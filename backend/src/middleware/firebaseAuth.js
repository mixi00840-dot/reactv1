const admin = require('firebase-admin');
const db = require('../utils/database');

/**
 * Middleware to verify Firebase Authentication tokens
 * Replaces the old JWT verification with Firebase Admin SDK
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token, true); // checkRevoked = true
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }

    const userData = userDoc.data();

    // Check account status
    if (userData.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: 'Account has been banned'
      });
    }

    if (userData.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account is temporarily suspended'
      });
    }

    // Attach user data to request
    req.user = {
      id: decodedToken.uid,
      ...userData,
      firebaseUser: decodedToken // Include Firebase-specific data if needed
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked. Please login again.',
        code: 'TOKEN_REVOKED'
      });
    }

    if (error.code === 'auth/argument-error') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token'
    });
  }
};

/**
 * Middleware to ensure user has admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required'
    });
  }

  next();
};

/**
 * Middleware to ensure user has seller role or admin
 */
const requireSeller = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Seller privileges required'
    });
  }

  next();
};

/**
 * Middleware to check if email is verified
 */
const requireEmailVerification = async (req, res, next) => {
  try {
    // Get Firebase user to check email verification
    const firebaseUser = await admin.auth().getUser(req.user.id);
    
    if (!firebaseUser.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before accessing this resource',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    next();
  } catch (error) {
    console.error('Email verification check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify email status'
    });
  }
};

module.exports = {
  verifyFirebaseToken,
  requireAdmin,
  requireSeller,
  requireEmailVerification
};
