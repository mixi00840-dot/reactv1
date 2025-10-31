const cron = require('node-cron');
const Content = require('../models/Content');
const Sound = require('../models/Sound');
const TrendingConfig = require('../models/TrendingConfig');

/**
 * Trending Calculation Cron Job
 * Runs daily at 3 AM to recalculate trending scores
 */

// Helper functions for score calculation
function calculateWatchTimeScore(content) {
  const totalWatchMinutes = (content.analytics?.totalWatchTime || 0) / 60;
  if (totalWatchMinutes === 0) return 0;
  const score = (Math.log10(totalWatchMinutes + 1) / Math.log10(1000)) * 100;
  return Math.min(100, Math.max(0, score));
}

function calculateLikesScore(content) {
  const likes = content.analytics?.likes || 0;
  const views = content.analytics?.views || 1;
  const likeRate = likes / views;
  const absoluteScore = (Math.log10(likes + 1) / Math.log10(10000)) * 50;
  const rateScore = (likeRate / 0.1) * 50;
  const score = absoluteScore + rateScore;
  return Math.min(100, Math.max(0, score));
}

function calculateSharesScore(content) {
  const shares = content.analytics?.shares || 0;
  const views = content.analytics?.views || 1;
  const shareRate = shares / views;
  const absoluteScore = (Math.log10(shares + 1) / Math.log10(5000)) * 50;
  const rateScore = (shareRate / 0.05) * 50;
  const score = absoluteScore + rateScore;
  return Math.min(100, Math.max(0, score));
}

function calculateCommentsScore(content) {
  const comments = content.analytics?.comments || 0;
  const views = content.analytics?.views || 1;
  const commentRate = comments / views;
  const absoluteScore = (Math.log10(comments + 1) / Math.log10(2000)) * 50;
  const rateScore = (commentRate / 0.03) * 50;
  const score = absoluteScore + rateScore;
  return Math.min(100, Math.max(0, score));
}

function calculateRecencyScore(content, decayHalfLife = 48) {
  const now = new Date();
  const createdAt = new Date(content.createdAt);
  const hoursOld = (now - createdAt) / (1000 * 60 * 60);
  const score = 100 * Math.pow(0.5, hoursOld / decayHalfLife);
  return Math.max(0, score);
}

/**
 * Calculate trending score for single content
 */
async function calculateContentTrendingScore(content, weights, thresholds) {
  // Calculate component scores
  const scores = {
    watchTime: calculateWatchTimeScore(content),
    likes: calculateLikesScore(content),
    shares: calculateSharesScore(content),
    comments: calculateCommentsScore(content),
    completionRate: content.analytics?.averageWatchPercentage || 0,
    recency: calculateRecencyScore(content, thresholds.decayHalfLife)
  };

  // Apply weights
  const weightedScore = 
    (scores.watchTime * weights.watchTime) +
    (scores.likes * weights.likes) +
    (scores.shares * weights.shares) +
    (scores.comments * weights.comments) +
    (scores.completionRate * weights.completionRate) +
    (scores.recency * weights.recency);

  // Apply creator multiplier (verified creators get 10% boost)
  const creatorMultiplier = content.userId?.verified ? 1.1 : 1.0;
  const finalScore = weightedScore * creatorMultiplier;

  return {
    score: Math.round(finalScore * 100) / 100,
    components: scores
  };
}

/**
 * Batch calculate trending scores for recent content
 */
