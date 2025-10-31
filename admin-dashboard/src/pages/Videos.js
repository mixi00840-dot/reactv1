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
  Tabs,
  Tab,
  IconButton,
  Avatar
} from '@mui/material';
import {
  VideoLibrary as VideoIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CloudUpload as UploadIcon,
  CheckCircle as ApproveIcon
} from '@mui/icons-material';

const Videos = () => {
  const [tabValue, setTabValue] = useState(0);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    totalViews: 0
  });

  useEffect(() => {
    fetchVideos();
    fetchStats();
  }, [tabValue]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const statusFilter = tabValue === 0 ? 'all' : tabValue === 1 ? 'active' : 'pending';
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/content?type=video&status=${statusFilter}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVideos(response.data.content || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/content/stats?type=video`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (videoId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/content/${videoId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Video approved successfully');
      fetchVideos();
      fetchStats();
    } catch (error) {
      console.error('Error approving video:', error);
      alert('Failed to approve video');
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/content/${videoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Video deleted successfully');
      fetchVideos();
      fetchStats();
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Videos Management</Typography>
        <Button variant="contained" startIcon={<UploadIcon />}>
          Upload Video
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Videos</Typography>
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
              <Typography color="textSecondary" gutterBottom>Pending Review</Typography>
              <Typography variant="h4" color="warning.main">{stats.pending || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Views</Typography>
              <Typography variant="h4" color="primary.main">{formatNumber(stats.totalViews || 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
          <Tab label="All Videos" />
          <Tab label="Active" />
          <Tab label="Pending Review" />
        </Tabs>
      </Paper>

      {/* Videos Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Video</TableCell>
                <TableCell>Creator</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Stats</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {videos.map((video) => (
                <TableRow key={video._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={video.thumbnailUrl}
                        variant="rounded"
                        sx={{ width: 80, height: 60 }}
                      >
                        <VideoIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {video.title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {video.description?.substring(0, 50)}...
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={video.creator?.avatar} sx={{ width: 32, height: 32 }} />
                      <Typography variant="body2">{video.creator?.username}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{formatDuration(video.duration || 0)}</TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block">
                      👁️ {formatNumber(video.views || 0)} views
                    </Typography>
                    <Typography variant="caption" display="block">
                      ❤️ {formatNumber(video.likes || 0)} likes
                    </Typography>
                    <Typography variant="caption" display="block">
                      💬 {formatNumber(video.comments || 0)} comments
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={video.status}
                      color={
                        video.status === 'active' ? 'success' :
                        video.status === 'pending' ? 'warning' :
                        'error'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(video.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedVideo(video);
                          setDetailsOpen(true);
                        }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      {video.status === 'pending' && (
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleApprove(video._id)}
                        >
                          <ApproveIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(video._id)}
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

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Video Details</DialogTitle>
        <DialogContent>
          {selectedVideo && (
            <Box>
              <video
                src={selectedVideo.videoUrl}
                controls
                style={{ width: '100%', maxHeight: 400, marginBottom: 16 }}
              />
              <Typography variant="h6" gutterBottom>{selectedVideo.title}</Typography>
              <Typography variant="body2" paragraph>{selectedVideo.description}</Typography>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Category</Typography>
                  <Typography variant="body2">{selectedVideo.category}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Tags</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {selectedVideo.tags?.map(tag => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Views</Typography>
                  <Typography variant="body2">{formatNumber(selectedVideo.views || 0)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Likes</Typography>
                  <Typography variant="body2">{formatNumber(selectedVideo.likes || 0)}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Videos;
