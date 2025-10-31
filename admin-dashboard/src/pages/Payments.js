import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  CircularProgress,
  Pagination,
  TextField,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    totalTransactions: 0,
    successRate: 0,
  });

  useEffect(() => {
    fetchPayments();
    fetchPaymentStats();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await axios.get(`/api/payments?${params}`);
      
      if (response.data.success) {
        const paymentsData = response.data.data?.payments || response.data.data?.transactions || response.data.data;
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
        setTotalPages(response.data.data?.pagination?.totalPages || response.data.pagination?.totalPages || 0);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]); // Ensure it's always an array
      // toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const response = await axios.get('/api/payments/analytics');
      if (response.data.success) {
        setStats(response.data.data || {});
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      setStats({}); // Ensure it's always an object
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      completed: { label: 'Completed', color: 'success' },
      pending: { label: 'Pending', color: 'warning' },
      failed: { label: 'Failed', color: 'error' },
      refunded: { label: 'Refunded', color: 'info' },
      cancelled: { label: 'Cancelled', color: 'default' },
    };
    
    const config = statusConfig[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight="bold" mb={3}>
        Payments & Transactions
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Revenue
                  </Typography>
                  <Typography variant="h5" component="div" color="primary">
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                </Box>
                <AccountBalanceIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Today's Revenue
                  </Typography>
                  <Typography variant="h5" component="div" color="success.main">
                    {formatCurrency(stats.todayRevenue)}
                  </Typography>
                </Box>
                <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Transactions
                  </Typography>
                  <Typography variant="h5" component="div">
                    {(stats.totalTransactions || 0).toLocaleString()}
                  </Typography>
                </Box>
                <CreditCardIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Success Rate
                  </Typography>
                  <Typography variant="h5" component="div" color="primary">
                    {(stats.successRate || 0)}%
                  </Typography>
                </Box>
                <PaymentIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="refunded">Refunded</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="h6" color="text.secondary">
                      No payment data available yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Payment transactions will appear here once customers start making purchases.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {payment.transactionId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {payment.customer?.fullName || payment.customer?.username}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        #{payment.order?.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={payment.paymentMethod} variant="outlined" size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(payment.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(payment.status)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" p={2}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(e, page) => setCurrentPage(page)}
              color="primary"
            />
          </Box>
        )}
      </Card>
    </Box>
  );
}

export default Payments;