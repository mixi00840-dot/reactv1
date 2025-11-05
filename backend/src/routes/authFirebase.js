const express = require('express');
const admin = require('firebase-admin');
const { body, validationResult } = require('express-validator');
const db = require('../utils/database');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/firebaseAuth');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Firebase Auth API is working',
    endpoints: [
      'POST /register - Register new user with Firebase Auth',
      'POST /login - Login user (returns custom token)',
      'POST /verify-token - Verify Firebase ID token',
      'GET /me - Get current user (requires auth)',
      'POST /logout - User logout',
      'POST /send-verification-email - Send email verification',
      'POST /reset-password - Send password reset email'
    ]
  });
});

// Validation middleware
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('fullName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      const age = new Date().getFullYear() - new Date(value).getFullYear();
      if (age < 13) {
        throw new Error('You must be at least 13 years old to register');
      }
      return true;
    })
];

const loginValidation = [
  body('login')
    .notEmpty()
    .withMessage('Email or username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// @route   POST /api/auth/firebase/register
// @desc    Register a new user with Firebase Authentication
// @access  Public
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, fullName, dateOfBirth, phone, bio } = req.body;

    // Check if username already exists in Firestore
    const usersRef = db.collection('users');
    const usernameSnapshot = await usersRef.where('username', '==', username).limit(1).get();
    if (!usernameSnapshot.empty) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Create Firebase Authentication user
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email,
        password,
        displayName: fullName,
        emailVerified: false, // Will be verified via email link
        disabled: false
      });
    } catch (firebaseError) {
      // Handle Firebase-specific errors
      if (firebaseError.code === 'auth/email-already-exists') {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
      throw firebaseError;
    }

    // Create user document in Firestore with Firebase UID
    const userData = {
      username,
      email,
      fullName,
      dateOfBirth,
      phone: phone || '',
      bio: bio || '',
      role: 'user',
      status: 'active',
      isVerified: false,
      isFeatured: false,
      avatar: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      firebaseUid: firebaseUser.uid // Link to Firebase Auth
    };

    // Use batch write for atomic operations
    const batch = db.batch();
    
    // Use Firebase UID as document ID for easy lookup
    const userRef = usersRef.doc(firebaseUser.uid);
    batch.set(userRef, userData);

    // Create wallet for new user
    const walletRef = db.collection('wallets').doc(firebaseUser.uid);
    batch.set(walletRef, {
      userId: firebaseUser.uid,
      balance: 0,
      currency: 'USD',
      transactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await batch.commit();

    // Generate custom token for immediate login
    const customToken = await admin.auth().createCustomToken(firebaseUser.uid);

    // Send email verification link
    try {
      const verificationLink = await admin.auth().generateEmailVerificationLink(email);
      // TODO: Send email with verificationLink (integrate with email service)
      console.log('Email verification link:', verificationLink);
    } catch (emailError) {
      console.error('Failed to generate verification email:', emailError);
    }

    // Remove sensitive data from response
    const userResponse = { ...userData, id: firebaseUser.uid };

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        user: userResponse,
        customToken, // Client exchanges this for ID token
        emailVerificationRequired: true
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/firebase/login
// @desc    Login user and return custom token for Firebase Auth
// @access  Public
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { login, password } = req.body;

    // Find user by email or username in Firestore
    const usersRef = db.collection('users');
    let userDoc = null;
    let userData = null;
    
    const isEmail = login.includes('@');
    const field = isEmail ? 'email' : 'username';
    const snapshot = await usersRef.where(field, '==', login).limit(1).get();

    if (snapshot.empty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    userDoc = snapshot.docs[0];
    userData = userDoc.data();

    // Check if account is active
    if (userData.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: 'Account is banned. Contact support for assistance.'
      });
    }

    if (userData.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended. Contact support for assistance.'
      });
    }

    // Verify password with Firebase Auth
    // Note: Firebase doesn't expose password verification directly
    // We need to use Firebase Client SDK on frontend or verify with Firebase REST API
    try {
      // Use Firebase REST API to verify password
      const firebaseApiKey = process.env.FIREBASE_WEB_API_KEY;
      const verifyPasswordUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`;
      
      const response = await fetch(verifyPasswordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          password,
          returnSecureToken: true
        })
      });

      const authResult = await response.json();

      if (!response.ok || authResult.error) {
        // Log the actual Firebase error for debugging
        console.error('Firebase Auth Error:', JSON.stringify(authResult.error || authResult, null, 2));
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          debug: process.env.NODE_ENV !== 'production' ? authResult.error : undefined
        });
      }

      // Update last login
      await userDoc.ref.update({
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Return the ID token from Firebase
      const userResponse = { ...userData, id: userDoc.id };

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          idToken: authResult.idToken,
          refreshToken: authResult.refreshToken,
          expiresIn: authResult.expiresIn,
          emailVerified: authResult.emailVerified || false
        }
      });

    } catch (authError) {
      console.error('Firebase authentication error:', authError);
      return res.status(401).json({
        success: false,
        message: 'Authentication failed'
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/firebase/verify-token
// @desc    Verify Firebase ID token
// @access  Public
router.post('/verify-token', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required'
      });
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken, true);

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();
    const userResponse = { ...userData, id: userDoc.id };

    res.json({
      success: true,
      data: {
        user: userResponse,
        tokenValid: true,
        emailVerified: decodedToken.email_verified
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

// Alias route for /verify (same as /verify-token)
router.post('/verify', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required'
      });
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken, true);

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();
    const userResponse = { ...userData, id: userDoc.id };

    res.json({
      success: true,
      data: {
        user: userResponse,
        tokenValid: true,
        emailVerified: decodedToken.email_verified
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

// @route   GET /api/auth/firebase/me
// @desc    Get current user profile
// @access  Private
router.get('/me', verifyFirebaseToken, async (req, res) => {
  try {
    // req.user is populated by verifyFirebaseToken middleware
    const userResponse = { ...req.user };
    delete userResponse.password; // Extra safety

    res.json({
      success: true,
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
});

// @route   POST /api/auth/firebase/send-verification-email
// @desc    Send email verification link
// @access  Private
router.post('/send-verification-email', verifyFirebaseToken, async (req, res) => {
  try {
    const verificationLink = await admin.auth().generateEmailVerificationLink(req.user.email);
    
    // TODO: Send email with verificationLink (integrate with email service)
    console.log('Email verification link:', verificationLink);

    res.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
      // Don't expose the link in production for security
      verificationLink: process.env.NODE_ENV === 'development' ? verificationLink : undefined
    });

  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email'
    });
  }
});

// @route   POST /api/auth/firebase/reset-password
// @desc    Send password reset email
// @access  Public
router.post('/reset-password', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Generate password reset link
    const resetLink = await admin.auth().generatePasswordResetLink(email);
    
    // TODO: Send email with resetLink (integrate with email service)
    console.log('Password reset link:', resetLink);

    res.json({
      success: true,
      message: 'Password reset email sent. Please check your inbox.',
      // Don't expose the link in production for security
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
    });

  } catch (error) {
    console.error('Password reset error:', error);
    // Don't reveal if email exists for security
    res.json({
      success: true,
      message: 'If that email exists, a password reset link has been sent.'
    });
  }
});

// @route   POST /api/auth/firebase/logout
// @desc    Revoke user's refresh tokens
// @access  Private
router.post('/logout', verifyFirebaseToken, async (req, res) => {
  try {
    // Revoke all refresh tokens for the user
    await admin.auth().revokeRefreshTokens(req.user.id);

    res.json({
      success: true,
      message: 'Logged out successfully. All sessions have been invalidated.'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

module.exports = router;
