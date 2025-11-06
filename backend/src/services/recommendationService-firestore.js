const db = require('../utils/database');
const { FieldValue } = require('@google-cloud/firestore');

/**
 * Recommendation Service - Firestore Implementation
 * Implements TikTok-style recommendation algorithms:
 * - Collaborative Filtering
 * - Content-Based Filtering
 * - Trending Recommendations
 * - Following-based Recommendations
 * - Hybrid approach combining all strategies
 */
class RecommendationService {
  constructor() {
    // Algorithm weights (similar to TikTok's For You algorithm)
    this.weights = {
      collaborative: 0.4,  // User-user similarity
      contentBased: 0.3,   // Content features matching
      trending: 0.2,       // Popular content
      following: 0.1       // Content from followed users
    };
  }

  /**
   * Generate personalized recommendations for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of recommendations
   * @returns {Promise<Array>} Recommended content with scores
   */
  async generateRecommendations(userId, limit = 50) {
    try {
      console.log(`Generating recommendations for user ${userId}...`);

      // Get user preferences and activity
      const userPreferences = await this.analyzeUserPreferences(userId);

      // Generate recommendations from different sources in parallel
      const [
        collaborativeRecs,
        contentBasedRecs,
        trendingRecs,
        followingRecs
      ] = await Promise.all([
        this.getCollaborativeRecommendations(userId, userPreferences),
        this.getContentBasedRecommendations(userId, userPreferences),
        this.getTrendingRecommendations(userId),
        this.getFollowingRecommendations(userId)
      ]);

      // Combine and score recommendations
      const combinedRecs = this.combineRecommendations({
        collaborative: collaborativeRecs,
        contentBased: contentBasedRecs,
        trending: trendingRecs,
        following: followingRecs
      });

      // Remove duplicates and already-watched content
      const watchedContent = await this.getWatchedContent(userId);
      const filteredRecs = combinedRecs.filter(rec => 
        !watchedContent.includes(rec.contentId)
      );

      // Sort by score and limit
      const topRecs = filteredRecs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Save recommendations to Firestore for caching
      await this.saveRecommendations(userId, topRecs, userPreferences);

      console.log(`Generated ${topRecs.length} recommendations for user ${userId}`);

      return topRecs;

    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  /**
   * Analyze user preferences from their activity
   */
  async analyzeUserPreferences(userId) {
    try {
      // Get user's recent activity (last 100 interactions)
      const activitiesSnapshot = await db.collection('userActivities')
        .where('userId', '==', userId)
        .where('activityType', 'in', ['view', 'like', 'share', 'comment'])
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      const activities = [];
      activitiesSnapshot.forEach(doc => {
        activities.push({ id: doc.id, ...doc.data() });
      });

      if (activities.length === 0) {
        return {
          favoriteCategories: [],
          favoriteCreators: [],
          avgWatchTime: 0,
          preferredContentLength: 'medium',
          activeHours: [],
          engagementRate: 0
        };
      }

      // Get content IDs from activities
      const contentIds = activities
        .filter(a => a.targetType === 'content')
        .map(a => a.targetId);

      // Get content details
      const categories = {};
      const creators = new Set();
      let totalWatchTime = 0;
      let totalVideos = 0;

      for (const contentId of contentIds.slice(0, 50)) {
        try {
          const contentDoc = await db.collection('content').doc(contentId).get();
          if (contentDoc.exists) {
            const contentData = contentDoc.data();
            
            // Count categories
            if (contentData.category) {
              categories[contentData.category] = (categories[contentData.category] || 0) + 1;
            }

            // Track creators
            if (contentData.userId) {
              creators.add(contentData.userId);
            }

            // Calculate avg watch time
            const activity = activities.find(a => a.targetId === contentId);
            if (activity?.metadata?.watchTime) {
              totalWatchTime += activity.metadata.watchTime;
              totalVideos++;
            }
          }
        } catch (err) {
          console.error(`Error fetching content ${contentId}:`, err);
        }
      }

      // Determine favorite categories (top 3)
      const favoriteCategories = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);

      // Determine preferred content length
      const avgWatchTime = totalVideos > 0 ? totalWatchTime / totalVideos : 0;
      let preferredContentLength = 'medium';
      if (avgWatchTime < 30) preferredContentLength = 'short';
      else if (avgWatchTime > 180) preferredContentLength = 'long';

      // Calculate engagement rate
      const likes = activities.filter(a => a.activityType === 'like').length;
      const shares = activities.filter(a => a.activityType === 'share').length;
      const views = activities.filter(a => a.activityType === 'view').length;
      const engagementRate = views > 0 ? ((likes + shares) / views) * 100 : 0;

      // Determine active hours
      const hourCounts = {};
      activities.forEach(a => {
        const timestamp = a.timestamp?.toDate?.() || new Date(a.timestamp);
        const hour = timestamp.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      const activeHours = Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));

      return {
        favoriteCategories,
        favoriteCreators: Array.from(creators),
        avgWatchTime: Math.round(avgWatchTime),
        preferredContentLength,
        activeHours,
        engagementRate: Math.round(engagementRate * 100) / 100
      };

    } catch (error) {
      console.error('Error analyzing user preferences:', error);
      return {
        favoriteCategories: [],
        favoriteCreators: [],
        avgWatchTime: 0,
        preferredContentLength: 'medium',
        activeHours: [],
        engagementRate: 0
      };
    }
  }

  /**
   * Collaborative Filtering: Find similar users and recommend their liked content
   */
  async getCollaborativeRecommendations(userId, userPreferences, limit = 30) {
    try {
      // Get user's liked content
      const userLikesSnapshot = await db.collection('contentLikes')
        .where('userId', '==', userId)
        .limit(50)
        .get();

      const userLikedContentIds = [];
      userLikesSnapshot.forEach(doc => {
        userLikedContentIds.push(doc.data().contentId);
      });

      if (userLikedContentIds.length === 0) {
        return [];
      }

      // Find users who liked similar content
      const similarUsersLikes = await db.collection('contentLikes')
        .where('contentId', 'in', userLikedContentIds.slice(0, 10)) // Firestore 'in' limit is 10
        .where('userId', '!=', userId)
        .get();

      // Count how many common likes each user has
      const userSimilarity = {};
      similarUsersLikes.forEach(doc => {
        const likeData = doc.data();
        const similarUserId = likeData.userId;
        if (!userSimilarity[similarUserId]) {
          userSimilarity[similarUserId] = 0;
        }
        userSimilarity[similarUserId]++;
      });

      // Get top 10 similar users
      const topSimilarUsers = Object.entries(userSimilarity)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId]) => userId);

