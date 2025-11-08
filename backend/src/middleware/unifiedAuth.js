/**
 * JWT Authentication Middleware (MongoDB Only)
 * Pure JWT-based authentication for MongoDB backend
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT authentication middleware
 * Verifies JWT tokens and attaches user to request
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

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from MongoDB
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
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

    // Attach user to request
    req.user = {
      id: user._id.toString(),
      uid: user._id.toString(),
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      isVerified: user.isVerified,
      ...user.toObject()
    };
    
    req.userId = req.user.id;
    req.authType = 'jwt';
    req.database = 'mongodb';

    next();
  } catch (error) {
    console.error('JWT auth error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
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
 * Require admin role
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
 * Require seller role
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
