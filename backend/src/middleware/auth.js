const jwt = require('jsonwebtoken');
const db = require('../utils/database'); // Firestore instance

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId, id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId, id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
};

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user in Firestore
    const userId = decoded.userId || decoded.id;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user not found.'
      });
    }
    
    const userData = userDoc.data();
    
    // Check if user is active
    if (userData.status === 'banned' || userData.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: `Account is ${userData.status}. Contact support for assistance.`
      });
    }
    
    // Attach user to request (with id for compatibility)
    req.user = {
      ...userData,
      id: userDoc.id,
      _id: userDoc.id // For backward compatibility
    };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

// Middleware to verify admin role
const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  
  next();
};

// Middleware to verify moderator role (admin or moderator)
const moderatorMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Moderator privileges required.'
    });
  }
  
  next();
};

// Middleware to verify seller role or admin
const sellerMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  if (!['seller', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Seller privileges required.'
    });
  }
  
  // Admin users have full access, skip seller verification check
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Check if seller is verified
  if (req.user.role === 'seller' && req.user.sellerProfile?.verificationStatus !== 'verified') {
    return res.status(403).json({
      success: false,
      message: 'Seller account must be verified to access this resource.'
    });
  }
  
  next();
};

// Middleware to verify store ownership
const storeOwnerMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    // Admin can access all stores
    if (req.user.role === 'admin') {
      return next();
    }
    
    const storeId = req.params.storeId || req.body.storeId || req.query.storeId;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required.'
      });
    }
    
    const Store = require('../models/Store');
    const store = await Store.findById(storeId);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found.'
      });
    }
    
    if (store.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this store.'
      });
    }
    
    req.store = store;
    next();
  } catch (error) {
    console.error('Store owner middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during store authorization.'
    });
  }
};

// Middleware to verify customer role
const customerMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  if (!['customer', 'seller', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer privileges required.'
    });
  }
  
  next();
};

// Middleware for rate limiting sensitive operations
const rateLimitMiddleware = (maxRequests = 10, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.user ? req.user._id.toString() : req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old requests
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    }
    
    const userRequests = requests.get(key) || [];
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    userRequests.push(now);
    requests.set(key, userRequests);
    
    next();
  };
};

// Middleware to check API key for external integrations
const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required.'
    });
  }
  
  // Validate API key (implement your API key validation logic)
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key.'
    });
  }
  
  next();
};

// Middleware to validate user permissions for specific resources
const permissionMiddleware = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check specific permissions based on resource and action
    const userPermissions = req.user.permissions || [];
    const requiredPermission = `${resource}:${action}`;
    
    if (!userPermissions.includes(requiredPermission) && !userPermissions.includes(`${resource}:*`)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Missing permission: ${requiredPermission}`
      });
    }
    
    next();
  };
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently ignore auth errors for optional middleware
  }
  
  next();
};

// Support agent middleware - allows support agents and admins
const supportAgentMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (!['support_agent', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Support agent access required.'
    });
  }

  next();
};

// Admin or support middleware - allows both admins and support agents
const adminOrSupportMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (!['admin', 'support_agent'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Admin or support agent access required.'
    });
  }

  next();
};

// Middleware for admin only (including superadmin)
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  
  next();
};

// Middleware for superadmin only
const superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin privileges required.'
    });
  }
  
  next();
};

module.exports = {
  generateToken,
  generateRefreshToken,
  authMiddleware,
  authenticate: authMiddleware, // Alias for consistency
  protect: authMiddleware, // Common alias
  adminMiddleware,
  adminOnly,
  superAdminOnly,
  moderatorMiddleware,
  moderatorOnly: moderatorMiddleware, // Alias
  sellerMiddleware,
  storeOwnerMiddleware,
  customerMiddleware,
  supportAgentMiddleware,
  adminOrSupportMiddleware,
  optionalAuthMiddleware,
  rateLimitMiddleware,
  apiKeyMiddleware,
  permissionMiddleware
};