const request = require('supertest');
const admin = require('firebase-admin');
const { generateTestToken, createTestAdmin, createTestProduct, clearTestData } = require('../helpers/testHelpers');

let app;

describe('Admin Products API Tests', () => {
  let adminToken;
  let adminUser;
  let testProduct;

  beforeAll(async () => {
    app = require('../../src/server-simple');
    adminUser = await createTestAdmin();
    adminToken = generateTestToken(adminUser.id, 'admin');
    testProduct = await createTestProduct();
  });

  afterAll(async () => {
    await clearTestData();
  });

  describe('GET /api/admin/products', () => {
    it('should return list of products', async () => {
      const response = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('totalProducts');
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should filter products by status', async () => {
      const response = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'active' });

      expect(response.status).toBe(200);
      response.body.products.forEach(product => {
        expect(product.status).toBe('active');
      });
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ category: 'test-category' });

      expect(response.status).toBe(200);
    });

    it('should search products by name', async () => {
      const response = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'Test' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/admin/products/:id', () => {
    it('should return product details', async () => {
      const response = await request(app)
        .get(`/api/admin/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('product');
      expect(response.body.product.id).toBe(testProduct.id);
    });
  });

  describe('PUT /api/admin/products/:id', () => {
    it('should update product details', async () => {
      const updates = {
        name: 'Updated Product Name',
        price: 149.99,
        stock: 50
      };

      const response = await request(app)
        .put(`/api/admin/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      
      const db = admin.firestore();
      const productDoc = await db.collection('products').doc(testProduct.id).get();
      expect(productDoc.data().name).toBe(updates.name);
      expect(productDoc.data().price).toBe(updates.price);
    });
  });

  describe('PUT /api/admin/products/:id/feature', () => {
    it('should feature a product', async () => {
      const response = await request(app)
        .put(`/api/admin/products/${testProduct.id}/feature`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ featured: true });

      expect(response.status).toBe(200);
      
      const db = admin.firestore();
      const productDoc = await db.collection('products').doc(testProduct.id).get();
      expect(productDoc.data().isFeatured).toBe(true);
    });
  });

  describe('PUT /api/admin/products/:id/status', () => {
    it('should change product status', async () => {
      const response = await request(app)
        .put(`/api/admin/products/${testProduct.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' });

      expect(response.status).toBe(200);
      
      const db = admin.firestore();
      const productDoc = await db.collection('products').doc(testProduct.id).get();
      expect(productDoc.data().status).toBe('inactive');
    });
  });

  describe('DELETE /api/admin/products/:id', () => {
    it('should delete a product', async () => {
      const productToDelete = await createTestProduct();
      
      const response = await request(app)
        .delete(`/api/admin/products/${productToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      const db = admin.firestore();
      const productDoc = await db.collection('products').doc(productToDelete.id).get();
      expect(productDoc.exists).toBe(false);
    });
  });

  describe('GET /api/admin/products/stats', () => {
    it('should return product statistics', async () => {
      const response = await request(app)
        .get('/api/admin/products/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalProducts');
      expect(response.body).toHaveProperty('activeProducts');
      expect(response.body).toHaveProperty('outOfStock');
      expect(response.body).toHaveProperty('featuredProducts');
    });
  });
});
