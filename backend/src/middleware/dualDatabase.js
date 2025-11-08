/**
 * Dual Database Middleware
 * Enables safe migration by supporting both Firebase and MongoDB simultaneously
 * 
 * Modes:
 * - 'firebase' = Use Firebase only (current production)
 * - 'mongodb' = Use MongoDB only (after migration)
 * - 'dual' = Write to both, read from MongoDB with Firebase fallback (migration mode)
 */

const admin = require('firebase-admin');
const firestore = admin.firestore();
const mongoose = require('mongoose');
const { connectMongoDB } = require('../utils/mongodb');

// Get database mode from environment
const DB_MODE = process.env.DATABASE_MODE || 'firebase';

/**
 * Database Abstraction Layer
 * Provides unified interface for both databases
 */
class DualDatabase {
  constructor() {
    this.mode = DB_MODE;
    this.mongoConnected = false;
    this.firestoreConnected = true; // Assuming Firebase is already initialized
  }

  /**
   * Initialize connections
   */
  async initialize() {
    console.log(`🔄 Initializing Database in ${this.mode.toUpperCase()} mode`);

    if (this.mode === 'mongodb' || this.mode === 'dual') {
      try {
        await connectMongoDB();
        this.mongoConnected = true;
        console.log('✅ MongoDB initialized');
      } catch (error) {
        console.error('❌ MongoDB initialization failed:', error.message);
        if (this.mode === 'mongodb') {
          throw error; // MongoDB-only mode requires MongoDB
        }
      }
    }

    if (this.mode === 'firebase' || this.mode === 'dual') {
      // Firebase already initialized in database.js
      console.log('✅ Firebase/Firestore initialized');
    }
  }

  /**
   * Create document in both databases (dual mode)
   */
  async create(collection, data, options = {}) {
    const { mongoModel, firestoreCollection = collection, id } = options;

    const results = {
      firebase: null,
      mongodb: null,
      errors: []
    };

    // Write to MongoDB
    if ((this.mode === 'mongodb' || this.mode === 'dual') && mongoModel) {
      try {
        const docData = { ...data };
        if (id) docData._id = id;
        
        const doc = new mongoModel(docData);
        results.mongodb = await doc.save();
        console.log(`✅ MongoDB: Created document in ${mongoModel.modelName}`);
      } catch (error) {
        console.error(`❌ MongoDB create error:`, error.message);
        results.errors.push({ db: 'mongodb', error: error.message });
        
        if (this.mode === 'mongodb') {
          throw error; // Fail in MongoDB-only mode
        }
      }
    }

    // Write to Firebase
    if (this.mode === 'firebase' || this.mode === 'dual') {
      try {
        const docId = id || results.mongodb?._id?.toString() || firestore.collection(firestoreCollection).doc().id;
        const firestoreData = this.convertToFirestore(data, results.mongodb);
        
        await firestore.collection(firestoreCollection).doc(docId).set(firestoreData);
        results.firebase = { id: docId, ...firestoreData };
        console.log(`✅ Firestore: Created document in ${firestoreCollection}`);
      } catch (error) {
        console.error(`❌ Firestore create error:`, error.message);
        results.errors.push({ db: 'firebase', error: error.message });
        
        if (this.mode === 'firebase') {
          throw error; // Fail in Firebase-only mode
        }
      }
    }

    return this.mode === 'mongodb' ? results.mongodb : results.firebase || results.mongodb;
  }

  /**
   * Read document (try MongoDB first in dual mode, fallback to Firebase)
   */
  async findOne(collection, query, options = {}) {
    const { mongoModel, firestoreCollection = collection } = options;

    // Try MongoDB first in dual mode
    if ((this.mode === 'mongodb' || this.mode === 'dual') && mongoModel && this.mongoConnected) {
      try {
        const doc = await mongoModel.findOne(query);
        if (doc) {
          console.log(`✅ MongoDB: Found document in ${mongoModel.modelName}`);
          return doc;
        }
      } catch (error) {
        console.error(`❌ MongoDB findOne error:`, error.message);
        if (this.mode === 'mongodb') {
          throw error;
        }
      }
    }

    // Fallback to Firebase or Firebase-only mode
    if (this.mode === 'firebase' || this.mode === 'dual') {
      try {
        // Convert MongoDB query to Firestore query (simplified)
        let firestoreQuery = firestore.collection(firestoreCollection);
        
        // Handle simple queries (id lookup)
        if (query._id || query.id) {
          const docId = (query._id || query.id).toString();
          const doc = await firestore.collection(firestoreCollection).doc(docId).get();
          
          if (doc.exists) {
            console.log(`✅ Firestore: Found document in ${firestoreCollection}`);
            return { id: doc.id, ...doc.data() };
          }
        } else {
          // Handle field queries
          Object.entries(query).forEach(([key, value]) => {
            firestoreQuery = firestoreQuery.where(key, '==', value);
          });
          
          const snapshot = await firestoreQuery.limit(1).get();
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            console.log(`✅ Firestore: Found document in ${firestoreCollection}`);
            return { id: doc.id, ...doc.data() };
          }
        }
      } catch (error) {
        console.error(`❌ Firestore findOne error:`, error.message);
        if (this.mode === 'firebase') {
          throw error;
        }
      }
    }

