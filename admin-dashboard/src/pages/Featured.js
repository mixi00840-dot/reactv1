import React, { useState, useEffect } from 'react';
import api from '../utils/api';
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
  IconButton,
  Tabs,
  Tab,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  Storefront as StoreIcon,
  Person as PersonIcon,
  VideoLibrary as VideoIcon
} from '@mui/icons-material';

const Featured = () => {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [dialog, setDialog] = useState(false);
  const [stats, setStats] = useState({
    totalFeatured: 0,
    featuredUsers: 0,
    featuredShops: 0,
    totalImpressions: 0
  });

  const [form, setForm] = useState({
    type: 'content',
    itemId: '',
    duration: 7,
    priority: 1,
    position: 'homepage'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    fetchFeatured();
    fetchStats();
  }, [tab]);

  const fetchFeatured = async () => {
    setLoading(true);
    try {
      let type = '';
      if (tab === 0) type = 'content';
      if (tab === 1) type = 'user';
      if (tab === 2) type = 'shop';
      if (tab === 3) type = 'expired';

      const payload = await api.get(`/api/admin/featured?type=${type}`);
      setFeatured(payload?.featured || payload?.data?.featured || []);
    } catch (error) {
      console.error('Error fetching featured:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const payload = await api.get('/api/admin/featured/stats');
      setStats(payload || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const searchItems = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const endpoint = form.type === 'user' ? 'users' : 
                      form.type === 'shop' ? 'stores' : 
                      'content';

      const payload = await api.get(`/api/admin/search/${endpoint}?q=${query}`);
      setSearchResults(payload?.results || []);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleAdd = async () => {
    if (!form.itemId) {
      alert('Please select an item to feature');
      return;
    }

    try {
      await api.post('/api/admin/featured', form);
      alert('Item featured successfully');
      setDialog(false);
      setForm({
        type: 'content',
        itemId: '',
        duration: 7,
        priority: 1,
        position: 'homepage'
      });
      setSearchQuery('');
      setSearchResults([]);
      fetchFeatured();
      fetchStats();
    } catch (error) {
      console.error('Error featuring item:', error);
      alert('Failed to feature item');
    }
  };

  const handleRemove = async (featuredId) => {
    if (!window.confirm('Remove from featured?')) return;

    try {
      await api.delete(`/api/admin/featured/${featuredId}`);
      alert('Removed from featured');
      fetchFeatured();
      fetchStats();
    } catch (error) {
      console.error('Error removing featured:', error);
      alert('Failed to remove');
    }
  };

  const changePriority = async (featuredId, direction) => {
    try {
      await api.patch(`/api/admin/featured/${featuredId}/priority`, { direction });
      fetchFeatured();
    } catch (error) {
      console.error('Error changing priority:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Featured Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setForm({
              type: 'content',
              itemId: '',
              duration: 7,
              priority: 1,
              position: 'homepage'
            });
            setSearchQuery('');
            setSearchResults([]);
            setDialog(true);
          }}
        >
          Add to Featured
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Featured</Typography>
              <Typography variant="h4">{stats.totalFeatured || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Featured Users</Typography>
              <Typography variant="h4" color="primary.main">{stats.featuredUsers || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Featured Shops</Typography>
              <Typography variant="h4" color="success.main">{stats.featuredShops || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Impressions</Typography>
              <Typography variant="h4" color="warning.main">{stats.totalImpressions || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Featured Content" icon={<VideoIcon />} iconPosition="start" />
          <Tab label="Featured Users" icon={<PersonIcon />} iconPosition="start" />
          <Tab label="Featured Shops" icon={<StoreIcon />} iconPosition="start" />
          <Tab label="Expired" />
        </Tabs>
      </Paper>

      {/* Featured Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="50">Priority</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Impressions</TableCell>
                <TableCell>CTR</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {featured.map((item, index) => (
                <TableRow key={item._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        disabled={index === 0}
                        onClick={() => changePriority(item._id, 'up')}
                      >
                        <UpIcon fontSize="small" />
                      </IconButton>
                      <Chip 
                        size="small" 
                        label={item.priority} 
                        color={item.priority === 1 ? 'error' : item.priority === 2 ? 'warning' : 'default'}
                      />
                      <IconButton
                        size="small"
                        disabled={index === featured.length - 1}
                        onClick={() => changePriority(item._id, 'down')}
                      >
                        <DownIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {item.item?.thumbnail || item.item?.avatar || item.item?.logo ? (
                        <Avatar
                          src={item.item.thumbnail || item.item.avatar || item.item.logo}
                          sx={{ width: 60, height: 60 }}
                        />
                      ) : (
                        <Avatar sx={{ width: 60, height: 60 }}>
                          {item.type === 'user' ? <PersonIcon /> : 
                           item.type === 'shop' ? <StoreIcon /> : 
                           <VideoIcon />}
                        </Avatar>
                      )}
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {item.item?.title || item.item?.username || item.item?.name || 'Unknown'}
                        </Typography>
                        <Chip size="small" label={item.type} color="primary" />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={item.position} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.duration} days
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Expires: {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'Never'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      👁️ {item.impressions || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="primary.main">
                      {item.impressions > 0 ? ((item.clicks / item.impressions) * 100).toFixed(2) : 0}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemove(item._id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Featured Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add to Featured</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Feature Type</InputLabel>
                <Select
                  value={form.type}
                  onChange={(e) => {
                    setForm({ ...form, type: e.target.value, itemId: '' });
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                >
                  <MenuItem value="content">Content (Video/Post)</MenuItem>
                  <MenuItem value="user">User/Creator</MenuItem>
                  <MenuItem value="shop">Shop/Store</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={`Search ${form.type}`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchItems(e.target.value);
                }}
                placeholder="Type to search..."
              />
            </Grid>
            {searchResults.length > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {searchResults.map((result) => (
                    <Box
                      key={result._id}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: form.itemId === result._id ? 'action.selected' : 'transparent'
                      }}
                      onClick={() => {
                        setForm({ ...form, itemId: result._id });
                        setSearchQuery(result.title || result.username || result.name);
                        setSearchResults([]);
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={result.thumbnail || result.avatar || result.logo} />
                        <Typography>
                          {result.title || result.username || result.name}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Position"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="homepage">Homepage Spotlight</option>
                <option value="explore">Explore Page</option>
                <option value="category">Category Featured</option>
                <option value="search">Search Spotlight</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Duration (days)"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 365 }}
                helperText="0 = permanent"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Priority (1=Highest)"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={!form.itemId}>
            Add to Featured
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Featured;