      if (topSimilarUsers.length === 0) {
        return [];
      }

      // Get content liked by similar users (that user hasn't liked)
      const recommendations = new Map();
      
      for (const similarUserId of topSimilarUsers) {
        const similarUserLikes = await db.collection('contentLikes')
          .where('userId', '==', similarUserId)
          .limit(20)
          .get();

        similarUserLikes.forEach(doc => {
          const contentId = doc.data().contentId;
          if (!userLikedContentIds.includes(contentId)) {
            if (!recommendations.has(contentId)) {
              recommendations.set(contentId, {
                contentId,
                score: 0,
                reason: 'collaborative'
              });
            }
            const rec = recommendations.get(contentId);
            rec.score += userSimilarity[similarUserId] * this.weights.collaborative;
          }
        });
      }

      return Array.from(recommendations.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting collaborative recommendations:', error);
      return [];
    }
  }

  /**
   * Content-Based Filtering: Recommend based on content features
   */
  async getContentBasedRecommendations(userId, userPreferences, limit = 30) {
    try {
      const { favoriteCategories, favoriteCreators } = userPreferences;

      if (favoriteCategories.length === 0 && favoriteCreators.length === 0) {
        return [];
      }

      const recommendations = new Map();

      // Recommend by category
      for (const category of favoriteCategories) {
        const contentSnapshot = await db.collection('content')
          .where('category', '==', category)
          .where('status', '==', 'published')
          .orderBy('createdAt', 'desc')
          .limit(20)
          .get();

        contentSnapshot.forEach(doc => {
          const contentId = doc.id;
          if (!recommendations.has(contentId)) {
            recommendations.set(contentId, {
              contentId,
              score: 0,
              reason: 'content_based'
            });
          }
          const rec = recommendations.get(contentId);
          rec.score += this.weights.contentBased * 0.5; // Category match
        });
      }

      // Recommend by creator
      for (const creatorId of favoriteCreators.slice(0, 5)) {
        const contentSnapshot = await db.collection('content')
          .where('userId', '==', creatorId)
          .where('status', '==', 'published')
          .orderBy('createdAt', 'desc')
          .limit(10)
          .get();

        contentSnapshot.forEach(doc => {
          const contentId = doc.id;
          if (!recommendations.has(contentId)) {
            recommendations.set(contentId, {
              contentId,
              score: 0,
              reason: 'content_based'
            });
          }
          const rec = recommendations.get(contentId);
          rec.score += this.weights.contentBased * 0.5; // Creator match
        });
      }

      return Array.from(recommendations.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting content-based recommendations:', error);
      return [];
    }
  }

  /**
   * Trending Recommendations: Popular content
   */
  async getTrendingRecommendations(userId, limit = 20) {
    try {
      // Get content with high engagement in last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const contentSnapshot = await db.collection('content')
        .where('status', '==', 'published')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

      const trendingContent = [];
      contentSnapshot.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
        
        if (createdAt >= oneDayAgo) {
          // Calculate trending score based on engagement
          const likes = data.stats?.likes || 0;
          const comments = data.stats?.comments || 0;
          const shares = data.stats?.shares || 0;
          const views = data.stats?.views || 0;
          
          const engagementScore = (likes * 2 + comments * 3 + shares * 4) / Math.max(views, 1);
          const timeDecay = Math.exp(-(Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000));
          
          trendingContent.push({
            contentId: doc.id,
            score: engagementScore * timeDecay * this.weights.trending,
            reason: 'trending'
          });
        }
      });

      return trendingContent
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting trending recommendations:', error);
      return [];
    }
  }

  /**
   * Following-based Recommendations: Content from followed users
   */
  async getFollowingRecommendations(userId, limit = 20) {
    try {
      // Get user's following list
      const followingSnapshot = await db.collection('follows')
        .where('followerId', '==', userId)
        .limit(100)
        .get();

      const followingIds = [];
      followingSnapshot.forEach(doc => {
        followingIds.push(doc.data().followingId);
      });

      if (followingIds.length === 0) {
        return [];
      }

      const recommendations = new Map();

      // Get recent content from followed users
      for (const followingId of followingIds.slice(0, 20)) {
        const contentSnapshot = await db.collection('content')
          .where('userId', '==', followingId)
          .where('status', '==', 'published')
          .orderBy('createdAt', 'desc')
          .limit(5)
          .get();

        contentSnapshot.forEach(doc => {
          const contentId = doc.id;
          if (!recommendations.has(contentId)) {
            recommendations.set(contentId, {
              contentId,
              score: this.weights.following,
              reason: 'following'
            });
          }
        });
      }

      return Array.from(recommendations.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting following recommendations:', error);
      return [];
    }
  }

  /**
   * Combine recommendations from different sources
   */
  combineRecommendations(sources) {
    const combined = new Map();

    // Add all recommendations
    Object.entries(sources).forEach(([source, recs]) => {
      recs.forEach(rec => {
        if (!combined.has(rec.contentId)) {
          combined.set(rec.contentId, {
            contentId: rec.contentId,
            score: 0,
            reasons: []
          });
        }
        const combinedRec = combined.get(rec.contentId);
        combinedRec.score += rec.score;
        combinedRec.reasons.push(rec.reason);
      });
    });

    return Array.from(combined.values());
  }

  /**
   * Get watched content IDs for a user
   */
  async getWatchedContent(userId) {
    try {
      const activitiesSnapshot = await db.collection('userActivities')
        .where('userId', '==', userId)
        .where('activityType', '==', 'view')
        .where('targetType', '==', 'content')
        .limit(200)
        .get();

      const watchedIds = [];
      activitiesSnapshot.forEach(doc => {
        watchedIds.push(doc.data().targetId);
      });

      return watchedIds;
    } catch (error) {
      console.error('Error getting watched content:', error);
      return [];
    }
  }

  /**
   * Save recommendations to Firestore for caching
   */
  async saveRecommendations(userId, recommendations, userPreferences) {
    try {
      const recDoc = {
        userId,
        recommendations: recommendations.map(rec => ({
          contentId: rec.contentId,
          score: rec.score,
          reasons: rec.reasons || [rec.reason]
        })),
        userPreferences,
        lastUpdated: FieldValue.serverTimestamp(),
        version: Date.now()
      };

      await db.collection('recommendations').doc(userId).set(recDoc, { merge: true });
    } catch (error) {
      console.error('Error saving recommendations:', error);
      // Don't throw - caching is optional
    }
  }

  /**
   * Get cached recommendations
   */
  async getCachedRecommendations(userId) {
    try {
      const recDoc = await db.collection('recommendations').doc(userId).get();
      
      if (!recDoc.exists) {
        return null;
      }

      const data = recDoc.data();
      const lastUpdated = data.lastUpdated?.toDate?.() || new Date(data.lastUpdated);
      const ageInHours = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);

      // Return cached recommendations if less than 1 hour old
      if (ageInHours < 1) {
        return data.recommendations || [];
      }

      return null;
    } catch (error) {
      console.error('Error getting cached recommendations:', error);
      return null;
    }
  }
}

module.exports = new RecommendationService();

