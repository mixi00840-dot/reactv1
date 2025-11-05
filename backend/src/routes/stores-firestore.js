/**
 * Stores Routes (Firestore Implementation)
 * Handles store management, discovery, and interactions
 */

const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

const {
  createStore,
  getStoreById,
  getStoreBySlug,
  updateStore,
  deleteStore,
  listStores,

  searchStores,
  toggleStoreFollow,
  isFollowingStore,
  updateStoreStatus,
  verifyStore,
  featureStore,
  getStoresByOwner
} = require('../utils/storeHelpers');

/**
 * GET /api/stores
 * List stores with filters
 * Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      category,
      status,
      isVerified,
      isFeatured,
      search,
      sortBy,
      sortOrder,
      limit,
      startAfter
    } = req.query;

    const options = {
      category,
      status: status || 'active',
      isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      search,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      limit: parseInt(limit) || 20,
      startAfter
    };

    const result = await listStores(options);

    res.status(200).json({
      success: true,
      data: result.stores,
      pagination: {
        hasMore: result.hasMore,
        lastDoc: result.lastDoc
      }
    });
  } catch (error) {
    console.error('Error listing stores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stores',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/stores/search
 * Search stores by name or description
 * Public
 */
router.get('/search', async (req, res) => {
  try {
    const { q, category, status, limit } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters'
      });
    }

    const options = {
      category,
      status: status || 'active',
      limit: parseInt(limit) || 20
    };

    const stores = await searchStores(q.trim(), options);

    res.status(200).json({
      success: true,
      data: stores,
      count: stores.length
    });
  } catch (error) {
    console.error('Error searching stores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search stores',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/stores/my-stores
 * Get current user's stores
 * Protected - Sellers only
 */
router.get('/my-stores', authenticateUser, authorizeRoles('seller', 'admin'), async (req, res) => {
  try {
    const stores = await getStoresByOwner(req.user.uid);

    res.status(200).json({
      success: true,
      data: stores,
      count: stores.length
    });
  } catch (error) {
    console.error('Error getting user stores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your stores',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/stores/slug/:slug
 * Get store by slug
 * Public
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const store = await getStoreBySlug(req.params.slug);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    res.status(200).json({
      success: true,
      data: store
    });
  } catch (error) {
    console.error('Error getting store by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/stores/:id
 * Get store by ID with view increment
 * Public
 */
router.get('/:id', async (req, res) => {
  try {
    const store = await getStoreById(req.params.id, true);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if user is following (if authenticated)
    let isFollowing = false;
    if (req.headers.authorization) {
      try {
        const { authenticateUser: auth } = require('../middleware/auth');
        await auth(req, res, async () => {
          if (req.user) {
            isFollowing = await isFollowingStore(req.params.id, req.user.uid);
          }
        });
      } catch (error) {
        // User not authenticated, continue without follow status
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...store,
        isFollowing
      }
    });
  } catch (error) {
    console.error('Error getting store:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/stores
 * Create a new store
 * Protected - Sellers only
 */
router.post('/', authenticateUser, authorizeRoles('seller', 'admin'), async (req, res) => {
  try {
    const storeData = {
      ...req.body,
      ownerId: req.user.uid,
      ownerUsername: req.user.username
    };

    const store = await createStore(storeData);

    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: store
    });
  } catch (error) {
    console.error('Error creating store:', error);
    
    if (error.message.includes('already have a store')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create store',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/stores/:id
 * Update store
 * Protected - Store owner or admin
 */
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const store = await getStoreById(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check ownership
    if (store.ownerId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own stores'
      });
    }

    const updatedStore = await updateStore(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Store updated successfully',
      data: updatedStore
    });
  } catch (error) {
    console.error('Error updating store:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update store',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/stores/:id
 * Delete store (soft delete)
 * Protected - Store owner or admin
 */
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const store = await getStoreById(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check ownership
    if (store.ownerId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own stores'
      });
    }

    await deleteStore(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting store:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete store',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/stores/:id/follow
 * Follow/unfollow store
 * Protected
 */
router.post('/:id/follow', authenticateUser, async (req, res) => {
  try {
    const store = await getStoreById(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    const isCurrentlyFollowing = await isFollowingStore(req.params.id, req.user.uid);
    const result = await toggleStoreFollow(req.params.id, req.user.uid, !isCurrentlyFollowing);

    res.status(200).json({
      success: true,
      message: result.following ? 'Store followed successfully' : 'Store unfollowed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error toggling store follow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update follow status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/stores/:id/status
 * Update store status (admin only)
 * Protected - Admin only
 */
router.patch('/:id/status', authenticateUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const updatedStore = await updateStoreStatus(req.params.id, status);

    res.status(200).json({
      success: true,
      message: 'Store status updated successfully',
      data: updatedStore
    });
  } catch (error) {
    console.error('Error updating store status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update store status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/stores/:id/verify
 * Verify/unverify store (admin only)
 * Protected - Admin only
 */
router.patch('/:id/verify', authenticateUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { verified } = req.body;

    if (verified === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Verified status is required'
      });
    }

    const updatedStore = await verifyStore(req.params.id, verified);

    res.status(200).json({
      success: true,
      message: verified ? 'Store verified successfully' : 'Store verification removed',
      data: updatedStore
    });
  } catch (error) {
    console.error('Error verifying store:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update store verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/stores/:id/feature
 * Feature/unfeature store (admin only)
 * Protected - Admin only
 */
router.patch('/:id/feature', authenticateUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { featured } = req.body;

    if (featured === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Featured status is required'
      });
    }

    const updatedStore = await featureStore(req.params.id, featured);

    res.status(200).json({
      success: true,
      message: featured ? 'Store featured successfully' : 'Store unfeatured',
      data: updatedStore
    });
  } catch (error) {
    console.error('Error featuring store:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update store featured status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/stores/stats
 * Get store statistics
 * Access: Admin
 */
router.get('/stats', async (req, res) => {
  try {
    const db = require('../utils/database');
    const storesSnapshot = await db.collection('stores').get();
    
    let total = 0;
    let active = 0;
    let inactive = 0;
    let verified = 0;
    let featured = 0;
    
    storesSnapshot.forEach(doc => {
      const store = doc.data();
      total++;
      if (store.status === 'active') active++;
      if (store.status === 'inactive') inactive++;
      if (store.isVerified) verified++;
      if (store.isFeatured) featured++;
    });
    
    res.json({
      success: true,
      data: {
        stats: {
          total,
          active,
          inactive,
          verified,
          featured
        }
      }
    });
  } catch (error) {
    console.error('Get store stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store statistics'
    });
  }
});

module.exports = router;
