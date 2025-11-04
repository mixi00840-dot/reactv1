/**
 * Firestore Helper Utilities
 * Reusable functions for common Firestore operations to replace MongoDB models
 */

const { getDb } = require('./database');
const { FieldValue } = require('@google-cloud/firestore');

/**
 * Create a new document in a collection
 * @param {string} collectionName - Firestore collection name
 * @param {object} data - Document data
 * @param {string} [docId] - Optional custom document ID
 * @returns {Promise<object>} Created document with ID
 */
async function createDocument(collectionName, data, docId = null) {
  const db = getDb();
  const docData = {
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };

  let docRef;
  if (docId) {
    docRef = db.collection(collectionName).doc(docId);
    await docRef.set(docData);
  } else {
    docRef = await db.collection(collectionName).add(docData);
  }

  const snapshot = await docRef.get();
  return { id: snapshot.id, ...snapshot.data() };
}

/**
 * Find document by ID
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @returns {Promise<object|null>} Document data or null
 */
async function findById(collectionName, docId) {
  const db = getDb();
  const docRef = db.collection(collectionName).doc(docId);
  const snapshot = await docRef.get();
  
  if (!snapshot.exists) {
    return null;
  }
  
  return { id: snapshot.id, ...snapshot.data() };
}

/**
 * Find documents by query
 * @param {string} collectionName - Firestore collection name
 * @param {object} filters - Query filters { field: value }
 * @param {object} options - Query options { limit, orderBy, direction }
 * @returns {Promise<array>} Array of documents
 */
async function findDocuments(collectionName, filters = {}, options = {}) {
  const db = getDb();
  let query = db.collection(collectionName);

  // Apply filters
  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null) {
      query = query.where(field, '==', value);
    }
  });

  // Apply ordering
  if (options.orderBy) {
    const direction = options.direction || 'asc';
    query = query.orderBy(options.orderBy, direction);
  }

  // Apply limit
  if (options.limit) {
    query = query.limit(options.limit);
  }

  // Apply offset
  if (options.offset) {
    query = query.offset(options.offset);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Find one document by query
 * @param {string} collectionName - Firestore collection name
 * @param {object} filters - Query filters { field: value }
 * @returns {Promise<object|null>} Document data or null
 */
async function findOne(collectionName, filters = {}) {
  const results = await findDocuments(collectionName, filters, { limit: 1 });
  return results.length > 0 ? results[0] : null;
}

/**
 * Update document by ID
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated document
 */
async function updateById(collectionName, docId, updates) {
  const db = getDb();
  const docRef = db.collection(collectionName).doc(docId);
  
  const updateData = {
    ...updates,
    updatedAt: FieldValue.serverTimestamp()
  };
  
  await docRef.update(updateData);
  
  const snapshot = await docRef.get();
  return { id: snapshot.id, ...snapshot.data() };
}

/**
 * Delete document by ID
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteById(collectionName, docId) {
  const db = getDb();
  await db.collection(collectionName).doc(docId).delete();
  return true;
}

/**
 * Count documents matching query
 * @param {string} collectionName - Firestore collection name
 * @param {object} filters - Query filters { field: value }
 * @returns {Promise<number>} Document count
 */
async function countDocuments(collectionName, filters = {}) {
  const db = getDb();
  let query = db.collection(collectionName);

  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null) {
      query = query.where(field, '==', value);
    }
  });

  const snapshot = await query.count().get();
  return snapshot.data().count;
}

/**
 * Advanced query with multiple conditions
 * @param {string} collectionName - Firestore collection name
 * @param {array} conditions - Array of condition objects { field, operator, value }
 * @param {object} options - Query options
 * @returns {Promise<array>} Array of documents
 */
