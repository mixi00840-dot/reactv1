const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/firebaseAuth');
const db = require('../utils/database');
const { FieldValue } = require('@google-cloud/firestore');

/**
 * Content Routes - Firestore Implementation
 * Supports posts, videos, stories, and carousel content
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Content API is operational (Firestore)' });
});

/**
 * GET /api/content
 * Get all content with filters
 * Query params: limit, offset, type, userId, status
 */
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      type, 
      userId, 
      status = 'published',
      page = 1
    } = req.query;
    
    let query = db.collection('content');
    
    // Apply filters
    if (type) {
      query = query.where('type', '==', type);
    }
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    if (status) {
      query = query.where('status', '==', status);
    }
    
    // Order by createdAt descending
    query = query.orderBy('createdAt', 'desc');
    
    // Apply pagination
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset) || (parseInt(page) - 1) * limitNum;
    query = query.limit(limitNum).offset(offsetNum);
    
    const snapshot = await query.get();
    
    const content = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get creator info
      let creator = null;
      if (data.userId) {
        try {
          const userDoc = await db.collection('users').doc(data.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            creator = {
              id: userDoc.id,
              username: userData.username || userData.email?.split('@')[0] || 'user',
              fullName: userData.fullName || userData.displayName || '',
              avatar: userData.avatar || userData.photoURL || '',
              isVerified: userData.isVerified || false,
              isSeller: userData.role === 'seller' || false
            };
          }
        } catch (err) {
          console.error('Error fetching creator:', err);
        }
      }
      
      // Get like count
      const likesSnapshot = await db.collection('contentLikes')
        .where('contentId', '==', doc.id)
        .count()
        .get();
      const likeCount = likesSnapshot.data().count || 0;
      
      // Check if current user liked
      const userId = req.user.id || req.user.uid;
      const userLikeDoc = await db.collection('contentLikes')
        .doc(`${doc.id}_${userId}`)
        .get();
      const isLiked = userLikeDoc.exists;
      
      // Get comment count
      const commentsSnapshot = await db.collection('comments')
        .where('contentId', '==', doc.id)
        .count()
        .get();
      const commentCount = commentsSnapshot.data().count || 0;
      
      // Get save count
      const savesSnapshot = await db.collection('contentSaves')
        .where('contentId', '==', doc.id)
        .count()
        .get();
      const saveCount = savesSnapshot.data().count || 0;
      
      // Check if current user saved
      const userSaveDoc = await db.collection('contentSaves')
        .doc(`${doc.id}_${userId}`)
        .get();
      const isSaved = userSaveDoc.exists;
      
      // Format media array for posts
      let media = [];
      if (data.type === 'post' || data.type === 'carousel') {
        if (data.postMetadata?.imageUrls && Array.isArray(data.postMetadata.imageUrls)) {
          media = data.postMetadata.imageUrls.map((img, index) => ({
            id: `${doc.id}_${index}`,
            type: 'photo',
            url: img.url,
            thumbnail: img.url,
            width: img.width || null,
            height: img.height || null,
            aspectRatio: img.width && img.height ? img.width / img.height : 1.0
          }));
        } else if (data.media?.masterFile?.url) {
          // Single media
          media = [{
            id: `${doc.id}_0`,
            type: data.type === 'video' ? 'video' : 'photo',
            url: data.media.masterFile.url,
            thumbnail: data.media.thumbnail?.url || data.media.masterFile.url,
            width: data.media.masterFile.width || null,
            height: data.media.masterFile.height || null,
            aspectRatio: data.media.masterFile.width && data.media.masterFile.height 
              ? data.media.masterFile.width / data.media.masterFile.height 
              : 1.0
          }];
        }
      } else if (data.media?.masterFile?.url) {
        // Video content
        media = [{
          id: `${doc.id}_0`,
          type: 'video',
          url: data.media.masterFile.url,
          thumbnail: data.media.thumbnail?.url || '',
          duration: data.duration || null,
          width: data.media.masterFile.width || null,
          height: data.media.masterFile.height || null,
          aspectRatio: data.media.masterFile.width && data.media.masterFile.height 
            ? data.media.masterFile.width / data.media.masterFile.height 
            : 16/9
        }];
      }
      
      // Get first media URL for admin dashboard imageUrl
      const imageUrl = media.length > 0 ? media[0].url : null;
      
      content.push({
        id: doc.id,
        _id: doc.id, // For admin dashboard compatibility
        userId: data.userId,
        creator: creator || {
          id: data.userId,
          username: 'user',
          fullName: '',
          avatar: '',
          isVerified: false,
          isSeller: false
        },
        type: data.type || 'post',
        media: media,
        caption: data.caption || data.description || '',
        hashtags: data.hashtags?.map(h => typeof h === 'string' ? h : h.normalizedTag || h.tag) || [],
        tags: data.hashtags?.map(h => typeof h === 'string' ? h : h.normalizedTag || h.tag) || [], // For admin dashboard
        productTags: data.productTags || [],
        location: data.location || null,
        sound: data.soundId ? {
          id: data.soundId,
          name: '',
          artist: '',
          cover: null,
          usageCount: 0
        } : null,
        stats: {
          likes: likeCount,
          comments: commentCount,
          shares: data.shares || 0,
          saves: saveCount,
          views: data.views || 0
        },
        // Direct fields for admin dashboard compatibility
        likes: likeCount,
        comments: commentCount,
        shares: data.shares || 0,
        saves: saveCount,
        views: data.views || 0,
        isLiked: isLiked,
        isSaved: isSaved,
        isFollowing: false, // TODO: Check follow status
        createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
        // Additional fields for admin dashboard
        title: data.title || '',
        description: data.description || '',
        category: data.category || '',
        visibility: data.visibility || 'public',
        allowComments: data.settings?.allowComments !== false,
        status: data.status || 'published',
        imageUrl: imageUrl // For admin dashboard
      });
    }
    
    res.json({
      success: true,
      data: {
        content: content,
        count: content.length,
        limit: limitNum,
        offset: offsetNum,
        hasMore: content.length === limitNum
      }
    });
  } catch (error) {
    console.error('Error getting content:', error);
    // Return empty array if error (e.g., missing index)
    res.json({
      success: true,
      data: {
        content: [],
        count: 0,
        limit: parseInt(req.query.limit || 20),
        offset: parseInt(req.query.offset || 0),
        hasMore: false
      }
    });
  }
});

