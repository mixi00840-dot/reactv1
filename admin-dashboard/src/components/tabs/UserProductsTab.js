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
  IconButton,
  Chip,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  Pagination,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  TrendingUp as SalesIcon,
  MonetizationOn as RevenueIcon,
  Inventory as StockIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import mongoAPI from '../../utils/apiMongoDB';
import toast from 'react-hot-toast';

function UserProductsTab({ userId }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalRevenue: 0,
    totalSales: 0
  });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [userId, filterStatus, page, searchQuery]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await mongoAPI.get(`/api/products/mongodb`, {
        params: {
          sellerId: userId,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          search: searchQuery,
          page,
          limit: 10
        }
      });

      if (response.success && response.data) {
        setProducts(response.data.products || []);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await mongoAPI.get(`/api/products/mongodb/seller/${userId}/stats`);
      if (response.success) {
        setStats(response.data);
      } else {
        setStats({ total: 0, active: 0, totalRevenue: 0, totalSales: 0 });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({ total: 0, active: 0, totalRevenue: 0, totalSales: 0 });
    }
  };

  const generateMockProducts = () => {
    const mockProducts = [
      {
        _id: '1',
        name: 'Premium Wireless Headphones',
        description: 'High-quality sound with noise cancellation',
        price: 129.99,
        compareAtPrice: 179.99,
        stock: 150,
        sales: 45,
        revenue: 5849.55,
        status: 'active',
        images: ['https://via.placeholder.com/80?text=Product+1'],
        category: 'Electronics',
        createdAt: '2025-10-15'
      },
      {
        _id: '2',
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable and eco-friendly',
        price: 29.99,
        compareAtPrice: 39.99,
        stock: 200,
        sales: 89,
        revenue: 2669.11,
        status: 'active',
        images: ['https://via.placeholder.com/80?text=Product+2'],
        category: 'Clothing',
        createdAt: '2025-10-12'
      },
      {
        _id: '3',
        name: 'Smart Fitness Watch',
        description: 'Track your health and fitness goals',
        price: 199.99,
        compareAtPrice: 249.99,
        stock: 75,
        sales: 34,
        revenue: 6799.66,
        status: 'active',
        images: ['https://via.placeholder.com/80?text=Product+3'],
        category: 'Electronics',
        createdAt: '2025-10-08'
      },
      {
        _id: '4',
        name: 'Handmade Leather Wallet',
        description: 'Genuine leather, handcrafted',
        price: 49.99,
        compareAtPrice: null,
        stock: 0,
        sales: 12,
        revenue: 599.88,
        status: 'out_of_stock',
        images: ['https://via.placeholder.com/80?text=Product+4'],
        category: 'Accessories',
        createdAt: '2025-10-05'
      }
    ];
    setProducts(mockProducts);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await mongoAPI.delete(`/api/products/mongodb/${productId}`);
      setProducts(products.filter(p => p._id !== productId));
      setDeleteDialog(false);
      setSelectedProduct(null);
      toast.success('Product deleted successfully');
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleStatusChange = async (productId, newStatus) => {
    try {
      await mongoAPI.put(`/api/products/mongodb/${productId}`, {
        status: newStatus
      });
      setProducts(products.map(p => 
        p._id === productId ? { ...p, status: newStatus } : p
      ));
      toast.success(`Product ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Failed to update product status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'out_of_stock':
        return 'error';
      case 'pending_approval':
        return 'warning';
      default:
        return 'default';
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
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Products
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                    {stats.total}
                  </Typography>
                </Box>
                <StockIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Active Products
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                    {stats.active}
                  </Typography>
                </Box>
                <ApproveIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Sales
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                    {stats.totalSales}
                  </Typography>
                </Box>
                <SalesIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                    ${stats.totalRevenue.toFixed(2)}
                  </Typography>
                </Box>
                <RevenueIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ minWidth: 300 }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="out_of_stock">Out of Stock</MenuItem>
            <MenuItem value="pending_approval">Pending</MenuItem>
          </Select>
        </FormControl>

        <Box flexGrow={1} />

        <Typography variant="body2" color="textSecondary" sx={{ alignSelf: 'center' }}>
          {products.length} products
        </Typography>
      </Box>

      {/* Products Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Product Name</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="center">Stock</TableCell>
              <TableCell align="center">Sales</TableCell>
              <TableCell align="right">Revenue</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                    No products found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product._id} hover>
                  <TableCell>
                    <Avatar
                      src={product.images?.[0] || 'https://via.placeholder.com/80?text=Product'}
                      variant="rounded"
                      sx={{ width: 60, height: 60 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {product.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {product.category || 'Uncategorized'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      ${product.price.toFixed(2)}
                    </Typography>
                    {product.compareAtPrice && (
                      <Typography variant="caption" color="textSecondary" sx={{ textDecoration: 'line-through' }}>
                        ${product.compareAtPrice.toFixed(2)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={product.stock}
                      size="small"
                      color={product.stock > 50 ? 'success' : product.stock > 0 ? 'warning' : 'error'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{product.sales || 0}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      ${(product.revenue || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={product.status?.replace('_', ' ').toUpperCase()}
                      size="small"
                      color={getStatusColor(product.status)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="View Product">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/products/${product._id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Product">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => navigate(`/products/${product._id}/edit`)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={product.status === 'active' ? 'Deactivate' : 'Activate'}>
                        <IconButton
                          size="small"
                          color={product.status === 'active' ? 'warning' : 'success'}
                          onClick={() => handleStatusChange(product._id, product.status === 'active' ? 'inactive' : 'active')}
                        >
                          {product.status === 'active' ? <RejectIcon /> : <ApproveIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Product">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedProduct(product);
                            setDeleteDialog(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={() => handleDeleteProduct(selectedProduct?._id)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserProductsTab;

