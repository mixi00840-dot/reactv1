import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import mongoAPI from '../utils/apiMongoDB';
import toast from 'react-hot-toast';

const api = mongoAPI;

function DatabaseMonitoring() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbStats, setDbStats] = useState(null);
  const [collections, setCollections] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [slowQueries, setSlowQueries] = useState([]);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchPerformance, 10000); // Refresh every 10s for realtime
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDatabaseStats(),
        fetchCollections(),
        fetchPerformance(),
        fetchSlowQueries()
      ]);
    } catch (error) {
      console.error('Error fetching database data:', error);
      toast.error('Failed to fetch database data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDatabaseStats = async () => {
    try {
      const response = await api.get('/admin/database/stats');
      if (response.success) {
        setDbStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching database stats:', error);
      // Try MongoDB health endpoint as fallback
      try {
        const healthResponse = await api.get('/health/mongodb');
        setDbStats({
          connected: healthResponse.data?.connected || false,
          database: healthResponse.data?.database_name || 'N/A',
          status: healthResponse.data?.status || 'unknown'
        });
      } catch (err) {
        console.error('Error fetching MongoDB health:', err);
      }
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await api.get('/admin/database/collections');
      if (response.success) {
        setCollections(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections([]);
    }
  };

  const fetchPerformance = async () => {
    try {
      const response = await api.get('/admin/database/performance');
      if (response.success) {
        setPerformance(response.data);
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
      setPerformance({
        opsPerSecond: 0,
        readOps: 0,
        writeOps: 0,
        avgLatency: 0
      });
    }
  };

  const fetchSlowQueries = async () => {
    try {
      const response = await api.get('/admin/database/slow-queries?limit=10');
      if (response.success) {
        setSlowQueries(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching slow queries:', error);
      setSlowQueries([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success('Database data refreshed');
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Database Monitoring</Typography>
        <IconButton onClick={handleRefresh} disabled={refreshing} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Connection Status */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Alert 
            severity={dbStats?.connected ? 'success' : 'error'}
            icon={dbStats?.connected ? <CheckIcon /> : <ErrorIcon />}
            sx={{ fontSize: '1.1rem' }}
          >
            <strong>MongoDB Status: {dbStats?.connected ? 'CONNECTED' : 'DISCONNECTED'}</strong>
            {dbStats?.database && ` - Database: ${dbStats.database}`}
          </Alert>
        </Grid>
      </Grid>

      {/* Key Database Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Collections</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {dbStats?.totalCollections || collections.length || 0}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Total Documents: {formatNumber(dbStats?.totalDocuments || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StorageIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Database Size</Typography>
              </Box>
              <Typography variant="h3" color="secondary">
                {formatBytes(dbStats?.dataSize || 0)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Index Size: {formatBytes(dbStats?.indexSize || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SpeedIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Operations</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {performance?.opsPerSecond?.toFixed(1) || 0}/s
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Read: {performance?.readOps || 0} | Write: {performance?.writeOps || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimerIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Avg Latency</Typography>
              </Box>
              <Typography variant="h3" color={performance?.avgLatency > 100 ? 'error' : 'textPrimary'}>
                {performance?.avgLatency?.toFixed(0) || 0}ms
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Connection Pool: {dbStats?.connections?.current || 0} / {dbStats?.connections?.available || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Collections Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Collections Overview
          </Typography>

          {collections.length === 0 ? (
            <Alert severity="info">No collection data available. Connect the monitoring endpoint to view details.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Collection Name</strong></TableCell>
                    <TableCell align="right"><strong>Documents</strong></TableCell>
                    <TableCell align="right"><strong>Size</strong></TableCell>
                    <TableCell align="right"><strong>Avg Doc Size</strong></TableCell>
                    <TableCell align="right"><strong>Indexes</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {collections.map((collection, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{collection.name}</TableCell>
                      <TableCell align="right">{formatNumber(collection.count)}</TableCell>
                      <TableCell align="right">{formatBytes(collection.size)}</TableCell>
                      <TableCell align="right">{formatBytes(collection.avgObjSize)}</TableCell>
                      <TableCell align="right">{collection.indexes || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Slow Queries */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <TimerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Slow Queries ({">"} 100ms)
          </Typography>

          {slowQueries.length === 0 ? (
            <Alert severity="success">No slow queries detected. Database is performing well!</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Collection</strong></TableCell>
                    <TableCell><strong>Operation</strong></TableCell>
                    <TableCell align="right"><strong>Duration (ms)</strong></TableCell>
                    <TableCell><strong>Query</strong></TableCell>
                    <TableCell><strong>Timestamp</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slowQueries.map((query, index) => (
                    <TableRow key={index}>
                      <TableCell>{query.collection}</TableCell>
                      <TableCell>
                        <Chip label={query.operation} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={query.duration} 
                          color={query.duration > 500 ? 'error' : 'warning'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={JSON.stringify(query.query, null, 2)}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              maxWidth: 300, 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              display: 'block'
                            }}
                          >
                            {JSON.stringify(query.query).substring(0, 50)}...
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{new Date(query.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Storage Usage Progress */}
      {dbStats?.storageQuota && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Storage Usage</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flex: 1, mr: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={(dbStats.dataSize / dbStats.storageQuota) * 100} 
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Typography variant="body2">
                {formatBytes(dbStats.dataSize)} / {formatBytes(dbStats.storageQuota)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default DatabaseMonitoring;
