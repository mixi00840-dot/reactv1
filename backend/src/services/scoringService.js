const UserProfile = require('../models/UserProfile');
const RecommendationMetadata = require('../models/RecommendationMetadata');
const CandidateGenerationService = require('./candidateGenerationService');

/**
 * Scoring & Ranking Service
 * 
 * Second stage of recommendation pipeline.
 * Takes candidates from generation stage and scores/ranks them
 * based on personalized user features and ML models.
 * 
 * Key Features:
 * - Personalized scoring using user profile
 * - ML model integration for prediction
 * - Diversification for feed quality
 * - Re-ranking based on business rules
 * - A/B testing support
 */

class ScoringService {
  /**
   * Score and rank candidates for personalized feed
   */
  static async scoreAndRank(userId, candidates, options = {}) {
    const {
      diversify = true,
      diversityWeight = 0.3,
      maxCreatorRepeat = 2,
      maxTopicRepeat = 3,
      boostTrending = true,
      trendingBoost = 1.2
    } = options;
    
    // Get user profile
    const profile = await UserProfile.getOrCreate(userId);
    
    // Score each candidate
    const scored = await Promise.all(
      candidates.map(candidate => this.scoreCandidate(candidate, profile, options))
    );
    
    // Sort by score
    scored.sort((a, b) => b.finalScore - a.finalScore);
    
    // Apply diversification
    let ranked = scored;
    if (diversify) {
      ranked = this.diversifyFeed(scored, {
        diversityWeight,
        maxCreatorRepeat,
        maxTopicRepeat
      });
    }
    
    // Apply trending boost
    if (boostTrending) {
      ranked = this.applyTrendingBoost(ranked, trendingBoost);
      ranked.sort((a, b) => b.finalScore - a.finalScore);
    }
    
    return {
      userId,
      ranked,
      count: ranked.length,
      scoringVersion: 'v1.0',
      timestamp: new Date()
    };
  }
  
  /**
   * Score individual candidate using ML model + heuristics
   */
  static async scoreCandidate(candidate, userProfile, options = {}) {
    const { content, metadata } = candidate;
    
    // Base score from candidate generation
    let score = candidate.score || 0;
    
    // Feature scores
    const topicScore = this.calculateTopicScore(metadata, userProfile);
    const creatorScore = this.calculateCreatorScore(content, userProfile);
    const qualityScore = metadata.signals.qualityScore || 0;
    const freshnessScore = metadata.signals.freshness || 0;
    const engagementScore = metadata.signals.engagementRate || 0;
    
    // ML model score (placeholder - integrate real model)
    const mlScore = await this.predictMLScore(metadata, userProfile);
    
    // Weighted combination
    const weights = {
      candidate: 0.2,
      topic: 0.15,
      creator: 0.15,
      quality: 0.15,
      freshness: 0.1,
      engagement: 0.1,
      ml: 0.15
    };
    
    const weightedScore = 
      weights.candidate * (score / 100) +
      weights.topic * topicScore +
      weights.creator * creatorScore +
      weights.quality * (qualityScore / 100) +
      weights.freshness * freshnessScore +
      weights.engagement * engagementScore +
      weights.ml * mlScore;
    
    // Apply user-specific adjustments
    const personalizedScore = this.applyPersonalization(
      weightedScore,
      userProfile,
      metadata
    );
    
    return {
      ...candidate,
      scores: {
        base: score,
        topic: topicScore,
        creator: creatorScore,
        quality: qualityScore / 100,
        freshness: freshnessScore,
        engagement: engagementScore,
        ml: mlScore,
        weighted: weightedScore,
        personalized: personalizedScore
      },
      finalScore: personalizedScore * 100, // Scale to 0-100
      scoringDetails: {
        weights,
        userId: userProfile.user,
        timestamp: new Date()
      }
    };
  }
  
  /**
   * Calculate topic relevance score
   */
  static calculateTopicScore(metadata, userProfile) {
    if (!metadata.features.topics || metadata.features.topics.length === 0) {
      return 0;
    }
    
    let totalScore = 0;
    let matchCount = 0;
    
    for (const contentTopic of metadata.features.topics) {
      const userTopic = userProfile.preferences.topics.find(
        t => t.name === contentTopic.name
      );
      
      if (userTopic) {
        // Normalize user topic score (assuming max ~100)
        const normalizedUserScore = Math.min(userTopic.score / 100, 1);
        totalScore += contentTopic.confidence * normalizedUserScore;
        matchCount++;
      }
    }
    
    // Average score with bonus for multiple matches
    const avgScore = matchCount > 0 ? totalScore / matchCount : 0;
    const matchBonus = Math.min(matchCount * 0.1, 0.3); // Up to 30% bonus
    
    return Math.min(avgScore + matchBonus, 1);
  }
  
  /**
   * Calculate creator affinity score
   */
  static calculateCreatorScore(content, userProfile) {
    const creatorPref = userProfile.preferences.favoriteCreators.find(
      c => c.creator.toString() === content.creator.toString()
    );
    
    if (!creatorPref) {
      return 0;
    }
    
    // Score based on interaction count (log scale)
    const interactionScore = Math.log(creatorPref.interactionCount + 1) / 10;
    
    // Boost if following
    const followBoost = creatorPref.following ? 0.3 : 0;
    
    // Recency bonus (last 7 days)
    let recencyBonus = 0;
    if (creatorPref.lastInteracted) {
      const daysSince = (Date.now() - creatorPref.lastInteracted) / (1000 * 60 * 60 * 24);
      recencyBonus = daysSince < 7 ? 0.2 : 0;
    }
    
    return Math.min(interactionScore + followBoost + recencyBonus, 1);
  }
  
