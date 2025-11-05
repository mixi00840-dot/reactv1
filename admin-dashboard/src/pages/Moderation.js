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
  Chip,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  Flag as FlagIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const Moderation = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    flagged: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchQueue();
    fetchStats();
  }, [selectedTab]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const status = selectedTab === 0 ? 'pending' : selectedTab === 1 ? 'flagged' : 'all';
      
      const response = await api.get(
        `/api/moderation/queue?status=${status}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setQueue(response?.items || response?.data?.items || []);
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(
        `/api/moderation/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      await api.post(
        `/api/moderation/approve/${itemId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchQueue();
      fetchStats();
      setDetailsOpen(false);
      alert('Content approved');
    } catch (error) {
      console.error('Error approving content:', error);
      alert('Failed to approve content');
    }
  };

  const handleReject = async (itemId) => {
    if (!rejectReason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.post(
        `/api/moderation/reject/${itemId}`,
        { reason: rejectReason, action: 'takedown' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchQueue();
      fetchStats();
      setDetailsOpen(false);
      setRejectReason('');
      alert('Content rejected');
    } catch (error) {
      console.error('Error rejecting content:', error);
      alert('Failed to reject content');
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Moderation Dashboard
      </Typography>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
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
              <Typography color="textSecondary" gutterBottom>Flagged</Typography>
              <Typography variant="h4" color="error.main">{stats.flagged || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Approved Today</Typography>
              <Typography variant="h4" color="success.main">{stats.approved || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Rejected Today</Typography>
              <Typography variant="h4">{stats.rejected || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
          <Tab label={`Pending (${stats.pending || 0})`} />
          <Tab label={`Flagged (${stats.flagged || 0})`} />
          <Tab label="All Content" />
        </Tabs>
      </Paper>

      {/* Queue Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Content</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Creator</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Flags</TableCell>
                <TableCell>AI Score</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {queue.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.thumbnailUrl && (
                        <img src={item.thumbnailUrl} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }} />
                      )}
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {item.caption || item.title || 'Untitled'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={item.type || 'video'} />
                  </TableCell>
                  <TableCell>{item.user?.username || 'Unknown'}</TableCell>
                  <TableCell>
                    <Chip 
                      size="small"
                      label={item.moderationStatus}
                      color={
                        item.moderationStatus === 'approved' ? 'success' :
                        item.moderationStatus === 'rejected' ? 'error' :
                        item.moderationStatus === 'flagged' ? 'error' : 'warning'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {item.flags && item.flags.length > 0 && (
                      <Chip 
                        size="small" 
                        icon={<FlagIcon />}
                        label={item.flags.length}
                        color="error"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {item.aiModeration?.overallScore ? (
                      <Box>
                        <Typography variant="caption">
                          {(item.aiModeration.overallScore * 100).toFixed(0)}%
                        </Typography>
                        {item.aiModeration.flagged && (
                          <WarningIcon fontSize="small" color="error" />
                        )}
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button size="small" onClick={() => handleViewDetails(item)}>
                        <ViewIcon />
                      </Button>
                      {item.moderationStatus === 'pending' && (
                        <>
                          <Button size="small" color="success" onClick={() => handleApprove(item._id)}>
                            <ApproveIcon />
                          </Button>
                          <Button size="small" color="error" onClick={() => handleViewDetails(item)}>
                            <RejectIcon />
                          </Button>
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

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Content Moderation</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box>
              {selectedItem.url && (
                <Box sx={{ mb: 2 }}>
                  {selectedItem.type === 'video' ? (
                    <video controls style={{ width: '100%', maxHeight: 400 }}>
                      <source src={selectedItem.url} />
                    </video>
                  ) : (
                    <img src={selectedItem.url} alt="" style={{ width: '100%' }} />
                  )}
                </Box>
              )}
              
              <Typography variant="body2"><strong>Creator:</strong> {selectedItem.user?.username}</Typography>
              <Typography variant="body2"><strong>Caption:</strong> {selectedItem.caption}</Typography>
              <Typography variant="body2"><strong>Type:</strong> {selectedItem.type}</Typography>
              
              {selectedItem.aiModeration && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">AI Moderation Results:</Typography>
                  <Typography variant="body2">NSFW: {(selectedItem.aiModeration.nsfw?.score * 100 || 0).toFixed(1)}%</Typography>
                  <Typography variant="body2">Violence: {(selectedItem.aiModeration.violence?.score * 100 || 0).toFixed(1)}%</Typography>
                  <Typography variant="body2">Hate: {(selectedItem.aiModeration.hate?.score * 100 || 0).toFixed(1)}%</Typography>
                </Box>
              )}

              {selectedItem.flags && selectedItem.flags.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">User Reports:</Typography>
                  {selectedItem.flags.map((flag, index) => (
                    <Chip key={index} label={flag.reason} size="small" sx={{ mr: 0.5, mt: 0.5 }} />
                  ))}
                </Box>
              )}

              {selectedItem.moderationStatus === 'pending' && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Rejection Reason (if rejecting)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  sx={{ mt: 2 }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedItem?.moderationStatus === 'pending' && (
            <>
              <Button onClick={() => handleApprove(selectedItem._id)} color="success" variant="contained">
                Approve
              </Button>
              <Button onClick={() => handleReject(selectedItem._id)} color="error" variant="contained">
                Reject
              </Button>
            </>
          )}
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Moderation;

