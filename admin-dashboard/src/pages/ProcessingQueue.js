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
  Chip,
  LinearProgress,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  HourglassEmpty as QueueIcon
} from '@mui/icons-material';

const ProcessingQueue = () => {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({
    active: 0,
    waiting: 0,
    completed: 0,
    failed: 0
  });
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchQueue();
    fetchStats();

    // Auto-refresh every 5 seconds
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchQueue();
        fetchStats();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchQueue = async () => {
    try {
      const payload = await api.get('/api/transcode/queue');
      setQueue(payload?.jobs || []);
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const payload = await api.get('/api/transcode/stats');
      setStats(payload?.stats || payload || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelJob = async (jobId) => {
    if (!window.confirm('Cancel this processing job?')) return;

    try {
      await api.post(`/api/transcode/${jobId}/cancel`, {});
      fetchQueue();
      fetchStats();
    } catch (error) {
      console.error('Error canceling job:', error);
      alert('Failed to cancel job');
    }
  };

  const handleRetryJob = async (jobId) => {
    try {
      await api.post(`/api/transcode/${jobId}/retry`, {});
      fetchQueue();
      fetchStats();
      alert('Job queued for retry');
    } catch (error) {
      console.error('Error retrying job:', error);
      alert('Failed to retry job');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'processing':
        return <PlayIcon color="primary" />;
      case 'waiting':
      case 'queued':
        return <QueueIcon color="warning" />;
      case 'completed':
        return <CheckIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <QueueIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'processing':
        return 'primary';
      case 'waiting':
      case 'queued':
        return 'warning';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Processing Queue
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={autoRefresh ? 'contained' : 'outlined'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchQueue();
              fetchStats();
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Jobs
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {stats.active || 0}
                  </Typography>
                </Box>
                <PlayIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.5 }} />
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
                    Waiting
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.waiting || 0}
                  </Typography>
                </Box>
                <QueueIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.5 }} />
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
                    Completed Today
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.completed || 0}
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
                    Failed
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {stats.failed || 0}
                  </Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 48, color: 'error.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Queue Table */}
      {loading && queue.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : queue.length === 0 ? (
        <Alert severity="info">No jobs in the queue</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Job ID</TableCell>
                <TableCell>Content</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {queue.map((job) => (
                <TableRow key={job.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(job.status)}
                      <Chip
                        size="small"
                        label={job.status}
                        color={getStatusColor(job.status)}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {job.id?.substring(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {job.data?.contentId && (
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {job.data.title || job.data.contentId}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={job.data?.type || 'video'} />
                  </TableCell>
                  <TableCell>
                    {job.progress !== undefined && job.status === 'active' ? (
                      <Box sx={{ width: 100 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={job.progress}
                            sx={{ flex: 1 }}
                          />
                          <Typography variant="caption">
                            {Math.round(job.progress)}%
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        {job.status === 'waiting' ? 'Queued' : '-'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatBytes(job.data?.fileSize)}
                  </TableCell>
                  <TableCell>
                    {job.processedOn ? (
                      formatDuration(Date.now() - new Date(job.processedOn).getTime())
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {job.timestamp ? new Date(job.timestamp).toLocaleTimeString() : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {(job.status === 'active' || job.status === 'waiting') && (
                        <Tooltip title="Cancel">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleCancelJob(job.id)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {job.status === 'failed' && (
                        <Tooltip title="Retry">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleRetryJob(job.id)}
                          >
                            <RefreshIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Error Log Section */}
      {stats.recentErrors && stats.recentErrors.length > 0 && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom color="error">
            Recent Errors
          </Typography>
          {stats.recentErrors.slice(0, 5).map((error, index) => (
            <Alert severity="error" key={index} sx={{ mb: 1 }}>
              <Typography variant="body2">
                <strong>{new Date(error.timestamp).toLocaleString()}:</strong> {error.message}
              </Typography>
            </Alert>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default ProcessingQueue;
