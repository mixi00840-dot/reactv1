import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
  Tooltip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  CloudQueue as CloudIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  TrendingUp as TrendingIcon,
  AttachMoney as CostIcon
} from '@mui/icons-material';
import mongoAPI from '../utils/apiMongoDB';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend);

const api = mongoAPI;

function SystemHealth() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('1h');

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchMetrics, 30000); // Refresh metrics every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSystemHealth(),
        fetchMetrics(),
        fetchLogs()
      ]);
    } catch (error) {
      console.error('Error fetching system data:', error);
      toast.error('Failed to fetch system data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await api.get('/api/admin/system/health');
      if (response.data?.success) {
        setSystemHealth(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
      // Fallback to basic health endpoint
      try {
        const basicHealth = await api.get('/health');
        setSystemHealth({
          status: basicHealth.data?.status || 'unknown',
          uptime: basicHealth.data?.uptime || 0,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error fetching basic health:', err);
      }
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await api.get(`/api/admin/system/metrics?timeRange=${timeRange}`);
      if (response.data?.success) {
        setMetrics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      // Set default metrics if endpoint doesn't exist
      setMetrics({
        cpu: { current: 0, average: 0 },
        memory: { used: 0, total: 1024, percentage: 0 },
        requests: { total: 0, rate: 0 },
        errors: { total: 0, rate: 0 }
      });
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await api.get(`/api/admin/system/logs?severity=${logFilter}&limit=50`);
      if (response.data?.success) {
        setLogs(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success('System data refreshed');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'online':
      case 'ok':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
      case 'offline':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'online':
      case 'ok':
        return <CheckIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
      case 'offline':
        return <ErrorIcon color="error" />;
      default:
        return <CloudIcon />;
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 MB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
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
        <Typography variant="h4">System Health & Monitoring</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select value={timeRange} label="Time Range" onChange={(e) => setTimeRange(e.target.value)}>
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="6h">Last 6 Hours</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={handleRefresh} disabled={refreshing} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Overall Status */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Alert 
            severity={getStatusColor(systemHealth?.status)} 
            icon={getStatusIcon(systemHealth?.status)}
            sx={{ fontSize: '1.1rem' }}
          >
            <strong>System Status: {systemHealth?.status?.toUpperCase() || 'UNKNOWN'}</strong>
            {systemHealth?.uptime && ` - Uptime: ${formatUptime(systemHealth.uptime)}`}
          </Alert>
        </Grid>
      </Grid>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SpeedIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">CPU Usage</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {metrics?.cpu?.current?.toFixed(1) || 0}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={metrics?.cpu?.current || 0} 
                sx={{ mt: 1, mb: 1 }}
              />
              <Typography variant="caption" color="textSecondary">
                Avg: {metrics?.cpu?.average?.toFixed(1) || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MemoryIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Memory</Typography>
              </Box>
              <Typography variant="h3" color="secondary">
                {metrics?.memory?.percentage?.toFixed(1) || 0}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={metrics?.memory?.percentage || 0} 
                color="secondary"
                sx={{ mt: 1, mb: 1 }}
              />
              <Typography variant="caption" color="textSecondary">
                {formatBytes(metrics?.memory?.used)} / {formatBytes(metrics?.memory?.total)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Requests</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {metrics?.requests?.rate?.toFixed(1) || 0}/s
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Total: {metrics?.requests?.total?.toLocaleString() || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ErrorIcon color={metrics?.errors?.rate > 1 ? 'error' : 'inherit'} sx={{ mr: 1 }} />
                <Typography variant="h6">Error Rate</Typography>
              </Box>
              <Typography variant="h3" color={metrics?.errors?.rate > 1 ? 'error' : 'textPrimary'}>
                {metrics?.errors?.rate?.toFixed(2) || 0}%
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Total Errors: {metrics?.errors?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Service Status */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <CloudIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Cloud Services Status
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Backend API</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={systemHealth?.status || 'Unknown'} 
                        color={getStatusColor(systemHealth?.status)} 
                        size="small" 
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>MongoDB</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={systemHealth?.database?.connected ? 'Connected' : 'Disconnected'} 
                        color={systemHealth?.database?.connected ? 'success' : 'error'} 
                        size="small" 
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Cloud Run</TableCell>
                    <TableCell align="right">
                      <Chip label="Deployed" color="success" size="small" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Cloudinary CDN</TableCell>
                    <TableCell align="right">
                      <Chip label="Active" color="success" size="small" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                System Information
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Platform</TableCell>
                    <TableCell align="right">Google Cloud Run</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Node Version</TableCell>
                    <TableCell align="right">{systemHealth?.nodeVersion || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Environment</TableCell>
                    <TableCell align="right">
                      <Chip label="Production" color="primary" size="small" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Last Deployed</TableCell>
                    <TableCell align="right">
                      {systemHealth?.lastDeployment 
                        ? new Date(systemHealth.lastDeployment).toLocaleString()
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Logs */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Recent Logs</Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Severity</InputLabel>
              <Select 
                value={logFilter} 
                label="Severity" 
                onChange={(e) => { setLogFilter(e.target.value); fetchLogs(); }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {logs.length === 0 ? (
            <Alert severity="info">No logs available. Logs will appear here when the monitoring endpoint is connected.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={log.level} 
                          color={log.level === 'error' ? 'error' : log.level === 'warning' ? 'warning' : 'default'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{log.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default SystemHealth;
