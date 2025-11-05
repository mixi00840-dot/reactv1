const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { 
  authMiddleware, 
  sellerMiddleware, 
  storeOwnerMiddleware,
  optionalAuthMiddleware,
  rateLimitMiddleware
} = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');

// Validation rules
const createProductValidation = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  
  body('description')
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  
  body('pricing.basePrice')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  
  body('category')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  
  body('inventory.stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  
  body('status')
    .optional()
    .isIn(['draft', 'active', 'inactive', 'out_of_stock'])
    .withMessage('Invalid status value')
];

const updateProductValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  
  body('description')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  
  body('pricing.basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  
  body('inventory.stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer')
];

const inventoryUpdateValidation = [
  body('operation')
    .isIn(['add', 'remove', 'set'])
    .withMessage('Operation must be add, remove, or set'),
  
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters')
];

// Public routes (no authentication required)

// GET /api/products - Get all products with filtering and pagination
router.get('/', 
  optionalAuthMiddleware,
  productController.getProducts
);

// GET /api/products/search - Advanced product search
router.post('/search',
  optionalAuthMiddleware,
  rateLimitMiddleware(50, 60000), // 50 requests per minute
  productController.searchProducts
);

// GET /api/products/stats - Global product stats (admin dashboard)
router.get('/stats',
  optionalAuthMiddleware,
  productController.getGlobalStats
);

// GET /api/products/:id - Get single product by ID or slug
router.get('/:id',
  optionalAuthMiddleware,
  productController.getProduct
);

// Protected routes (authentication required)

// POST /api/products - Create new product (seller/admin only)
router.post('/',
  authMiddleware,
  sellerMiddleware,
  uploadMiddleware.productImages, // Allow up to 10 product images
  createProductValidation,
  rateLimitMiddleware(10, 3600000), // 10 products per hour
  productController.createProduct
);

// PUT /api/products/:id - Update product (store owner/admin only)
router.put('/:id',
  authMiddleware,
  uploadMiddleware.productImages,
  updateProductValidation,
  productController.updateProduct
);

// DELETE /api/products/:id - Delete product (store owner/admin only)
router.delete('/:id',
  authMiddleware,
  productController.deleteProduct
);

// PATCH /api/products/bulk - Bulk update products (store owner/admin only)
router.patch('/bulk',
  authMiddleware,
  sellerMiddleware,
  rateLimitMiddleware(5, 3600000), // 5 bulk operations per hour
  productController.bulkUpdateProducts
);

// Inventory management routes

// PATCH /api/products/:id/inventory - Update product inventory
router.patch('/:id/inventory',
  authMiddleware,
  sellerMiddleware,
  inventoryUpdateValidation,
  productController.updateInventory
);

// Analytics routes

// GET /api/products/:id/analytics - Get product analytics (store owner/admin only)
router.get('/:id/analytics',
  authMiddleware,
  productController.getProductAnalytics
);

// Store-specific routes

// GET /api/products/store/:storeId - Get products by store
router.get('/store/:storeId',
  optionalAuthMiddleware,
  productController.getProducts
);

// Category-specific routes

// GET /api/products/category/:categoryId - Get products by category
router.get('/category/:categoryId',
  optionalAuthMiddleware,
  productController.getProducts
);

// Admin-only routes

// GET /api/products/admin/all - Get all products including inactive (admin only)
router.get('/admin/all',
  authMiddleware,
  require('../middleware/auth').adminMiddleware,
  productController.getProducts
);

module.exports = router;