async function batchCalculateTrending() {
  try {
    console.log('📊 Starting trending calculation job...');
    const startTime = Date.now();

    // Get configuration
    const config = await TrendingConfig.findOne().lean();
    const weights = config?.weights || {
      watchTime: 0.35,
      likes: 0.20,
      shares: 0.20,
      comments: 0.10,
      completionRate: 0.10,
      recency: 0.05
    };
    const thresholds = config?.thresholds || {
      minViews: 100,
      minEngagement: 10,
      decayHalfLife: 48
    };

    // Get content from last 7 days with minimum thresholds
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const contents = await Content.find({
      createdAt: { $gte: cutoffDate },
      status: 'published',
      visibility: 'public',
      'analytics.views': { $gte: thresholds.minViews }
    })
      .populate('userId', 'verified')
      .limit(5000) // Process max 5000 items per run
      .lean();

    console.log(`  Found ${contents.length} items to process`);

    let processed = 0;
    let errors = 0;
    const batchSize = 100;

    // Process in batches
    for (let i = 0; i < contents.length; i += batchSize) {
      const batch = contents.slice(i, i + batchSize);
      
      const updates = await Promise.allSettled(
        batch.map(async (content) => {
          try {
            const result = await calculateContentTrendingScore(content, weights, thresholds);
            
            await Content.findByIdAndUpdate(content._id, {
              'trending.score': result.score,
              'trending.lastCalculated': new Date(),
              'trending.components': result.components
            });
            
            processed++;
            return { success: true };
          } catch (error) {
            errors++;
            console.error(`  ✗ Error for ${content._id}:`, error.message);
            return { success: false, error: error.message };
          }
        })
      );

      // Progress update every batch
      if ((i + batchSize) % 500 === 0 || (i + batchSize) >= contents.length) {
        console.log(`  ✓ Processed ${Math.min(i + batchSize, contents.length)}/${contents.length} items...`);
      }
    }

    // Update sound trending scores
    await updateSoundTrendingScores();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Trending calculation complete in ${duration}s`);
    console.log(`   Processed: ${processed} | Errors: ${errors}`);

    return {
      processed,
      errors,
      total: contents.length,
      duration
    };

  } catch (error) {
    console.error('❌ Trending calculation job failed:', error);
    throw error;
  }
}

/**
 * Update sound/music trending scores
 */
async function updateSoundTrendingScores() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get sounds used in last 7 days
    const recentContent = await Content.find({
      createdAt: { $gte: sevenDaysAgo },
      soundId: { $exists: true, $ne: null },
      status: 'published'
    }).select('soundId analytics.views analytics.likes trending.score');

    // Group by sound
    const soundStats = {};
    recentContent.forEach(content => {
      const soundId = content.soundId.toString();
      if (!soundStats[soundId]) {
        soundStats[soundId] = {
          usageCount: 0,
          totalViews: 0,
          totalLikes: 0,
          scores: []
        };
      }
      soundStats[soundId].usageCount++;
      soundStats[soundId].totalViews += content.analytics?.views || 0;
      soundStats[soundId].totalLikes += content.analytics?.likes || 0;
      soundStats[soundId].scores.push(content.trending?.score || 0);
    });

    // Calculate and update trending scores
    let updated = 0;
    for (const [soundId, stats] of Object.entries(soundStats)) {
      const avgScore = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
      
      const trendingScore = 
        (stats.usageCount * 10) +
        (stats.totalViews * 0.01) +
        (stats.totalLikes * 0.1) +
        (avgScore * 5);

      await Sound.findByIdAndUpdate(soundId, {
        'trending.score': Math.round(trendingScore * 100) / 100,
        'trending.lastCalculated': new Date(),
        'trending.usageCount7d': stats.usageCount,
        'trending.views7d': stats.totalViews,
        'trending.lastUsed': new Date()
      });
      
      updated++;
    }

    console.log(`  ✓ Updated ${updated} sound trending scores`);
    return updated;

  } catch (error) {
    console.error('Error updating sound trending scores:', error);
    throw error;
  }
}

/**
 * Initialize cron job
 */
function initializeTrendingCron() {
  // Run daily at 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('\n🕐 [CRON] Trending calculation job triggered');
    try {
      await batchCalculateTrending();
    } catch (error) {
      console.error('Cron job error:', error);
    }
  });

  console.log('✅ Trending calculation cron job initialized (runs daily at 3 AM)');
  
  // Optional: Run immediately on startup (for testing)
  if (process.env.RUN_TRENDING_ON_STARTUP === 'true') {
    console.log('🚀 Running initial trending calculation...');
    setTimeout(() => {
      batchCalculateTrending().catch(console.error);
    }, 5000); // Wait 5 seconds after startup
  }
}

module.exports = {
  initializeTrendingCron,
  batchCalculateTrending,
  updateSoundTrendingScores
};
