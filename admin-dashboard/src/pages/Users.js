import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Pagination,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Search,
  MoreVert,
  Visibility,
  Block,
  CheckCircle,
  Star,
  Warning,
  Edit,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const UserStatusChip = ({ status }) => {
  const getChipProps = () => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: 'success' };
      case 'suspended':
        return { label: 'Suspended', color: 'warning' };
      case 'banned':
        return { label: 'Banned', color: 'error' };
      default:
        return { label: status, color: 'default' };
    }
  };

  return <Chip size="small" {...getChipProps()} />;
};

function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
  });
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    verified: '',
    featured: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [filters, pagination.currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 20,
        ...filters,
      });

      const response = await axios.get(`/api/admin/users?${params}`);
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (event, value) => {
    setPagination(prev => ({ ...prev, currentPage: value }));
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleViewUser = () => {
    if (selectedUser) {
      navigate(`/users/${selectedUser._id}`);
    }
    handleMenuClose();
  };

  const handleUserAction = async (action) => {
    if (!selectedUser) return;

    console.log(`🔵 User action triggered: ${action} for user:`, selectedUser._id);

    try {
      let endpoint = '';
      let method = 'PUT';
      let data = {};

      switch (action) {
        case 'verify':
          endpoint = `/api/admin/users/${selectedUser._id}/verify`;
          break;
        case 'makeSeller':
          endpoint = `/api/admin/users/${selectedUser._id}/make-seller`;
          console.log('📞 Calling make-seller endpoint:', endpoint);
          break;
        case 'feature':
          endpoint = `/api/admin/users/${selectedUser._id}/feature`;
          break;
        case 'ban':
          endpoint = `/api/admin/users/${selectedUser._id}/status`;
          data = { status: 'banned', reason: 'Banned by admin' };
          break;
        case 'suspend':
          endpoint = `/api/admin/users/${selectedUser._id}/status`;
          data = { status: 'suspended', reason: 'Suspended by admin' };
          break;
        case 'activate':
          endpoint = `/api/admin/users/${selectedUser._id}/status`;
          data = { status: 'active', reason: 'Activated by admin' };
          break;
        default:
          return;
      }

      const response = await axios[method.toLowerCase()](endpoint, Object.keys(data).length ? data : undefined);
      
      console.log(`✅ ${action} successful:`, response.data);
      
      if (action === 'makeSeller' && response.data.data) {
        console.log('🏪 Store created:', response.data.data.storeCreated);
        console.log('📦 Store details:', response.data.data.store);
      }
      
      toast.success(response.data.message || `User ${action}d successfully`);
      fetchUsers();
    } catch (error) {
      console.error(`❌ ${action} user error:`, error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || `Failed to ${action} user`);
    }
    
    handleMenuClose();
  };

  const columns = [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      renderCell: (params) => (
        <Avatar
          src={params.row.avatar}
          sx={{ width: 32, height: 32 }}
        >
          {params.row.fullName.charAt(0)}
        </Avatar>
      ),
      sortable: false,
    },
    {
      field: 'fullName',
      headerName: 'Name',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography 
            variant="body2" 
            fontWeight="medium"
            sx={{ 
              cursor: 'pointer', 
              color: 'primary.main',
              '&:hover': { textDecoration: 'underline' }
            }}
            onClick={() => navigate(`/users/${params.row._id}`)}
          >
            {params.row.fullName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            @{params.row.username}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 250,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => <UserStatusChip status={params.row.status} />,
    },
    {
      field: 'badges',
      headerName: 'Badges',
      width: 150,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          {params.row.isVerified && (
            <CheckCircle sx={{ fontSize: 16, color: 'primary.main' }} />
          )}
          {params.row.isFeatured && (
            <Star sx={{ fontSize: 16, color: 'warning.main' }} />
          )}
          {params.row.activeStrikes > 0 && (
            <Warning sx={{ fontSize: 16, color: 'error.main' }} />
          )}
        </Box>
      ),
      sortable: false,
    },
    {
      field: 'stats',
      headerName: 'Stats',
      width: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="caption" display="block">
            {params.row.followersCount} followers
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            {params.row.videosCount} videos
          </Typography>
        </Box>
      ),
      sortable: false,
    },
    {
      field: 'wallet',
      headerName: 'Earnings',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          ${params.row.wallet?.totalEarnings?.toLocaleString() || '0'}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 120,
      renderCell: (params) => (
        <Typography variant="caption">
          {new Date(params.row.createdAt).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(e) => handleMenuOpen(e, params.row)}
        >
          <MoreVert />
        </IconButton>
      ),
      sortable: false,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Users Management
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search users"
                variant="outlined"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="banned">Banned</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Verified</InputLabel>
                <Select
                  value={filters.verified}
                  label="Verified"
                  onChange={(e) => handleFilterChange('verified', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Verified</MenuItem>
                  <MenuItem value="false">Not Verified</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Featured</InputLabel>
                <Select
                  value={filters.featured}
                  label="Featured"
                  onChange={(e) => handleFilterChange('featured', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Featured</MenuItem>
                  <MenuItem value="false">Not Featured</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  label="Sort By"
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <MenuItem value="createdAt">Join Date</MenuItem>
                  <MenuItem value="fullName">Name</MenuItem>
                  <MenuItem value="followersCount">Followers</MenuItem>
                  <MenuItem value="videosCount">Videos</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={1}>
              <Button
                variant="outlined"
                onClick={() => setFilters({
                  search: '',
                  status: '',
                  verified: '',
                  featured: '',
                  sortBy: 'createdAt',
                  sortOrder: 'desc',
                })}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Users ({pagination.totalUsers.toLocaleString()})
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/create-user')}
            >
              Add User
            </Button>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                  rows={users}
                  columns={columns}
                  pageSize={20}
                  rowsPerPageOptions={[20]}
                  disableSelectionOnClick
                  getRowId={(row) => row._id}
                  hideFooterPagination
                  hideFooter
                />
              </Box>

              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.currentPage}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewUser}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleUserAction('verify')}>
          <ListItemIcon>
            <CheckCircle fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {selectedUser?.isVerified ? 'Unverify' : 'Verify'}
          </ListItemText>
        </MenuItem>

        {selectedUser?.role !== 'seller' && (
          <MenuItem onClick={() => handleUserAction('makeSeller')}>
            <ListItemIcon>
              <CheckCircle fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Make Seller & Create Store</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={() => handleUserAction('feature')}>
          <ListItemIcon>
            <Star fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {selectedUser?.isFeatured ? 'Unfeature' : 'Feature'}
          </ListItemText>
        </MenuItem>

        {selectedUser?.status === 'active' && (
          <>
            <MenuItem onClick={() => handleUserAction('suspend')}>
              <ListItemIcon>
                <Warning fontSize="small" />
              </ListItemIcon>
              <ListItemText>Suspend</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleUserAction('ban')}>
              <ListItemIcon>
                <Block fontSize="small" />
              </ListItemIcon>
              <ListItemText>Ban</ListItemText>
            </MenuItem>
          </>
        )}

        {(selectedUser?.status === 'suspended' || selectedUser?.status === 'banned') && (
          <MenuItem onClick={() => handleUserAction('activate')}>
            <ListItemIcon>
              <CheckCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText>Activate</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}

export default Users;