async function advancedQuery(collectionName, conditions = [], options = {}) {
  const db = getDb();
  let query = db.collection(collectionName);

  // Apply conditions
  conditions.forEach(({ field, operator, value }) => {
    query = query.where(field, operator, value);
  });

  // Apply ordering
  if (options.orderBy) {
    const direction = options.direction || 'asc';
    query = query.orderBy(options.orderBy, direction);
  }

  // Apply pagination
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.offset(options.offset);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Batch create multiple documents
 * @param {string} collectionName - Firestore collection name
 * @param {array} documents - Array of document data objects
 * @returns {Promise<array>} Created documents with IDs
 */
async function batchCreate(collectionName, documents) {
  const db = getDb();
  const batch = db.batch();
  const refs = [];

  documents.forEach(data => {
    const docRef = db.collection(collectionName).doc();
    refs.push(docRef);
    batch.set(docRef, {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
  });

  await batch.commit();

  // Fetch created documents
  const results = await Promise.all(
    refs.map(async ref => {
      const snapshot = await ref.get();
      return { id: snapshot.id, ...snapshot.data() };
    })
  );

  return results;
}

/**
 * Batch update multiple documents
 * @param {string} collectionName - Firestore collection name
 * @param {array} updates - Array of { id, data } objects
 * @returns {Promise<boolean>} Success status
 */
async function batchUpdate(collectionName, updates) {
  const db = getDb();
  const batch = db.batch();

  updates.forEach(({ id, data }) => {
    const docRef = db.collection(collectionName).doc(id);
    batch.update(docRef, {
      ...data,
      updatedAt: FieldValue.serverTimestamp()
    });
  });

  await batch.commit();
  return true;
}

/**
 * Batch delete multiple documents
 * @param {string} collectionName - Firestore collection name
 * @param {array} docIds - Array of document IDs
 * @returns {Promise<boolean>} Success status
 */
async function batchDelete(collectionName, docIds) {
  const db = getDb();
  const batch = db.batch();

  docIds.forEach(id => {
    const docRef = db.collection(collectionName).doc(id);
    batch.delete(docRef);
  });

  await batch.commit();
  return true;
}

/**
 * Paginated query with cursor
 * @param {string} collectionName - Firestore collection name
 * @param {object} filters - Query filters
 * @param {object} pagination - { page, limit, orderBy, direction }
 * @returns {Promise<object>} { data, page, totalPages, hasMore }
 */
async function paginatedQuery(collectionName, filters = {}, pagination = {}) {
  const { page = 1, limit = 10, orderBy = 'createdAt', direction = 'desc' } = pagination;
  const offset = (page - 1) * limit;

  const db = getDb();
  let query = db.collection(collectionName);

  // Apply filters
  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null) {
      query = query.where(field, '==', value);
    }
  });

  // Get total count
  const countSnapshot = await query.count().get();
  const totalCount = countSnapshot.data().count;
  const totalPages = Math.ceil(totalCount / limit);

  // Apply pagination
  query = query.orderBy(orderBy, direction).limit(limit).offset(offset);

  const snapshot = await query.get();
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return {
    data,
    page,
    limit,
    totalCount,
    totalPages,
    hasMore: page < totalPages
  };
}

/**
 * Increment field value
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @param {string} field - Field name to increment
 * @param {number} amount - Amount to increment (default 1)
 * @returns {Promise<boolean>} Success status
 */
async function incrementField(collectionName, docId, field, amount = 1) {
  const db = getDb();
  const docRef = db.collection(collectionName).doc(docId);
  
  await docRef.update({
    [field]: FieldValue.increment(amount),
    updatedAt: FieldValue.serverTimestamp()
  });
  
  return true;
}

/**
 * Add item to array field
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @param {string} field - Array field name
 * @param {any} value - Value to add
 * @returns {Promise<boolean>} Success status
 */
async function arrayAdd(collectionName, docId, field, value) {
  const db = getDb();
  const docRef = db.collection(collectionName).doc(docId);
  
  await docRef.update({
    [field]: FieldValue.arrayUnion(value),
    updatedAt: FieldValue.serverTimestamp()
  });
  
  return true;
}

/**
 * Remove item from array field
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @param {string} field - Array field name
 * @param {any} value - Value to remove
 * @returns {Promise<boolean>} Success status
 */
async function arrayRemove(collectionName, docId, field, value) {
  const db = getDb();
  const docRef = db.collection(collectionName).doc(docId);
  
  await docRef.update({
    [field]: FieldValue.arrayRemove(value),
    updatedAt: FieldValue.serverTimestamp()
  });
  
  return true;
}

/**
 * Transaction helper
 * @param {function} callback - Callback function with transaction object
 * @returns {Promise<any>} Transaction result
 */
async function runTransaction(callback) {
  const db = getDb();
  return await db.runTransaction(callback);
}

/**
 * Check if document exists
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @returns {Promise<boolean>} Exists status
 */
async function documentExists(collectionName, docId) {
  const db = getDb();
  const snapshot = await db.collection(collectionName).doc(docId).get();
  return snapshot.exists;
}

module.exports = {
  createDocument,
  findById,
  findDocuments,
  findOne,
  updateById,
  deleteById,
  countDocuments,
  advancedQuery,
  batchCreate,
  batchUpdate,
  batchDelete,
  paginatedQuery,
  incrementField,
  arrayAdd,
  arrayRemove,
  runTransaction,
  documentExists,
  FieldValue
};
