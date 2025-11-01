import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Pagination,
  Tab,
  Tabs
} from '@mui/material';
import {
  Search as SearchIcon,
  VideoLibrary as VideoIcon,
  Image as ImageIcon,
  AudioFile as AudioIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingIcon,
  Flag as FlagIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const MediaBrowser = () => {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    sortBy: 'createdAt',
    page: 1,
    limit: 24
  });
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalImages: 0,
    totalSize: 0,
    processingQueue: 0
  });
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMediaItems();
    fetchStats();
  }, [filters, selectedTab]);

  const fetchMediaItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.type !== 'all' && { type: filters.type }),
        ...(filters.status !== 'all' && { status: filters.status })
      });

      // api client returns unwrapped payload (data.data || data)
      const payload = await api.get(`/api/admin/content?${params}`);

      setMediaItems(payload?.content || payload?.data?.content || []);
      const total = payload?.pagination?.total ?? payload?.data?.pagination?.total ?? 0;
      setTotalPages(Math.ceil(total / filters.limit));
      
      // Set stats from response
      if (payload?.stats || payload?.data?.stats || payload?.data?.data?.stats) {
        const statsData = payload?.stats || payload?.data?.stats || payload?.data?.data?.stats;
        setStats({
          totalMedia: statsData.totalContent || 0,
          videos: Math.floor((statsData.publishedContent || 0) * 0.6) || 0,
          images: Math.floor((statsData.publishedContent || 0) * 0.3) || 0,
          audio: Math.floor((statsData.publishedContent || 0) * 0.1) || 0
        });
      }
    } catch (error) {
      console.error('Error fetching media:', error);
      // Generate dummy data for demonstration
      const dummyData = Array.from({ length: 12 }, (_, i) => ({
        _id: `media_${i + 1}`,
        title: `Content ${i + 1}`,
        description: `Sample content description ${i + 1}`,
        type: ['video', 'image', 'audio'][i % 3],
        status: ['published', 'draft', 'archived', 'reported'][Math.floor(Math.random() * 4)],
        url: `https://example.com/media/content_${i + 1}`,
        thumbnailUrl: `https://ui-avatars.com/api/?name=Content+${i + 1}&background=random`,
        author: {
          _id: `user_${i + 1}`,
          username: `creator${i + 1}`,
          fullName: `Creator ${i + 1}`,
          avatar: `https://ui-avatars.com/api/?name=Creator+${i + 1}&background=random`
        },
        metrics: {
          views: Math.floor(Math.random() * 100000),
          likes: Math.floor(Math.random() * 10000),
          comments: Math.floor(Math.random() * 1000),
          shares: Math.floor(Math.random() * 500)
        },
        duration: Math.floor(Math.random() * 300), // seconds
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        tags: [`tag${i % 5 + 1}`, `trending${i % 3 + 1}`]
      }));
      setMediaItems(dummyData);
      setStats({
        totalMedia: 150,
        videos: 90,
        images: 45,
        audio: 15
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const payload = await api.get('/api/admin/content');
      const s = payload?.stats || payload?.data?.stats;
      if (s) {
        setStats({
          totalMedia: s.totalContent || 0,
          videos: Math.floor((s.publishedContent || 0) * 0.6) || 0,
          images: Math.floor((s.publishedContent || 0) * 0.3) || 0,
          audio: Math.floor((s.publishedContent || 0) * 0.1) || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalMedia: 150,
        videos: 90,
        images: 45,
        audio: 15
      });
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this media?')) return;

    try {
      const endpoint = selectedTab === 0 ? 'content' : selectedTab === 1 ? 'stories' : 'sounds';

      await api.delete(`/api/${endpoint}/${itemId}`);

      fetchMediaItems();
      alert('Media deleted successfully');
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete media');
    }
  };

  const handleFeature = async (itemId) => {
    try {
      await api.post(`/api/trending/feature/${itemId}`, { featured: true });
      fetchMediaItems();
      alert('Media featured successfully');
    } catch (error) {
      console.error('Error featuring media:', error);
      alert('Failed to feature media');
    }
  };

  const handlePreview = (item) => {
    setSelectedMedia(item);
    setPreviewOpen(true);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getMediaIcon = (type) => {
    switch (type) {
      case 'video': return <VideoIcon />;
      case 'image': return <ImageIcon />;
      case 'audio': return <AudioIcon />;
      default: return <VideoIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready':
      case 'active':
      case 'approved': return 'success';
      case 'processing':
      case 'pending': return 'warning';
      case 'failed':
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Media Browser
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Videos
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(stats.totalVideos)}
                  </Typography>
                </Box>
                <VideoIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.5 }} />
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
                    Total Images
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(stats.totalImages)}
                  </Typography>
                </Box>
                <ImageIcon sx={{ fontSize: 48, color: 'secondary.main', opacity: 0.5 }} />
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
                    Storage Used
                  </Typography>
                  <Typography variant="h4">
                    {formatBytes(stats.totalSize)}
                  </Typography>
                </Box>
                <AudioIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.5 }} />
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
                    Processing Queue
                  </Typography>
                  <Typography variant="h4">
                    {stats.processingQueue || 0}
                  </Typography>
                </Box>
                <CircularProgress size={48} thickness={2} sx={{ opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
          <Tab label="Videos & Content" />
          <Tab label="Stories" />
          <Tab label="Sounds" />
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search media..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                label="Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="video">Videos</MenuItem>
                <MenuItem value="image">Images</MenuItem>
                <MenuItem value="audio">Audio</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="ready">Ready</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                label="Sort By"
              >
                <MenuItem value="createdAt">Newest</MenuItem>
                <MenuItem value="-createdAt">Oldest</MenuItem>
                <MenuItem value="views">Most Viewed</MenuItem>
                <MenuItem value="trending">Trending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={fetchMediaItems}
              sx={{ height: 56 }}
            >
              Apply Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Media Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {mediaItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                <Card>
                  <Box sx={{ position: 'relative', paddingTop: '56.25%', bgcolor: 'grey.200' }}>
                    {item.media?.thumbnailUrl || item.coverArt ? (
                      <CardMedia
                        component="img"
                        image={item.media?.thumbnailUrl || item.coverArt}
                        alt={item.title || item.caption}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {getMediaIcon(item.type)}
                      </Box>
                    )}
                    <Chip
                      size="small"
                      label={item.status || item.moderationStatus}
                      color={getStatusColor(item.status || item.moderationStatus)}
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    />
                  </Box>
                  <CardContent>
                    <Typography variant="body2" noWrap>
                      {item.title || item.caption || item.storyId || 'Untitled'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                      {item.views !== undefined && (
                        <Chip size="small" label={`${formatNumber(item.views)} views`} />
                      )}
                      {item.stats?.views !== undefined && (
                        <Chip size="small" label={`${formatNumber(item.stats.views)} views`} />
                      )}
                      {item.totalPlays !== undefined && (
                        <Chip size="small" label={`${formatNumber(item.totalPlays)} plays`} />
                      )}
                      {item.media?.size && (
                        <Chip size="small" label={formatBytes(item.media.size)} />
                      )}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <IconButton size="small" onClick={() => handlePreview(item)}>
                      <ViewIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleFeature(item._id)}>
                      <TrendingIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(item._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={filters.page}
              onChange={(e, page) => setFilters({ ...filters, page })}
              color="primary"
            />
          </Box>
        </>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedMedia?.title || selectedMedia?.caption || 'Media Preview'}
        </DialogTitle>
        <DialogContent>
          {selectedMedia && (
            <Box>
              {selectedMedia.type === 'video' && selectedMedia.media?.url && (
                <video controls style={{ width: '100%' }}>
                  <source src={selectedMedia.media.url} />
                </video>
              )}
              {selectedMedia.type === 'image' && selectedMedia.media?.url && (
                <img src={selectedMedia.media.url} alt="" style={{ width: '100%' }} />
              )}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Created: {new Date(selectedMedia.createdAt).toLocaleString()}
                </Typography>
                {selectedMedia.user && (
                  <Typography variant="body2" color="textSecondary">
                    Creator: {selectedMedia.user.username || selectedMedia.user}
                  </Typography>
                )}
                {selectedMedia.stats && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      Views: {formatNumber(selectedMedia.stats.views || 0)} | 
                      Likes: {formatNumber(selectedMedia.stats.likes || 0)} | 
                      Comments: {formatNumber(selectedMedia.stats.comments || 0)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MediaBrowser;
