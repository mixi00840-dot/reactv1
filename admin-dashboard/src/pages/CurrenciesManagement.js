import React, { useState, useEffect } from 'react';
// MongoDB Migration
import mongoAPI from '../utils/apiMongoDB';
import toast from 'react-hot-toast';
const api = mongoAPI; // Alias for backward compatibility
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  AttachMoney as CurrencyIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const CurrenciesManagement = () => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currencyDialog, setCurrencyDialog] = useState({ 
    open: false, 
    currency: null, 
    mode: 'create' 
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    page: 1,
    limit: 20
  });

  // Popular currencies with their symbols and flags
  const popularCurrencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', country: 'United States' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', country: 'European Union' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', country: 'United Kingdom' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', country: 'Japan' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', flag: '🇸🇦', country: 'Saudi Arabia' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', country: 'United Arab Emirates' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', country: 'Canada' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', country: 'Australia' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', country: 'Switzerland' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', country: 'China' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', country: 'India' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', country: 'South Korea' }
  ];

  useEffect(() => {
    fetchCurrencies();
  }, [filters]);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/admin/currencies', {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      const list = response?.data?.data?.currencies || response?.data?.currencies || response?.currencies || response?.data || response;
      setCurrencies(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error fetching currencies:', error);
      // Generate dummy data since backend API doesn't exist yet
      const dummyCurrencies = [
        {
          _id: 'curr_1',
          code: 'USD',
          name: 'US Dollar',
          symbol: '$',
          flag: '🇺🇸',
          country: 'United States',
          exchangeRate: 1.0,
          isDefault: true,
          isActive: true,
          isSupported: true,
          decimals: 2,
          position: 'before', // before or after amount
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        },
        {
          _id: 'curr_2',
          code: 'SAR',
          name: 'Saudi Riyal',
          symbol: 'ر.س',
          flag: '🇸🇦',
          country: 'Saudi Arabia',
          exchangeRate: 3.75,
          isDefault: false,
          isActive: true,
          isSupported: true,
          decimals: 2,
          position: 'after',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        },
        {
          _id: 'curr_3',
          code: 'EUR',
          name: 'Euro',
          symbol: '€',
          flag: '🇪🇺',
          country: 'European Union',
          exchangeRate: 0.85,
          isDefault: false,
          isActive: true,
          isSupported: true,
          decimals: 2,
          position: 'before',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        },
        {
          _id: 'curr_4',
          code: 'AED',
          name: 'UAE Dirham',
          symbol: 'د.إ',
          flag: '🇦🇪',
          country: 'United Arab Emirates',
          exchangeRate: 3.67,
          isDefault: false,
          isActive: true,
          isSupported: true,
          decimals: 2,
          position: 'after',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        },
        {
          _id: 'curr_5',
          code: 'GBP',
          name: 'British Pound',
          symbol: '£',
          flag: '🇬🇧',
          country: 'United Kingdom',
          exchangeRate: 0.73,
          isDefault: false,
          isActive: false,
          isSupported: true,
          decimals: 2,
          position: 'before',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        }
      ];
      setCurrencies(dummyCurrencies);
    }
    setLoading(false);
  };

  const handleCreateCurrency = () => {
    setCurrencyDialog({
      open: true,
      currency: {
        code: '',
        name: '',
        symbol: '',
        flag: '',
        country: '',
        exchangeRate: 1.0,
        isDefault: false,
        isActive: true,
        isSupported: true,
        decimals: 2,
        position: 'before'
      },
      mode: 'create'
    });
  };

  const handleEditCurrency = (currency) => {
    setCurrencyDialog({
      open: true,
      currency: { ...currency },
      mode: 'edit'
    });
  };

  const handleSaveCurrency = async () => {
    try {
      const token = localStorage.getItem('token');
      const { currency, mode } = currencyDialog;
      
      if (mode === 'create') {
        await api.post('/api/admin/currencies', currency, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await api.put(`/api/admin/currencies/${currency._id}`, currency, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setSnackbar({
        open: true,
        message: `Currency ${mode}d successfully`,
        severity: 'success'
      });
      
      setCurrencyDialog({ open: false, currency: null, mode: 'create' });
      fetchCurrencies();
    } catch (error) {
      console.error('Error saving currency:', error);
      setSnackbar({
        open: true,
        message: 'Error saving currency',
        severity: 'error'
      });
    }
  };

  const handleDeleteCurrency = async (currencyId) => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/admin/currencies/${currencyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSnackbar({
        open: true,
        message: 'Currency deleted successfully',
        severity: 'success'
      });
      
      fetchCurrencies();
    } catch (error) {
      console.error('Error deleting currency:', error);
      setSnackbar({
        open: true,
        message: 'Error deleting currency',
        severity: 'error'
      });
    }
  };

  const handleToggleStatus = async (currencyId, field, value) => {
    try {
      const token = localStorage.getItem('token');
      await api.patch(`/api/admin/currencies/${currencyId}`, {
        [field]: value
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCurrencies(prev => prev.map(curr => 
        curr._id === currencyId ? { ...curr, [field]: value } : curr
      ));
      
      setSnackbar({
        open: true,
        message: `Currency ${field} updated`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating currency:', error);
      setSnackbar({
        open: true,
        message: 'Error updating currency',
        severity: 'error'
      });
    }
  };

  const handleSetDefault = async (currencyId) => {
    try {
      const token = localStorage.getItem('token');
      await api.patch(`/api/admin/currencies/${currencyId}/set-default`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCurrencies(prev => prev.map(curr => ({
        ...curr,
        isDefault: curr._id === currencyId
      })));
      
      setSnackbar({
        open: true,
        message: 'Default currency updated',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error setting default currency:', error);
      setSnackbar({
        open: true,
        message: 'Error setting default currency',
        severity: 'error'
      });
    }
  };

  const handleUpdateExchangeRates = async () => {
    try {
      const token = localStorage.getItem('token');
      await api.post('/api/admin/currencies/update-rates', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSnackbar({
        open: true,
        message: 'Exchange rates updated successfully',
        severity: 'success'
      });
      
      fetchCurrencies();
    } catch (error) {
      console.error('Error updating exchange rates:', error);
      setSnackbar({
        open: true,
        message: 'Error updating exchange rates',
        severity: 'error'
      });
    }
  };

  const formatAmount = (amount, currency) => {
    const formatted = amount.toFixed(currency.decimals);
    return currency.position === 'before' 
      ? `${currency.symbol}${formatted}`
      : `${formatted} ${currency.symbol}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CurrencyIcon /> Currencies Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleUpdateExchangeRates}
            >
              Update Rates
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateCurrency}
            >
              Add Currency
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {currencies.length}
                </Typography>
                <Typography variant="body2">Total Currencies</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {currencies.filter(c => c.isActive).length}
                </Typography>
                <Typography variant="body2">Active</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {currencies.filter(c => c.isSupported).length}
                </Typography>
                <Typography variant="body2">Supported</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {currencies.find(c => c.isDefault)?.code || 'None'}
                </Typography>
                <Typography variant="body2">Default Currency</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search currencies..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="supported">Supported</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                label="Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="fiat">Fiat</MenuItem>
                <MenuItem value="crypto">Cryptocurrency</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={fetchCurrencies}
              sx={{ height: '40px' }}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Currency</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Exchange Rate</TableCell>
                <TableCell>Sample Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Default</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : currencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    No currencies found
                  </TableCell>
                </TableRow>
              ) : (
                currencies.map((currency) => (
                  <TableRow key={currency._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'transparent', fontSize: '1.5rem' }}>
                          {currency.flag}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {currency.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {currency.country}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" fontFamily="monospace">
                        {currency.code}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {currency.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        1 USD = {currency.exchangeRate.toFixed(4)} {currency.code}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <TrendingIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        <Typography variant="caption" color="text.secondary">
                          Updated: {formatDate(currency.updatedAt)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatAmount(100, currency)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        (100 USD equivalent)
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={currency.isActive}
                              onChange={(e) => handleToggleStatus(currency._id, 'isActive', e.target.checked)}
                            />
                          }
                          label="Active"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={currency.isSupported}
                              onChange={(e) => handleToggleStatus(currency._id, 'isSupported', e.target.checked)}
                            />
                          }
                          label="Supported"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {currency.isDefault ? (
                        <Chip 
                          icon={<StarIcon />}
                          label="Default"
                          color="primary"
                          size="small"
                        />
                      ) : (
                        <Button
                          size="small"
                          onClick={() => handleSetDefault(currency._id)}
                          disabled={!currency.isActive}
                        >
                          Set Default
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(currency.updatedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditCurrency(currency)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteCurrency(currency._id)}
                          disabled={currency.isDefault}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination
            count={Math.ceil(currencies.length / filters.limit)}
            page={filters.page}
            onChange={(e, page) => setFilters({ ...filters, page })}
            color="primary"
          />
        </Box>
      </Paper>

      {/* Currency Edit/Create Dialog */}
      <Dialog 
        open={currencyDialog.open} 
        onClose={() => setCurrencyDialog({ open: false, currency: null, mode: 'create' })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currencyDialog.mode === 'create' ? 'Add New Currency' : 'Edit Currency'}
        </DialogTitle>
        <DialogContent>
          {currencyDialog.currency && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Select Currency</InputLabel>
                    <Select
                      value={currencyDialog.currency.code}
                      onChange={(e) => {
                        const selected = popularCurrencies.find(c => c.code === e.target.value);
                        if (selected) {
                          setCurrencyDialog({
                            ...currencyDialog,
                            currency: {
                              ...currencyDialog.currency,
                              ...selected,
                              exchangeRate: currencyDialog.currency.exchangeRate || 1.0
                            }
                          });
                        }
                      }}
                      label="Select Currency"
                      disabled={currencyDialog.mode === 'edit'}
                    >
                      {popularCurrencies.map((curr) => (
                        <MenuItem key={curr.code} value={curr.code}>
                          {curr.flag} {curr.code} - {curr.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Currency Code"
                    value={currencyDialog.currency.code}
                    onChange={(e) => setCurrencyDialog({
                      ...currencyDialog,
                      currency: { ...currencyDialog.currency, code: e.target.value.toUpperCase() }
                    })}
                    disabled={currencyDialog.mode === 'edit'}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Currency Name"
                    value={currencyDialog.currency.name}
                    onChange={(e) => setCurrencyDialog({
                      ...currencyDialog,
                      currency: { ...currencyDialog.currency, name: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Symbol"
                    value={currencyDialog.currency.symbol}
                    onChange={(e) => setCurrencyDialog({
                      ...currencyDialog,
                      currency: { ...currencyDialog.currency, symbol: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Flag Emoji"
                    value={currencyDialog.currency.flag}
                    onChange={(e) => setCurrencyDialog({
                      ...currencyDialog,
                      currency: { ...currencyDialog.currency, flag: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Exchange Rate (vs USD)"
                    type="number"
                    step="0.0001"
                    value={currencyDialog.currency.exchangeRate}
                    onChange={(e) => setCurrencyDialog({
                      ...currencyDialog,
                      currency: { ...currencyDialog.currency, exchangeRate: parseFloat(e.target.value) }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Decimal Places"
                    type="number"
                    value={currencyDialog.currency.decimals}
                    onChange={(e) => setCurrencyDialog({
                      ...currencyDialog,
                      currency: { ...currencyDialog.currency, decimals: parseInt(e.target.value) }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={currencyDialog.currency.country}
                    onChange={(e) => setCurrencyDialog({
                      ...currencyDialog,
                      currency: { ...currencyDialog.currency, country: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Symbol Position</InputLabel>
                    <Select
                      value={currencyDialog.currency.position}
                      onChange={(e) => setCurrencyDialog({
                        ...currencyDialog,
                        currency: { ...currencyDialog.currency, position: e.target.value }
                      })}
                      label="Symbol Position"
                    >
                      <MenuItem value="before">Before Amount ($100)</MenuItem>
                      <MenuItem value="after">After Amount (100 ₹)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={currencyDialog.currency.isActive}
                          onChange={(e) => setCurrencyDialog({
                            ...currencyDialog,
                            currency: { ...currencyDialog.currency, isActive: e.target.checked }
                          })}
                        />
                      }
                      label="Active"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={currencyDialog.currency.isSupported}
                          onChange={(e) => setCurrencyDialog({
                            ...currencyDialog,
                            currency: { ...currencyDialog.currency, isSupported: e.target.checked }
                          })}
                        />
                      }
                      label="Supported"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={currencyDialog.currency.isDefault}
                          onChange={(e) => setCurrencyDialog({
                            ...currencyDialog,
                            currency: { ...currencyDialog.currency, isDefault: e.target.checked }
                          })}
                        />
                      }
                      label="Set as Default"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info">
                    Preview: {formatAmount(100, currencyDialog.currency)} 
                    (100 USD = {(100 * currencyDialog.currency.exchangeRate).toFixed(currencyDialog.currency.decimals)} {currencyDialog.currency.code})
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCurrencyDialog({ open: false, currency: null, mode: 'create' })}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCurrency}
            variant="contained"
          >
            {currencyDialog.mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CurrenciesManagement;
