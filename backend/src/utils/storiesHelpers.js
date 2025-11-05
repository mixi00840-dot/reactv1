const db = require('./database');
const { FieldValue } = require('@google-cloud/firestore');

/**
 * Stories Helpers - Firestore Operations
 * Collection: stories
 */

// Create a new story
async function createStory(storyData) {
  const storyRef = db.collection('stories').doc();
  const story = {
    storyId: storyRef.id,
    userId: storyData.userId,
    mediaUrl: storyData.mediaUrl,
    mediaType: storyData.mediaType || 'image',
    thumbnail: storyData.thumbnail || null,
    caption: storyData.caption || '',
    duration: storyData.duration || 5,
    backgroundColor: storyData.backgroundColor || '#000000',
    music: storyData.music || null,
    location: storyData.location || null,
    mentions: storyData.mentions || [],
    hashtags: storyData.hashtags || [],
    viewCount: 0,
    reactionCount: 0,
    replyCount: 0,
    viewers: [],
    reactions: [],
    replies: [],
    status: 'active',
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    updatedAt: FieldValue.serverTimestamp()
  };
  
  await storyRef.set(story);
  return { ...story, storyId: storyRef.id };
}

// Get all active stories (not expired, within 24 hours)
async function getAllActiveStories(options = {}) {
  const { limit = 50, status = 'active' } = options;
  
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  let query = db.collection('stories')
    .where('status', '==', status)
    .where('expiresAt', '>', twentyFourHoursAgo)
    .orderBy('expiresAt', 'desc')
    .orderBy('createdAt', 'desc')
    .limit(limit);
  
  const snapshot = await query.get();
  const stories = [];
  
  snapshot.forEach(doc => {
    stories.push({ id: doc.id, ...doc.data() });
  });
  
  return stories;
}

// Get stories feed for following users
async function getStoriesFeed(userId, followingIds, options = {}) {
  const { limit = 50 } = options;
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  if (!followingIds || followingIds.length === 0) {
    return [];
  }
  
  // Firestore 'in' queries limited to 10 items, batch if needed
  const batches = [];
  for (let i = 0; i < followingIds.length; i += 10) {
    const batch = followingIds.slice(i, i + 10);
    const query = db.collection('stories')
      .where('userId', 'in', batch)
      .where('status', '==', 'active')
      .where('expiresAt', '>', twentyFourHoursAgo)
      .orderBy('expiresAt', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(limit);
    
    batches.push(query.get());
  }
  
  const snapshots = await Promise.all(batches);
  const stories = [];
  
  snapshots.forEach(snapshot => {
    snapshot.forEach(doc => {
      stories.push({ id: doc.id, ...doc.data() });
    });
  });
  
  // Sort by createdAt descending and limit
  return stories
    .sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis())
    .slice(0, limit);
}

// Get user stories
async function getUserStories(userId, options = {}) {
  const { limit = 50 } = options;
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const query = db.collection('stories')
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .where('expiresAt', '>', twentyFourHoursAgo)
    .orderBy('expiresAt', 'desc')
    .orderBy('createdAt', 'desc')
    .limit(limit);
  
  const snapshot = await query.get();
  const stories = [];
  
  snapshot.forEach(doc => {
    stories.push({ id: doc.id, ...doc.data() });
  });
  
  return stories;
}

// Get story by ID
async function getStoryById(storyId) {
  const doc = await db.collection('stories').doc(storyId).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return { id: doc.id, ...doc.data() };
}

// View story (increment view count and add viewer)
async function viewStory(storyId, viewerId) {
  const storyRef = db.collection('stories').doc(storyId);
  const doc = await storyRef.get();
  
  if (!doc.exists) {
    throw new Error('Story not found');
  }
  
  const story = doc.data();
  const viewers = story.viewers || [];
  
  // Only add viewer if not already viewed
  if (!viewers.includes(viewerId)) {
    await storyRef.update({
      viewCount: FieldValue.increment(1),
      viewers: FieldValue.arrayUnion(viewerId),
      updatedAt: FieldValue.serverTimestamp()
    });
  }
  
  return { success: true };
}

// Add reaction to story
async function addReaction(storyId, userId, reactionType) {
  const storyRef = db.collection('stories').doc(storyId);
  const doc = await storyRef.get();
  
  if (!doc.exists) {
    throw new Error('Story not found');
  }
  
  const reaction = {
    userId,
    type: reactionType,
    timestamp: new Date()
  };
  
  await storyRef.update({
    reactions: FieldValue.arrayUnion(reaction),
    reactionCount: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp()
  });
  
  return { success: true, reaction };
}

