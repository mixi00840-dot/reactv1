import React, { useState, useEffect } from 'react';
// MongoDB Migration
import mongoAPI from '../utils/apiMongoDB';
const api = mongoAPI; // Alias for backward compatibility
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import {
  TrendingUp,
  People,
  ShoppingCart,
  AttachMoney
} from '@mui/icons-material';

function Analytics() {
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [dashboardData, setDashboardData] = useState({});
  const [userAnalytics, setUserAnalytics] = useState({});
  const [revenueAnalytics, setRevenueAnalytics] = useState({});

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (tabValue === 1) fetchUserAnalytics();
    if (tabValue === 2) fetchRevenueAnalytics();
  }, [tabValue]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/analytics/overview');
      setDashboardData(response?.data?.data || response?.data || {});
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Failed to fetch analytics dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAnalytics = async () => {
    try {
      const response = await api.get('/api/analytics/overview');
      const data = response?.data?.data || response?.data || {};
      setUserAnalytics(data.users || {});
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      toast.error('Failed to fetch user analytics');
    }
  };

  const fetchRevenueAnalytics = async () => {
    try {
      const response = await api.get('/api/analytics/overview');
      const data = response?.data?.data || response?.data || {};
      setRevenueAnalytics(data.orders || {});
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      toast.error('Failed to fetch revenue analytics');
    }
  };

  const handleExport = async (format = 'json') => {
    try {
      const data = await api.get(`/api/admin/analytics/export?format=${format}&type=dashboard`);
      if (format === 'csv') {
        // Download CSV
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'analytics-export.csv';
        a.click();
      } else {
        // Download JSON
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'analytics-export.json';
        a.click();
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Analytics Dashboard</Typography>
        <Box>
          <Button variant="outlined" onClick={() => handleExport('json')} sx={{ mr: 1 }}>
            Export JSON
          </Button>
          <Button variant="outlined" onClick={() => handleExport('csv')}>
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary">Total Users</Typography>
              </Box>
              <Typography variant="h4">{dashboardData.totalUsers || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoney color="success" sx={{ mr: 1 }} />
                <Typography color="textSecondary">Total Revenue</Typography>
              </Box>
              <Typography variant="h4">
                ${(dashboardData.totalRevenue || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShoppingCart color="info" sx={{ mr: 1 }} />
                <Typography color="textSecondary">Total Orders</Typography>
              </Box>
              <Typography variant="h4">{dashboardData.totalOrders || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp color="warning" sx={{ mr: 1 }} />
                <Typography color="textSecondary">Avg Order Value</Typography>
              </Box>
              <Typography variant="h4">
                ${(dashboardData.averageOrderValue || 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
          <Tab label="Overview" />
          <Tab label="User Analytics" />
          <Tab label="Revenue Analytics" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Quick Stats</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography>Conversion Rate: {dashboardData.conversionRate}%</Typography>
                  <Typography>Active Sellers: {dashboardData.activeSellers}</Typography>
                  <Typography>Total Products: {dashboardData.totalProducts}</Typography>
                  <Typography>Completed Orders: {dashboardData.completedOrders}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary">New Users</Typography>
                <Typography variant="h5">{userAnalytics.newUsers || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary">Active Users</Typography>
                <Typography variant="h5">{userAnalytics.activeUsers || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary">Growth Rate</Typography>
                <Typography variant="h5">{userAnalytics.growth}%</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary">Daily Revenue</Typography>
                <Typography variant="h5">${revenueAnalytics.daily || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary">Weekly Revenue</Typography>
                <Typography variant="h5">${revenueAnalytics.weekly || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary">Monthly Revenue</Typography>
                <Typography variant="h5">${revenueAnalytics.monthly || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default Analytics;
