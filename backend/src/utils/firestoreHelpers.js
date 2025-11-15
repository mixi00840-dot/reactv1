/**
 * Firestore Helpers Stub
 * 
 * This file provides stub functions for Firestore operations.
 * The system has been migrated to MongoDB, so these functions
 * return empty data or throw not-implemented errors.
 */

module.exports = {
  /**
   * Find documents (stub - returns empty array)
   */
  findDocuments: async (collection, query = {}, options = {}) => {
    console.warn(`firestoreHelpers.findDocuments called for ${collection} - returning empty array (MongoDB migration)`);
    return [];
  },

  /**
   * Find document by ID (stub - returns null)
   */
  findDocumentById: async (collection, id) => {
    console.warn(`firestoreHelpers.findDocumentById called for ${collection}/${id} - returning null (MongoDB migration)`);
    return null;
  },

  /**
   * Create document (stub - throws error)
   */
  createDocument: async (collection, data) => {
    throw new Error('Firestore operations not supported - system migrated to MongoDB');
  },

  /**
   * Update document (stub - throws error)
   */
  updateDocument: async (collection, id, data) => {
    throw new Error('Firestore operations not supported - system migrated to MongoDB');
  },

  /**
   * Delete document (stub - throws error)
   */
  deleteDocument: async (collection, id) => {
    throw new Error('Firestore operations not supported - system migrated to MongoDB');
  },

  /**
   * Batch write (stub - throws error)
   */
  batchWrite: async (operations) => {
    throw new Error('Firestore operations not supported - system migrated to MongoDB');
  },

  /**
   * Query documents (stub - returns empty array)
   */
  queryDocuments: async (collection, filters, options = {}) => {
    console.warn(`firestoreHelpers.queryDocuments called for ${collection} - returning empty array (MongoDB migration)`);
    return [];
  }
};