// Reply to story
async function replyToStory(storyId, userId, message) {
  const storyRef = db.collection('stories').doc(storyId);
  const doc = await storyRef.get();
  
  if (!doc.exists) {
    throw new Error('Story not found');
  }
  
  const reply = {
    userId,
    message,
    timestamp: new Date()
  };
  
  await storyRef.update({
    replies: FieldValue.arrayUnion(reply),
    replyCount: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp()
  });
  
  return { success: true, reply };
}

// Get story viewers
async function getStoryViewers(storyId) {
  const doc = await db.collection('stories').doc(storyId).get();
  
  if (!doc.exists) {
    throw new Error('Story not found');
  }
  
  const story = doc.data();
  return story.viewers || [];
}

// Delete story
async function deleteStory(storyId) {
  const storyRef = db.collection('stories').doc(storyId);
  const doc = await storyRef.get();
  
  if (!doc.exists) {
    throw new Error('Story not found');
  }
  
  await storyRef.update({
    status: 'deleted',
    updatedAt: FieldValue.serverTimestamp()
  });
  
  return { success: true };
}

// Save story to highlight
async function saveToHighlight(storyId, userId, highlightName) {
  const storyRef = db.collection('stories').doc(storyId);
  const doc = await storyRef.get();
  
  if (!doc.exists) {
    throw new Error('Story not found');
  }
  
  // Create highlight reference
  const highlightRef = db.collection('highlights').doc();
  await highlightRef.set({
    highlightId: highlightRef.id,
    userId,
    name: highlightName,
    storyId,
    coverImage: doc.data().thumbnail || doc.data().mediaUrl,
    createdAt: FieldValue.serverTimestamp()
  });
  
  return { success: true, highlightId: highlightRef.id };
}

// Get cleanup statistics (Admin)
async function getCleanupStats() {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Count expired stories
  const expiredSnapshot = await db.collection('stories')
    .where('expiresAt', '<', now)
    .where('status', '==', 'active')
    .count()
    .get();
  
  // Count active stories
  const activeSnapshot = await db.collection('stories')
    .where('status', '==', 'active')
    .where('expiresAt', '>', twentyFourHoursAgo)
    .count()
    .get();
  
  // Count all stories
  const totalSnapshot = await db.collection('stories')
    .count()
    .get();
  
  return {
    expiredCount: expiredSnapshot.data().count,
    activeCount: activeSnapshot.data().count,
    totalCount: totalSnapshot.data().count,
    readyForCleanup: expiredSnapshot.data().count
  };
}

// Manual cleanup (Admin) - mark expired stories as inactive
async function manualCleanup() {
  const now = new Date();
  
  const expiredSnapshot = await db.collection('stories')
    .where('expiresAt', '<', now)
    .where('status', '==', 'active')
    .limit(500)
    .get();
  
  const batch = db.batch();
  let count = 0;
  
  expiredSnapshot.forEach(doc => {
    batch.update(doc.ref, {
      status: 'expired',
      updatedAt: FieldValue.serverTimestamp()
    });
    count++;
  });
  
  await batch.commit();
  
  return {
    success: true,
    cleanedCount: count
  };
}

// Get stories statistics
async function getStoriesStats() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Get active stories count
  const activeSnapshot = await db.collection('stories')
    .where('status', '==', 'active')
    .where('expiresAt', '>', twentyFourHoursAgo)
    .count()
    .get();
  
  // Get total views (sum of all viewCounts)
  const storiesSnapshot = await db.collection('stories')
    .where('status', '==', 'active')
    .where('expiresAt', '>', twentyFourHoursAgo)
    .get();
  
  let totalViews = 0;
  let totalReactions = 0;
  let totalReplies = 0;
  
  storiesSnapshot.forEach(doc => {
    const data = doc.data();
    totalViews += data.viewCount || 0;
    totalReactions += data.reactionCount || 0;
    totalReplies += data.replyCount || 0;
  });
  
  return {
    activeStories: activeSnapshot.data().count,
    totalViews,
    totalReactions,
    totalReplies,
    averageViews: activeSnapshot.data().count > 0 ? totalViews / activeSnapshot.data().count : 0
  };
}

module.exports = {
  createStory,
  getAllActiveStories,
  getStoriesFeed,
  getUserStories,
  getStoryById,
  viewStory,
  addReaction,
  replyToStory,
  getStoryViewers,
  deleteStory,
  saveToHighlight,
  getCleanupStats,
  manualCleanup,
  getStoriesStats
};
