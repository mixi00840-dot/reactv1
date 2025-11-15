import React, { useState, useEffect } from 'react';
// MongoDB Migration
import mongoAPI from '../utils/apiMongoDB';
import toast from 'react-hot-toast';
const api = mongoAPI; // Alias for backward compatibility
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Badge
} from '@mui/material';
import {
  PlayCircle as LiveIcon,
  Stop as StopIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  Star as FeaturedIcon,
  Delete as DeleteIcon,
  Message as MessageIcon,
  People as PeopleIcon
} from '@mui/icons-material';

const Livestreams = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedStream, setSelectedStream] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [stats, setStats] = useState({
    active: 0,
    ended: 0,
    totalViewers: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchStreams();
    fetchStats();
    
    // Auto-refresh every 10 seconds for active streams
    const interval = setInterval(() => {
      if (selectedTab === 0) {
        fetchStreams();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedTab]);

  const fetchStreams = async () => {
    setLoading(true);
    try {
      const status = selectedTab === 0 ? 'live' : selectedTab === 1 ? 'ended' : '';
      const response = await api.get('/api/livestreams/admin/all', {
        params: {
          status,
          limit: 50
        }
      });
      const data = response?.data?.data?.streams || response?.data?.streams || [];
      setStreams(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching streams:', error);
      toast.error('Failed to fetch livestreams');
      setStreams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/livestreams/admin/stats');
      const data = response?.data?.data || response?.data || {};
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleEndStream = async (streamId) => {
    if (!window.confirm('End this livestream?')) return;

    try {
      await api.post(`/api/livestreams/admin/${streamId}/end`, { reason: 'Admin ended stream' });
      toast.success('Stream ended successfully');
      fetchStreams();
      fetchStats();
      alert('Stream ended successfully');
    } catch (error) {
      console.error('Error ending stream:', error);
      alert('Failed to end stream');
    }
  };

  const handleFeatureStream = async (streamId, currentFeatured) => {
    try {
      await api.put(`/api/livestreams/admin/${streamId}/feature`, { 
        featured: !currentFeatured 
      });
      toast.success(`Stream ${!currentFeatured ? 'featured' : 'unfeatured'} successfully`);
      fetchStreams();
    } catch (error) {
      console.error('Error featuring stream:', error);
      toast.error('Failed to update featured status');
    }
  };

  const handleViewDetails = (stream) => {
    setSelectedStream(stream);
    setDetailsOpen(true);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Livestream Management
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Streams
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {stats.active || 0}
                  </Typography>
                </Box>
                <Badge badgeContent="LIVE" color="error">
                  <LiveIcon sx={{ fontSize: 48, opacity: 0.5 }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Viewers
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(stats.totalViewers)}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Ended Today
                  </Typography>
                  <Typography variant="h4">
                    {stats.ended || 0}
                  </Typography>
                </Box>
                <StopIcon sx={{ fontSize: 48, color: 'secondary.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    ${formatNumber(stats.totalRevenue)}
                  </Typography>
                </Box>
                <FeaturedIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
          <Tab label={`Active Streams (${stats.active || 0})`} />
          <Tab label="Ended Streams" />
          <Tab label="All Streams" />
        </Tabs>
      </Paper>

      {/* Streams Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Stream</TableCell>
                <TableCell>Host</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Viewers</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Revenue</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {streams.map((stream) => (
                <TableRow key={stream._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {stream.thumbnail && (
                        <img 
                          src={stream.thumbnail} 
                          alt="" 
                          style={{ width: 80, height: 45, borderRadius: 4, objectFit: 'cover' }}
                        />
                      )}
                      <Box>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {stream.title}
                        </Typography>
                        {stream.featured && (
                          <Chip size="small" label="Featured" color="primary" icon={<FeaturedIcon />} />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={stream.host?.avatar} sx={{ width: 32, height: 32 }}>
                        {stream.host?.username?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2">
                        {stream.host?.username || 'Unknown'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="small"
                      label={stream.status}
                      color={stream.status === 'live' ? 'error' : stream.status === 'ended' ? 'default' : 'warning'}
                      icon={stream.status === 'live' ? <LiveIcon /> : undefined}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PeopleIcon fontSize="small" />
                      <Typography variant="body2">
                        {formatNumber(stream.viewerCount || 0)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {stream.status === 'live' && stream.startedAt ? 
                      formatDuration(Math.floor((Date.now() - new Date(stream.startedAt)) / 1000)) :
                      stream.duration ? formatDuration(stream.duration) : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="success.main">
                      ${(stream.revenue || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {stream.startedAt ? new Date(stream.startedAt).toLocaleString() : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => handleViewDetails(stream)}>
                        <ViewIcon />
                      </IconButton>
                      {stream.status === 'live' && (
                        <>
                          <IconButton size="small" color="primary" onClick={() => handleFeatureStream(stream._id)}>
                            <FeaturedIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleEndStream(stream._id)}>
                            <StopIcon />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Stream Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Stream Details</DialogTitle>
        <DialogContent>
          {selectedStream && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  {selectedStream.thumbnail && (
                    <img 
                      src={selectedStream.thumbnail} 
                      alt={selectedStream.title}
                      style={{ width: '100%', borderRadius: 8 }}
                    />
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6">{selectedStream.title}</Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {selectedStream.description}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2"><strong>Host:</strong> {selectedStream.host?.username}</Typography>
                    <Typography variant="body2"><strong>Status:</strong> {selectedStream.status}</Typography>
                    <Typography variant="body2"><strong>Current Viewers:</strong> {formatNumber(selectedStream.viewerCount || 0)}</Typography>
                    <Typography variant="body2"><strong>Peak Viewers:</strong> {formatNumber(selectedStream.peakViewers || 0)}</Typography>
                    <Typography variant="body2"><strong>Total Viewers:</strong> {formatNumber(selectedStream.totalViewers || 0)}</Typography>
                    <Typography variant="body2"><strong>Revenue:</strong> ${(selectedStream.revenue || 0).toFixed(2)}</Typography>
                    <Typography variant="body2"><strong>Gifts Received:</strong> {selectedStream.giftsReceived || 0}</Typography>
                  </Box>

                  {selectedStream.tags && selectedStream.tags.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="textSecondary">Tags:</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                        {selectedStream.tags.map((tag, index) => (
                          <Chip key={index} label={tag} size="small" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Grid>
              </Grid>

              {selectedStream.analytics && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Analytics</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="caption" color="textSecondary">Likes</Typography>
                          <Typography variant="h6">{formatNumber(selectedStream.analytics.likes || 0)}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="caption" color="textSecondary">Comments</Typography>
                          <Typography variant="h6">{formatNumber(selectedStream.analytics.comments || 0)}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="caption" color="textSecondary">Shares</Typography>
                          <Typography variant="h6">{formatNumber(selectedStream.analytics.shares || 0)}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="caption" color="textSecondary">Avg Watch Time</Typography>
                          <Typography variant="h6">{formatDuration(selectedStream.analytics.avgWatchTime || 0)}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}
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

export default Livestreams;