/**
 * GET /api/content/:contentId
 * Get content by ID
 */
router.get('/:contentId', verifyFirebaseToken, async (req, res) => {
  try {
    const { contentId } = req.params;
    const doc = await db.collection('content').doc(contentId).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    const data = doc.data();
    const userId = req.user.id || req.user.uid;
    
    // Get creator info
    let creator = null;
    if (data.userId) {
      try {
        const userDoc = await db.collection('users').doc(data.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          creator = {
            id: userDoc.id,
            username: userData.username || userData.email?.split('@')[0] || 'user',
            fullName: userData.fullName || userData.displayName || '',
            avatar: userData.avatar || userData.photoURL || '',
            isVerified: userData.isVerified || false,
            isSeller: userData.role === 'seller' || false
          };
        }
      } catch (err) {
        console.error('Error fetching creator:', err);
      }
    }
    
    // Get stats
    const likesSnapshot = await db.collection('contentLikes')
      .where('contentId', '==', contentId)
      .count()
      .get();
    const likeCount = likesSnapshot.data().count || 0;
    
    const userLikeDoc = await db.collection('contentLikes')
      .doc(`${contentId}_${userId}`)
      .get();
    const isLiked = userLikeDoc.exists;
    
    const commentsSnapshot = await db.collection('comments')
      .where('contentId', '==', contentId)
      .count()
      .get();
    const commentCount = commentsSnapshot.data().count || 0;
    
    const savesSnapshot = await db.collection('contentSaves')
      .where('contentId', '==', contentId)
      .count()
      .get();
    const saveCount = savesSnapshot.data().count || 0;
    
    const userSaveDoc = await db.collection('contentSaves')
      .doc(`${contentId}_${userId}`)
      .get();
    const isSaved = userSaveDoc.exists;
    
    // Format media
    let media = [];
    if (data.type === 'post' || data.type === 'carousel') {
      if (data.postMetadata?.imageUrls && Array.isArray(data.postMetadata.imageUrls)) {
        media = data.postMetadata.imageUrls.map((img, index) => ({
          id: `${contentId}_${index}`,
          type: 'photo',
          url: img.url,
          thumbnail: img.url,
          width: img.width || null,
          height: img.height || null,
          aspectRatio: img.width && img.height ? img.width / img.height : 1.0
        }));
      }
    } else if (data.media?.masterFile?.url) {
      media = [{
        id: `${contentId}_0`,
        type: data.type === 'video' ? 'video' : 'photo',
        url: data.media.masterFile.url,
        thumbnail: data.media.thumbnail?.url || data.media.masterFile.url,
        duration: data.duration || null,
        width: data.media.masterFile.width || null,
        height: data.media.masterFile.height || null,
        aspectRatio: data.media.masterFile.width && data.media.masterFile.height 
          ? data.media.masterFile.width / data.media.masterFile.height 
          : 1.0
      }];
    }
    
    const imageUrl = media.length > 0 ? media[0].url : null;
    
    res.json({
      success: true,
      data: {
        id: doc.id,
        _id: doc.id, // For admin dashboard compatibility
        userId: data.userId,
        creator: creator || {
          id: data.userId,
          username: 'user',
          fullName: '',
          avatar: '',
          isVerified: false,
          isSeller: false
        },
        type: data.type || 'post',
        media: media,
        caption: data.caption || data.description || '',
        hashtags: data.hashtags?.map(h => typeof h === 'string' ? h : h.normalizedTag || h.tag) || [],
        tags: data.hashtags?.map(h => typeof h === 'string' ? h : h.normalizedTag || h.tag) || [],
        productTags: data.productTags || [],
        location: data.location || null,
        sound: data.soundId ? {
          id: data.soundId,
          name: '',
          artist: '',
          cover: null,
          usageCount: 0
        } : null,
        stats: {
          likes: likeCount,
          comments: commentCount,
          shares: data.shares || 0,
          saves: saveCount,
          views: data.views || 0
        },
        likes: likeCount,
        comments: commentCount,
        shares: data.shares || 0,
        saves: saveCount,
        views: data.views || 0,
        isLiked: isLiked,
        isSaved: isSaved,
        isFollowing: false,
        createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
        title: data.title || '',
        description: data.description || '',
        category: data.category || '',
        visibility: data.visibility || 'public',
        allowComments: data.settings?.allowComments !== false,
        status: data.status || 'published',
        imageUrl: imageUrl
      }
    });
  } catch (error) {
    console.error('Error getting content:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/content
 * Create new content (post, video, etc.)
 */
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const {
      type = 'post',
      caption,
      description,
      title,
      hashtags = [],
      media = [],
      location,
      soundId,
      productTags = [],
      visibility = 'public',
      category,
      allowComments = true
    } = req.body;
    
    const userId = req.user.id || req.user.uid;
    
    // Process hashtags
    const processedHashtags = hashtags.map(tag => {
      const normalized = tag.toLowerCase().replace(/^#/, '');
      return {
        tag: tag.startsWith('#') ? tag : `#${tag}`,
        normalizedTag: normalized
      };
    });
    
    // Prepare content data
    const contentData = {
      userId: userId,
      type: type,
      caption: caption || description || '',
      description: description || caption || '',
      title: title || '',
      hashtags: processedHashtags,
      visibility: visibility,
      status: 'published',
      category: category || '',
      settings: {
        allowComments: allowComments !== false,
        allowSharing: true,
        showLikeCount: true,
        showViewCount: true
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      publishedAt: FieldValue.serverTimestamp()
    };
    
    // Add location if provided
    if (location) {
      contentData.location = typeof location === 'string' 
        ? { name: location }
        : location;
    }
    
    // Add sound if provided
    if (soundId) {
      contentData.soundId = soundId;
    }
    
    // Add product tags if provided
    if (productTags && productTags.length > 0) {
      contentData.productTags = productTags;
    }
    
    // Handle media for posts (carousel)
    if (type === 'post' || type === 'carousel') {
      if (media && media.length > 0) {
        contentData.postMetadata = {
          imageUrls: media.map((url, index) => ({
            url: typeof url === 'string' ? url : url.url,
            key: `post_${userId}_${Date.now()}_${index}`,
            order: index,
            width: typeof url === 'object' ? url.width : null,
            height: typeof url === 'object' ? url.height : null
          }))
        };
      }
    } else if (media && media.length > 0) {
      // Video or single media
      const firstMedia = media[0];
      contentData.media = {
        masterFile: {
          url: typeof firstMedia === 'string' ? firstMedia : firstMedia.url,
          mimeType: typeof firstMedia === 'object' ? firstMedia.mimeType : 'video/mp4',
          size: typeof firstMedia === 'object' ? firstMedia.size : null,
          width: typeof firstMedia === 'object' ? firstMedia.width : null,
          height: typeof firstMedia === 'object' ? firstMedia.height : null
        },
        thumbnail: typeof firstMedia === 'object' && firstMedia.thumbnail ? {
          url: firstMedia.thumbnail
        } : null
      };
    }
    
    // Create content document
    const docRef = await db.collection('content').add(contentData);
    const doc = await docRef.get();
    
    // Get creator info
    let creator = null;
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        creator = {
          id: userDoc.id,
          username: userData.username || userData.email?.split('@')[0] || 'user',
          fullName: userData.fullName || userData.displayName || '',
          avatar: userData.avatar || userData.photoURL || '',
          isVerified: userData.isVerified || false,
          isSeller: userData.role === 'seller' || false
        };
      }
    } catch (err) {
      console.error('Error fetching creator:', err);
    }
    
    const createdData = doc.data();
    
    // Format response
    let formattedMedia = [];
    if (type === 'post' || type === 'carousel') {
      if (createdData.postMetadata?.imageUrls) {
        formattedMedia = createdData.postMetadata.imageUrls.map((img, index) => ({
          id: `${doc.id}_${index}`,
          type: 'photo',
          url: img.url,
          thumbnail: img.url,
          width: img.width || null,
          height: img.height || null,
          aspectRatio: img.width && img.height ? img.width / img.height : 1.0
        }));
      }
    } else if (createdData.media?.masterFile?.url) {
      formattedMedia = [{
        id: `${doc.id}_0`,
        type: type === 'video' ? 'video' : 'photo',
        url: createdData.media.masterFile.url,
        thumbnail: createdData.media.thumbnail?.url || createdData.media.masterFile.url,
        width: createdData.media.masterFile.width || null,
        height: createdData.media.masterFile.height || null,
        aspectRatio: createdData.media.masterFile.width && createdData.media.masterFile.height 
          ? createdData.media.masterFile.width / createdData.media.masterFile.height 
          : 1.0
      }];
    }
    
    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: {
        id: doc.id,
        userId: userId,
        creator: creator || {
          id: userId,
          username: 'user',
          fullName: '',
          avatar: '',
          isVerified: false,
          isSeller: false
        },
        type: type,
        media: formattedMedia,
        caption: createdData.caption || '',
        hashtags: processedHashtags.map(h => h.normalizedTag),
        productTags: productTags,
        location: createdData.location || null,
        sound: soundId ? { id: soundId } : null,
        stats: {
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
          views: 0
        },
        isLiked: false,
        isSaved: false,
        isFollowing: false,
        createdAt: createdData.createdAt?.toDate?.() || new Date(),
        updatedAt: createdData.updatedAt?.toDate?.() || new Date(),
        title: createdData.title || '',
        description: createdData.description || '',
        category: createdData.category || '',
        visibility: createdData.visibility || 'public',
        allowComments: createdData.settings?.allowComments !== false,
        status: createdData.status || 'published'
      }
    });
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/content/:contentId
 * Update content
 */
router.put('/:contentId', verifyFirebaseToken, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id || req.user.uid;
    
    // Check if content exists and user owns it
    const doc = await db.collection('content').doc(contentId).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    const data = doc.data();
    if (data.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this content'
      });
    }
    
    // Prepare updates
    const updates = {
      updatedAt: FieldValue.serverTimestamp()
    };
    
    if (req.body.caption !== undefined) updates.caption = req.body.caption;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.hashtags !== undefined) {
      updates.hashtags = req.body.hashtags.map(tag => {
        const normalized = tag.toLowerCase().replace(/^#/, '');
        return {
          tag: tag.startsWith('#') ? tag : `#${tag}`,
          normalizedTag: normalized
        };
      });
    }
    if (req.body.visibility !== undefined) updates.visibility = req.body.visibility;
    if (req.body.category !== undefined) updates.category = req.body.category;
    if (req.body.allowComments !== undefined) {
      if (!updates.settings) updates.settings = { ...data.settings };
      updates.settings.allowComments = req.body.allowComments;
    }
    
    // Update document
    await db.collection('content').doc(contentId).update(updates);
    
    // Get updated document
    const updatedDoc = await db.collection('content').doc(contentId).get();
    
    res.json({
      success: true,
      message: 'Content updated successfully',
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/content/:contentId
 * Delete content
 */
router.delete('/:contentId', verifyFirebaseToken, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id || req.user.uid;
    
    // Check if content exists and user owns it
    const doc = await db.collection('content').doc(contentId).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    const data = doc.data();
    if (data.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this content'
      });
    }
    
    // Delete content
    await db.collection('content').doc(contentId).delete();
    
    // Delete related likes and saves
    const likesSnapshot = await db.collection('contentLikes')
      .where('contentId', '==', contentId)
      .get();
    const batch = db.batch();
    likesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/content/:contentId/like
 * Like/Unlike content
 */
router.post('/:contentId/like', verifyFirebaseToken, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id || req.user.uid;
    const likeDocId = `${contentId}_${userId}`;
    
    // Check if already liked
    const likeDoc = await db.collection('contentLikes').doc(likeDocId).get();
    
    if (likeDoc.exists) {
      // Unlike
      await db.collection('contentLikes').doc(likeDocId).delete();
      
      // Get updated like count
      const likeSnapshot = await db.collection('contentLikes')
        .where('contentId', '==', contentId)
        .count()
        .get();
      
      const likeCount = likeSnapshot.data().count || 0;
      
      return res.json({
        success: true,
        data: { liked: false, likeCount }
      });
    } else {
      // Like
      await db.collection('contentLikes').doc(likeDocId).set({
        contentId,
        userId,
        createdAt: FieldValue.serverTimestamp()
      });
      
      // Get updated like count
      const likeSnapshot = await db.collection('contentLikes')
        .where('contentId', '==', contentId)
        .count()
        .get();
      
      const likeCount = likeSnapshot.data().count || 0;
      
      return res.json({
        success: true,
        data: { liked: true, likeCount }
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/content/:contentId/save
 * Save/Unsave content
 */
router.post('/:contentId/save', verifyFirebaseToken, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id || req.user.uid;
    const saveDocId = `${contentId}_${userId}`;
    
    // Check if already saved
    const saveDoc = await db.collection('contentSaves').doc(saveDocId).get();
    
    if (saveDoc.exists) {
      // Unsave
      await db.collection('contentSaves').doc(saveDocId).delete();
      
      return res.json({
        success: true,
        data: { saved: false }
      });
    } else {
      // Save
      await db.collection('contentSaves').doc(saveDocId).set({
        contentId,
        userId,
        createdAt: FieldValue.serverTimestamp()
      });
      
      return res.json({
        success: true,
        data: { saved: true }
      });
    }
  } catch (error) {
    console.error('Error toggling save:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/content/stats
 * Get content statistics (for admin dashboard)
 */
router.get('/stats', verifyFirebaseToken, async (req, res) => {
  try {
    const { type = 'post' } = req.query;
    
    // Only admins can access stats
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    let query = db.collection('content');
    if (type !== 'all') {
      query = query.where('type', '==', type);
    }
    
    const snapshot = await query.get();
    const allContent = snapshot.docs.map(doc => doc.data());
    
    const stats = {
      total: allContent.length,
      active: allContent.filter(c => c.status === 'published' || c.status === 'active').length,
      scheduled: allContent.filter(c => c.status === 'scheduled').length,
      totalEngagement: 0
    };
    
    // Calculate total engagement (sum of likes, comments, shares)
    for (const content of allContent) {
      const likesSnapshot = await db.collection('contentLikes')
        .where('contentId', '==', content.id || snapshot.docs.find(d => d.data() === content)?.id)
        .count()
        .get();
      const likes = likesSnapshot.data().count || 0;
      
      const commentsSnapshot = await db.collection('comments')
        .where('contentId', '==', content.id || snapshot.docs.find(d => d.data() === content)?.id)
        .count()
        .get();
      const comments = commentsSnapshot.data().count || 0;
      
      stats.totalEngagement += likes + comments + (content.shares || 0);
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
