import React, { useState, useEffect } from 'react';
import api from '../utils/apiFirebase';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  AccountBalanceWallet as WalletIcon,
  CardGiftcard as GiftIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Monetization = () => {
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    giftRevenue: 0,
    subscriptionRevenue: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchTransactions();
    fetchRevenueChart();
  }, [selectedTab]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(
        `/api/monetization/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response?.data || response || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(
        `/api/monetization/transactions?limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response?.data?.transactions || response?.transactions || response?.data || response;
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueChart = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(
        `/api/monetization/revenue-chart?days=30`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const chart = response?.data?.data || response?.data || response;
      setRevenueChart(Array.isArray(chart) ? chart : []);
    } catch (error) {
      console.error('Error fetching revenue chart:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Monetization Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>Total Revenue</Typography>
                  <Typography variant="h5">{formatCurrency(stats.totalRevenue)}</Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>Today's Revenue</Typography>
                  <Typography variant="h5">{formatCurrency(stats.todayRevenue)}</Typography>
                </Box>
                <TrendingIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>Gift Revenue</Typography>
                  <Typography variant="h5">{formatCurrency(stats.giftRevenue)}</Typography>
                </Box>
                <GiftIcon sx={{ fontSize: 48, color: 'secondary.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>Subscription Revenue</Typography>
                  <Typography variant="h5">{formatCurrency(stats.subscriptionRevenue)}</Typography>
                </Box>
                <WalletIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Revenue Chart */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Revenue Trend (Last 30 Days)</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueChart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#2196f3" name="Revenue" />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
          <Tab label="All Transactions" />
          <Tab label="Gifts" />
          <Tab label="Subscriptions" />
        </Tabs>
      </Paper>

      {/* Transactions Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Transaction ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx._id} hover>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {tx._id.substring(0, 12)}...
                    </Typography>
                  </TableCell>
                  <TableCell>{tx.user?.username || 'Unknown'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={tx.type} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="success.main">
                      {formatCurrency(tx.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={tx.status}
                      color={tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(tx.createdAt).toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Monetization;