  /**
   * ML model prediction (placeholder)
   * In production, integrate with TensorFlow, PyTorch, or SageMaker
   */
  static async predictMLScore(metadata, userProfile) {
    // Placeholder implementation
    // In production:
    // 1. Extract features from metadata and userProfile
    // 2. Call ML model API (REST, gRPC, or embedded model)
    // 3. Return prediction score (0-1)
    
    const userFeatures = userProfile.getMLFeatures();
    const contentFeatures = {
      qualityScore: metadata.signals.qualityScore / 100,
      viralityScore: metadata.signals.viralityScore / 100,
      freshness: metadata.signals.freshness,
      engagementRate: metadata.signals.engagementRate,
      completionRate: metadata.signals.completionRate
    };
    
    // Mock model prediction (weighted average)
    const mockPrediction = 
      userFeatures.completionRate * 0.3 +
      contentFeatures.qualityScore * 0.3 +
      contentFeatures.engagementRate * 0.2 +
      contentFeatures.freshness * 0.2;
    
    return Math.min(mockPrediction, 1);
  }
  
  /**
   * Apply personalization adjustments
   */
  static applyPersonalization(baseScore, userProfile, metadata) {
    let score = baseScore;
    
    // Cold start users get boosted popular content
    if (userProfile.signals.isColdStart) {
      const popularityBoost = metadata.signals.qualityScore / 200; // Up to 50% boost
      score += popularityBoost;
    }
    
    // Power users get more diverse content
    if (userProfile.signals.sophistication === 'power') {
      const diversityAdjustment = metadata.segments.audienceType === 'niche' ? 0.1 : -0.05;
      score += diversityAdjustment;
    }
    
    // Boost rising content for engaged users
    if (userProfile.signals.engagementTier === 'high' && metadata.segments.rising) {
      score *= 1.15;
    }
    
    // Penalize if user is saturated
    if (userProfile.signals.saturation > 0.7) {
      score *= (1 - userProfile.signals.saturation * 0.2);
    }
    
    return Math.max(0, Math.min(score, 1));
  }
  
  /**
   * Diversify feed to avoid repetition
   */
  static diversifyFeed(ranked, options = {}) {
    const {
      diversityWeight = 0.3,
      maxCreatorRepeat = 2,
      maxTopicRepeat = 3
    } = options;
    
    const diversified = [];
    const creatorCounts = new Map();
    const topicCounts = new Map();
    
    // First pass: add high-scoring items
    for (const item of ranked) {
      const creatorId = item.content.creator.toString();
      const topics = item.metadata.features.topics.map(t => t.name);
      
      // Check creator frequency
      const creatorCount = creatorCounts.get(creatorId) || 0;
      if (creatorCount >= maxCreatorRepeat) {
        continue; // Skip for now
      }
      
      // Check topic frequency
      const topicOverlap = topics.some(topic => 
        (topicCounts.get(topic) || 0) >= maxTopicRepeat
      );
      if (topicOverlap) {
        continue; // Skip for now
      }
      
      // Add to diversified feed
      diversified.push(item);
      
      // Update counts
      creatorCounts.set(creatorId, creatorCount + 1);
      for (const topic of topics) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      }
    }
    
    // Second pass: fill remaining slots with skipped items
    const remaining = ranked.filter(item => !diversified.includes(item));
    diversified.push(...remaining);
    
    return diversified;
  }
  
  /**
   * Apply trending boost
   */
  static applyTrendingBoost(ranked, boostFactor = 1.2) {
    return ranked.map(item => {
      if (item.metadata.segments.trending) {
        return {
          ...item,
          finalScore: item.finalScore * boostFactor,
          trendingBoosted: true
        };
      }
      return item;
    });
  }
  
  /**
   * Generate personalized For You feed
   */
  static async generateForYouFeed(userId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      refresh = false
    } = options;
    
    // Get user profile
    const profile = await UserProfile.getOrCreate(userId);
    
    // Generate candidates (200 candidates for ranking)
    const candidateResult = await CandidateGenerationService.generateCandidates(userId, {
      limit: 200,
      minQuality: 30,
      excludeViewed: !refresh
    });
    
    // Score and rank
    const ranked = await this.scoreAndRank(userId, candidateResult.candidates, {
      diversify: true,
      boostTrending: true
    });
    
    // Paginate
    const feed = ranked.ranked.slice(offset, offset + limit);
    
    // Mark as seen
    for (const item of feed) {
      await profile.markAsSeen(item.content._id);
    }
    
    return {
      userId,
      feed,
      count: feed.length,
      total: ranked.count,
      hasMore: offset + limit < ranked.count,
      nextOffset: offset + limit,
      timestamp: new Date()
    };
  }
  
  /**
   * Re-rank feed based on real-time signals
   */
  static async reRankFeed(rankedItems, userProfile, options = {}) {
    // Apply real-time adjustments (e.g., breaking news, viral content)
    const reranked = rankedItems.map(item => {
      let adjustment = 0;
      
      // Boost super viral content
      if (item.metadata.signals.viralityScore > 80) {
        adjustment += 10;
      }
      
      // Boost content from followed creators
      const isFollowing = userProfile.preferences.favoriteCreators.some(
        c => c.creator.toString() === item.content.creator.toString() && c.following
      );
      if (isFollowing) {
        adjustment += 5;
      }
      
      return {
        ...item,
        finalScore: item.finalScore + adjustment
      };
    });
    
    reranked.sort((a, b) => b.finalScore - a.finalScore);
    
    return reranked;
  }
}

module.exports = ScoringService;
