import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Search as SearchIcon
} from '@mui/icons-material';

const Wallets = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [stats, setStats] = useState({
    totalWallets: 0,
    totalBalance: 0,
    totalDeposits: 0,
    totalWithdrawals: 0
  });

  useEffect(() => {
    fetchWallets();
    fetchStats();
  }, []);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/wallets?limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWallets(response.data.wallets || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/wallets/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAdjustBalance = async (type) => {
    if (!adjustAmount || parseFloat(adjustAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/wallets/${selectedWallet.user}/adjust`,
        {
          amount: parseFloat(adjustAmount),
          type: type,
          reason: adjustReason || `Admin ${type} adjustment`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchWallets();
      fetchStats();
      setAdjustOpen(false);
      setAdjustAmount('');
      setAdjustReason('');
      setSelectedWallet(null);
      alert(`Balance ${type === 'credit' ? 'added' : 'deducted'} successfully`);
    } catch (error) {
      console.error('Error adjusting balance:', error);
      alert('Failed to adjust balance');
    }
  };

  const filteredWallets = wallets.filter(wallet =>
    wallet.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Wallet Management
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Wallets</Typography>
              <Typography variant="h4">{stats.totalWallets || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Balance</Typography>
              <Typography variant="h4" color="primary.main">{formatCurrency(stats.totalBalance)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Deposits</Typography>
              <Typography variant="h4" color="success.main">{formatCurrency(stats.totalDeposits)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Withdrawals</Typography>
              <Typography variant="h4" color="error.main">{formatCurrency(stats.totalWithdrawals)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by username or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Paper>

      {/* Wallets Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Lifetime Earnings</TableCell>
                <TableCell>Lifetime Spending</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWallets.map((wallet) => (
                <TableRow key={wallet._id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{wallet.user?.username || 'Unknown'}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {wallet.user?.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold" color="primary.main">
                      {formatCurrency(wallet.balance)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="success.main">
                      {formatCurrency(wallet.lifetimeEarnings || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatCurrency(wallet.lifetimeSpending || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={wallet.status || 'active'}
                      color={wallet.status === 'active' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedWallet(wallet);
                        setAdjustOpen(true);
                      }}
                    >
                      Adjust Balance
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Adjust Balance Dialog */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust Wallet Balance</DialogTitle>
        <DialogContent>
          {selectedWallet && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>User:</strong> {selectedWallet.user?.username}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Current Balance:</strong> {formatCurrency(selectedWallet.balance)}
              </Typography>

              <TextField
                fullWidth
                type="number"
                label="Amount"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                sx={{ mt: 2 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reason (optional)"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => handleAdjustBalance('credit')}
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
          >
            Add Funds
          </Button>
          <Button 
            onClick={() => handleAdjustBalance('debit')}
            variant="contained"
            color="error"
            startIcon={<RemoveIcon />}
          >
            Deduct Funds
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Wallets;
