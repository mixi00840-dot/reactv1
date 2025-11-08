import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Tooltip,
  CircularProgress,
  Alert,
  Pagination,
  InputAdornment,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  LocalOffer as CouponIcon,
  Campaign as CampaignIcon,
  Percent as PercentIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
// MongoDB Migration
import mongoAPI from '../utils/apiMongoDB';
import toast from 'react-hot-toast';
const api = mongoAPI; // Alias for backward compatibility

function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('view');
  const [analytics, setAnalytics] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    totalSavings: 0,
    usageCount: 0
  });
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    discount: {
      value: 0,
      maxDiscountAmount: null
    },
    conditions: {
      minOrderAmount: null,
      maxUses: null,
      userLimit: 1
    },
    validFrom: '',
    validUntil: '',
    isActive: true
  });

  useEffect(() => {
    fetchCoupons();
    fetchAnalytics();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await api.get(`/api/coupons?${params}`);
      
      const success = response?.data?.success ?? response?.success ?? true;
      if (success) {
        const couponsData = response?.data?.data?.coupons || response?.data?.coupons || response?.coupons || response?.data || response;
        setCoupons(Array.isArray(couponsData) ? couponsData : []);
        const pagination = response?.data?.data?.pagination || response?.data?.pagination || response?.pagination || {};
        setTotalPages(pagination?.totalPages || 0);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setCoupons([]); // Ensure it's always an array
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/api/coupons/analytics');
      const success = response?.data?.success ?? response?.success ?? true;
      if (success) {
        setAnalytics(response?.data?.data || response?.data || response || {});
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics({}); // Ensure it's always an object
    }
  };

  const handleCreateCoupon = async () => {
    try {
      const response = await api.post('/api/coupons', formData);
      const success = response?.data?.success ?? response?.success ?? true;
      if (success) {
        toast.success('Coupon created successfully');
        setDialogOpen(false);
        fetchCoupons();
        fetchAnalytics();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast.error(error.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleUpdateCoupon = async () => {
    try {
      const response = await api.put(`/api/coupons/${selectedCoupon._id}`, formData);
      const success = response?.data?.success ?? response?.success ?? true;
      if (success) {
        toast.success('Coupon updated successfully');
        setDialogOpen(false);
        fetchCoupons();
        resetForm();
      }
    } catch (error) {
      console.error('Error updating coupon:', error);
      toast.error(error.response?.data?.message || 'Failed to update coupon');
    }
  };

  const handleDeleteCoupon = async () => {
    try {
  await api.delete(`/api/coupons/${selectedCoupon._id}`);
      toast.success('Coupon deleted successfully');
      setDialogOpen(false);
      fetchCoupons();
      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      discount: {
        value: 0,
        maxDiscountAmount: null
      },
      conditions: {
        minOrderAmount: null,
        maxUses: null,
        userLimit: 1
      },
      validFrom: '',
      validUntil: '',
      isActive: true
    });
  };

  const handleDialogOpen = (type, coupon = null) => {
    setDialogType(type);
    if (coupon) {
      setSelectedCoupon(coupon);
      if (type === 'edit') {
        setFormData({
          code: coupon.code || '',
          name: coupon.name || '',
          description: coupon.description || '',
          type: coupon.type || 'percentage',
          discount: {
            value: coupon.discount?.value || 0,
            maxDiscountAmount: coupon.discount?.maxDiscountAmount || null
          },
          conditions: {
            minOrderAmount: coupon.conditions?.minOrderAmount || null,
            maxUses: coupon.conditions?.maxUses || null,
            userLimit: coupon.conditions?.userLimit || 1
          },
          validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
          validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
          isActive: coupon.isActive !== false
        });
      }
    } else {
      setSelectedCoupon(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const getStatusChip = (coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    
    if (!coupon.isActive) {
      return <Chip label="Inactive" color="default" size="small" />;
    }
    if (now < validFrom) {
      return <Chip label="Scheduled" color="info" size="small" />;
    }
    if (now > validUntil) {
      return <Chip label="Expired" color="error" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
  };

  const formatDiscount = (coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.discount.value}%`;
    } else if (coupon.type === 'fixed_amount') {
      return `$${coupon.discount.value}`;
    } else if (coupon.type === 'free_shipping') {
      return 'Free Shipping';
    }
    return `${coupon.discount.value}`;
  };

  if (loading && coupons.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Coupons & Promotions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen('create')}
        >
          Create Coupon
        </Button>
      </Box>

      {/* Analytics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CouponIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Total Coupons
              </Typography>
              <Typography variant="h4" color="primary">
                {analytics.totalCoupons}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CampaignIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Active Coupons
              </Typography>
              <Typography variant="h4" color="success.main">
                {analytics.activeCoupons}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <MoneyIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Total Savings
              </Typography>
              <Typography variant="h4" color="secondary.main">
                ${analytics.totalSavings?.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <PercentIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Total Uses
              </Typography>
              <Typography variant="h4" color="warning.main">
                {analytics.usageCount}
              </Typography>
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
                placeholder="Search coupons..."
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
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Uses</TableCell>
                <TableCell>Valid Until</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon._id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {coupon.code}
                    </Typography>
                  </TableCell>
                  <TableCell>{coupon.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={coupon.type?.replace('_', ' ')} 
                      variant="outlined" 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{formatDiscount(coupon)}</TableCell>
                  <TableCell>
                    {coupon.usage?.count || 0}
                    {coupon.conditions?.maxUses && ` / ${coupon.conditions.maxUses}`}
                  </TableCell>
                  <TableCell>
                    {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : 'No expiry'}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(coupon)}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleDialogOpen('view', coupon)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Coupon">
                        <IconButton
                          size="small"
                          onClick={() => handleDialogOpen('edit', coupon)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Coupon">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDialogOpen('delete', coupon)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {coupons.length === 0 && !loading && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              No coupons found
            </Typography>
          </Box>
        )}

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

      {/* Coupon Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'view' && 'Coupon Details'}
          {dialogType === 'edit' && 'Edit Coupon'}
          {dialogType === 'create' && 'Create New Coupon'}
          {dialogType === 'delete' && 'Delete Coupon'}
        </DialogTitle>
        <DialogContent>
          {(dialogType === 'create' || dialogType === 'edit') && (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Coupon Code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Coupon Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Discount Type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <MenuItem value="percentage">Percentage</MenuItem>
                    <MenuItem value="fixed_amount">Fixed Amount</MenuItem>
                    <MenuItem value="free_shipping">Free Shipping</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label={formData.type === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
                    value={formData.discount.value}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      discount: { ...formData.discount, value: parseFloat(e.target.value) || 0 }
                    })}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">
                        {formData.type === 'percentage' ? '%' : '$'}
                      </InputAdornment>,
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Minimum Order Amount"
                    value={formData.conditions.minOrderAmount || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      conditions: { ...formData.conditions, minOrderAmount: parseFloat(e.target.value) || null }
                    })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Maximum Uses"
                    value={formData.conditions.maxUses || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      conditions: { ...formData.conditions, maxUses: parseInt(e.target.value) || null }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Valid From"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Valid Until"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                    }
                    label="Active"
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {selectedCoupon && dialogType === 'view' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedCoupon.name} ({selectedCoupon.code})
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedCoupon.description}
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  {getStatusChip(selectedCoupon)}
                  <Chip label={selectedCoupon.type?.replace('_', ' ')} variant="outlined" />
                  <Chip label={formatDiscount(selectedCoupon)} color="primary" />
                </Box>
              </Grid>
            </Grid>
          )}

          {dialogType === 'delete' && selectedCoupon && (
            <Alert severity="warning">
              Are you sure you want to delete coupon "{selectedCoupon.code}"? This action cannot be undone.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          {dialogType === 'create' && (
            <Button
              variant="contained"
              onClick={handleCreateCoupon}
              disabled={!formData.code || !formData.name}
            >
              Create Coupon
            </Button>
          )}
          {dialogType === 'edit' && (
            <Button
              variant="contained"
              onClick={handleUpdateCoupon}
              disabled={!formData.code || !formData.name}
            >
              Update Coupon
            </Button>
          )}
          {dialogType === 'delete' && (
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteCoupon}
            >
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Coupons;
