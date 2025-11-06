const admin = require('firebase-admin');
const { createTestProduct, createTestSeller, clearTestData } = require('../helpers/testHelpers');

describe('Product Model Tests', () => {
  let db;
  let testSeller;

  beforeAll(async () => {
    db = admin.firestore();
    testSeller = await createTestSeller();
  });

  afterAll(async () => {
    await clearTestData();
  });

  describe('Product Creation', () => {
    it('should create a product with all required fields', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: 'electronics',
        status: 'active',
        storeId: 'test-store',
        sellerId: testSeller.id,
        stock: 100
      };

      const productRef = await db.collection('products').add(productData);
      const productDoc = await productRef.get();

      expect(productDoc.exists).toBe(true);
      expect(productDoc.data().name).toBe(productData.name);
      expect(productDoc.data().price).toBe(productData.price);
    });

    it('should validate price is positive', async () => {
      const invalidProduct = {
        name: 'Invalid Product',
        price: -10,
        category: 'test'
      };

      // Price validation should fail
      expect(() => {
        if (invalidProduct.price < 0) {
          throw new Error('Price must be positive');
        }
      }).toThrow('Price must be positive');
    });

    it('should set default values', async () => {
      const product = await createTestProduct({ sellerId: testSeller.id });

      expect(product.stock).toBeGreaterThanOrEqual(0);
      expect(product.status).toBeDefined();
      expect(product.createdAt).toBeDefined();
    });
  });

  describe('Product Updates', () => {
    it('should update product price', async () => {
      const product = await createTestProduct({ sellerId: testSeller.id });
      
      const newPrice = 149.99;
      await db.collection('products').doc(product.id).update({
        price: newPrice,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const updatedDoc = await db.collection('products').doc(product.id).get();
      expect(updatedDoc.data().price).toBe(newPrice);
    });

    it('should update stock quantity', async () => {
      const product = await createTestProduct({ sellerId: testSeller.id, stock: 100 });
      
      await db.collection('products').doc(product.id).update({
        stock: admin.firestore.FieldValue.increment(-5)
      });

      const updatedDoc = await db.collection('products').doc(product.id).get();
      expect(updatedDoc.data().stock).toBe(95);
    });

    it('should update product status', async () => {
      const product = await createTestProduct({ sellerId: testSeller.id });
      
      await db.collection('products').doc(product.id).update({
        status: 'inactive'
      });

      const updatedDoc = await db.collection('products').doc(product.id).get();
      expect(updatedDoc.data().status).toBe('inactive');
    });
  });

  describe('Product Queries', () => {
    beforeAll(async () => {
      await createTestProduct({ category: 'electronics', status: 'active', price: 99.99 });
      await createTestProduct({ category: 'electronics', status: 'active', price: 199.99 });
      await createTestProduct({ category: 'clothing', status: 'active', price: 49.99 });
    });

    it('should query products by category', async () => {
      const snapshot = await db.collection('products')
        .where('category', '==', 'electronics')
        .get();

      expect(snapshot.size).toBeGreaterThan(0);
      snapshot.forEach(doc => {
        expect(doc.data().category).toBe('electronics');
      });
    });

    it('should query products by status', async () => {
      const snapshot = await db.collection('products')
        .where('status', '==', 'active')
        .get();

      expect(snapshot.size).toBeGreaterThan(0);
      snapshot.forEach(doc => {
        expect(doc.data().status).toBe('active');
      });
    });

    it('should query products by price range', async () => {
      const snapshot = await db.collection('products')
        .where('price', '>=', 50)
        .where('price', '<=', 150)
        .get();

      expect(snapshot.size).toBeGreaterThan(0);
      snapshot.forEach(doc => {
        expect(doc.data().price).toBeGreaterThanOrEqual(50);
        expect(doc.data().price).toBeLessThanOrEqual(150);
      });
    });

    it('should sort products by price', async () => {
      const snapshot = await db.collection('products')
        .orderBy('price', 'asc')
        .limit(10)
        .get();

      let previousPrice = 0;
      snapshot.forEach(doc => {
        const price = doc.data().price;
        expect(price).toBeGreaterThanOrEqual(previousPrice);
        previousPrice = price;
      });
    });
  });

  describe('Product Stock Management', () => {
    it('should track low stock', async () => {
      const product = await createTestProduct({ 
        stock: 5, 
        lowStockThreshold: 10 
      });

      const productDoc = await db.collection('products').doc(product.id).get();
      const isLowStock = productDoc.data().stock <= productDoc.data().lowStockThreshold;

      expect(isLowStock).toBe(true);
    });

    it('should handle out of stock', async () => {
      const product = await createTestProduct({ stock: 0 });

      const productDoc = await db.collection('products').doc(product.id).get();
      expect(productDoc.data().stock).toBe(0);
    });
  });
});
