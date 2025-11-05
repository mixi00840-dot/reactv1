/**
 * Store Controller - Firestore Migration
 * Handles all store-related operations using Firestore
 */

const {
  findDocuments,
  findById,
  findOne,
  createDocument,
  updateById,
  deleteById,
  paginatedQuery
} = require('../utils/firestoreHelpers');

class StoreController {
  // Get all stores
  async getStores(req, res) {
    try {
      const { page = 1, limit = 20, search, category, status = 'active', featured } = req.query;

      const filters = {};
      if (status && status !== 'all') {
        filters.status = status;
      }
      if (featured === 'true') {
        filters.isFeatured = true;
      }
      if (category) {
        filters.category = category;
      }

      let stores = await findDocuments('stores', filters, {
        limit: parseInt(limit) * 2,
        orderBy: 'createdAt',
        direction: 'desc'
      });

      // Search filter in memory
      if (search) {
        const searchLower = search.toLowerCase();
        stores = stores.filter(s => 
          s.name?.toLowerCase().includes(searchLower) ||
          s.description?.toLowerCase().includes(searchLower) ||
          s.businessInfo?.businessName?.toLowerCase().includes(searchLower)
        );
      }

      const start = (parseInt(page) - 1) * parseInt(limit);
      const end = start + parseInt(limit);
      const total = stores.length;
      const paginatedStores = stores.slice(start, end);

      res.json({
        success: true,
        data: {
          stores: paginatedStores,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching stores:', error);
      res.status(500).json({ success: false, message: 'Error fetching stores', error: error.message });
    }
  }

  // Get single store
  async getStore(req, res) {
    try {
      const { id } = req.params;
      let store = await findById('stores', id);
      
      if (!store) {
        store = await findOne('stores', { slug: id });
      }

      if (!store) {
        return res.status(404).json({ success: false, message: 'Store not found' });
      }

      // Get store products
      const products = await findDocuments('products', { storeId: store.id, status: 'active' }, { limit: 12 });

      res.json({ success: true, data: { store, products } });
    } catch (error) {
      console.error('Error fetching store:', error);
      res.status(500).json({ success: false, message: 'Error fetching store', error: error.message });
    }
  }

  // Create store
  async createStore(req, res) {
    try {
      const { name, description, logo, banner, businessInfo, shipping, policies } = req.body;

      // Check if user is a seller
      const user = await findById('users', req.user.id);
      if (user.role !== 'seller' && user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Only sellers can create stores' });
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const store = await createDocument('stores', {
        name,
        slug,
        description: description || '',
        logo: logo || '',
        banner: banner || '',
        ownerId: req.user.id,
        businessInfo: businessInfo || {},
        shipping: shipping || {},
        policies: policies || {},
        status: 'active',
        isFeatured: false,
        ratings: { average: 0, count: 0 },
        stats: { totalProducts: 0, totalSales: 0, totalRevenue: 0 }
      });

      res.status(201).json({ success: true, message: 'Store created successfully', data: { store } });
    } catch (error) {
      console.error('Error creating store:', error);
      res.status(500).json({ success: false, message: 'Error creating store', error: error.message });
    }
  }

  // Update store
  async updateStore(req, res) {
    try {
      const { id } = req.params;
      const store = await findById('stores', id);

      if (!store) {
        return res.status(404).json({ success: false, message: 'Store not found' });
      }

      if (req.user.role !== 'admin' && store.ownerId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const updatedStore = await updateById('stores', id, req.body);
      res.json({ success: true, message: 'Store updated successfully', data: { store: updatedStore } });
    } catch (error) {
      console.error('Error updating store:', error);
      res.status(500).json({ success: false, message: 'Error updating store', error: error.message });
    }
  }

  // Delete store
  async deleteStore(req, res) {
    try {
      const { id } = req.params;
      const store = await findById('stores', id);

      if (!store) {
        return res.status(404).json({ success: false, message: 'Store not found' });
      }

      if (req.user.role !== 'admin' && store.ownerId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      await deleteById('stores', id);
      res.json({ success: true, message: 'Store deleted successfully' });
    } catch (error) {
      console.error('Error deleting store:', error);
      res.status(500).json({ success: false, message: 'Error deleting store', error: error.message });
    }
  }

  // Stub methods for routes compatibility
  async updateStoreSettings(req, res) {
    return this.updateStore(req, res);
  }

  async getStoreDashboard(req, res) {
    res.status(503).json({ success: false, message: 'Dashboard feature coming soon' });
  }

  async getStoreAnalytics(req, res) {
    res.status(503).json({ success: false, message: 'Analytics feature coming soon' });
  }

  async updateStoreStatus(req, res) {
    return this.updateStore(req, res);
  }

  async getStoreProducts(req, res) {
    try {
      const { id } = req.params;
      const products = await findDocuments('products', { storeId: id, status: 'active' }, { limit: 100 });
      res.json({ success: true, data: { products } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching store products', error: error.message });
    }
  }

  async getStoreOrders(req, res) {
    try {
      const { id } = req.params;
      const orders = await findDocuments('orders', { storeId: id }, { limit: 100 });
      res.json({ success: true, data: { orders } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching store orders', error: error.message });
    }
  }

  async verifyStore(req, res) {
    try {
      const { id } = req.params;
      await updateById('stores', id, { verified: true });
      res.json({ success: true, message: 'Store verified successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error verifying store', error: error.message });
    }
  }

  async featureStore(req, res) {
    try {
      const { id } = req.params;
      const { featured } = req.body;
      await updateById('stores', id, { isFeatured: featured });
      res.json({ success: true, message: 'Store feature status updated' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error updating feature status', error: error.message });
    }
  }

  async unverifyStore(req, res) {
    try {
      const { id } = req.params;
      await updateById('stores', id, { verified: false });
      res.json({ success: true, message: 'Store unverified successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error unverifying store', error: error.message });
    }
  }

  async banStore(req, res) {
    try {
      const { id } = req.params;
      await updateById('stores', id, { status: 'banned' });
      res.json({ success: false, message: 'Store banned successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error banning store', error: error.message });
    }
  }

  async suspendStore(req, res) {
    try {
      const { id } = req.params;
      await updateById('stores', id, { status: 'suspended' });
      res.json({ success: true, message: 'Store suspended successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error suspending store', error: error.message });
    }
  }

  async activateStore(req, res) {
    try {
      const { id } = req.params;
      await updateById('stores', id, { status: 'active' });
      res.json({ success: true, message: 'Store activated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error activating store', error: error.message });
    }
  }

  // Get global store stats for admin dashboard
  async getGlobalStats(req, res) {
    try {
      const { findDocuments } = require('../utils/firestoreHelpers');
      const stores = await findDocuments('stores', {}, { limit: 10000 });

      let total = 0;
      let active = 0;
      let inactive = 0;
      let verified = 0;
      let featured = 0;

      for (const s of stores) {
        total += 1;
        if (s.status === 'active') active += 1;
        if (s.status && s.status !== 'active') inactive += 1;
        if (s.verified) verified += 1;
        if (s.isFeatured) featured += 1;
      }

      return res.json({
        success: true,
        data: {
          stats: { total, active, inactive, verified, featured }
        }
      });
    } catch (error) {
      console.error('Error fetching global store stats:', error);
      return res.status(500).json({ success: false, message: 'Error fetching store stats' });
    }
  }
}

module.exports = new StoreController();
