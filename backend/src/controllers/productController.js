const Product = require('../models/Product');
const Store = require('../models/Store');
const { Category } = require('../models/Category');
const { validationResult } = require('express-validator');

class ProductController {
  // Get all products with filtering, sorting, and pagination
  async getProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = '-createdAt',
        search,
        category,
        store,
        minPrice,
        maxPrice,
        inStock,
        featured,
        status = 'active',
        brand,
        tags,
        hasVariants,
        isDigital
      } = req.query;

      // Build query
      const query = {};
      
      // Status filter
      if (status && status !== 'all') {
        query.status = status;
      }
      
      // Store filter
      if (store) {
        query.storeId = store;
      }
      
      // Category filter
      if (category) {
        query.category = category;
      }
      
      // Price range filter
      if (minPrice || maxPrice) {
        query.pricing = {};
        if (minPrice) query.pricing.basePrice = { $gte: parseFloat(minPrice) };
        if (maxPrice) {
          query.pricing.basePrice = { 
            ...query.pricing.basePrice, 
            $lte: parseFloat(maxPrice) 
          };
        }
      }
      
      // Stock filter
      if (inStock === 'true') {
        query.$or = [
          { 'inventory.trackInventory': false },
          { 'inventory.stockQuantity': { $gt: 0 } }
        ];
      }
      
      // Featured filter
      if (featured === 'true') {
        query.isFeatured = true;
      }
      
      // Brand filter
      if (brand) {
        query.brand = new RegExp(brand, 'i');
      }
      
      // Tags filter
      if (tags) {
        const tagArray = tags.split(',');
        query.tags = { $in: tagArray };
      }
      
      // Variants filter
      if (hasVariants === 'true') {
        query['variants.0'] = { $exists: true };
      }
      
      // Digital products filter
      if (isDigital === 'true') {
        query.isDigital = true;
      }
      
      // Search filter
      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { tags: new RegExp(search, 'i') },
          { brand: new RegExp(search, 'i') },
          { sku: new RegExp(search, 'i') }
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Execute query with population
      const products = await Product.find(query)
        .populate('storeId', 'name slug logo businessInfo.businessName')
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get total count for pagination
      const total = await Product.countDocuments(query);
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / parseInt(limit));
      const hasNextPage = parseInt(page) < totalPages;
      const hasPrevPage = parseInt(page) > 1;

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage,
            hasPrevPage
          },
          filters: {
            search,
            category,
            store,
            minPrice,
            maxPrice,
            inStock,
            featured,
            status,
            brand,
            tags
          }
        }
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching products',
        error: error.message
      });
    }
  }

  // Get single product by ID or slug
  async getProduct(req, res) {
    try {
      const { id } = req.params;
      const { includeRelated = false } = req.query;
      
      // Find product by ID or slug
      const product = await Product.findOne({
        $or: [
          { _id: id },
          { slug: id }
        ]
      })
        .populate('storeId', 'name slug logo businessInfo ratings shipping')
        .populate('category', 'name slug')
        .populate('reviews.user', 'firstName lastName avatar');

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if product is accessible
      if (product.status !== 'active' && (!req.user || req.user.role !== 'admin')) {
        // Allow store owners to view their own products
        if (!req.user || product.storeId.owner?.toString() !== req.user._id.toString()) {
          return res.status(404).json({
            success: false,
            message: 'Product not found'
          });
        }
      }

      let relatedProducts = [];
      
      // Get related products if requested
      if (includeRelated === 'true') {
        relatedProducts = await Product.find({
          _id: { $ne: product._id },
          category: product.category,
          status: 'active'
        })
          .populate('storeId', 'name slug logo')
          .limit(8)
          .select('name slug images pricing.basePrice ratings.average')
          .lean();
      }

      // Update view count
      await Product.findByIdAndUpdate(product._id, {
        $inc: { 'analytics.views': 1 }
      });

      res.json({
        success: true,
        data: {
          product,
          relatedProducts
        }
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching product',
        error: error.message
      });
    }
  }

  // Create new product (seller/admin only)
  async createProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const productData = req.body;
      
      // Set store ID for sellers
      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (!store) {
          return res.status(400).json({
            success: false,
            message: 'You must have a store to create products'
          });
        }
        productData.storeId = store._id;
      }

      // Validate category exists
      if (productData.category) {
        const category = await Category.findById(productData.category);
        if (!category) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category'
          });
        }
      }

      // Create product
      const product = new Product(productData);
      await product.save();

      // Populate references
      await product.populate('storeId', 'name slug logo');
      await product.populate('category', 'name slug');

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      console.error('Error creating product:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Product SKU already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error creating product',
        error: error.message
      });
    }
  }

  // Update product (store owner/admin only)
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'admin') {
        const store = await Store.findById(product.storeId);
        if (!store || store.owner.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'You can only update your own products'
          });
        }
      }

      // Update product
      Object.assign(product, updates);
      await product.save();

      // Populate references
      await product.populate('storeId', 'name slug logo');
      await product.populate('category', 'name slug');

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating product',
        error: error.message
      });
    }
  }

  // Delete product (store owner/admin only)
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const { permanent = false } = req.query;

      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'admin') {
        const store = await Store.findById(product.storeId);
        if (!store || store.owner.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'You can only delete your own products'
          });
        }
      }

      if (permanent === 'true' && req.user.role === 'admin') {
        // Permanent deletion (admin only)
        await Product.findByIdAndDelete(id);
        
        res.json({
          success: true,
          message: 'Product permanently deleted'
        });
      } else {
        // Soft delete
        product.status = 'deleted';
        product.deletedAt = new Date();
        await product.save();
        
        res.json({
          success: true,
          message: 'Product deleted successfully'
        });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting product',
        error: error.message
      });
    }
  }

  // Bulk update products (admin/store owner)
  async bulkUpdateProducts(req, res) {
    try {
      const { productIds, updates } = req.body;

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Product IDs array is required'
        });
      }

      // Build query based on user role
      let query = { _id: { $in: productIds } };
      
      if (req.user.role !== 'admin') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (!store) {
          return res.status(403).json({
            success: false,
            message: 'Store not found'
          });
        }
        query.storeId = store._id;
      }

      // Update products
      const result = await Product.updateMany(query, updates);

      res.json({
        success: true,
        message: `${result.modifiedCount} products updated successfully`,
        data: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount
        }
      });
    } catch (error) {
      console.error('Error bulk updating products:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating products',
        error: error.message
      });
    }
  }

  // Manage product inventory
  async updateInventory(req, res) {
    try {
      const { id } = req.params;
      const { operation, quantity, variantId, reason } = req.body;

      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'admin') {
        const store = await Store.findById(product.storeId);
        if (!store || store.owner.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'You can only manage inventory for your own products'
          });
        }
      }

      let result;
      
      switch (operation) {
        case 'add':
          result = await product.addStock(quantity, variantId, reason);
          break;
        case 'remove':
          result = await product.removeStock(quantity, variantId, reason);
          break;
        case 'set':
          result = await product.setStock(quantity, variantId, reason);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid operation. Use add, remove, or set'
          });
      }

      res.json({
        success: true,
        message: 'Inventory updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating inventory:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating inventory',
        error: error.message
      });
    }
  }

  // Get product analytics
  async getProductAnalytics(req, res) {
    try {
      const { id } = req.params;
      const { 
        startDate, 
        endDate, 
        granularity = 'day' 
      } = req.query;

      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'admin') {
        const store = await Store.findById(product.storeId);
        if (!store || store.owner.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'You can only view analytics for your own products'
          });
        }
      }

      // Get analytics data (would integrate with your analytics service)
      const analytics = {
        views: product.analytics.views,
        sales: product.analytics.totalSold,
        revenue: product.analytics.totalRevenue,
        conversionRate: product.analytics.conversionRate,
        averageRating: product.ratings.average,
        totalReviews: product.ratings.count,
        // Add more detailed analytics here
        trends: {
          // Daily/weekly/monthly trends would be calculated here
        }
      };

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching product analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching analytics',
        error: error.message
      });
    }
  }

  // Search products with advanced filters
  async searchProducts(req, res) {
    try {
      const {
        q,
        filters = {},
        sort = 'relevance',
        page = 1,
        limit = 20
      } = req.body;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      // Build search aggregation pipeline
      const pipeline = [
        {
          $match: {
            $and: [
              {
                $or: [
                  { name: new RegExp(q, 'i') },
                  { description: new RegExp(q, 'i') },
                  { tags: new RegExp(q, 'i') },
                  { brand: new RegExp(q, 'i') }
                ]
              },
              { status: 'active' }
            ]
          }
        }
      ];

      // Apply additional filters
      if (filters.category) {
        pipeline[0].$match.$and.push({ category: filters.category });
      }
      
      if (filters.priceRange) {
        pipeline[0].$match.$and.push({
          'pricing.basePrice': {
            $gte: filters.priceRange.min || 0,
            $lte: filters.priceRange.max || 999999
          }
        });
      }

      // Add sorting
      let sortStage = {};
      switch (sort) {
        case 'price_low':
          sortStage = { 'pricing.basePrice': 1 };
          break;
        case 'price_high':
          sortStage = { 'pricing.basePrice': -1 };
          break;
        case 'rating':
          sortStage = { 'ratings.average': -1 };
          break;
        case 'newest':
          sortStage = { createdAt: -1 };
          break;
        default:
          sortStage = { 'analytics.views': -1, 'ratings.average': -1 };
      }
      
      pipeline.push({ $sort: sortStage });

      // Add pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: parseInt(limit) });

      // Execute search
      const products = await Product.aggregate(pipeline);
      
      // Get total count
      const totalPipeline = pipeline.slice(0, -2); // Remove skip and limit
      totalPipeline.push({ $count: "total" });
      const totalResult = await Product.aggregate(totalPipeline);
      const total = totalResult[0]?.total || 0;

      // Populate references
      await Product.populate(products, [
        { path: 'storeId', select: 'name slug logo' },
        { path: 'category', select: 'name slug' }
      ]);

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          },
          searchQuery: q,
          filters,
          sort
        }
      });
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching products',
        error: error.message
      });
    }
  }
}

module.exports = new ProductController();
