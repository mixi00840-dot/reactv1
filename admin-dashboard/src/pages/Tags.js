import React, { useState, useEffect } from 'react';
import api from '../utils/apiFirebase';
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
  Switch
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Block as BlockIcon
} from '@mui/icons-material';

const Tags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [dialog, setDialog] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    trending: 0,
    featured: 0,
    flagged: 0
  });

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    isFeatured: false,
    isBanned: false
  });

  useEffect(() => {
    fetchTags();
    fetchStats();
  }, [tab]);

  const fetchTags = async () => {
    setLoading(true);
    try {
      let endpoint = `/api/admin/tags`;
      
      if (tab === 1) endpoint += '?filter=trending';
      if (tab === 2) endpoint += '?filter=featured';
      if (tab === 3) endpoint += '?filter=flagged';

      const payload = await api.get(endpoint);
      setTags(payload?.tags || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const payload = await api.get('/api/admin/tags/stats');
      setStats(payload || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      
      if (selectedTag) {
        await api.put(`/api/admin/tags/${selectedTag._id}`, form);
        alert('Tag updated successfully');
      } else {
        await api.post('/api/admin/tags', form);
        alert('Tag created successfully');
      }

      setDialog(false);
      setSelectedTag(null);
      setForm({
        name: '',
        description: '',
        category: '',
        isFeatured: false,
        isBanned: false
      });
      fetchTags();
      fetchStats();
    } catch (error) {
      console.error('Error saving tag:', error);
      alert('Failed to save tag');
    }
  };

  const handleDelete = async (tagId) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) return;

    try {
      await api.delete(`/api/admin/tags/${tagId}`);
      alert('Tag deleted successfully');
      fetchTags();
      fetchStats();
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('Failed to delete tag');
    }
  };

  const toggleFeature = async (tagId, currentStatus) => {
    try {
      await api.patch(`/api/admin/tags/${tagId}/feature`, { isFeatured: !currentStatus });
      fetchTags();
      fetchStats();
    } catch (error) {
      console.error('Error toggling feature:', error);
    }
  };

  const toggleBan = async (tagId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this tag?`)) return;

    try {
      await api.patch(`/api/admin/tags/${tagId}/ban`, { isBanned: !currentStatus });
      fetchTags();
      fetchStats();
    } catch (error) {
      console.error('Error toggling ban:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Tags Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedTag(null);
            setForm({
              name: '',
              description: '',
              category: '',
              isFeatured: false,
              isBanned: false
            });
            setDialog(true);
          }}
        >
          Create Tag
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Tags</Typography>
              <Typography variant="h4">{stats.total || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Trending Today</Typography>
              <Typography variant="h4" color="warning.main">{stats.trending || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Featured</Typography>
              <Typography variant="h4" color="primary.main">{stats.featured || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Flagged</Typography>
              <Typography variant="h4" color="error.main">{stats.flagged || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="All Tags" />
          <Tab label="Trending" />
          <Tab label="Featured" />
          <Tab label="Flagged" />
        </Tabs>
      </Paper>

      {/* Tags Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tag</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Usage</TableCell>
                <TableCell>Trending Score</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag._id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        #{tag.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {tag.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {tag.category ? (
                      <Chip size="small" label={tag.category} color="primary" />
                    ) : (
                      <Typography variant="caption" color="textSecondary">Uncategorized</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      📝 {tag.postCount || 0} posts
                    </Typography>
                    <Typography variant="body2">
                      🎥 {tag.videoCount || 0} videos
                    </Typography>
                    <Typography variant="body2" color="primary.main">
                      👁️ {tag.totalViews || 0} views
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {tag.isTrending && <TrendingIcon color="warning" fontSize="small" />}
                      <Typography variant="h6" color={tag.isTrending ? 'warning.main' : 'textSecondary'}>
                        {tag.trendingScore || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {tag.isFeatured && <Chip size="small" label="Featured" color="primary" />}
                      {tag.isBanned && <Chip size="small" label="Banned" color="error" />}
                      {!tag.isFeatured && !tag.isBanned && (
                        <Chip size="small" label="Active" color="success" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        color={tag.isFeatured ? 'primary' : 'default'}
                        onClick={() => toggleFeature(tag._id, tag.isFeatured)}
                        title={tag.isFeatured ? 'Unfeature' : 'Feature'}
                      >
                        <StarIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color={tag.isBanned ? 'error' : 'default'}
                        onClick={() => toggleBan(tag._id, tag.isBanned)}
                        title={tag.isBanned ? 'Unban' : 'Ban'}
                      >
                        <BlockIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedTag(tag);
                          setForm({
                            name: tag.name,
                            description: tag.description || '',
                            category: tag.category || '',
                            isFeatured: tag.isFeatured,
                            isBanned: tag.isBanned
                          });
                          setDialog(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(tag._id)}
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

      {/* Tag Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedTag ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tag Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Without # symbol"
                helperText="Enter tag name without # (e.g., 'dance', 'comedy')"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe this tag..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="">-- Select Category --</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Dance">Dance</option>
                <option value="Comedy">Comedy</option>
                <option value="Gaming">Gaming</option>
                <option value="Music">Music</option>
                <option value="Sports">Sports</option>
                <option value="Education">Education</option>
                <option value="Technology">Technology</option>
                <option value="Fashion">Fashion</option>
                <option value="Food">Food</option>
                <option value="Travel">Travel</option>
                <option value="Other">Other</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Switch
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                />
                <Typography>Featured</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Switch
                  checked={form.isBanned}
                  onChange={(e) => setForm({ ...form, isBanned: e.target.checked })}
                  color="error"
                />
                <Typography>Banned</Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {selectedTag ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tags;

