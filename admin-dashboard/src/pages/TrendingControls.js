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
  Slider,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  History as HistoryIcon,
  Calculate as CalculateIcon,
  Save as SaveIcon
} from '@mui/icons-material';

const TrendingControls = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    weights: {
      watchTime: 0.35,
      likes: 0.20,
      shares: 0.20,
      comments: 0.10,
      completionRate: 0.10,
      recency: 0.05
    },
    thresholds: {
      minViews: 100,
      minEngagement: 10,
      decayHalfLife: 48
    }
  });
  const [originalConfig, setOriginalConfig] = useState(null);
  const [history, setHistory] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchConfig();
    fetchHistory();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/trending/admin/config');
      const configData = response?.data?.data?.config || response?.data?.config || response?.config;
      setConfig(configData);
      setOriginalConfig(configData);
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Failed to fetch trending configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/trending/admin/config/history', {
        params: { limit: 10 }
      });
      setHistory(response?.data?.data?.history || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleWeightChange = (key, value) => {
    setConfig({
      ...config,
      weights: {
        ...config.weights,
        [key]: value / 100
      }
    });
  };

  const handleThresholdChange = (key, value) => {
    setConfig({
      ...config,
      thresholds: {
        ...config.thresholds,
        [key]: value
      }
    });
  };

  const handleSaveWeights = async () => {
    // Validate weights sum to 1.0
    const sum = Object.values(config.weights).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.001) {
      toast.error('Weights must sum to 100%');
      return;
    }

    setSaving(true);
    try {
      await api.put('/api/trending/admin/config', { 
        weights: config.weights,
        thresholds: config.thresholds 
      });
      toast.success('Configuration updated successfully!');
      setSuccessMessage('Weights updated successfully!');
      fetchConfig();
      fetchHistory();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving weights:', error);
      toast.error('Failed to save weights');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveThresholds = async () => {
    setSaving(true);
    try {
      await api.put('/api/trending/admin/config', { 
        weights: config.weights,
        thresholds: config.thresholds 
      });
      toast.success('Thresholds updated successfully!');
      setSuccessMessage('Thresholds updated successfully!');
      fetchConfig();
      fetchHistory();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving thresholds:', error);
      toast.error('Failed to save thresholds');
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    if (!window.confirm('Recalculate trending scores for all content? This may take a few minutes.')) {
      return;
    }

    setSaving(true);
    try {
      await api.post('/api/trending/admin/recalculate', {
        category: 'overall',
        period: 'daily'
      });
      toast.success('Trending calculation started. This will complete in the background.');
    } catch (error) {
      console.error('Error triggering recalculation:', error);
      toast.error('Failed to trigger recalculation');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (originalConfig) {
      setConfig(originalConfig);
    }
  };

  const weightSum = Object.values(config.weights).reduce((a, b) => a + b, 0);
  const isValidWeights = Math.abs(weightSum - 1.0) < 0.001;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Trending Algorithm Controls
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {/* Weight Configuration */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrendingIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Algorithm Weights</Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Adjust the importance of each factor in the trending algorithm. Total must equal 100%.
          Current total: <strong>{(weightSum * 100).toFixed(1)}%</strong>
          {!isValidWeights && <Typography color="error"> - Must equal 100%!</Typography>}
        </Alert>

        <Grid container spacing={3}>
          {Object.entries(config.weights).map(([key, value]) => (
            <Grid item xs={12} md={6} key={key}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">
                      {key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())}
                    </Typography>
                    <Chip 
                      label={`${(value * 100).toFixed(0)}%`} 
                      color={value > 0 ? 'primary' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Slider
                    value={value * 100}
                    onChange={(e, v) => handleWeightChange(key, v)}
                    min={0}
                    max={100}
                    step={1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 50, label: '50%' },
                      { value: 100, label: '100%' }
                    ]}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {key === 'watchTime' && 'How much of the video viewers watch'}
                    {key === 'likes' && 'Number of likes the content receives'}
                    {key === 'shares' && 'How often the content is shared'}
                    {key === 'comments' && 'Engagement through comments'}
                    {key === 'completionRate' && 'Percentage of viewers who finish watching'}
                    {key === 'recency' && 'How recent the content is (decay factor)'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            onClick={handleSaveWeights}
            disabled={!isValidWeights || saving}
            startIcon={<SaveIcon />}
          >
            Save Weights
          </Button>
          <Button variant="outlined" onClick={resetToDefaults}>
            Reset to Current
          </Button>
        </Box>
      </Paper>

      {/* Threshold Configuration */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CalculateIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Algorithm Thresholds</Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Set minimum requirements for content to be considered for trending.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body1" gutterBottom>
                  Minimum Views
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={config.thresholds.minViews}
                  onChange={(e) => handleThresholdChange('minViews', parseInt(e.target.value) || 0)}
                  helperText="Minimum views required"
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body1" gutterBottom>
                  Minimum Engagement
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={config.thresholds.minEngagement}
                  onChange={(e) => handleThresholdChange('minEngagement', parseInt(e.target.value) || 0)}
                  helperText="Minimum total engagement (likes + comments + shares)"
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body1" gutterBottom>
                  Decay Half-Life (hours)
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={config.thresholds.decayHalfLife}
                  onChange={(e) => handleThresholdChange('decayHalfLife', parseInt(e.target.value) || 1)}
                  helperText="Time for recency score to decay by 50%"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            onClick={handleSaveThresholds}
            disabled={saving}
            startIcon={<SaveIcon />}
          >
            Save Thresholds
          </Button>
        </Box>
      </Paper>

      {/* Manual Recalculation */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CalculateIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Manual Recalculation</Typography>
        </Box>

        <Alert severity="warning" sx={{ mb: 2 }}>
          Manually trigger a full recalculation of trending scores. This process runs automatically daily at 3 AM.
        </Alert>

        <Button
          variant="outlined"
          color="warning"
          onClick={handleRecalculate}
          disabled={saving}
          startIcon={<CalculateIcon />}
        >
          Recalculate All Trending Scores
        </Button>
      </Paper>

      {/* Configuration History */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <HistoryIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Configuration History</Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Changed By</TableCell>
                <TableCell>Watch Time</TableCell>
                <TableCell>Likes</TableCell>
                <TableCell>Shares</TableCell>
                <TableCell>Comments</TableCell>
                <TableCell>Completion</TableCell>
                <TableCell>Recency</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {new Date(entry.changedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {entry.changedBy?.username || 'System'}
                  </TableCell>
                  <TableCell>{(entry.weights.watchTime * 100).toFixed(0)}%</TableCell>
                  <TableCell>{(entry.weights.likes * 100).toFixed(0)}%</TableCell>
                  <TableCell>{(entry.weights.shares * 100).toFixed(0)}%</TableCell>
                  <TableCell>{(entry.weights.comments * 100).toFixed(0)}%</TableCell>
                  <TableCell>{(entry.weights.completionRate * 100).toFixed(0)}%</TableCell>
                  <TableCell>{(entry.weights.recency * 100).toFixed(0)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default TrendingControls;

