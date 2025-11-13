const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Store = require('../models/Store');
const Category = require('../models/Category');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

/**
 * Products Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Products API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/products
 * @desc    Get all products with filters
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      storeId,
      search,
      minPrice,
      maxPrice,
      sortBy = '-createdAt'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { isActive: true }; // Changed from status and isPublished

    // Handle category filter - can be ObjectId or category name/slug
    if (category) {
      const Category = require('../models/Category');
      // Check if category is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        // Try to find category by name or slug
        const categoryDoc = await Category.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${category}$`, 'i') } },
            { slug: category.toLowerCase() }
          ]
        });
        if (categoryDoc) {
          query.category = categoryDoc._id;
        } else {
          // If category not found, return empty result
          return res.json({
            success: true,
            data: {
              products: [],
              pagination: {
                total: 0,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: 0
              }
            }
          });
        }
      }
    }
    
    if (storeId) query.storeId = storeId;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Text search if search query provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('storeId', 'name logo rating')
      .populate('sellerId', 'username fullName')
      .populate('category', 'name slug')
      .lean(); // Use lean for better performance

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 * @access  Public
 */
router.get('/featured', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get featured products or fallback to recent active products
    const products = await Product.find({ 
      isActive: true,
      $or: [
        { isFeatured: true },
        { isActive: true } // Fallback if no featured flag
      ]
    })
    .populate('store', 'name logo')
    .populate('category', 'name')
    .limit(parseInt(limit))
    .sort({ isFeatured: -1, createdAt: -1 });

    res.json({
      success: true,
      data: { products }
    });

  } catch (error) {
    console.error('Featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product'
    });
  }
});

/**
 * @route   GET /api/products/featured/best-sellers
 * @desc    Get best-selling products
 * @access  Public
 */
router.get('/featured/best-sellers', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const products = await Product.getBestSellers(parseInt(limit));

    res.json({
      success: true,
      data: { products }
    });

  } catch (error) {
    console.error('Get best sellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching best sellers'
    });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('storeId', 'name logo rating verified')
      .populate('sellerId', 'username fullName avatar')
      .populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment views
    product.viewsCount += 1;
    await product.save();

    res.json({
      success: true,
      data: { product }
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product'
    });
  }
});

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private (Seller)
 */
router.post('/', verifyJWT, async (req, res) => {
  try {
    const sellerId = req.userId;
    
    // Verify user has a store
    const store = await Store.findOne({ sellerId });
    if (!store) {
      return res.status(403).json({
        success: false,
        message: 'You must have an approved store to create products'
      });
    }

    if (store.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your store must be active to create products'
      });
    }

    const productData = {
      ...req.body,
      storeId: store._id,
      sellerId,
      status: 'pending_approval' // Requires admin approval
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      data: { product },
      message: 'Product created successfully. Pending approval.'
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (Product owner or Admin)
 */
router.put('/:id', verifyJWT, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    if (!product.sellerId.equals(req.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this product'
      });
    }

    Object.assign(product, req.body);
    await product.save();

    res.json({
      success: true,
      data: { product },
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Private (Product owner or Admin)
 */
router.delete('/:id', verifyJWT, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    if (!product.sellerId.equals(req.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this product'
      });
    }

    // Soft delete
    product.status = 'archived';
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product'
    });
  }
});

// ==================== ADMIN ENDPOINTS ====================
const { requireAdmin: requireAdminMiddleware } = require('../middleware/jwtAuth');

/**
 * @route   GET /api/products/admin/all
 * @desc    Get all products (Admin)
 * @access  Admin
 */
router.get('/admin/all', verifyJWT, requireAdminMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search,
      status,
      category,
      isActive
    } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .populate('sellerId', 'username storeName email')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

/**
 * @route   GET /api/products/admin/stats
 * @desc    Get product statistics (Admin)
 * @access  Admin
 */
router.get('/admin/stats', verifyJWT, requireAdminMiddleware, async (req, res) => {
  try {
    const [
      totalProducts,
      activeProducts,
      draftProducts,
      pendingApproval,
      outOfStock
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ status: 'draft' }),
      Product.countDocuments({ status: 'pending_approval' }),
      Product.countDocuments({ 'inventory.quantity': 0, 'inventory.trackQuantity': true })
    ]);

    res.json({
      success: true,
      data: {
        total: totalProducts,
        active: activeProducts,
        draft: draftProducts,
        pending: pendingApproval,
        outOfStock
      }
    });

  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product statistics'
    });
  }
});

/**
 * @route   PUT /api/products/admin/:id/status
 * @desc    Update product status (Admin)
 * @access  Admin
 */
router.put('/admin/:id/status', verifyJWT, requireAdminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.status = status;
    if (status === 'active') {
      product.isActive = true;
    }
    await product.save();

    res.json({
      success: true,
      data: { product },
      message: `Product status updated to ${status}`
    });

  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product status'
    });
  }
});

/**
 * @route   DELETE /api/products/admin/:id
 * @desc    Delete product permanently (Admin)
 * @access  Admin
 */
router.delete('/admin/:id', verifyJWT, requireAdminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted permanently'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product'
    });
  }
});

module.exports = router;
