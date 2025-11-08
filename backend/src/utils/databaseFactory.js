/**
 * Database Factory
 * Provides clean abstraction for database operations
 * Automatically routes to correct database based on mode
 */

const { dualDb } = require('../middleware/dualDatabase');

/**
 * Database Factory Class
 * Use this in your routes instead of directly accessing Firebase or MongoDB
 */
class DatabaseFactory {
  /**
   * Create a new document
   * @param {string} collection - Collection/model name
   * @param {object} data - Document data
   * @param {object} options - { mongoModel, docId }
   */
  static async create(collection, data, options = {}) {
    return dualDb.createDocument(collection, data, options);
  }

  /**
   * Find document by ID
   * @param {string} collection - Collection/model name
   * @param {string} docId - Document ID
   * @param {object} options - { mongoModel }
   */
  static async findById(collection, docId, options = {}) {
    const result = await dualDb.readDocument(collection, docId, options);
    return result.data;
  }

  /**
   * Find documents with query
   * @param {string} collection - Collection/model name
   * @param {object} query - Query filters
   * @param {object} options - { mongoModel, limit, sort }
   */
  static async find(collection, query = {}, options = {}) {
    const result = await dualDb.queryDocuments(collection, query, options);
    return result.data;
  }

  /**
   * Update document
   * @param {string} collection - Collection/model name
   * @param {string} docId - Document ID
   * @param {object} updates - Update data
   * @param {object} options - { mongoModel }
   */
  static async update(collection, docId, updates, options = {}) {
    return dualDb.updateDocument(collection, docId, updates, options);
  }

  /**
   * Delete document
   * @param {string} collection - Collection/model name
   * @param {string} docId - Document ID
   * @param {object} options - { mongoModel, softDelete }
   */
  static async delete(collection, docId, options = {}) {
    return dualDb.deleteDocument(collection, docId, options);
  }

  /**
   * Get database status
   */
  static getStatus() {
    return dualDb.getStatus();
  }
}

// Example usage in routes:
/*
const DatabaseFactory = require('../utils/databaseFactory');

// Create user
const result = await DatabaseFactory.create('users', userData, {
  mongoModel: 'User',
  docId: userId // optional
});

// Find user
const user = await DatabaseFactory.findById('users', userId, {
  mongoModel: 'User'
});

// Update user
await DatabaseFactory.update('users', userId, { fullName: 'New Name' }, {
  mongoModel: 'User'
});

// Delete user
await DatabaseFactory.delete('users', userId, {
  mongoModel: 'User',
  softDelete: true // optional
});
*/

module.exports = DatabaseFactory;

