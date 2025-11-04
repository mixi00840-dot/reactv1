const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cmsController');

// Banner routes
router.get('/', cmsController.getBanners);

module.exports = router;
