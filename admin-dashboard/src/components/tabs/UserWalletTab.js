import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  TrendingUp as EarningsIcon,
  Pending as PendingIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Download as ExportIcon
} from '@mui/icons-material';
import mongoAPI from '../../utils/apiMongoDB';
import toast from 'react-hot-toast';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function UserWalletTab({ userId }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState(0);
  const [fundsDialog, setFundsDialog] = useState(false);
  const [fundsAction, setFundsAction] = useState('add'); // 'add' or 'deduct'
  const [fundsAmount, setFundsAmount] = useState('');
  const [fundsNote, setFundsNote] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, [userId]);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      // Fetch wallet balance
      const walletResponse = await mongoAPI.get(`/api/wallets/mongodb/${userId}`);
      if (walletResponse.success) {
        setWallet(walletResponse.data.wallet || walletResponse.data);
      }

      // Fetch transactions - use admin route for better access
      const transResponse = await mongoAPI.get(`/api/admin/wallets/${userId}/transactions`);
      if (transResponse.success) {
        setTransactions(transResponse.data.transactions || []);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      setWallet(null);
      setTransactions([]);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    setWallet({
      balance: 1250.75,
      totalEarnings: 5420.30,
      pendingPayments: 320.50,
      currency: 'USD'
    });

    setTransactions([
      { _id: '1', type: 'credit', amount: 45.50, description: 'Video Views Revenue', date: '2025-10-28', status: 'completed' },
      { _id: '2', type: 'debit', amount: 20.00, description: 'Withdrawal', date: '2025-10-27', status: 'completed' },
      { _id: '3', type: 'credit', amount: 67.25, description: 'Brand Partnership', date: '2025-10-25', status: 'completed' },
      { _id: '4', type: 'credit', amount: 23.75, description: 'Live Stream Tips', date: '2025-10-22', status: 'pending' }
    ]);

    setEarnings([
      { source: 'Video Views', amount: 2345.50, percentage: 43 },
      { source: 'Live Streams', amount: 1890.25, percentage: 35 },
      { source: 'Brand Deals', amount: 984.55, percentage: 18 },
      { source: 'Other', amount: 200.00, percentage: 4 }
    ]);
  };

  const handleManageFunds = async () => {
    const amount = parseFloat(fundsAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      if (fundsAction === 'add') {
        await mongoAPI.post(`/api/wallets/mongodb/${userId}/add-funds`, {
          amount,
          description: fundsNote || 'Manual fund addition by admin'
        });
        toast.success(`$${amount.toFixed(2)} added successfully`);
      } else {
        await mongoAPI.post(`/api/wallets/mongodb/${userId}/deduct-funds`, {
          amount,
          description: fundsNote || 'Manual fund deduction by admin'
        });
        toast.success(`$${amount.toFixed(2)} deducted successfully`);
      }

      setFundsDialog(false);
      setFundsAmount('');
      setFundsNote('');
      fetchWalletData();
    } catch (error) {
      console.error('Error managing funds:', error);
      toast.error('Failed to process request');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Wallet Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Current Balance
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                    ${(wallet?.balance || 0).toFixed(2)}
                  </Typography>
                </Box>
                <WalletIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Earnings
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                    ${(wallet?.totalEarnings || 0).toFixed(2)}
                  </Typography>
                </Box>
                <EarningsIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Pending Payments
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                    ${(wallet?.pendingPayments || 0).toFixed(2)}
                  </Typography>
                </Box>
                <PendingIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Admin Actions */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => {
            setFundsAction('add');
            setFundsDialog(true);
          }}
        >
          Add Funds
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<RemoveIcon />}
          onClick={() => {
            setFundsAction('deduct');
            setFundsDialog(true);
          }}
        >
          Deduct Funds
        </Button>
        <Button
          variant="outlined"
          startIcon={<ExportIcon />}
        >
          Export Report
        </Button>
      </Box>

      {/* Sub-Tabs for detailed views */}
      <Card>
        <Tabs value={subTab} onChange={(e, newValue) => setSubTab(newValue)}>
          <Tab label="Transactions" />
          <Tab label="Earnings Breakdown" />
          <Tab label="Withdrawal History" />
        </Tabs>

        {/* Transactions Tab */}
        <TabPanel value={subTab} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>{transaction.date || new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.type?.toUpperCase()}
                        color={transaction.type === 'credit' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.status}
                        color={transaction.status === 'completed' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Earnings Breakdown Tab */}
        <TabPanel value={subTab} index={1}>
          <Grid container spacing={2}>
            {earnings.map((earning, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1">{earning.source}</Typography>
                      <Typography variant="h6" color="primary">${earning.amount.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Box display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="textSecondary">{earning.percentage}% of total</Typography>
                      </Box>
                      <Box sx={{ height: 8, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                        <Box sx={{ width: `${earning.percentage}%`, height: '100%', bgcolor: 'primary.main' }} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Withdrawal History Tab */}
        <TabPanel value={subTab} index={2}>
          <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
            No withdrawal history available
          </Typography>
        </TabPanel>
      </Card>

      {/* Funds Management Dialog */}
      <Dialog open={fundsDialog} onClose={() => setFundsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {fundsAction === 'add' ? 'Add Funds' : 'Deduct Funds'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={fundsAmount}
            onChange={(e) => setFundsAmount(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
            }}
          />
          <TextField
            fullWidth
            label="Note (optional)"
            multiline
            rows={3}
            value={fundsNote}
            onChange={(e) => setFundsNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFundsDialog(false)}>Cancel</Button>
          <Button
            onClick={handleManageFunds}
            variant="contained"
            color={fundsAction === 'add' ? 'success' : 'error'}
          >
            {fundsAction === 'add' ? 'Add' : 'Deduct'} Funds
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserWalletTab;

