const Content = require('../models/Content');
const User = require('../models/User');
const UserActivity = require('../models/UserActivity');
const Follow = require('../models/Follow');
const cache = require('./redisCache');

/**
 * Feed Ranking Service
 * 
 * AI-powered personalized feed ranking using:
 * - User preferences & watch history
 * - Content embeddings (semantic similarity)
 * - Engagement metrics
 * - Following relationships
 * - Diversity injection
 */

class FeedRankingService {
  constructor() {
    // Ranking weights
    this.weights = {
      following: 0.25,      // 25% - Content from followed users
      embeddings: 0.20,     // 20% - Semantic similarity
      engagement: 0.20,     // 20% - Likes, comments, shares
      recency: 0.15,        // 15% - Recent content
      diversity: 0.10,      // 10% - Avoid filter bubbles
      userHistory: 0.10     // 10% - Based on user's watch history
    };
  }

  /**
   * Generate personalized feed for user
   * @param {String} userId - User ID
   * @param {Object} options - Pagination and filter options
   * @returns {Array} Ranked content
   */
  async generateFeed(userId, options = {}) {
    const {
      cursor = null,
      limit = 20,
      includeFollowing = true,
      minScore = 0
    } = options;

    try {
      console.log(`🎯 Generating feed for user ${userId}`);

      // Check cache first
      if (!cursor) {
        const cachedFeed = await cache.getFeed(userId);
        if (cachedFeed && cachedFeed.length > 0) {
          console.log('✅ Returning cached feed');
          return {
            content: cachedFeed.slice(0, limit),
            hasMore: cachedFeed.length > limit,
            cursor: cachedFeed.length > limit ? cachedFeed[limit - 1]._id : null,
            source: 'cache'
          };
        }
      }

      // Get user data
      const user = await User.findById(userId).select('following');
      const followingIds = user?.following || [];

      // Get user preferences
      const userPrefs = await this.getUserPreferences(userId);

      // Build query
      let query = {
        status: 'active',
        isDeleted: false
      };

      if (cursor) {
        query._id = { $lt: cursor };
      }

      // Get candidate content (more than needed for ranking)
      const candidates = await Content.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 5) // Get 5x to rank from
        .populate('userId', 'username fullName avatar isVerified')
        .lean();

      if (candidates.length === 0) {
        return {
          content: [],
          hasMore: false,
          cursor: null,
          source: 'empty'
        };
      }

      // Calculate scores for each content
      const scoredContent = await Promise.all(
        candidates.map(content => this.scoreContent(content, userId, followingIds, userPrefs))
      );

      // Sort by score
      scoredContent.sort((a, b) => b.score - a.score);

      // Apply diversity filter
      const diverseFeed = this.applyDiversity(scoredContent, userPrefs);

      // Take top N
      const finalFeed = diverseFeed
        .filter(item => item.score >= minScore)
        .slice(0, limit);

      // Cache the feed
      if (!cursor && finalFeed.length > 0) {
        await cache.cacheFeed(userId, finalFeed.map(item => item.content));
      }

      console.log(`✅ Generated feed with ${finalFeed.length} items`);

      return {
        content: finalFeed.map(item => item.content),
        hasMore: scoredContent.length > limit,
        cursor: finalFeed.length > 0 ? finalFeed[finalFeed.length - 1].content._id : null,
        source: 'ranked',
        avgScore: finalFeed.reduce((sum, item) => sum + item.score, 0) / finalFeed.length
      };

    } catch (error) {
      console.error('Feed generation error:', error);
      throw error;
    }
  }

  /**
   * Score individual content for user
   */
  async scoreContent(content, userId, followingIds, userPrefs) {
    let score = 0;
    const breakdown = {};

    // 1. Following score (25%)
    const isFollowing = followingIds.includes(content.userId?._id?.toString());
    breakdown.following = isFollowing ? this.weights.following * 100 : 0;
    score += breakdown.following;

    // 2. Embeddings similarity score (20%)
    if (content.embeddings && userPrefs.avgEmbedding) {
      const similarity = this.cosineSimilarity(content.embeddings, userPrefs.avgEmbedding);
      breakdown.embeddings = similarity * this.weights.embeddings * 100;
      score += breakdown.embeddings;
    } else {
      breakdown.embeddings = 0;
    }

    // 3. Engagement score (20%)
    const engagementScore = this.calculateEngagementScore(content);
    breakdown.engagement = engagementScore * this.weights.engagement;
    score += breakdown.engagement;

    // 4. Recency score (15%)
    const recencyScore = this.calculateRecencyScore(content.createdAt);
    breakdown.recency = recencyScore * this.weights.recency;
    score += breakdown.recency;

    // 5. User history score (10%)
    const historyScore = this.calculateHistoryScore(content, userPrefs);
    breakdown.userHistory = historyScore * this.weights.userHistory;
    score += breakdown.userHistory;

    // Use pre-calculated feedScore as baseline
    if (content.feedScore) {
      score = (score * 0.7) + (content.feedScore * 0.3);
    }

    // Penalty for low moderation score
    if (content.moderationScore > 50) {
      const penalty = (content.moderationScore - 50) / 2;
      score -= penalty;
      breakdown.moderation = -penalty;
    }

    // Boost for quality signals
    if (content.userId?.isVerified) {
      score += 5;
      breakdown.verified = 5;
    }

    return {
      content,
      score: Math.max(0, Math.min(100, score)),
      breakdown
    };
  }

  /**
   * Calculate engagement score
   */
  calculateEngagementScore(content) {
    const {
      viewsCount = 0,
      likesCount = 0,
      commentsCount = 0,
      sharesCount = 0
    } = content;

    // Weighted engagement
    const engagement = (likesCount * 1) + (commentsCount * 2) + (sharesCount * 3);
    
    // Normalize by views (engagement rate)
    const rate = viewsCount > 0 ? (engagement / viewsCount) * 100 : 0;
    
    // Cap at 100
    return Math.min(100, rate);
  }

  /**
   * Calculate recency score (exponential decay)
   */
  calculateRecencyScore(createdAt) {
    const hoursSinceCreation = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    
    // Exponential decay: 100 at 0 hours, 50 at 24 hours, 25 at 48 hours, etc.
    const decayRate = 0.693 / 24; // Half-life of 24 hours
    const score = 100 * Math.exp(-decayRate * hoursSinceCreation);
    
    return Math.max(0, score);
  }

  /**
   * Calculate history-based score
   */
  calculateHistoryScore(content, userPrefs) {
    let score = 0;

    // Match with user's favorite categories
    if (userPrefs.favoriteHashtags && content.hashtags) {
      const matchingHashtags = content.hashtags.filter(tag =>
        userPrefs.favoriteHashtags.includes(tag)
      );
      score += matchingHashtags.length * 20;
    }

    // Match with user's favorite creators
    if (userPrefs.favoriteCreators) {
      const isavorite = userPrefs.favoriteCreators.includes(content.userId?._id?.toString());
      if (isFavorite) {
        score += 30;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Cosine similarity between two vectors
   */
  cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Get user preferences from history
   */
  async getUserPreferences(userId) {
    try {
      // Check cache first
      const cached = await cache.getUserPrefs(userId);
      if (cached) {
        return cached;
      }

      // Get recent activity
      const recentViews = await UserActivity.find({
        user: userId,
        activityType: 'view'
      })
        .sort({ timestamp: -1 })
        .limit(50)
        .populate('targetId');

      // Get following list
      const following = await Follow.find({ follower: userId })
        .select('following')
        .limit(100);

      const followingIds = following.map(f => f.following.toString());

      // Analyze preferences
      const preferences = {
        favoriteHashtags: [],
        favoriteCreators: followingIds,
        avgEmbedding: null,
        recentCategories: []
      };

      // Extract favorite hashtags
      const hashtagCounts = {};
      const embeddings = [];

      for (const activity of recentViews) {
        const content = activity.targetId;
        if (!content) continue;

        // Count hashtags
        if (content.hashtags) {
          content.hashtags.forEach(tag => {
            hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
          });
        }

        // Collect embeddings
        if (content.embeddings && content.embeddings.length > 0) {
          embeddings.push(content.embeddings);
        }
      }

      // Top hashtags
      preferences.favoriteHashtags = Object.entries(hashtagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag);

      // Average embedding
      if (embeddings.length > 0) {
        const dimensions = embeddings[0].length;
        const avgEmbedding = new Array(dimensions).fill(0);

        for (const embedding of embeddings) {
          for (let i = 0; i < dimensions; i++) {
            avgEmbedding[i] += embedding[i];
          }
        }

        for (let i = 0; i < dimensions; i++) {
          avgEmbedding[i] /= embeddings.length;
        }

        preferences.avgEmbedding = avgEmbedding;
      }

      // Cache preferences
      await cache.cacheUserPrefs(userId, preferences);

      return preferences;

    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {
        favoriteHashtags: [],
        favoriteCreators: [],
        avgEmbedding: null,
        recentCategories: []
      };
    }
  }

  /**
   * Apply diversity to avoid filter bubbles
   */
  applyDiversity(scoredContent, userPrefs) {
    const diverse = [];
    const seenCreators = new Set();
    const seenHashtags = new Set();

    for (const item of scoredContent) {
      const creatorId = item.content.userId?._id?.toString();
      const hashtags = item.content.hashtags || [];

      // Skip if we've seen too much from this creator recently
      const creatorCount = Array.from(seenCreators).filter(c => c === creatorId).length;
      if (creatorCount >= 3) {
        // Reduce score for repetitive creator
        item.score *= 0.5;
      } else {
        seenCreators.add(creatorId);
      }

      // Boost if introduces new hashtags
      const newHashtags = hashtags.filter(tag => !seenHashtags.has(tag));
      if (newHashtags.length > 0) {
        item.score += newHashtags.length * 2;
        newHashtags.forEach(tag => seenHashtags.add(tag));
      }

      diverse.push(item);
    }

    // Re-sort after diversity adjustments
    diverse.sort((a, b) => b.score - a.score);

    return diverse;
  }

  /**
   * Update feed score for content (called on new engagement)
   */
  async updateFeedScore(contentId) {
    try {
      const content = await Content.findById(contentId);
      if (!content) return;

      // Recalculate score
      const engagementScore = this.calculateEngagementScore(content);
      const recencyScore = this.calculateRecencyScore(content.createdAt);
      
      let newScore = (engagementScore * 0.4) + (recencyScore * 0.3) + (content.feedScore || 50) * 0.3;

      // Apply moderation penalty
      if (content.moderationScore > 50) {
        newScore -= (content.moderationScore - 50) / 2;
      }

      content.feedScore = Math.max(0, Math.min(100, newScore));
      await content.save();

      console.log(`✅ Updated feed score for ${contentId}: ${content.feedScore}`);

    } catch (error) {
      console.error('Error updating feed score:', error);
    }
  }

  /**
   * Invalidate user feed cache (call after new post, follow, etc.)
   */
  async invalidateUserFeed(userId) {
    await cache.invalidateFeed(userId);
    await cache.del(cache.key('prefs', userId));
  }
}

// Singleton
let feedRankingService = null;

function getFeedRanking() {
  if (!feedRankingService) {
    feedRankingService = new FeedRankingService();
  }
  return feedRankingService;
}

module.exports = getFeedRanking();
module.exports.FeedRankingService = FeedRankingService;
