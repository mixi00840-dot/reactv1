const StreamFilter = require('../models/StreamFilter');
const User = require('../models/User');

/**
 * Stream Filter Service
 * 
 * Handles beauty filters, AR effects, and visual enhancements
 */

class StreamFilterService {
  /**
   * Get available filters
   */
  static async getAvailableFilters(userId, options = {}) {
    try {
      const { type, category, free, limit = 50 } = options;
      
      const query = { status: 'active' };
      
      if (type) {
        query.type = type;
      }
      
      if (category) {
        query.category = category;
      }
      
      if (free !== undefined) {
        query['availability.free'] = free;
      }
      
      const filters = await StreamFilter.find(query)
        .sort({ featured: -1, 'stats.usageCount': -1 })
        .limit(limit);
      
      // Check user's unlocked filters
      const user = await User.findById(userId).select('unlockedFilters');
      const unlockedFilters = user?.unlockedFilters || [];
      
      // Add unlock status
      const filtersWithStatus = filters.map(filter => ({
        ...filter.toObject(),
        unlocked: unlockedFilters.includes(filter._id) || filter.availability.free
      }));
      
      return filtersWithStatus;
      
    } catch (error) {
      console.error('Error getting available filters:', error);
      throw error;
    }
  }
  
  /**
   * Get trending filters
   */
  static async getTrendingFilters(type = null, limit = 20) {
    try {
      return await StreamFilter.getTrendingFilters(type, limit);
    } catch (error) {
      console.error('Error getting trending filters:', error);
      throw error;
    }
  }
  
  /**
   * Get featured filters
   */
  static async getFeaturedFilters(limit = 10) {
    try {
      return await StreamFilter.getFeaturedFilters(limit);
    } catch (error) {
      console.error('Error getting featured filters:', error);
      throw error;
    }
  }
  
  /**
   * Get filters by category
   */
  static async getByCategory(category, limit = 50) {
    try {
      return await StreamFilter.getByCategory(category, limit);
    } catch (error) {
      console.error('Error getting filters by category:', error);
      throw error;
    }
  }
  
  /**
   * Search filters
   */
  static async searchFilters(query, filters = {}) {
    try {
      return await StreamFilter.searchFilters(query, filters);
    } catch (error) {
      console.error('Error searching filters:', error);
      throw error;
    }
  }
  
  /**
   * Apply filter to stream
   */
  static async applyFilter(filterId, userId, streamId) {
    try {
      const filter = await StreamFilter.findById(filterId);
      
      if (!filter) {
        throw new Error('Filter not found');
      }
      
      if (filter.status !== 'active') {
        throw new Error('Filter is not available');
      }
      
      // Check if user has access
      if (!filter.availability.free) {
        const user = await User.findById(userId).select('unlockedFilters');
        
        if (!user.unlockedFilters || !user.unlockedFilters.includes(filterId)) {
          throw new Error('Filter not unlocked');
        }
      }
      
      // Increment usage count
      await filter.incrementUsage();
      
      // Return filter configuration
      return {
        filterId: filter.filterId,
        name: filter.name,
        type: filter.type,
        assets: filter.assets,
        parameters: filter.parameters
      };
      
    } catch (error) {
      console.error('Error applying filter:', error);
      throw error;
    }
  }
  
  /**
   * Unlock filter (purchase/earn)
   */
  static async unlockFilter(filterId, userId) {
    try {
      const filter = await StreamFilter.findById(filterId);
      
      if (!filter) {
        throw new Error('Filter not found');
      }
      
      if (filter.availability.free) {
        throw new Error('Filter is already free');
      }
      
      const user = await User.findById(userId);
      
      // Check if already unlocked
      if (user.unlockedFilters && user.unlockedFilters.includes(filterId)) {
        throw new Error('Filter already unlocked');
      }
      
      // Check price
      if (filter.availability.price > 0) {
        if (user.wallet.coins < filter.availability.price) {
          throw new Error('Insufficient coins');
        }
        
        // Deduct coins
        user.wallet.coins -= filter.availability.price;
      }
      
      // Add to unlocked filters
      if (!user.unlockedFilters) {
        user.unlockedFilters = [];
      }
      user.unlockedFilters.push(filterId);
      
      await user.save();
      
      // Increment downloads
      filter.stats.downloads++;
      await filter.save();
      
      return filter;
      
    } catch (error) {
      console.error('Error unlocking filter:', error);
      throw error;
    }
  }
  
  /**
   * Favorite filter
   */
  static async favoriteFilter(filterId, userId) {
    try {
      const filter = await StreamFilter.findById(filterId);
      
      if (!filter) {
        throw new Error('Filter not found');
      }
      
      const user = await User.findById(userId);
      
      if (!user.favoriteFilters) {
        user.favoriteFilters = [];
      }
      
      // Check if already favorited
      if (user.favoriteFilters.includes(filterId)) {
        // Unfavorite
        user.favoriteFilters = user.favoriteFilters.filter(
          id => id.toString() !== filterId.toString()
        );
        await filter.removeFavorite();
      } else {
        // Favorite
        user.favoriteFilters.push(filterId);
        await filter.addFavorite();
      }
      
      await user.save();
      
      return filter;
      
    } catch (error) {
      console.error('Error favoriting filter:', error);
      throw error;
    }
  }
  
  /**
   * Rate filter
   */
  static async rateFilter(filterId, userId, rating) {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
      
      const filter = await StreamFilter.findById(filterId);
      
      if (!filter) {
        throw new Error('Filter not found');
      }
      
      await filter.rate(rating);
      
      return filter;
      
    } catch (error) {
      console.error('Error rating filter:', error);
      throw error;
    }
  }
  
  /**
   * Create custom filter
   */
  static async createCustomFilter(userId, filterData) {
    try {
      const filter = await StreamFilter.create({
        ...filterData,
        creator: userId,
        official: false,
        status: 'review'
      });
      
      return filter;
      
    } catch (error) {
      console.error('Error creating custom filter:', error);
      throw error;
    }
  }
  
  /**
   * Get user's favorite filters
   */
  static async getUserFavorites(userId) {
    try {
      const user = await User.findById(userId)
        .select('favoriteFilters')
        .populate({
          path: 'favoriteFilters',
          match: { status: 'active' }
        });
      
      return user?.favoriteFilters || [];
      
    } catch (error) {
      console.error('Error getting user favorites:', error);
      throw error;
    }
  }
  
  /**
   * Get user's unlocked filters
   */
  static async getUserUnlockedFilters(userId) {
    try {
      const user = await User.findById(userId)
        .select('unlockedFilters')
        .populate({
          path: 'unlockedFilters',
          match: { status: 'active' }
        });
      
      return user?.unlockedFilters || [];
      
    } catch (error) {
      console.error('Error getting user unlocked filters:', error);
      throw error;
    }
  }
}

module.exports = StreamFilterService;
