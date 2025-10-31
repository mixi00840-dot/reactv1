const RecommendationMetadata = require('../models/RecommendationMetadata');
const Content = require('../models/Content');
const ViewEvent = require('../models/ViewEvent');

/**
 * Candidate Generation Service
 * 
 * Generates candidate content for personalized recommendations using:
 * - Content-based filtering (embeddings, features)
 * - Collaborative filtering (user-user, item-item)
 * - Hybrid approaches
 * - Approximate Nearest Neighbor (ANN) search
 * 
 * This is the first stage of the recommendation pipeline.
 * Generates 100-500 candidates that are then scored/ranked.
 */

class CandidateGenerationService {
  /**
   * Generate candidate recommendations for a user
   */
  static async generateCandidates(userId, options = {}) {
    const {
      limit = 200,
      minQuality = 30,
      excludeViewed = true,
      strategies = ['collaborative', 'content_based', 'trending', 'topics']
    } = options;
    
    const candidates = new Map(); // Use Map to deduplicate
    
    // Get user's interaction history
    const userHistory = await this.getUserHistory(userId, { limit: 100 });
    const viewedContentIds = excludeViewed ? userHistory.map(v => v.content.toString()) : [];
    
    // Execute each strategy in parallel
    const strategyPromises = [];
    
    if (strategies.includes('collaborative')) {
      strategyPromises.push(
        this.getCollaborativeCandidates(userId, userHistory, { limit: limit / 2 })
      );
    }
    
    if (strategies.includes('content_based')) {
      strategyPromises.push(
        this.getContentBasedCandidates(userHistory, { limit: limit / 2 })
      );
    }
    
    if (strategies.includes('trending')) {
      strategyPromises.push(
        this.getTrendingCandidates({ limit: 50 })
      );
    }
    
    if (strategies.includes('topics')) {
      const userTopics = await this.extractUserTopics(userHistory);
      strategyPromises.push(
        this.getTopicBasedCandidates(userTopics, { limit: limit / 2 })
      );
    }
    
    // Wait for all strategies
    const strategyResults = await Promise.all(strategyPromises);
    
    // Merge and deduplicate candidates
    for (const results of strategyResults) {
      for (const candidate of results) {
        const contentId = candidate.content._id.toString();
        
        // Skip if already viewed
        if (excludeViewed && viewedContentIds.includes(contentId)) {
          continue;
        }
        
        // Skip low quality
        if (candidate.metadata.signals.qualityScore < minQuality) {
          continue;
        }
        
        // Add or update with highest score
        if (!candidates.has(contentId) || 
            candidates.get(contentId).score < candidate.score) {
          candidates.set(contentId, candidate);
        }
      }
    }
    
    // Convert to array and sort by score
    const candidateArray = Array.from(candidates.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return {
      userId,
      candidates: candidateArray,
      count: candidateArray.length,
      strategies: strategies,
      timestamp: new Date()
    };
  }
  
  /**
   * Collaborative filtering candidates
   * Based on users with similar taste
   */
  static async getCollaborativeCandidates(userId, userHistory, options = {}) {
    const { limit = 100 } = options;
    const candidates = [];
    
    // Get similar users based on co-viewing patterns
    const similarUsers = await this.findSimilarUsers(userId, userHistory);
    
    if (similarUsers.length === 0) {
      return candidates;
    }
    
    // Get what similar users liked recently
    const similarUserIds = similarUsers.map(u => u.userId);
    
    const recentLikes = await ViewEvent.aggregate([
      {
        $match: {
          user: { $in: similarUserIds },
          eventType: 'like',
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$content',
          likeCount: { $sum: 1 },
          avgWatchTime: { $avg: '$watchTime' }
        }
      },
      { $sort: { likeCount: -1 } },
      { $limit: limit }
    ]);
    
    // Get metadata for these content
    for (const like of recentLikes) {
      const metadata = await RecommendationMetadata.findOne({ content: like._id })
        .populate('content', 'title creator videoUrl thumbnailUrl');
      
      if (metadata && metadata.content) {
        candidates.push({
          content: metadata.content,
          metadata: metadata,
          score: like.likeCount * 10, // Base score from popularity among similar users
          source: 'collaborative',
          reason: `Liked by ${like.likeCount} users with similar taste`
        });
      }
    }
    
    return candidates;
  }
  
  /**
   * Content-based filtering candidates
   * Based on similar content to what user liked
   */
  static async getContentBasedCandidates(userHistory, options = {}) {
    const { limit = 100 } = options;
    const candidates = [];
    
    // Get content user engaged with positively
    const positiveInteractions = userHistory.filter(h => 
      h.eventType === 'like' || 
      (h.eventType === 'view_complete' && h.completionRate > 0.7)
    );
    
    if (positiveInteractions.length === 0) {
      return candidates;
    }
    
    // Find similar content for each positive interaction
    const similarContentPromises = positiveInteractions.slice(0, 10).map(async interaction => {
      const metadata = await RecommendationMetadata.findOne({ content: interaction.content });
      
      if (!metadata) return [];
      
      // Get similar content from collaborative data
      return metadata.collaborative.similarContent.slice(0, 10);
    });
    
    const allSimilarContent = (await Promise.all(similarContentPromises)).flat();
    
    // Aggregate similar content by ID
    const contentScores = new Map();
    for (const similar of allSimilarContent) {
      const contentId = similar.contentId.toString();
      const currentScore = contentScores.get(contentId) || 0;
      contentScores.set(contentId, currentScore + similar.similarity);
    }
    
    // Sort by aggregated score
    const sortedContent = Array.from(contentScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    
    // Fetch metadata
    for (const [contentId, score] of sortedContent) {
      const metadata = await RecommendationMetadata.findOne({ content: contentId })
        .populate('content', 'title creator videoUrl thumbnailUrl');
      
      if (metadata && metadata.content) {
        candidates.push({
          content: metadata.content,
          metadata: metadata,
          score: score * 10,
          source: 'content_based',
          reason: 'Similar to content you liked'
        });
      }
    }
    
    return candidates;
  }
  
  /**
   * Get trending content candidates
   */
  static async getTrendingCandidates(options = {}) {
    const { limit = 50 } = options;
    const candidates = [];
    
    const trending = await RecommendationMetadata.find({
      'segments.trending': true
    })
    .sort({ 'signals.viralityScore': -1, 'signals.viewsLast24h': -1 })
    .limit(limit)
    .populate('content', 'title creator videoUrl thumbnailUrl');
    
    for (const metadata of trending) {
      if (metadata.content) {
        candidates.push({
          content: metadata.content,
          metadata: metadata,
          score: metadata.signals.viralityScore,
          source: 'trending',
          reason: 'Trending now'
        });
      }
    }
    
    return candidates;
  }
  
  /**
   * Get topic-based candidates
   */
  static async getTopicBasedCandidates(userTopics, options = {}) {
    const { limit = 100 } = options;
    const candidates = [];
    
    if (userTopics.length === 0) {
      return candidates;
    }
    
    const topicCandidates = await RecommendationMetadata.find({
      'features.topics.name': { $in: userTopics }
    })
    .sort({ 'signals.qualityScore': -1, 'signals.freshness': -1 })
    .limit(limit)
    .populate('content', 'title creator videoUrl thumbnailUrl');
    
    for (const metadata of topicCandidates) {
      if (metadata.content) {
        // Calculate topic match score
        const matchingTopics = metadata.features.topics.filter(t => 
          userTopics.includes(t.name)
        );
        const topicScore = matchingTopics.reduce((sum, t) => sum + t.confidence, 0);
        
        candidates.push({
          content: metadata.content,
          metadata: metadata,
          score: topicScore * 20 + metadata.signals.qualityScore,
          source: 'topics',
          reason: `Matches your interests: ${matchingTopics.map(t => t.name).join(', ')}`
        });
      }
    }
    
    return candidates;
  }
  
  /**
   * Get user interaction history
   */
  static async getUserHistory(userId, options = {}) {
    const { limit = 100, daysBack = 30 } = options;
    
    const history = await ViewEvent.find({
      user: userId,
      timestamp: { $gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000) }
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('content', 'title creator');
    
    return history;
  }
  
  /**
   * Find users with similar taste
   */
  static async findSimilarUsers(userId, userHistory) {
    // Get content user interacted with
    const userContentIds = userHistory.map(h => h.content._id);
    
    if (userContentIds.length === 0) {
      return [];
    }
    
    // Find users who also interacted with same content
    const coViewers = await ViewEvent.aggregate([
      {
        $match: {
          content: { $in: userContentIds },
          user: { $ne: userId }, // Exclude self
          eventType: { $in: ['like', 'share', 'view_complete'] }
        }
      },
      {
        $group: {
          _id: '$user',
          sharedContent: { $addToSet: '$content' },
          interactions: { $sum: 1 }
        }
      },
      {
        $project: {
          userId: '$_id',
          sharedContentCount: { $size: '$sharedContent' },
          interactions: 1
        }
      },
      {
        $match: {
          sharedContentCount: { $gte: 3 } // At least 3 shared content
        }
      },
      { $sort: { sharedContentCount: -1, interactions: -1 } },
      { $limit: 50 }
    ]);
    
    return coViewers.map(viewer => ({
      userId: viewer.userId,
      similarity: viewer.sharedContentCount / userContentIds.length
    }));
  }
  
  /**
   * Extract user's preferred topics from history
   */
  static async extractUserTopics(userHistory) {
    const topicCounts = new Map();
    
    for (const interaction of userHistory) {
      const metadata = await RecommendationMetadata.findOne({ content: interaction.content });
      
      if (metadata && metadata.features.topics) {
        for (const topic of metadata.features.topics) {
          const current = topicCounts.get(topic.name) || 0;
          topicCounts.set(topic.name, current + topic.confidence);
        }
      }
    }
    
    // Return top topics
    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name]) => name);
  }
  
