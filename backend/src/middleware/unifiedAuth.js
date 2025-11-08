/**
 * Unified Authentication Middleware
 * Supports BOTH Firebase Auth AND JWT during migration
 * This allows gradual user migration without breaking existing sessions
 */

const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const db = require('../utils/database'); // Firestore
const { getDatabaseMode } = require('./dualDatabase');

/**
 * Unified auth middleware that accepts both Firebase tokens and JWT tokens
 * This allows Flutter app to work during migration period
 */
const unifiedAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.split('Bearer ')[1]?.trim();
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format',
        code: 'INVALID_TOKEN'
      });
    }

    const mode = getDatabaseMode();
    let user = null;
    let authType = null;

    // Try JWT first (MongoDB users)
    if (mode === 'mongodb' || mode === 'dual') {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from MongoDB
        const mongoUser = await User.findById(decoded.id).select('-password');
        
        if (mongoUser) {
          user = mongoUser;
          authType = 'jwt';
          req.authType = 'jwt';
          req.database = 'mongodb';
          console.log(`✅ Authenticated via JWT (MongoDB user: ${mongoUser.username})`);
        }
      } catch (jwtError) {
        // Not a JWT token, will try Firebase next
        if (mode === 'mongodb') {
          // In MongoDB-only mode, JWT is required
          throw jwtError;
        }
      }
    }

    // Try Firebase if JWT failed (Firestore users)
    if (!user && (mode === 'firebase' || mode === 'dual')) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token, true);
        const uid = decodedToken.uid;
        
        // Check MongoDB first for migrated users
        if (mode === 'dual') {
          try {
            const mongoUser = await User.findOne({ firebaseUid: uid }).select('-password');
            if (mongoUser) {
              user = mongoUser;
              authType = 'firebase-migrated';
              req.authType = 'firebase-migrated';
              req.database = 'mongodb';
              console.log(`✅ Authenticated via Firebase (Migrated MongoDB user: ${mongoUser.username})`);
            }
          } catch (mongoErr) {
            // User not migrated yet, use Firestore
          }
        }
        
        // If not in MongoDB, get from Firestore
        if (!user) {
          let userDoc = await db.collection('users').doc(uid).get();
          
          // Auto-create user if doesn't exist
          if (!userDoc.exists) {
            console.log(`Auto-creating Firestore user document for Firebase Auth user: ${uid}`);
            
            const firebaseUser = await admin.auth().getUser(uid);
            const userData = {
              email: firebaseUser.email || '',
              username: firebaseUser.email ? firebaseUser.email.split('@')[0] : `user_${uid.substring(0, 8)}`,
              fullName: firebaseUser.displayName || 'User',
              role: 'user',
              status: 'active',
              isVerified: firebaseUser.emailVerified || false,
              isFeatured: false,
              avatar: firebaseUser.photoURL || '',
              createdAt: new Date(firebaseUser.metadata.creationTime).toISOString(),
              updatedAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              firebaseUid: uid,
              autoCreated: true
            };
            
            await db.collection('users').doc(uid).set(userData);
            await db.collection('wallets').doc(uid).set({
              userId: uid,
              balance: 0,
              currency: 'USD',
              transactions: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            
            user = { id: uid, ...userData };
            console.log(`✅ Auto-created user document for ${uid}`);
          } else {
            user = { id: userDoc.id, ...userDoc.data() };
          }
          
          authType = 'firebase';
          req.authType = 'firebase';
          req.database = 'firestore';
          console.log(`✅ Authenticated via Firebase (Firestore user: ${user.username || user.email})`);
        }
        
      } catch (firebaseError) {
        console.error('Firebase auth error:', firebaseError.message);
        if (mode === 'firebase') {
          throw firebaseError;
        }
      }
    }

    // Check if we got a user
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token',
        code: 'AUTH_FAILED'
      });
    }

    // Check account status
    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: 'Account has been banned',
        code: 'ACCOUNT_BANNED'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account is temporarily suspended',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    // Attach user to request (normalize format)
    req.user = {
      id: user._id || user.id,
      uid: user._id || user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      isVerified: user.isVerified,
      ...user
    };
    
    req.userId = req.user.id;
    req.authType = authType;

    next();
  } catch (error) {
    console.error('Unified auth error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError' || error.code === 'auth/argument-error') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Require admin role (works with both auth types)
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required'
    });
  }

  next();
};

/**
 * Require seller role (works with both auth types)
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

module.exports = {
  unifiedAuth,
  requireAdmin,
  requireSeller
};

