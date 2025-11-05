/**
 * Products Routes - Firestore Version
 * Migrated from MongoDB to Firestore
 */

const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

const {
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  listProducts,
  searchProducts,
  getProductsByStore,
  incrementViews,
  incrementLikes,
  decrementLikes,
  getSimilarProducts,
  updateInventory
} = require('../utils/productHelpers');

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * GET /api/products
 * List all products with filtering and pagination
 * Query params: storeId, category, status, limit, orderBy, order, startAfter
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      storeId: req.query.storeId,
      category: req.query.category,
      status: req.query.status || 'active', // Default: active only
      limit: req.query.limit,
      orderBy: req.query.orderBy,
      order: req.query.order,
      startAfter: req.query.startAfter
    };
    
    const products = await listProducts(filters);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        limit: parseInt(req.query.limit) || 20,
        hasMore: products.length === (parseInt(req.query.limit) || 20)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/products/search
 * Search products by name or tags
 * Query params: q (search term)
 */
router.get('/search', async (req, res) => {
  try {
    const { q: searchTerm } = req.query;
    
    if (!searchTerm || searchTerm.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }
    
    const products = await searchProducts(searchTerm);
    
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/products/:id
 * Get single product by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Increment views asynchronously (don't wait)
    incrementViews(req.params.id).catch(err => 
      console.error('Failed to increment views:', err)
    );
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/products/:id/similar
 * Get similar products (same category)
 */
router.get('/:id/similar', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const similarProducts = await getSimilarProducts(req.params.id, limit);
    
    res.json({
      success: true,
      data: similarProducts,
      count: similarProducts.length
    });
  } catch (error) {
    console.error('Error fetching similar products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch similar products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/products/store/:storeId
 * Get all products from a specific store
 */
router.get('/store/:storeId', async (req, res) => {
  try {
    const options = {
      status: req.query.status || 'active',
      limit: req.query.limit || 20,
      orderBy: req.query.orderBy || 'createdAt',
      order: req.query.order || 'desc',
      startAfter: req.query.startAfter
    };
    
    const products = await getProductsByStore(req.params.storeId, options);
    
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Error fetching store products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// AUTHENTICATED ROUTES (Sellers & Admins)
// ============================================================================

/**
 * POST /api/products
 * Create a new product (seller or admin only)
 * Body: name, description, price, images, category, inventory, tags
 */
router.post('/', authenticateUser, authorizeRoles('seller', 'admin'), async (req, res) => {
  try {
    const { name, description, price, images, category, inventory, tags, status } = req.body;
    
    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }
    
    if (!price || parseFloat(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required'
      });
    }
    
    // Get user's store
    const { firestore } = require('../utils/database');
    const storesSnapshot = await firestore.collection('stores')
      .where('ownerId', '==', req.user.uid)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    if (storesSnapshot.empty) {
      return res.status(400).json({
        success: false,
        message: 'You must have an active store to create products. Please create a store first.'
      });
    }
    
    const storeDoc = storesSnapshot.docs[0];
    
    // Prepare product data
    const productData = {
      name: name.trim(),
      description: description?.trim() || '',
      price: parseFloat(price),
      images: Array.isArray(images) ? images : [],
      category: category || 'general',
      inventory: parseInt(inventory) || 0,
      tags: Array.isArray(tags) ? tags.map(t => t.toLowerCase()) : [],
      status: status || 'active',
      storeId: storeDoc.id,
      ownerId: req.user.uid
    };
    
    // Create product
    const newProduct = await createProduct(productData);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/products/:id
 * Update product (owner or admin only)
 */
router.put('/:id', authenticateUser, authorizeRoles('seller', 'admin'), async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check ownership (unless admin)
    if (req.user.role !== 'admin' && product.ownerId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own products'
      });
    }
    
    // Allowed update fields
    const allowedFields = ['name', 'description', 'price', 'images', 'category', 'inventory', 'tags', 'status'];
    const updates = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'price') {
          updates[field] = parseFloat(req.body[field]);
        } else if (field === 'inventory') {
          updates[field] = parseInt(req.body[field]);
        } else if (field === 'tags' && Array.isArray(req.body[field])) {
          updates[field] = req.body[field].map(t => t.toLowerCase());
        } else {
          updates[field] = req.body[field];
        }
      }
    });
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    const updatedProduct = await updateProduct(req.params.id, updates);
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/products/:id
 * Delete product (soft delete - sets status to inactive)
 */
router.delete('/:id', authenticateUser, authorizeRoles('seller', 'admin'), async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check ownership (unless admin)
    if (req.user.role !== 'admin' && product.ownerId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own products'
      });
    }
    
    await deleteProduct(req.params.id);
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/products/:id/like
 * Like a product (authenticated users)
 */
router.post('/:id/like', authenticateUser, async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if user already liked (store in separate collection)
    const { firestore } = require('../utils/database');
    const likeRef = firestore.collection('productLikes').doc(`${req.user.uid}_${req.params.id}`);
    const likeDoc = await likeRef.get();
    
    if (likeDoc.exists) {
      // Unlike
      await likeRef.delete();
      await decrementLikes(req.params.id);
      
      res.json({
        success: true,
        message: 'Product unliked',
        liked: false
      });
    } else {
      // Like
      await likeRef.set({
        userId: req.user.uid,
        productId: req.params.id,
        createdAt: require('firebase-admin').firestore.FieldValue.serverTimestamp()
      });
      await incrementLikes(req.params.id);
      
      res.json({
        success: true,
        message: 'Product liked',
        liked: true
      });
    }
  } catch (error) {
    console.error('Error toggling product like:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update like status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/products/:id/inventory
 * Update product inventory (admin only)
 * Body: { quantity: number } - positive to add, negative to subtract
 */
router.patch('/:id/inventory', authenticateUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (quantity === undefined || isNaN(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }
    
    const updatedProduct = await updateInventory(req.params.id, parseInt(quantity));
    
    res.json({
      success: true,
      message: 'Inventory updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    
    if (error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (error.message === 'Insufficient inventory') {
      return res.status(400).json({
        success: false,
        message: 'Insufficient inventory'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/products/stats
 * Get product statistics
 * Access: Admin
 */
router.get('/stats', async (req, res) => {
  try {
    const db = require('../utils/database');
    const productsSnapshot = await db.collection('products').get();
    
    let total = 0;
    let active = 0;
    let inactive = 0;
    let outOfStock = 0;
    let totalValue = 0;
    
    productsSnapshot.forEach(doc => {
      const product = doc.data();
      total++;
      if (product.status === 'active') active++;
      if (product.status === 'inactive') inactive++;
      if (product.inventory <= 0) outOfStock++;
      totalValue += (product.price || 0) * (product.inventory || 0);
    });
    
    res.json({
      success: true,
      data: {
        stats: {
          total,
          active,
          inactive,
          outOfStock,
          totalValue: totalValue.toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product statistics'
    });
  }
});

module.exports = router;
