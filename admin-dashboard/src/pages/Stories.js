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
  Tabs,
  Tab,
  IconButton,
  Avatar
} from '@mui/material';
import {
  AutoStories as StoryIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

const Stories = () => {
  const [tabValue, setTabValue] = useState(0);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    totalViews: 0
  });

  useEffect(() => {
    fetchStories();
    fetchStats();
  }, [tabValue]);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const statusFilter = tabValue === 0 ? 'all' : tabValue === 1 ? 'active' : 'expired';
      const payload = await api.get(`/api/stories?status=${statusFilter}&limit=100`);
      setStories(payload?.stories || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const payload = await api.get('/api/stories/stats');
      setStats(payload || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;

    try {
      await api.delete(`/api/stories/${storyId}`);
      alert('Story deleted successfully');
      fetchStories();
      fetchStats();
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story');
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Stories Management
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Stories</Typography>
              <Typography variant="h4">{stats.total || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Active (24h)</Typography>
              <Typography variant="h4" color="success.main">{stats.active || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Expired</Typography>
              <Typography variant="h4" color="error.main">{stats.expired || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Views</Typography>
              <Typography variant="h4" color="primary.main">
                {formatNumber(stats.totalViews || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
          <Tab label="All Stories" />
          <Tab label="Active (24h)" />
          <Tab label="Expired" />
        </Tabs>
      </Paper>

      {/* Stories Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Story</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Views</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Posted</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stories.map((story) => (
                <TableRow key={story._id} hover>
                  <TableCell>
                    <Avatar
                      src={story.mediaType === 'image' ? story.mediaUrl : story.thumbnailUrl}
                      variant="rounded"
                      sx={{ width: 60, height: 80 }}
                    >
                      <StoryIcon />
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={story.user?.avatar} sx={{ width: 32, height: 32 }} />
                      <Box>
                        <Typography variant="body2">{story.user?.username}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          @{story.user?.username}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={story.mediaType}
                      color={story.mediaType === 'video' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      👁️ {formatNumber(story.views || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={story.isExpired ? 'Expired' : 'Active'}
                      color={story.isExpired ? 'error' : 'success'}
                    />
                  </TableCell>
                  <TableCell>{formatTimeAgo(story.createdAt)}</TableCell>
                  <TableCell>
                    {story.expiresAt ? formatTimeAgo(story.expiresAt) : '24h'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedStory(story);
                          setViewDialog(true);
                        }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteStory(story._id)}
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

      {/* View Story Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Story Details</DialogTitle>
        <DialogContent>
          {selectedStory && (
            <Box>
              {selectedStory.mediaType === 'video' ? (
                <video
                  src={selectedStory.mediaUrl}
                  controls
                  style={{ width: '100%', maxHeight: 500, borderRadius: 8 }}
                />
              ) : (
                <Box
                  component="img"
                  src={selectedStory.mediaUrl}
                  alt="Story"
                  sx={{ width: '100%', maxHeight: 500, borderRadius: 2 }}
                />
              )}
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Caption:</strong> {selectedStory.caption || 'No caption'}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Views:</strong> {formatNumber(selectedStory.views || 0)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Posted:</strong> {new Date(selectedStory.createdAt).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Expires:</strong> {new Date(selectedStory.expiresAt).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
          <Button
            color="error"
            onClick={() => {
              handleDeleteStory(selectedStory._id);
              setViewDialog(false);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Stories;
