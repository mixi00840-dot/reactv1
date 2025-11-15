import React, { useState, useEffect } from 'react';
// MongoDB Migration
import mongoAPI from '../utils/apiMongoDB';
import toast from 'react-hot-toast';
const api = mongoAPI; // Alias for backward compatibility
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
  TextField,
  IconButton,
  Avatar,
  Tabs,
  Tab
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon
} from '@mui/icons-material';

const Levels = () => {
  const [tabValue, setTabValue] = useState(0);
  const [levels, setLevels] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [stats, setStats] = useState({
    totalLevels: 0,
    totalBadges: 0,
    activeUsers: 0,
    maxLevel: 0
  });

  const [form, setForm] = useState({
    name: '',
    level: '',
    xpRequired: '',
    benefits: '',
    color: '#3f51b5',
    icon: ''
  });

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [tabValue]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (tabValue === 0) {
        const response = await api.get(
          `/api/admin/levels`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = response?.data?.levels || response?.levels || response?.data || response;
        setLevels(Array.isArray(data) ? data : []);
      } else {
        const response = await api.get(
          `/api/admin/badges`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = response?.data?.badges || response?.badges || response?.data || response;
        setBadges(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(
        `/api/admin/levels/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response?.data || response || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = tabValue === 0 ? 'levels' : 'badges';
      
      if (selectedItem) {
        await api.put(
          `/api/admin/${endpoint}/${selectedItem._id}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert(`${tabValue === 0 ? 'Level' : 'Badge'} updated successfully`);
      } else {
        await api.post(
          `/api/admin/${endpoint}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert(`${tabValue === 0 ? 'Level' : 'Badge'} created successfully`);
      }

      setDialog(false);
      setSelectedItem(null);
      setForm({
        name: '',
        level: '',
        xpRequired: '',
        benefits: '',
        color: '#3f51b5',
        icon: ''
      });
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;

    try {
      const token = localStorage.getItem('token');
      const endpoint = tabValue === 0 ? 'levels' : 'badges';
      await api.delete(
        `/api/admin/${endpoint}/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Deleted successfully');
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">User Levels & Badges</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedItem(null);
            setForm({
              name: '',
              level: '',
              xpRequired: '',
              benefits: '',
              color: '#3f51b5',
              icon: ''
            });
            setDialog(true);
          }}
        >
          Create {tabValue === 0 ? 'Level' : 'Badge'}
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Levels</Typography>
              <Typography variant="h4">{stats.totalLevels || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Badges</Typography>
              <Typography variant="h4" color="primary.main">{stats.totalBadges || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Active Users</Typography>
              <Typography variant="h4" color="success.main">{stats.activeUsers || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Max Level</Typography>
              <Typography variant="h4" color="warning.main">{stats.maxLevel || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
          <Tab label="User Levels" icon={<TrophyIcon />} iconPosition="start" />
          <Tab label="Badges & Achievements" icon={<StarIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Levels Table */}
      {tabValue === 0 && (
        loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Level</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>XP Required</TableCell>
                  <TableCell>Benefits</TableCell>
                  <TableCell>Users</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {levels.map((level) => (
                  <TableRow key={level._id} hover>
                    <TableCell>
                      <Chip
                        label={`LVL ${level.level}`}
                        sx={{ bgcolor: level.color, color: 'white', fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{level.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{level.xpRequired?.toLocaleString()} XP</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{level.benefits}</Typography>
                    </TableCell>
                    <TableCell>{level.userCount || 0}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedItem(level);
                            setForm({
                              name: level.name,
                              level: level.level,
                              xpRequired: level.xpRequired,
                              benefits: level.benefits || '',
                              color: level.color || '#3f51b5',
                              icon: level.icon || ''
                            });
                            setDialog(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(level._id)}
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
        )
      )}

      {/* Badges Table */}
      {tabValue === 1 && (
        loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Badge</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Rarity</TableCell>
                  <TableCell>Earned By</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {badges.map((badge) => (
                  <TableRow key={badge._id} hover>
                    <TableCell>
                      <Avatar src={badge.icon} sx={{ bgcolor: badge.color }}>
                        <StarIcon />
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{badge.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{badge.description}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={badge.rarity}
                        color={
                          badge.rarity === 'legendary' ? 'error' :
                          badge.rarity === 'epic' ? 'secondary' :
                          badge.rarity === 'rare' ? 'primary' :
                          'default'
                        }
                      />
                    </TableCell>
                    <TableCell>{badge.earnedBy || 0} users</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedItem(badge);
                            setForm({
                              name: badge.name,
                              description: badge.description,
                              rarity: badge.rarity,
                              color: badge.color || '#3f51b5',
                              icon: badge.icon || ''
                            });
                            setDialog(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(badge._id)}
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
        )
      )}

      {/* Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedItem ? 'Edit' : 'Create'} {tabValue === 0 ? 'Level' : 'Badge'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            {tabValue === 0 ? (
              <>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Level Number"
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="XP Required"
                    value={form.xpRequired}
                    onChange={(e) => setForm({ ...form, xpRequired: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Benefits"
                    value={form.benefits}
                    onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Rarity"
                    value={form.rarity}
                    onChange={(e) => setForm({ ...form, rarity: e.target.value })}
                    SelectProps={{ native: true }}
                  >
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </TextField>
                </Grid>
              </>
            )}
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="color"
                label="Color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Icon URL"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {selectedItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Levels;

