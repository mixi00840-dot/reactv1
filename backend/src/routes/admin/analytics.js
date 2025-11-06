const express = require('express');
const router = express.Router();
const db = require('../../utils/database');
const admin = require('firebase-admin');

// Helper function to parse date range
const parseDateRange = (startDate, endDate) => {
  const start = startDate ? admin.firestore.Timestamp.fromDate(new Date(startDate)) : null;
  const end = endDate ? admin.firestore.Timestamp.fromDate(new Date(endDate)) : null;
  return { start, end };
};

// GET /api/admin/analytics/dashboard - Dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    // Get total users
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;

    // Get total orders
    const ordersSnapshot = await db.collection('orders').get();
    const totalOrders = ordersSnapshot.size;

    // Calculate total revenue
    let totalRevenue = 0;
    let completedOrders = 0;
    ordersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'completed' || data.status === 'delivered') {
        totalRevenue += data.totalAmount || 0;
        completedOrders++;
      }
    });

    // Calculate average order value
    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    // Get total products
    const productsSnapshot = await db.collection('products').get();
    const totalProducts = productsSnapshot.size;

    // Get active sellers
    const sellersSnapshot = await db.collection('users').where('role', '==', 'seller').get();
    const activeSellers = sellersSnapshot.size;

    // Calculate conversion rate (simple: orders / users)
    const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0;

    res.json({
      totalUsers,
      totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      totalProducts,
      activeSellers,
      completedOrders
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// GET /api/admin/analytics/users - User analytics
router.get('/users', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = parseDateRange(startDate, endDate);

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;

    // Count new users in date range
    let newUsers = 0;
    let activeUsers = 0;
    const chartData = {};

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      
      if (start && end && data.createdAt) {
        if (data.createdAt >= start && data.createdAt <= end) {
          newUsers++;
        }
      }

      // Count active users (those with recent activity)
      if (data.lastLoginAt) {
        const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        );
        if (data.lastLoginAt >= thirtyDaysAgo) {
          activeUsers++;
        }
      }

      // Build chart data
      if (data.createdAt) {
        const date = data.createdAt.toDate().toISOString().split('T')[0];
        chartData[date] = (chartData[date] || 0) + 1;
      }
    });

    // Convert chart data to array
    const chartDataArray = Object.entries(chartData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, users: count }));

    // Calculate growth rate
    const lastMonth = totalUsers - newUsers;
    const growth = lastMonth > 0 ? ((newUsers / lastMonth) * 100) : 0;

    // Calculate retention (simple: active / total)
    const retention = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    res.json({
      totalUsers,
      newUsers,
      activeUsers,
      growth: parseFloat(growth.toFixed(2)),
      retention: parseFloat(retention.toFixed(2)),
      chartData: chartDataArray.slice(-30) // Last 30 days
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

// GET /api/admin/analytics/revenue - Revenue analytics
router.get('/revenue', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = parseDateRange(startDate, endDate);

    const ordersSnapshot = await db.collection('orders').get();

    let daily = 0;
    let weekly = 0;
    let monthly = 0;
    const chartData = {};

    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    ordersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'completed' || data.status === 'delivered') {
        const amount = data.totalAmount || 0;
        const orderDate = data.createdAt?.toDate();

        if (orderDate) {
          // Daily
          if (orderDate >= oneDayAgo) daily += amount;
          // Weekly
          if (orderDate >= oneWeekAgo) weekly += amount;
          // Monthly
          if (orderDate >= oneMonthAgo) monthly += amount;

          // Chart data
          const date = orderDate.toISOString().split('T')[0];
          if (!chartData[date]) {
            chartData[date] = { revenue: 0, orders: 0 };
          }
          chartData[date].revenue += amount;
          chartData[date].orders += 1;
        }
      }
    });

    // Convert chart data to array
    const chartDataArray = Object.entries(chartData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({ date, ...data }));

    res.json({
      daily: parseFloat(daily.toFixed(2)),
      weekly: parseFloat(weekly.toFixed(2)),
      monthly: parseFloat(monthly.toFixed(2)),
      chartData: chartDataArray.slice(-30) // Last 30 days
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// GET /api/admin/analytics/products - Product analytics
router.get('/products', async (req, res) => {
  try {
    const ordersSnapshot = await db.collection('orders').get();

    const productSales = {};
    const categorySales = {};

    for (const doc of ordersSnapshot.docs) {
      const orderData = doc.data();
      if (orderData.items && Array.isArray(orderData.items)) {
        for (const item of orderData.items) {
          if (item.productId) {
            if (!productSales[item.productId]) {
              productSales[item.productId] = {
                productId: item.productId,
                name: item.name || 'Unknown',
                sales: 0,
                revenue: 0
              };
            }
            productSales[item.productId].sales += item.quantity || 1;
            productSales[item.productId].revenue += (item.price || 0) * (item.quantity || 1);
          }

          // Category analytics
          if (item.category) {
            if (!categorySales[item.category]) {
              categorySales[item.category] = {
                name: item.category,
                products: 0,
                revenue: 0
              };
            }
            categorySales[item.category].revenue += (item.price || 0) * (item.quantity || 1);
          }
        }
      }
    }

    // Get top products
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Get categories
    const categories = Object.values(categorySales).slice(0, 10);

    res.json({
      topProducts,
      categories
    });
  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch product analytics' });
  }
});

// GET /api/admin/analytics/orders - Order analytics
router.get('/orders', async (req, res) => {
  try {
    const ordersSnapshot = await db.collection('orders').get();

    let pending = 0;
    let processing = 0;
    let completed = 0;
    let cancelled = 0;
    const trends = {};

    ordersSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Status counts
      if (data.status === 'pending') pending++;
      else if (data.status === 'processing' || data.status === 'shipped') processing++;
      else if (data.status === 'completed' || data.status === 'delivered') completed++;
      else if (data.status === 'cancelled') cancelled++;

      // Trends
      if (data.createdAt) {
        const date = data.createdAt.toDate().toISOString().split('T')[0];
        if (!trends[date]) {
          trends[date] = { count: 0, value: 0 };
        }
        trends[date].count += 1;
        trends[date].value += data.totalAmount || 0;
      }
    });

    // Convert trends to array
    const trendsArray = Object.entries(trends)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({ date, ...data }));

    res.json({
      pending,
      processing,
      completed,
      cancelled,
      trends: trendsArray.slice(-30)
    });
  } catch (error) {
    console.error('Get order analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch order analytics' });
  }
});

