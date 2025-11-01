import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button
} from '@mui/material';
import {
  Storage as StorageIcon,
  CloudUpload as UploadIcon,
  TrendingDown as CompressionIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as ChartTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const StorageStats = () => {
  const [stats, setStats] = useState(null);
  const [cleanupStats, setCleanupStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchCleanupStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const payload = await api.get('/api/analytics/storage');
      setStats(payload);
    } catch (error) {
      console.error('Error fetching storage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCleanupStats = async () => {
    try {
      const payload = await api.get('/api/stories/admin/cleanup/stats');
      setCleanupStats(payload?.stats || payload);
    } catch (error) {
      console.error('Error fetching cleanup stats:', error);
    }
  };

  const triggerCleanup = async () => {
    if (!window.confirm('Trigger manual story cleanup now?')) return;

    try {
      await api.post('/api/stories/admin/cleanup/trigger', {});
      alert('Cleanup triggered successfully');
      fetchCleanupStats();
    } catch (error) {
      console.error('Error triggering cleanup:', error);
      alert('Failed to trigger cleanup');
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  const storageData = stats ? [
    { name: 'Videos', value: stats.videoSize || 0, color: '#2196f3' },
    { name: 'Images', value: stats.imageSize || 0, color: '#4caf50' },
    { name: 'Audio', value: stats.audioSize || 0, color: '#ff9800' },
    { name: 'Other', value: stats.otherSize || 0, color: '#9e9e9e' }
  ] : [];

  const compressionData = stats?.compressionStats ? [
    { name: 'Original', size: stats.compressionStats.originalSize },
    { name: 'Compressed', size: stats.compressionStats.compressedSize }
  ] : [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Storage & Compression Stats
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            fetchStats();
            fetchCleanupStats();
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Storage
                  </Typography>
                  <Typography variant="h4">
                    {formatBytes(stats?.totalSize || 0)}
                  </Typography>
                </Box>
                <StorageIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.5 }} />
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
                    Total Files
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(stats?.totalFiles || 0)}
                  </Typography>
                </Box>
                <UploadIcon sx={{ fontSize: 48, color: 'secondary.main', opacity: 0.5 }} />
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
                    Space Saved
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {formatBytes(stats?.compressionStats?.savedSize || 0)}
                  </Typography>
                </Box>
                <CompressionIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.5 }} />
              </Box>
              <Typography variant="caption" color="textSecondary">
                {stats?.compressionStats?.compressionRatio ? 
                  `${(stats.compressionStats.compressionRatio * 100).toFixed(1)}% compression` : 
                  'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Stories Cleaned
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(cleanupStats?.totalStoriesDeleted || 0)}
                  </Typography>
                </Box>
                <DeleteIcon sx={{ fontSize: 48, color: 'error.main', opacity: 0.5 }} />
              </Box>
              <Typography variant="caption" color="textSecondary">
                {formatBytes(cleanupStats?.totalBytesSaved || 0)} recovered
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Storage Distribution */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Storage Distribution
            </Typography>
            {storageData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={storageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {storageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip formatter={(value) => formatBytes(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Compression Savings
            </Typography>
            {compressionData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={compressionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatBytes(value)} />
                  <ChartTooltip formatter={(value) => formatBytes(value)} />
                  <Bar dataKey="size" fill="#2196f3" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* File Type Breakdown */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          File Type Breakdown
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell align="right">Count</TableCell>
                <TableCell align="right">Total Size</TableCell>
                <TableCell align="right">Avg Size</TableCell>
                <TableCell>Distribution</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats && [
                { type: 'Videos', count: stats.videoCount, size: stats.videoSize, color: 'primary' },
                { type: 'Images', count: stats.imageCount, size: stats.imageSize, color: 'success' },
                { type: 'Audio', count: stats.audioCount, size: stats.audioSize, color: 'warning' },
                { type: 'Other', count: stats.otherCount, size: stats.otherSize, color: 'default' }
              ].map((row) => (
                <TableRow key={row.type}>
                  <TableCell>
                    <Chip label={row.type} color={row.color} size="small" />
                  </TableCell>
                  <TableCell align="right">{formatNumber(row.count || 0)}</TableCell>
                  <TableCell align="right">{formatBytes(row.size || 0)}</TableCell>
                  <TableCell align="right">
                    {row.count > 0 ? formatBytes((row.size || 0) / row.count) : '0 B'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={stats.totalSize > 0 ? ((row.size || 0) / stats.totalSize) * 100 : 0}
                        sx={{ flex: 1, height: 8, borderRadius: 1 }}
                      />
                      <Typography variant="caption">
                        {stats.totalSize > 0 ? (((row.size || 0) / stats.totalSize) * 100).toFixed(1) : '0'}%
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Cleanup Stats */}
      {cleanupStats && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Story Cleanup Statistics
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={triggerCleanup}
            >
              Trigger Manual Cleanup
            </Button>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" variant="caption">
                    Last Run
                  </Typography>
                  <Typography variant="body1">
                    {cleanupStats.lastRun ? new Date(cleanupStats.lastRun).toLocaleString() : 'Never'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" variant="caption">
                    Stories Deleted
                  </Typography>
                  <Typography variant="h6">
                    {formatNumber(cleanupStats.totalStoriesDeleted || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" variant="caption">
                    Files Deleted
                  </Typography>
                  <Typography variant="h6">
                    {formatNumber(cleanupStats.totalFilesDeleted || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" variant="caption">
                    Space Recovered
                  </Typography>
                  <Typography variant="h6">
                    {formatBytes(cleanupStats.totalBytesSaved || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default StorageStats;
