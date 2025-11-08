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
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  MusicNote as MusicIcon,
  TrendingUp as TrendingIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon
} from '@mui/icons-material';

const SoundManager = () => {
  const [sounds, setSounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    page: 1,
    limit: 20
  });
  const [stats, setStats] = useState({
    totalSounds: 0,
    pendingReview: 0,
    approved: 0,
    trending: 0
  });
  const [selectedSound, setSelectedSound] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [playingAudio, setPlayingAudio] = useState(null);

  useEffect(() => {
    fetchSounds();
    fetchStats();
  }, [filters, selectedTab]);

  const fetchSounds = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      
      if (selectedTab === 0) {
        endpoint = '/api/sounds/moderation/pending-review';
      } else if (selectedTab === 1) {
        endpoint = '/api/sounds/trending';
      } else {
        endpoint = '/api/sounds/search';
      }

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== 'all' && value !== '') {
          params.append(key, value);
        }
      });

      const payload = await api.get(`${endpoint}?${params}`);
      setSounds(payload?.sounds || []);
      setTotalPages(Math.ceil((payload?.total || 0) / filters.limit));
    } catch (error) {
      console.error('Error fetching sounds:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const payload = await api.get('/api/sounds/admin/stats');
      setStats(payload);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (soundId, featured = false) => {
    try {
      await api.post(`/api/sounds/moderation/approve/${soundId}`,
        { featured }
      );
      fetchSounds();
      fetchStats();
      alert(`Sound ${featured ? 'approved and featured' : 'approved'} successfully`);
    } catch (error) {
      console.error('Error approving sound:', error);
      alert('Failed to approve sound');
    }
  };

  const handleReject = async (soundId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await api.post(`/api/sounds/moderation/reject/${soundId}`,
        { reason }
      );
      fetchSounds();
      fetchStats();
      alert('Sound rejected successfully');
    } catch (error) {
      console.error('Error rejecting sound:', error);
      alert('Failed to reject sound');
    }
  };

  const handleViewDetails = async (soundId) => {
    try {
      const payload = await api.get(`/api/sounds/${soundId}`);
      setSelectedSound(payload?.sound || payload);
      setDetailsOpen(true);
    } catch (error) {
      console.error('Error fetching sound details:', error);
      alert('Failed to load sound details');
    }
  };

  const handlePlayAudio = (audioUrl) => {
    if (playingAudio) {
      playingAudio.pause();
      if (playingAudio.src === audioUrl) {
        setPlayingAudio(null);
        return;
      }
    }
    
    const audio = new Audio(audioUrl);
    audio.play();
    audio.onended = () => setPlayingAudio(null);
    setPlayingAudio(audio);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sound Manager
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Sounds
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(stats.totalSounds)}
                  </Typography>
                </Box>
                <MusicIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.5 }} />
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
                    Pending Review
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.pendingReview || 0}
                  </Typography>
                </Box>
                <CloseIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.5 }} />
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
                    Approved
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {formatNumber(stats.approved)}
                  </Typography>
                </Box>
                <CheckIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.5 }} />
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
                    Trending
                  </Typography>
                  <Typography variant="h4">
                    {stats.trending || 0}
                  </Typography>
                </Box>
                <TrendingIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
          <Tab label="Pending Review" />
          <Tab label="Trending Sounds" />
          <Tab label="All Sounds" />
        </Tabs>
      </Paper>

      {/* Filters */}
      {selectedTab === 2 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search sounds..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="pop">Pop</MenuItem>
                  <MenuItem value="rock">Rock</MenuItem>
                  <MenuItem value="hip_hop">Hip Hop</MenuItem>
                  <MenuItem value="electronic">Electronic</MenuItem>
                  <MenuItem value="jazz">Jazz</MenuItem>
                  <MenuItem value="classical">Classical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant="contained" onClick={fetchSounds} sx={{ height: 56 }}>
                Search
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Sounds Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Play</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Artist</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Usage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sounds.map((sound) => (
                  <TableRow key={sound._id} hover>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handlePlayAudio(sound.fileUrl)}
                        color={playingAudio?.src === sound.fileUrl ? 'primary' : 'default'}
                      >
                        {playingAudio?.src === sound.fileUrl ? <PauseIcon /> : <PlayIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {sound.coverArt && (
                          <img 
                            src={sound.coverArt} 
                            alt="" 
                            style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }}
                          />
                        )}
                        <Typography variant="body2">{sound.title}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{sound.artist || 'Unknown'}</TableCell>
                    <TableCell>{formatDuration(sound.duration)}</TableCell>
                    <TableCell>
                      {sound.category && (
                        <Chip size="small" label={sound.category} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="caption" display="block">
                          {formatNumber(sound.totalPlays)} plays
                        </Typography>
                        <Typography variant="caption" display="block" color="textSecondary">
                          {formatNumber(sound.totalVideos)} videos
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={sound.moderationStatus || sound.status}
                        color={
                          sound.moderationStatus === 'approved' ? 'success' :
                          sound.moderationStatus === 'pending' ? 'warning' :
                          sound.moderationStatus === 'rejected' ? 'error' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {selectedTab === 0 && (
                          <>
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => handleApprove(sound._id, false)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleApprove(sound._id, true)}
                            >
                              Feature
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleReject(sound._id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => handleViewDetails(sound._id)}
                        >
                          Details
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={filters.page}
              onChange={(e, page) => setFilters({ ...filters, page })}
              color="primary"
            />
          </Box>
        </>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Sound Details</DialogTitle>
        <DialogContent>
          {selectedSound && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  {selectedSound.coverArt && (
                    <img 
                      src={selectedSound.coverArt} 
                      alt={selectedSound.title}
                      style={{ width: '100%', borderRadius: 8 }}
                    />
                  )}
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6">{selectedSound.title}</Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {selectedSound.artist}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2"><strong>Album:</strong> {selectedSound.album || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Duration:</strong> {formatDuration(selectedSound.duration)}</Typography>
                    <Typography variant="body2"><strong>Genre:</strong> {selectedSound.genre || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Mood:</strong> {selectedSound.mood || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Tempo:</strong> {selectedSound.tempo ? `${selectedSound.tempo} BPM` : 'N/A'}</Typography>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2"><strong>Total Plays:</strong> {formatNumber(selectedSound.totalPlays)}</Typography>
                    <Typography variant="body2"><strong>Total Videos:</strong> {formatNumber(selectedSound.totalVideos)}</Typography>
                    <Typography variant="body2"><strong>Total Views:</strong> {formatNumber(selectedSound.totalViews)}</Typography>
                    <Typography variant="body2"><strong>Unique Creators:</strong> {formatNumber(selectedSound.uniqueCreators)}</Typography>
                  </Box>

                  {selectedSound.copyrightHolder && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2"><strong>Copyright:</strong> {selectedSound.copyrightHolder}</Typography>
                      <Typography variant="body2"><strong>License:</strong> {selectedSound.licenseType}</Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>

              {selectedSound.recentVideos && selectedSound.recentVideos.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Recent Videos Using This Sound</Typography>
                  <Grid container spacing={2}>
                    {selectedSound.recentVideos.slice(0, 6).map((video) => (
                      <Grid item xs={6} sm={4} key={video._id}>
                        <Card>
                          <CardMedia
                            component="img"
                            height="120"
                            image={video.media?.thumbnailUrl}
                            alt=""
                          />
                          <CardContent sx={{ p: 1 }}>
                            <Typography variant="caption" noWrap>
                              {formatNumber(video.stats?.views || 0)} views
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
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

export default SoundManager;

