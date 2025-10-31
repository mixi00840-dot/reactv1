const StreamFilterService = require('../services/streamFilterService');

/**
 * Stream Filter Controller
 */

exports.getFilters = async (req, res) => {
  try {
    const { type, category, free, limit } = req.query;
    
    const filters = await StreamFilterService.getAvailableFilters(
      req.user._id,
      { type, category, free: free === 'true', limit: parseInt(limit) || 50 }
    );
    
    res.json({
      success: true,
      filters
    });
    
  } catch (error) {
    console.error('Error getting filters:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getTrending = async (req, res) => {
  try {
    const { type, limit = 20 } = req.query;
    
    const filters = await StreamFilterService.getTrendingFilters(type, parseInt(limit));
    
    res.json({
      success: true,
      filters
    });
    
  } catch (error) {
    console.error('Error getting trending filters:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getFeatured = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const filters = await StreamFilterService.getFeaturedFilters(parseInt(limit));
    
    res.json({
      success: true,
      filters
    });
    
  } catch (error) {
    console.error('Error getting featured filters:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 50 } = req.query;
    
    const filters = await StreamFilterService.getByCategory(category, parseInt(limit));
    
    res.json({
      success: true,
      filters
    });
    
  } catch (error) {
    console.error('Error getting filters by category:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.search = async (req, res) => {
  try {
    const { q, type, category, free, limit } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query required'
      });
    }
    
    const filters = await StreamFilterService.searchFilters(q, {
      type,
      category,
      free: free === 'true',
      limit: parseInt(limit) || 50
    });
    
    res.json({
      success: true,
      filters
    });
    
  } catch (error) {
    console.error('Error searching filters:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.applyFilter = async (req, res) => {
  try {
    const { filterId } = req.params;
    const { streamId } = req.body;
    
    const filterConfig = await StreamFilterService.applyFilter(
      filterId,
      req.user._id,
      streamId
    );
    
    res.json({
      success: true,
      filter: filterConfig
    });
    
  } catch (error) {
    console.error('Error applying filter:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.unlockFilter = async (req, res) => {
  try {
    const { filterId } = req.params;
    
    const filter = await StreamFilterService.unlockFilter(filterId, req.user._id);
    
    res.json({
      success: true,
      filter,
      message: 'Filter unlocked successfully'
    });
    
  } catch (error) {
    console.error('Error unlocking filter:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.favoriteFilter = async (req, res) => {
  try {
    const { filterId } = req.params;
    
    const filter = await StreamFilterService.favoriteFilter(filterId, req.user._id);
    
    res.json({
      success: true,
      filter
    });
    
  } catch (error) {
    console.error('Error favoriting filter:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.rateFilter = async (req, res) => {
  try {
    const { filterId } = req.params;
    const { rating } = req.body;
    
    const filter = await StreamFilterService.rateFilter(filterId, req.user._id, rating);
    
    res.json({
      success: true,
      filter
    });
    
  } catch (error) {
    console.error('Error rating filter:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createCustomFilter = async (req, res) => {
  try {
    const filterData = req.body;
    
    const filter = await StreamFilterService.createCustomFilter(req.user._id, filterData);
    
    res.status(201).json({
      success: true,
      filter
    });
    
  } catch (error) {
    console.error('Error creating custom filter:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getUserFavorites = async (req, res) => {
  try {
    const filters = await StreamFilterService.getUserFavorites(req.user._id);
    
    res.json({
      success: true,
      filters
    });
    
  } catch (error) {
    console.error('Error getting user favorites:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getUserUnlocked = async (req, res) => {
  try {
    const filters = await StreamFilterService.getUserUnlockedFilters(req.user._id);
    
    res.json({
      success: true,
      filters
    });
    
  } catch (error) {
    console.error('Error getting user unlocked filters:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