    return null;
  }

  /**
   * Update document in both databases
   */
  async update(collection, id, updateData, options = {}) {
    const { mongoModel, firestoreCollection = collection } = options;

    const results = {
      firebase: null,
      mongodb: null,
      errors: []
    };

    // Update in MongoDB
    if ((this.mode === 'mongodb' || this.mode === 'dual') && mongoModel) {
      try {
        results.mongodb = await mongoModel.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        );
        console.log(`✅ MongoDB: Updated document in ${mongoModel.modelName}`);
      } catch (error) {
        console.error(`❌ MongoDB update error:`, error.message);
        results.errors.push({ db: 'mongodb', error: error.message });
        
        if (this.mode === 'mongodb') {
          throw error;
        }
      }
    }

    // Update in Firebase
    if (this.mode === 'firebase' || this.mode === 'dual') {
      try {
        const firestoreData = this.convertToFirestore(updateData, results.mongodb);
        firestoreData.updatedAt = new Date().toISOString();
        
        await firestore.collection(firestoreCollection).doc(id.toString()).update(firestoreData);
        results.firebase = { id: id.toString(), ...firestoreData };
        console.log(`✅ Firestore: Updated document in ${firestoreCollection}`);
      } catch (error) {
        console.error(`❌ Firestore update error:`, error.message);
        results.errors.push({ db: 'firebase', error: error.message });
        
        if (this.mode === 'firebase') {
          throw error;
        }
      }
    }

    return this.mode === 'mongodb' ? results.mongodb : results.firebase || results.mongodb;
  }

  /**
   * Delete document from both databases
   */
  async delete(collection, id, options = {}) {
    const { mongoModel, firestoreCollection = collection } = options;

    const results = {
      firebase: false,
      mongodb: false,
      errors: []
    };

    // Delete from MongoDB
    if ((this.mode === 'mongodb' || this.mode === 'dual') && mongoModel) {
      try {
        await mongoModel.findByIdAndDelete(id);
        results.mongodb = true;
        console.log(`✅ MongoDB: Deleted document from ${mongoModel.modelName}`);
      } catch (error) {
        console.error(`❌ MongoDB delete error:`, error.message);
        results.errors.push({ db: 'mongodb', error: error.message });
        
        if (this.mode === 'mongodb') {
          throw error;
        }
      }
    }

    // Delete from Firebase
    if (this.mode === 'firebase' || this.mode === 'dual') {
      try {
        await firestore.collection(firestoreCollection).doc(id.toString()).delete();
        results.firebase = true;
        console.log(`✅ Firestore: Deleted document from ${firestoreCollection}`);
      } catch (error) {
        console.error(`❌ Firestore delete error:`, error.message);
        results.errors.push({ db: 'firebase', error: error.message });
        
        if (this.mode === 'firebase') {
          throw error;
        }
      }
    }

    return results.mongodb || results.firebase;
  }

  /**
   * Query documents (with fallback)
   */
  async find(collection, query = {}, options = {}) {
    const { mongoModel, firestoreCollection = collection, limit = 50, sort } = options;

    // Try MongoDB first
    if ((this.mode === 'mongodb' || this.mode === 'dual') && mongoModel && this.mongoConnected) {
      try {
        let mongoQuery = mongoModel.find(query);
        
        if (limit) mongoQuery = mongoQuery.limit(limit);
        if (sort) mongoQuery = mongoQuery.sort(sort);
        
        const docs = await mongoQuery.exec();
        
        if (docs && docs.length > 0) {
          console.log(`✅ MongoDB: Found ${docs.length} documents in ${mongoModel.modelName}`);
          return docs;
        }
      } catch (error) {
        console.error(`❌ MongoDB find error:`, error.message);
        if (this.mode === 'mongodb') {
          throw error;
        }
      }
    }

    // Fallback to Firebase
    if (this.mode === 'firebase' || this.mode === 'dual') {
      try {
        let firestoreQuery = firestore.collection(firestoreCollection);
        
        // Apply simple where clauses
        Object.entries(query).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            // Handle operators like { $gte: value }
            // Simplified - in production, map all MongoDB operators
          } else {
            firestoreQuery = firestoreQuery.where(key, '==', value);
          }
        });
        
        if (limit) firestoreQuery = firestoreQuery.limit(limit);
        
        const snapshot = await firestoreQuery.get();
        const docs = [];
        snapshot.forEach(doc => {
          docs.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`✅ Firestore: Found ${docs.length} documents in ${firestoreCollection}`);
        return docs;
      } catch (error) {
        console.error(`❌ Firestore find error:`, error.message);
        if (this.mode === 'firebase') {
          throw error;
        }
      }
    }

    return [];
  }

  /**
   * Convert MongoDB document to Firestore format
   */
  convertToFirestore(data, mongoDoc) {
    const firestoreData = { ...data };
    
    // Convert ObjectId to string
    if (mongoDoc && mongoDoc._id) {
      firestoreData.id = mongoDoc._id.toString();
      delete firestoreData._id;
    }
    
    // Convert Date objects to ISO strings or Firestore Timestamps
    Object.keys(firestoreData).forEach(key => {
      if (firestoreData[key] instanceof Date) {
        firestoreData[key] = firestoreData[key].toISOString();
      }
      
      // Remove undefined values (Firestore doesn't support them)
      if (firestoreData[key] === undefined) {
        delete firestoreData[key];
      }
      
      // Convert nested objects recursively
      if (typeof firestoreData[key] === 'object' && firestoreData[key] !== null && !Array.isArray(firestoreData[key])) {
        if (firestoreData[key]._id) {
          firestoreData[key] = firestoreData[key]._id.toString();
        }
      }
    });
    
    return firestoreData;
  }

  /**
   * Get current database mode
   */
  getMode() {
    return this.mode;
  }

  /**
   * Check if MongoDB is available
   */
  isMongoAvailable() {
    return this.mongoConnected;
  }

  /**
   * Check if Firebase is available
   */
  isFirebaseAvailable() {
    return this.firestoreConnected;
  }
}

// Singleton instance
const dualDb = new DualDatabase();

module.exports = {
  dualDb,
  DualDatabase
};
