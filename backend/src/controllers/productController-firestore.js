/**
 * Product Controller - Firestore Migration
 * Handles all product-related operations using Firestore
 */

const {
  findDocuments,
  findById,
  findOne,
  createDocument,
  updateById,
  deleteById,
  countDocuments,
  paginatedQuery,
  advancedQuery,
  incrementField,
  FieldValue
} = require('../utils/firestoreHelpers');
const { validationResult } = require('express-validator');

class ProductController {
  // Get all products with filtering, sorting, and pagination
  async getProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        category,
        store,
        minPrice,
        maxPrice,
        inStock,
        featured,
        status = 'active',
        brand,
        tags
      } = req.query;

      // Build filters
      const filters = {};
      
      if (status && status !== 'all') {
        filters.status = status;
      }
      
      if (store) {
        filters.storeId = store;
      }
      
      if (category) {
        filters.category = category;
      }
      
      if (featured === 'true') {
        filters.isFeatured = true;
      }
      
      if (brand) {
        filters.brand = brand;
      }

      // For complex queries (price, search, tags), we'll fetch and filter in memory
      // This is a tradeoff - Firestore doesn't support range queries on multiple fields like MongoDB
      let products = await findDocuments('products', filters, {
        limit: parseInt(limit) * 2, // Fetch more to account for filtering
        orderBy: 'createdAt',
        direction: 'desc'
      });

      // Apply additional filters in memory
      if (minPrice || maxPrice) {
        products = products.filter(p => {
          const price = p.pricing?.basePrice || 0;
          if (minPrice && price < parseFloat(minPrice)) return false;
          if (maxPrice && price > parseFloat(maxPrice)) return false;
          return true;
        });
      }

      if (inStock === 'true') {
        products = products.filter(p => 
          !p.inventory?.trackInventory || (p.inventory?.stockQuantity || 0) > 0
        );
      }

      if (search) {
        const searchLower = search.toLowerCase();
        products = products.filter(p => 
          p.name?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.tags?.some(t => t.toLowerCase().includes(searchLower)) ||
          p.brand?.toLowerCase().includes(searchLower) ||
          p.sku?.toLowerCase().includes(searchLower)
        );
      }

      if (tags) {
        const tagArray = tags.split(',');
        products = products.filter(p => 
          p.tags?.some(t => tagArray.includes(t))
        );
      }

      // Pagination
      const start = (parseInt(page) - 1) * parseInt(limit);
      const end = start + parseInt(limit);
      const total = products.length;
      products = products.slice(start, end);

      // Enrich with store and category data
      for (let product of products) {
        if (product.storeId) {
          product.store = await findById('stores', product.storeId);
        }
        if (product.category) {
          product.categoryData = await findById('categories', product.category);
        }
      }

      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          },
          filters: { search, category, store, minPrice, maxPrice, inStock, featured, status, brand, tags }
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
      
      // Try to find by ID first
      let product = await findById('products', id);
      
      // If not found, try to find by slug
      if (!product) {
        product = await findOne('products', { slug: id });
      }

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if product is accessible
      if (product.status !== 'active' && (!req.user || req.user.role !== 'admin')) {
        // Get store to check ownership
        if (product.storeId) {
          const store = await findById('stores', product.storeId);
          if (!req.user || store?.ownerId !== req.user.id) {
            return res.status(404).json({
              success: false,
              message: 'Product not found'
            });
          }
        }
      }

      // Enrich product data
      if (product.storeId) {
        product.store = await findById('stores', product.storeId);
      }
      if (product.category) {
        product.categoryData = await findById('categories', product.category);
      }

      // Get related products
      const relatedProducts = await findDocuments('products', {
        category: product.category,
        status: 'active'
      }, {
        limit: 6,
        orderBy: 'createdAt',
        direction: 'desc'
      });

      res.json({
        success: true,
        data: {
          product,
          relatedProducts: relatedProducts.filter(p => p.id !== product.id).slice(0, 5)
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

  // Create new product
  async createProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        name,
        description,
        storeId,
        category,
        pricing,
        inventory,
        images,
        specifications,
        variants,
        shipping,
        seo,
        tags,
        brand,
        sku,
        isDigital,
        isFeatured
      } = req.body;

      // Verify store exists and user owns it
      const store = await findById('stores', storeId);
      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      if (req.user.role !== 'admin' && store.ownerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to add products to this store'
        });
      }

      // Create slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      // Create product
      const product = await createDocument('products', {
        name,
        slug,
        description,
        storeId,
        category,
        pricing: pricing || {},
        inventory: inventory || {},
        images: images || [],
        specifications: specifications || {},
        variants: variants || [],
        shipping: shipping || {},
        seo: seo || {},
        tags: tags || [],
        brand: brand || '',
        sku: sku || `PRD-${Date.now()}`,
        isDigital: isDigital || false,
        isFeatured: isFeatured || false,
        status: 'active',
        ratings: {
          average: 0,
          count: 0
        },
        sales: {
          total: 0,
          last30Days: 0
        },
        views: 0
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product }
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating product',
        error: error.message
      });
    }
  }

  // Update product
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await findById('products', id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check authorization
      if (req.user.role !== 'admin') {
        const store = await findById('stores', product.storeId);
        if (store?.ownerId !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to update this product'
          });
        }
      }

      const updatedProduct = await updateById('products', id, req.body);

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: { product: updatedProduct }
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

  // Delete product
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await findById('products', id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check authorization
      if (req.user.role !== 'admin') {
        const store = await findById('stores', product.storeId);
        if (store?.ownerId !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to delete this product'
          });
        }
      }

      await deleteById('products', id);

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting product',
        error: error.message
      });
    }
  }

  // Add product review
  async addReview(req, res) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;

      const product = await findById('products', id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const reviews = product.reviews || [];
      reviews.push({
        userId: req.user.id,
        rating: parseFloat(rating),
        comment,
        createdAt: new Date().toISOString()
      });

      // Calculate new average rating
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const average = totalRating / reviews.length;

      await updateById('products', id, {
        reviews,
        'ratings.average': average,
        'ratings.count': reviews.length
      });

      res.json({
        success: true,
        message: 'Review added successfully'
      });
    } catch (error) {
      console.error('Error adding review:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding review',
        error: error.message
      });
    }
  }

  // Get product stats
  async getProductStats(req, res) {
    try {
      const { id } = req.params;
      const product = await findById('products', id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Get orders containing this product
      const orders = await findDocuments('orders', {}, { limit: 1000 });
      const productOrders = orders.filter(order => 
        order.items?.some(item => item.productId === id)
      );

      const stats = {
        totalSales: product.sales?.total || 0,
        revenue: productOrders.reduce((sum, order) => {
          const item = order.items.find(i => i.productId === id);
          return sum + (item?.price || 0) * (item?.quantity || 0);
        }, 0),
        averageRating: product.ratings?.average || 0,
        totalReviews: product.ratings?.count || 0,
        views: product.views || 0,
        stockLevel: product.inventory?.stockQuantity || 0
      };

      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error('Error fetching product stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching product stats',
        error: error.message
      });
    }
  }
}

module.exports = new ProductController();
