const admin = require('firebase-admin');
const { createTestOrder, createTestUser, createTestProduct, clearTestData } = require('../helpers/testHelpers');

describe('Order Model Tests', () => {
  let db;
  let testCustomer;
  let testProduct;

  beforeAll(async () => {
    db = admin.firestore();
    testCustomer = await createTestUser();
    testProduct = await createTestProduct();
  });

  afterAll(async () => {
    await clearTestData();
  });

  describe('Order Creation', () => {
    it('should create an order with required fields', async () => {
      const orderData = {
        customerId: testCustomer.id,
        storeId: 'test-store',
        status: 'pending',
        items: [
          {
            productId: testProduct.id,
            quantity: 2,
            price: 99.99
          }
        ],
        totalAmount: 199.98
      };

      const orderRef = await db.collection('orders').add(orderData);
      const orderDoc = await orderRef.get();

      expect(orderDoc.exists).toBe(true);
      expect(orderDoc.data().customerId).toBe(testCustomer.id);
      expect(orderDoc.data().totalAmount).toBe(199.98);
    });

    it('should calculate order totals correctly', async () => {
      const items = [
        { productId: 'prod1', quantity: 2, price: 50.00 },
        { productId: 'prod2', quantity: 1, price: 30.00 }
      ];

      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.1; // 10% tax
      const shipping = 10.00;
      const totalAmount = subtotal + tax + shipping;

      expect(subtotal).toBe(130.00);
      expect(tax).toBe(13.00);
      expect(totalAmount).toBe(153.00);
    });

    it('should generate unique order number', async () => {
      const order1 = await createTestOrder();
      const order2 = await createTestOrder();

      expect(order1.id).not.toBe(order2.id);
    });
  });

  describe('Order Status Updates', () => {
    it('should update order status', async () => {
      const order = await createTestOrder();
      
      const statusFlow = ['pending', 'processing', 'shipped', 'delivered'];
      
      for (const status of statusFlow) {
        await db.collection('orders').doc(order.id).update({
          status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const orderDoc = await db.collection('orders').doc(order.id).get();
        expect(orderDoc.data().status).toBe(status);
      }
    });

    it('should track status history', async () => {
      const order = await createTestOrder();
      
      const statusHistory = [];
      
      await db.collection('orders').doc(order.id).update({
        status: 'processing',
        statusHistory: admin.firestore.FieldValue.arrayUnion({
          status: 'processing',
          timestamp: new Date(),
          updatedBy: 'admin'
        })
      });

      const orderDoc = await db.collection('orders').doc(order.id).get();
      expect(orderDoc.data().statusHistory).toBeDefined();
    });
  });

  describe('Order Queries', () => {
    beforeAll(async () => {
      await createTestOrder({ customerId: testCustomer.id, status: 'pending' });
      await createTestOrder({ customerId: testCustomer.id, status: 'completed' });
      await createTestOrder({ customerId: testCustomer.id, status: 'cancelled' });
    });

    it('should query orders by customer', async () => {
      const snapshot = await db.collection('orders')
        .where('customerId', '==', testCustomer.id)
        .get();

      expect(snapshot.size).toBeGreaterThan(0);
      snapshot.forEach(doc => {
        expect(doc.data().customerId).toBe(testCustomer.id);
      });
    });

    it('should query orders by status', async () => {
      const snapshot = await db.collection('orders')
        .where('status', '==', 'pending')
        .get();

      expect(snapshot.size).toBeGreaterThan(0);
      snapshot.forEach(doc => {
        expect(doc.data().status).toBe('pending');
      });
    });

    it('should calculate total revenue', async () => {
      const snapshot = await db.collection('orders')
        .where('status', '==', 'completed')
        .get();

      let totalRevenue = 0;
      snapshot.forEach(doc => {
        totalRevenue += doc.data().totalAmount;
      });

      expect(totalRevenue).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Order Payment', () => {
    it('should update payment status', async () => {
      const order = await createTestOrder();
      
      await db.collection('orders').doc(order.id).update({
        paymentStatus: 'paid',
        paidAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const orderDoc = await db.collection('orders').doc(order.id).get();
      expect(orderDoc.data().paymentStatus).toBe('paid');
      expect(orderDoc.data().paidAt).toBeDefined();
    });

    it('should handle refunds', async () => {
      const order = await createTestOrder();
      
      await db.collection('orders').doc(order.id).update({
        status: 'refunded',
        refundAmount: order.totalAmount,
        refundedAt: admin.firestore.FieldValue.serverTimestamp(),
        refundReason: 'Customer request'
      });

      const orderDoc = await db.collection('orders').doc(order.id).get();
      expect(orderDoc.data().status).toBe('refunded');
      expect(orderDoc.data().refundAmount).toBe(order.totalAmount);
    });
  });

  describe('Order Shipping', () => {
    it('should add tracking information', async () => {
      const order = await createTestOrder();
      
      await db.collection('orders').doc(order.id).update({
        trackingNumber: 'TRACK123456',
        carrier: 'UPS',
        shippedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const orderDoc = await db.collection('orders').doc(order.id).get();
      expect(orderDoc.data().trackingNumber).toBe('TRACK123456');
      expect(orderDoc.data().carrier).toBe('UPS');
    });
  });
});
