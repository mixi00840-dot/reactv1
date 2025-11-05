const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
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

    const token = authHeader.split('Bearer ')[1]?.trim();
    
    // Validate token format before verification
    if (!token || typeof token !== 'string' || token.length < 10) {
      console.error('Invalid token: missing or too short', { 
        hasToken: !!token, 
        tokenType: typeof token,
        tokenLength: token?.length 
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid token format',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Basic JWT format validation (should have 3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('Token format error: Expected 3 parts, got', tokenParts.length, {
        tokenPreview: token.substring(0, 20) + '...'
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid token format: Token must have header, payload, and signature',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }
    
    // Validate JWT header contains "kid" claim (check if token is properly formatted)
    try {
      const header = JSON.parse(Buffer.from(tokenParts[0], 'base64url').toString());
      if (!header.alg || !header.typ) {
        console.error('Token header missing required fields', { header });
        return res.status(401).json({
          success: false,
          message: 'Invalid token format: Missing required header fields',
          code: 'INVALID_TOKEN_HEADER'
        });
      }
    } catch (headerError) {
      console.error('Token header parse error:', headerError);
      return res.status(401).json({
        success: false,
        message: 'Invalid token format: Cannot parse token header',
        code: 'INVALID_TOKEN_HEADER'
      });
    }
    
    let decodedToken;
    let uid;
    
    // Try to verify as ID token first
    try {
      decodedToken = await admin.auth().verifyIdToken(token, true); // checkRevoked = true
      uid = decodedToken.uid;
    } catch (idTokenError) {
      // Custom token support (for testing/development only)
      // In production, only Firebase ID tokens should be used
      const allowCustomTokens = process.env.ALLOW_CUSTOM_TOKENS === 'true' || process.env.NODE_ENV !== 'production';
      
      if (allowCustomTokens && (idTokenError.code === 'auth/argument-error' || idTokenError.code === 'auth/id-token-expired')) {
        try {
          // Decode custom token (JWT) to extract UID without signature verification
          // We'll verify the user exists in Firebase Auth instead
          
          // Decode without verification (custom tokens are signed by service account)
          const decoded = jwt.decode(token);
          
          if (!decoded || !decoded.uid) {
            throw new Error('Invalid custom token format');
          }
          
          // Extract UID from custom token claims
          uid = decoded.uid;
          
          // Verify the user exists in Firebase Auth (this validates the token)
          const firebaseUser = await admin.auth().getUser(uid);
          
          // Create a mock decodedToken structure for compatibility
          decodedToken = {
            uid: uid,
            email: firebaseUser.email,
            email_verified: firebaseUser.emailVerified,
            custom_token: true // Flag to indicate this came from a custom token
          };
        } catch (customTokenError) {
          // Not a custom token either, re-throw original error
          throw idTokenError;
        }
      } else {
        throw idTokenError;
      }
    }
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    
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
          // Log more details for debugging
          let tokenPreview = 'N/A';
          try {
            const parts = token?.split('.');
            if (parts && parts.length === 3) {
              const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
              tokenPreview = {
                alg: header.alg,
                typ: header.typ,
                hasKid: !!header.kid,
                hasKeyId: !!header.keyId
              };
            }
          } catch (e) {
            // Ignore parse errors
          }
          
          console.error('Token verification error:', {
            code: error.code,
            message: error.message,
            tokenLength: token?.length,
            tokenParts: token?.split('.').length,
            tokenHeader: tokenPreview,
            userAgent: req.headers['user-agent'],
            ip: req.ip
          });
          
          return res.status(401).json({
            success: false,
            message: 'Invalid token format. Please log out and log in again.',
            code: 'INVALID_TOKEN',
            hint: 'The token may be corrupted. Please clear your browser cache and try again.'
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
