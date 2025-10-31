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
  Avatar,
  Tooltip,
  CircularProgress,
  Alert,
  Pagination,
  InputAdornment,
  Rating,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Verified as VerifiedIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

function Stores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedStore, setSelectedStore] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('view'); // 'view', 'edit', 'delete', 'create'
  const [formData, setFormData] = useState({
    name: '',
    businessInfo: {
      businessName: '',
      description: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: ''
      }
    },
    status: 'active'
  });

  useEffect(() => {
    fetchStores();
  }, [currentPage, searchTerm, statusFilter, verificationFilter]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(verificationFilter !== 'all' && { verified: verificationFilter === 'verified' }),
      });

      const response = await axios.get(`/api/stores?${params}`);
      
      if (response.data.success) {
        setStores(response.data.data.stores);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalItems(response.data.data.pagination.totalItems);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast.error('Failed to fetch stores');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationToggle = async (storeId, currentStatus) => {
    try {
      const endpoint = currentStatus ? `/api/stores/${storeId}/unverify` : `/api/stores/${storeId}/verify`;
      await axios.patch(endpoint);
      toast.success(`Store ${currentStatus ? 'unverified' : 'verified'} successfully`);
      fetchStores();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error('Failed to update verification');
    }
  };

  const handleStatusChange = async (storeId, newStatus) => {
    try {
      await axios.patch(`/api/stores/${storeId}/status`, { status: newStatus });
      toast.success('Store status updated successfully');
      fetchStores();
    } catch (error) {
      console.error('Error updating store status:', error);
      toast.error('Failed to update store status');
    }
  };

  const handleCreateStore = async () => {
    try {
      const response = await axios.post('/api/stores', formData);
      if (response.data.success) {
        toast.success('Store created successfully');
        setDialogOpen(false);
        fetchStores();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating store:', error);
      toast.error(error.response?.data?.message || 'Failed to create store');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      businessInfo: {
        businessName: '',
        description: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        }
      },
      status: 'active'
    });
  };

  const handleDialogOpen = (type, store = null) => {
    setDialogType(type);
    if (store) {
      setSelectedStore(store);
      if (type === 'edit') {
        setFormData({
          name: store.storeName || '',
          businessInfo: {
            businessName: store.businessInfo?.businessName || '',
            description: store.description || '',
            email: store.contactInfo?.email || '',
            phone: store.contactInfo?.phone || '',
            address: {
              street: store.address?.street || '',
              city: store.address?.city || '',
              state: store.address?.state || '',
              country: store.address?.country || '',
              zipCode: store.address?.zipCode || ''
            }
          },
          status: store.status || 'active'
        });
      }
    } else {
      setSelectedStore(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      active: { label: 'Active', color: 'success' },
      inactive: { label: 'Inactive', color: 'default' },
      suspended: { label: 'Suspended', color: 'warning' },
      banned: { label: 'Banned', color: 'error' },
    };
    
    const config = statusConfig[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading && stores.length === 0) {
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
          Stores Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen('create')}
        >
          Add Store
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search stores..."
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
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="banned">Banned</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Verification"
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
              >
                <MenuItem value="all">All Stores</MenuItem>
                <MenuItem value="verified">Verified</MenuItem>
                <MenuItem value="unverified">Unverified</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                Total: {totalItems} stores
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Stores Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Store</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Products</TableCell>
                <TableCell>Revenue</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store._id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar
                        src={store.logo}
                        alt={store.storeName}
                        sx={{ width: 40, height: 40, mr: 2 }}
                      >
                        <StoreIcon />
                      </Avatar>
                      <Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {store.storeName}
                          </Typography>
                          {store.isVerified && (
                            <VerifiedIcon color="primary" sx={{ fontSize: 16 }} />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {store.storeSlug}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {store.ownerId?.fullName || store.ownerId?.username || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {store.ownerId?.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={store.category || 'General'} 
                      variant="outlined" 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {store.productsCount || 0} products
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatCurrency(store.totalRevenue || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Rating 
                        value={store.averageRating || 0} 
                        readOnly 
                        size="small" 
                        precision={0.1}
                      />
                      <Typography variant="caption">
                        ({store.reviewCount || 0})
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(store.status)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(store.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleDialogOpen('view', store)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={store.isVerified ? "Unverify Store" : "Verify Store"}>
                        <IconButton
                          size="small"
                          color={store.isVerified ? "warning" : "primary"}
                          onClick={() => handleVerificationToggle(store._id, store.isVerified)}
                        >
                          <VerifiedIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Store">
                        <IconButton
                          size="small"
                          onClick={() => handleDialogOpen('edit', store)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {stores.length === 0 && !loading && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              No stores found
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

      {/* Store Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'view' && 'Store Details'}
          {dialogType === 'edit' && 'Edit Store'}
          {dialogType === 'create' && 'Create New Store'}
        </DialogTitle>
        <DialogContent>
          {(dialogType === 'create' || dialogType === 'edit') && (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Store Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Business Name"
                    value={formData.businessInfo.businessName}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      businessInfo: { ...formData.businessInfo, businessName: e.target.value }
                    })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={formData.businessInfo.description}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      businessInfo: { ...formData.businessInfo, description: e.target.value }
                    })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="email"
                    label="Business Email"
                    value={formData.businessInfo.email}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      businessInfo: { ...formData.businessInfo, email: e.target.value }
                    })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.businessInfo.phone}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      businessInfo: { ...formData.businessInfo, phone: e.target.value }
                    })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Business Address</Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={formData.businessInfo.address.street}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      businessInfo: { 
                        ...formData.businessInfo, 
                        address: { ...formData.businessInfo.address, street: e.target.value }
                      }
                    })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.businessInfo.address.city}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      businessInfo: { 
                        ...formData.businessInfo, 
                        address: { ...formData.businessInfo.address, city: e.target.value }
                      }
                    })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="State"
                    value={formData.businessInfo.address.state}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      businessInfo: { 
                        ...formData.businessInfo, 
                        address: { ...formData.businessInfo.address, state: e.target.value }
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={formData.businessInfo.address.country}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      businessInfo: { 
                        ...formData.businessInfo, 
                        address: { ...formData.businessInfo.address, country: e.target.value }
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="ZIP Code"
                    value={formData.businessInfo.address.zipCode}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      businessInfo: { 
                        ...formData.businessInfo, 
                        address: { ...formData.businessInfo.address, zipCode: e.target.value }
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Box>
          )}

          {selectedStore && dialogType === 'view' && (
            <Box>
              {dialogType === 'view' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar
                        src={selectedStore.logo}
                        alt={selectedStore.storeName}
                        sx={{ width: 60, height: 60 }}
                      >
                        <StoreIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {selectedStore.storeName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedStore.description}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        {getStatusChip(selectedStore.status)}
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Category</Typography>
                        <Typography>{selectedStore.category || 'General'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Products</Typography>
                        <Typography>{selectedStore.productsCount || 0}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Revenue</Typography>
                        <Typography>{formatCurrency(selectedStore.totalRevenue || 0)}</Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          {dialogType === 'create' && (
            <Button
              variant="contained"
              onClick={handleCreateStore}
              disabled={!formData.name || !formData.businessInfo.businessName}
            >
              Create Store
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Stores;