const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { protect, adminOnly } = require('../middleware/auth');

// Generate candidates
router.post('/candidates', protect, recommendationController.generateCandidates);

// Trending content
router.get('/trending', recommendationController.getTrending);

// Content metadata
router.get('/metadata/:contentId', protect, recommendationController.getMetadata);
router.post('/metadata/:contentId/refresh', protect, adminOnly, recommendationController.refreshMetadata);
router.post('/metadata/batch/refresh', protect, adminOnly, recommendationController.batchRefreshMetadata);

// Embeddings
router.post('/embeddings/:contentId', protect, adminOnly, recommendationController.generateEmbeddings);

// Similar content
router.get('/similar/:contentId', recommendationController.getSimilarContent);

// Topic/Hashtag based
router.post('/by-topics', protect, recommendationController.getByTopics);
router.post('/by-hashtags', protect, recommendationController.getByHashtags);

// Reindexing
router.get('/reindex/pending', protect, adminOnly, recommendationController.getPendingReindex);

module.exports = router;
