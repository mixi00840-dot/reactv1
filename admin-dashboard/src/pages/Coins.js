import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
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
  TextField,
  IconButton
} from '@mui/material';
import {
  MonetizationOn as CoinIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const Coins = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [packageDialog, setPackageDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [stats, setStats] = useState({
    totalPackages: 0,
    totalRevenue: 0,
    totalPurchases: 0,
    popularPackage: ''
  });

  const [packageForm, setPackageForm] = useState({
    name: '',
    coinAmount: '',
    price: '',
    bonusCoins: '',
    description: '',
    popular: false
  });

  useEffect(() => {
    fetchPackages();
    fetchStats();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/coin-packages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPackages(response.data.packages || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/coin-packages/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSavePackage = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (selectedPackage) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/admin/coin-packages/${selectedPackage._id}`,
          packageForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Package updated successfully');
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/coin-packages`,
          packageForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Package created successfully');
      }

      setPackageDialog(false);
      setSelectedPackage(null);
      setPackageForm({
        name: '',
        coinAmount: '',
        price: '',
        bonusCoins: '',
        description: '',
        popular: false
      });
      fetchPackages();
      fetchStats();
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Failed to save package');
    }
  };

  const handleDeletePackage = async (packageId) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/admin/coin-packages/${packageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Package deleted successfully');
      fetchPackages();
      fetchStats();
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Failed to delete package');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Coins Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedPackage(null);
            setPackageForm({
              name: '',
              coinAmount: '',
              price: '',
              bonusCoins: '',
              description: '',
              popular: false
            });
            setPackageDialog(true);
          }}
        >
          Create Package
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Packages</Typography>
              <Typography variant="h4">{stats.totalPackages || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Revenue</Typography>
              <Typography variant="h4" color="success.main">
                ${(stats.totalRevenue || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Purchases</Typography>
              <Typography variant="h4" color="primary.main">{stats.totalPurchases || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Most Popular</Typography>
              <Typography variant="h6">{stats.popularPackage || 'N/A'}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Packages Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Package Name</TableCell>
                <TableCell>Coin Amount</TableCell>
                <TableCell>Bonus Coins</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Value/Coin</TableCell>
                <TableCell>Purchases</TableCell>
                <TableCell>Revenue</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CoinIcon color="primary" />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">{pkg.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {pkg.description}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold" color="primary.main">
                      🪙 {pkg.coinAmount?.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {pkg.bonusCoins > 0 ? (
                      <Chip
                        size="small"
                        label={`+${pkg.bonusCoins} Bonus`}
                        color="success"
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold">
                      ${pkg.price?.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    ${(pkg.price / (pkg.coinAmount + (pkg.bonusCoins || 0))).toFixed(4)}
                  </TableCell>
                  <TableCell>{pkg.purchases || 0}</TableCell>
                  <TableCell>
                    ${((pkg.purchases || 0) * pkg.price).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {pkg.popular && (
                      <Chip size="small" label="Popular" color="secondary" />
                    )}
                    {pkg.isActive !== false ? (
                      <Chip size="small" label="Active" color="success" />
                    ) : (
                      <Chip size="small" label="Inactive" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setPackageForm({
                            name: pkg.name,
                            coinAmount: pkg.coinAmount,
                            price: pkg.price,
                            bonusCoins: pkg.bonusCoins || 0,
                            description: pkg.description || '',
                            popular: pkg.popular || false
                          });
                          setPackageDialog(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeletePackage(pkg._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Package Dialog */}
      <Dialog open={packageDialog} onClose={() => setPackageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedPackage ? 'Edit Package' : 'Create Package'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Package Name"
                value={packageForm.name}
                onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                placeholder="e.g., Starter Pack, Mega Pack"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={packageForm.description}
                onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Coin Amount"
                value={packageForm.coinAmount}
                onChange={(e) => setPackageForm({ ...packageForm, coinAmount: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Bonus Coins"
                value={packageForm.bonusCoins}
                onChange={(e) => setPackageForm({ ...packageForm, bonusCoins: e.target.value })}
                helperText="Extra coins for this package"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Price (USD)"
                value={packageForm.price}
                onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                InputProps={{
                  startAdornment: '$'
                }}
              />
            </Grid>
            {packageForm.coinAmount && packageForm.price && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
                  <Typography variant="body2">
                    <strong>Value per Coin:</strong> $
                    {(packageForm.price / (parseInt(packageForm.coinAmount) + parseInt(packageForm.bonusCoins || 0))).toFixed(4)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total Coins:</strong> {parseInt(packageForm.coinAmount) + parseInt(packageForm.bonusCoins || 0)}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPackageDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePackage}>
            {selectedPackage ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Coins;