  /**
   * Refresh metadata for content
   */
  static async refreshMetadata(contentId) {
    const content = await Content.findById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }
    
    let metadata = await RecommendationMetadata.findOne({ content: contentId });
    
    if (!metadata) {
      metadata = new RecommendationMetadata({
        content: contentId
      });
    }
    
    // Update features from content
    metadata.features.hashtags = content.hashtags || [];
    metadata.features.duration = content.duration || 0;
    metadata.features.language = content.language || 'en';
    metadata.features.hasCaption = !!content.caption;
    
    // Update signals from ContentMetrics
    const ContentMetrics = require('../models/ContentMetrics');
    const metrics = await ContentMetrics.findOne({ content: contentId });
    
    if (metrics) {
      await metadata.updateSignals(metrics);
    }
    
    // Mark for reindexing if embeddings changed
    if (!metadata.embeddings.combined || metadata.embeddings.combined.length === 0) {
      metadata.indexing.needsReindex = true;
    }
    
    await metadata.save();
    
    return metadata;
  }
  
  /**
   * Batch refresh metadata
   */
  static async batchRefreshMetadata(contentIds) {
    const results = [];
    
    for (const contentId of contentIds) {
      try {
        const metadata = await this.refreshMetadata(contentId);
        results.push({ contentId, success: true, metadata });
      } catch (error) {
        results.push({ contentId, success: false, error: error.message });
      }
    }
    
    return results;
  }
  
  /**
   * Generate embeddings for content (placeholder)
   * In production, integrate with ML models
   */
  static async generateEmbeddings(contentId) {
    // Placeholder - in production:
    // 1. Extract video frames → ResNet/VGG → visual embedding
    // 2. Extract audio → VGGish/OpenL3 → audio embedding
    // 3. Process text (title/caption) → BERT → text embedding
    // 4. Combine embeddings → multimodal fusion
    
    const metadata = await RecommendationMetadata.findOne({ content: contentId });
    if (!metadata) {
      throw new Error('Metadata not found');
    }
    
    // Mock embeddings (in production, call ML service)
    metadata.embeddings.visual = Array(512).fill(0).map(() => Math.random());
    metadata.embeddings.audio = Array(128).fill(0).map(() => Math.random());
    metadata.embeddings.text = Array(384).fill(0).map(() => Math.random());
    metadata.embeddings.combined = [
      ...metadata.embeddings.visual.slice(0, 256),
      ...metadata.embeddings.audio.slice(0, 64),
      ...metadata.embeddings.text.slice(0, 192)
    ];
    
    metadata.embeddings.modelVersion = 'v1.0-mock';
    metadata.embeddings.generatedAt = new Date();
    metadata.embeddings.quality = 0.85;
    
    await metadata.save();
    await metadata.confirmIndexed();
    
    return metadata.embeddings;
  }
}

module.exports = CandidateGenerationService;
