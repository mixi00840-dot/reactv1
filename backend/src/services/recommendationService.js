const UserActivity = require('../models/UserActivity');
const ContentRecommendation = require('../models/ContentRecommendation');
const Content = require('../models/Content');
const User = require('../models/User');

class RecommendationService {
  constructor() {
    this.weights = {
      collaborative: 0.4,
      contentBased: 0.3,
      trending: 0.2,
      following: 0.1
    };
  }

  async generateRecommendations(userId, limit = 50) {
    try {
      console.log(`Generating recommendations for user ${userId}...`);

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user preferences and activity
      const userPreferences = await this.analyzeUserPreferences(userId);

      // Generate recommendations from different sources
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
        !watchedContent.includes(rec.content.toString())
      );

      // Sort by score and limit
      const topRecs = filteredRecs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Save recommendations
      await ContentRecommendation.findOneAndUpdate(
        { user: userId },
        {
          $set: {
            recommendedContent: topRecs,
            userPreferences,
            lastUpdated: new Date(),
            version: Date.now()
          }
        },
        { upsert: true, new: true }
      );

      console.log(`Generated ${topRecs.length} recommendations for user ${userId}`);

      return topRecs;

    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  async analyzeUserPreferences(userId) {
    try {
      // Get user's recent activity
      const activities = await UserActivity.find({
        user: userId,
        activityType: { $in: ['view', 'like', 'share'] }
      })
        .sort({ timestamp: -1 })
        .limit(100);

      // Analyze watch patterns
      const watchedContent = await Content.find({
        _id: { $in: activities.map(a => a.targetId) }
      }).populate('creator', 'username');

      const categories = {};
      const creators = new Set();
      let totalWatchTime = 0;
      let totalVideos = 0;

      watchedContent.forEach(content => {
        // Count categories
        if (content.category) {
          categories[content.category] = (categories[content.category] || 0) + 1;
        }

        // Track creators
        if (content.creator) {
          creators.add(content.creator._id.toString());
        }

        // Calculate avg watch time
        const activity = activities.find(a => a.targetId.toString() === content._id.toString());
        if (activity?.metadata?.watchTime) {
          totalWatchTime += activity.metadata.watchTime;
          totalVideos++;
        }
      });

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
        const hour = new Date(a.timestamp).getHours();
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
      return {};
    }
  }

  async getCollaborativeRecommendations(userId, userPreferences, limit = 30) {
    try {
      // Find similar users based on activity patterns
      const userActivities = await UserActivity.find({
        user: userId,
        activityType: { $in: ['view', 'like'] }
      }).limit(50);

      const likedContent = userActivities
        .filter(a => a.activityType === 'like')
        .map(a => a.targetId);

      // Find users who liked similar content
      const similarUsers = await UserActivity.aggregate([
        {
          $match: {
            targetId: { $in: likedContent },
            activityType: 'like',
            user: { $ne: userId }
          }
        },
        {
          $group: {
            _id: '$user',
            commonLikes: { $sum: 1 }
          }
        },
        { $sort: { commonLikes: -1 } },
        { $limit: 10 }
      ]);

      if (similarUsers.length === 0) {
        return [];
      }

      // Get content liked by similar users
      const similarUserIds = similarUsers.map(u => u._id);
      const recommendations = await UserActivity.aggregate([
        {
          $match: {
            user: { $in: similarUserIds },
            activityType: 'like',
            targetType: 'content'
          }
        },
        {
          $group: {
            _id: '$targetId',
            score: { $sum: 1 }
          }
        },
        { $sort: { score: -1 } },
        { $limit: limit }
      ]);

      return recommendations.map(rec => ({
        content: rec._id,
        score: rec.score * this.weights.collaborative,
        reason: 'collaborative'
      }));

    } catch (error) {
      console.error('Error getting collaborative recommendations:', error);
      return [];
    }
  }

  async getContentBasedRecommendations(userId, userPreferences, limit = 30) {
    try {
      const { favoriteCategories, favoriteCreators } = userPreferences;

      if (!favoriteCategories || favoriteCategories.length === 0) {
        return [];
      }

      // Find content similar to user's preferences
      const recommendations = await Content.find({
        $or: [
          { category: { $in: favoriteCategories } },
          { creator: { $in: favoriteCreators } },
          { tags: { $in: favoriteCategories } }
        ],
        status: 'active',
        visibility: 'public'
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('_id category creator tags');

      return recommendations.map(content => {
        let score = 0;
        
        // Score based on category match
        if (favoriteCategories.includes(content.category)) {
          score += 3;
        }

        // Score based on creator match
        if (favoriteCreators.includes(content.creator?.toString())) {
          score += 5;
        }

        // Score based on tag match
        const tagMatches = content.tags?.filter(tag => 
          favoriteCategories.includes(tag)
        ).length || 0;
        score += tagMatches;

        return {
          content: content._id,
          score: score * this.weights.contentBased,
          reason: 'content_based'
        };
      });

    } catch (error) {
      console.error('Error getting content-based recommendations:', error);
      return [];
    }
  }

  async getTrendingRecommendations(userId, limit = 20) {
    try {
      // Get trending content from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const trending = await Content.find({
        createdAt: { $gte: sevenDaysAgo },
        status: 'active',
        visibility: 'public'
      })
        .sort({ views: -1, likes: -1 })
        .limit(limit)
        .select('_id views likes');

      return trending.map(content => ({
        content: content._id,
        score: ((content.views || 0) * 0.1 + (content.likes || 0) * 2) * this.weights.trending,
        reason: 'trending'
      }));

    } catch (error) {
      console.error('Error getting trending recommendations:', error);
      return [];
    }
  }

  async getFollowingRecommendations(userId, limit = 20) {
    try {
      const user = await User.findById(userId).select('following');
      
      if (!user || !user.following || user.following.length === 0) {
        return [];
      }

      // Get recent content from followed users
      const recommendations = await Content.find({
        creator: { $in: user.following },
        status: 'active',
        visibility: 'public'
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('_id');

      return recommendations.map(content => ({
        content: content._id,
        score: 10 * this.weights.following,
        reason: 'following'
      }));

    } catch (error) {
      console.error('Error getting following recommendations:', error);
      return [];
    }
  }

  combineRecommendations(sources) {
    const scoreMap = new Map();

    // Combine scores from all sources
    Object.entries(sources).forEach(([source, recommendations]) => {
      recommendations.forEach(rec => {
        const contentId = rec.content.toString();
        const existingScore = scoreMap.get(contentId) || { content: rec.content, score: 0, reasons: [] };
        
        existingScore.score += rec.score;
        existingScore.reasons.push(rec.reason);
        
        scoreMap.set(contentId, existingScore);
      });
    });

    return Array.from(scoreMap.values()).map(rec => ({
      content: rec.content,
      score: rec.score,
      reason: rec.reasons[0] // Primary reason
    }));
  }

  async getWatchedContent(userId) {
    try {
      const activities = await UserActivity.find({
        user: userId,
        activityType: 'view'
      })
        .sort({ timestamp: -1 })
        .limit(500)
        .select('targetId');

      return activities.map(a => a.targetId.toString());
    } catch (error) {
      console.error('Error getting watched content:', error);
      return [];
    }
  }
}

module.exports = new RecommendationService();