// GET /api/admin/analytics/sellers - Seller analytics
router.get('/sellers', async (req, res) => {
  try {
    const sellersSnapshot = await db.collection('users')
      .where('role', '==', 'seller')
      .get();

    const sellerStats = [];
    let totalCommission = 0;
    let totalRating = 0;
    let ratedSellers = 0;

    for (const doc of sellersSnapshot.docs) {
      const sellerData = doc.data();
      const sellerId = doc.id;

      // Get seller's products
      const productsSnapshot = await db.collection('products')
        .where('sellerId', '==', sellerId)
        .get();

      // Calculate sales
      const ordersSnapshot = await db.collection('orders')
        .where('sellerId', '==', sellerId)
        .get();

      let revenue = 0;
      let sales = 0;

      ordersSnapshot.forEach(orderDoc => {
        const orderData = orderDoc.data();
        if (orderData.status === 'completed' || orderData.status === 'delivered') {
          revenue += orderData.totalAmount || 0;
          sales += 1;
        }
      });

      const rating = sellerData.rating || 0;
      if (rating > 0) {
        totalRating += rating;
        ratedSellers++;
      }

      // Commission (10% of revenue)
      const commission = revenue * 0.1;
      totalCommission += commission;

      sellerStats.push({
        id: sellerId,
        name: sellerData.name || sellerData.displayName,
        sales,
        revenue: parseFloat(revenue.toFixed(2)),
        rating,
        products: productsSnapshot.size
      });
    }

    // Sort by revenue
    const topSellers = sellerStats
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const averageRating = ratedSellers > 0 ? totalRating / ratedSellers : 0;

    res.json({
      topSellers,
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalCommission: parseFloat(totalCommission.toFixed(2))
    });
  } catch (error) {
    console.error('Get seller analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch seller analytics' });
  }
});

// GET /api/admin/analytics/engagement - Engagement metrics
router.get('/engagement', async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();

    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    let dau = 0; // Daily active users
    let mau = 0; // Monthly active users
    let totalSessionTime = 0;
    let sessionCount = 0;

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      
      if (data.lastLoginAt) {
        const lastLogin = data.lastLoginAt.toDate();
        
        if (lastLogin >= oneDayAgo) {
          dau++;
        }
        if (lastLogin >= oneMonthAgo) {
          mau++;
        }
      }

      // Session time (if tracked)
      if (data.averageSessionTime) {
        totalSessionTime += data.averageSessionTime;
        sessionCount++;
      }
    });

    const averageSessionTime = sessionCount > 0 ? totalSessionTime / sessionCount : 8.5;

    // Get page views (from stories, products, etc.)
    const storiesSnapshot = await db.collection('stories').get();
    const productsSnapshot = await db.collection('products').get();

    let pageViews = 0;
    storiesSnapshot.forEach(doc => {
      pageViews += doc.data().viewsCount || 0;
    });
    productsSnapshot.forEach(doc => {
      pageViews += doc.data().viewsCount || 0;
    });

    // Bounce rate (simplified: users with no orders / total users)
    const ordersSnapshot = await db.collection('orders').get();
    const usersWithOrders = new Set();
    ordersSnapshot.forEach(doc => {
      usersWithOrders.add(doc.data().userId);
    });
    const bounceRate = usersSnapshot.size > 0 
      ? ((usersSnapshot.size - usersWithOrders.size) / usersSnapshot.size) * 100 
      : 0;

    res.json({
      dau,
      mau,
      averageSessionTime: parseFloat(averageSessionTime.toFixed(1)),
      pageViews,
      bounceRate: parseFloat(bounceRate.toFixed(2))
    });
  } catch (error) {
    console.error('Get engagement analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch engagement analytics' });
  }
});

// GET /api/admin/analytics/export - Export analytics data
router.get('/export', async (req, res) => {
  try {
    const { format = 'json', type = 'dashboard' } = req.query;

    let data = {};

    // Get the requested data type
    switch (type) {
      case 'users':
        const usersSnapshot = await db.collection('users').get();
        data = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        break;
      case 'orders':
        const ordersSnapshot = await db.collection('orders').get();
        data = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        break;
      case 'products':
        const productsSnapshot = await db.collection('products').get();
        data = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        break;
      default:
        // Dashboard data
        data = {
          exportDate: new Date().toISOString(),
          type: 'dashboard',
          message: 'Dashboard analytics exported'
        };
    }

    if (format === 'csv') {
      // Simple CSV conversion
      let csv = '';
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        csv = headers.join(',') + '\n';
        data.forEach(row => {
          csv += headers.map(h => row[h] || '').join(',') + '\n';
        });
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-export.csv"`);
      res.send(csv);
    } else {
      res.json(data);
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ error: 'Failed to export analytics' });
  }
});

module.exports = router;
