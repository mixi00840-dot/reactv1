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
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon
} from '@mui/icons-material';

const Explorer = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [dialog, setDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [stats, setStats] = useState({
    totalSections: 0,
    totalContent: 0,
    dailyVisitors: 0,
    engagementRate: 0
  });

  const [form, setForm] = useState({
    title: '',
    type: 'trending',
    category: '',
    order: 1,
    maxItems: 20,
    isActive: true
  });

  useEffect(() => {
    fetchSections();
    fetchStats();
  }, [tab]);

  const fetchSections = async () => {
    setLoading(true);
    try {
      let endpoint = `/api/admin/explorer/sections`;
      
      if (tab === 1) endpoint += '?filter=active';
      if (tab === 2) endpoint += '?filter=categories';

      const payload = await api.get(endpoint);
      setSections(payload?.sections || payload || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const payload = await api.get('/api/admin/explorer/stats');
      setStats(payload || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      
      if (selectedSection) {
        await api.put(`/api/admin/explorer/sections/${selectedSection._id}`, form);
        alert('Section updated successfully');
      } else {
        await api.post('/api/admin/explorer/sections', form);
        alert('Section created successfully');
      }

      setDialog(false);
      setSelectedSection(null);
      setForm({
        title: '',
        type: 'trending',
        category: '',
        order: 1,
        maxItems: 20,
        isActive: true
      });
      fetchSections();
      fetchStats();
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Failed to save section');
    }
  };

  const handleDelete = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;

    try {
      await api.delete(`/api/admin/explorer/sections/${sectionId}`);
      alert('Section deleted successfully');
      fetchSections();
      fetchStats();
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section');
    }
  };

  const toggleActive = async (sectionId, currentStatus) => {
    try {
      await api.patch(`/api/admin/explorer/sections/${sectionId}/toggle`, { isActive: !currentStatus });
      fetchSections();
    } catch (error) {
      console.error('Error toggling section:', error);
    }
  };

  const reorderSection = async (sectionId, direction) => {
    try {
      await api.patch(`/api/admin/explorer/sections/${sectionId}/reorder`, { direction });
      fetchSections();
    } catch (error) {
      console.error('Error reordering section:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Explorer Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedSection(null);
            setForm({
              title: '',
              type: 'trending',
              category: '',
              order: sections.length + 1,
              maxItems: 20,
              isActive: true
            });
            setDialog(true);
          }}
        >
          Add Section
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Sections</Typography>
              <Typography variant="h4">{stats.totalSections || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Featured Content</Typography>
              <Typography variant="h4" color="primary.main">{stats.totalContent || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Daily Visitors</Typography>
              <Typography variant="h4" color="success.main">{stats.dailyVisitors || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Engagement Rate</Typography>
              <Typography variant="h4" color="warning.main">{(stats.engagementRate || 0).toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="All Sections" />
          <Tab label="Active" />
          <Tab label="Categories" />
        </Tabs>
      </Paper>

      {/* Sections Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="50">Order</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Content Count</TableCell>
                <TableCell>Views</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sections.map((section, index) => (
                <TableRow key={section._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        disabled={index === 0}
                        onClick={() => reorderSection(section._id, 'up')}
                      >
                        <UpIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="caption" align="center">
                        {section.order}
                      </Typography>
                      <IconButton
                        size="small"
                        disabled={index === sections.length - 1}
                        onClick={() => reorderSection(section._id, 'down')}
                      >
                        <DownIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold">
                      {section.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Max {section.maxItems} items
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={section.type} 
                      color={
                        section.type === 'trending' ? 'warning' :
                        section.type === 'featured' ? 'primary' :
                        section.type === 'category' ? 'info' :
                        'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {section.category ? (
                      <Chip size="small" label={section.category} />
                    ) : (
                      <Typography variant="caption" color="textSecondary">All</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      🎥 {section.contentCount || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="primary.main">
                      👁️ {section.views || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={section.isActive}
                      onChange={() => toggleActive(section._id, section.isActive)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedSection(section);
                          setForm({
                            title: section.title,
                            type: section.type,
                            category: section.category || '',
                            order: section.order,
                            maxItems: section.maxItems,
                            isActive: section.isActive
                          });
                          setDialog(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(section._id)}
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

      {/* Section Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedSection ? 'Edit Section' : 'Create Section'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Section Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., For You, Trending, Comedy"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Section Type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="trending">Trending</option>
                <option value="featured">Featured</option>
                <option value="category">Category</option>
                <option value="for-you">For You (Personalized)</option>
                <option value="new">New Releases</option>
                <option value="popular">Most Popular</option>
              </TextField>
            </Grid>
            {form.type === 'category' && (
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
                </TextField>
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Display Order"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })}
                inputProps={{ min: 1 }}
                helperText="Lower numbers appear first"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Items"
                value={form.maxItems}
                onChange={(e) => setForm({ ...form, maxItems: parseInt(e.target.value) })}
                inputProps={{ min: 5, max: 100 }}
                helperText="Items to display (5-100)"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Switch
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <Typography>Active</Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {selectedSection ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Explorer;
