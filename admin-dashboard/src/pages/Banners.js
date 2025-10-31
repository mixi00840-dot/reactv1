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
  IconButton,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalClicks: 0,
    avgCTR: 0
  });

  const [form, setForm] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    position: 'homepage-top',
    startDate: '',
    endDate: '',
    targetAudience: 'all',
    priority: 1,
    isActive: true
  });

  useEffect(() => {
    fetchBanners();
    fetchStats();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/banners`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBanners(response.data.banners || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/banners/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (selectedBanner) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/admin/banners/${selectedBanner._id}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Banner updated successfully');
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/banners`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Banner created successfully');
      }

      setDialog(false);
      setSelectedBanner(null);
      setForm({
        title: '',
        imageUrl: '',
        linkUrl: '',
        position: 'homepage-top',
        startDate: '',
        endDate: '',
        targetAudience: 'all',
        priority: 1,
        isActive: true
      });
      fetchBanners();
      fetchStats();
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Failed to save banner');
    }
  };

  const handleDelete = async (bannerId) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/admin/banners/${bannerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Banner deleted successfully');
      fetchBanners();
      fetchStats();
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Failed to delete banner');
    }
  };

  const toggleActive = async (bannerId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/admin/banners/${bannerId}/toggle`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBanners();
    } catch (error) {
      console.error('Error toggling banner:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Banners Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedBanner(null);
            setForm({
              title: '',
              imageUrl: '',
              linkUrl: '',
              position: 'homepage-top',
              startDate: '',
              endDate: '',
              targetAudience: 'all',
              priority: 1,
              isActive: true
            });
            setDialog(true);
          }}
        >
          Create Banner
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Banners</Typography>
              <Typography variant="h4">{stats.total || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Active</Typography>
              <Typography variant="h4" color="success.main">{stats.active || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Clicks</Typography>
              <Typography variant="h4" color="primary.main">{stats.totalClicks || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Avg CTR</Typography>
              <Typography variant="h4" color="warning.main">{(stats.avgCTR || 0).toFixed(2)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Banners Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Banner</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Performance</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        component="img"
                        src={banner.imageUrl}
                        alt={banner.title}
                        sx={{ width: 100, height: 50, objectFit: 'cover', borderRadius: 1 }}
                        onError={(e) => { e.target.src = '/placeholder-banner.png'; }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">{banner.title}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {banner.linkUrl}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={banner.position} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block">
                      From: {banner.startDate ? new Date(banner.startDate).toLocaleDateString() : 'Now'}
                    </Typography>
                    <Typography variant="caption" display="block">
                      To: {banner.endDate ? new Date(banner.endDate).toLocaleDateString() : 'Ongoing'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={banner.targetAudience} color="primary" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block">
                      👁️ {banner.impressions || 0} views
                    </Typography>
                    <Typography variant="caption" display="block">
                      🖱️ {banner.clicks || 0} clicks
                    </Typography>
                    <Typography variant="caption" display="block" color="primary.main">
                      CTR: {banner.impressions > 0 ? ((banner.clicks / banner.impressions) * 100).toFixed(2) : 0}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={banner.priority}
                      color={banner.priority === 1 ? 'error' : banner.priority === 2 ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={banner.isActive}
                      onChange={() => toggleActive(banner._id, banner.isActive)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedBanner(banner);
                          setForm({
                            title: banner.title,
                            imageUrl: banner.imageUrl,
                            linkUrl: banner.linkUrl,
                            position: banner.position,
                            startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
                            endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
                            targetAudience: banner.targetAudience,
                            priority: banner.priority,
                            isActive: banner.isActive
                          });
                          setDialog(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(banner._id)}
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

      {/* Banner Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedBanner ? 'Edit Banner' : 'Create Banner'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                helperText="Banner image (recommended: 1200x300px)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Link URL"
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                placeholder="https://..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Position"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="homepage-top">Homepage - Top</option>
                <option value="homepage-middle">Homepage - Middle</option>
                <option value="homepage-bottom">Homepage - Bottom</option>
                <option value="sidebar">Sidebar</option>
                <option value="explore">Explore Page</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Target Audience"
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="all">All Users</option>
                <option value="new">New Users</option>
                <option value="creators">Creators</option>
                <option value="buyers">Buyers</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Priority (1=Highest)"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {selectedBanner ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Banners;
