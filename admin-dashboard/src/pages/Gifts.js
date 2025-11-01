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
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';

const Gifts = () => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [giftDialog, setGiftDialog] = useState(false);
  const [editingGift, setEditingGift] = useState(null);
  const [stats, setStats] = useState({
    totalGifts: 0,
    totalRevenue: 0,
    giftsSentToday: 0,
    popularGift: ''
  });

  const [giftForm, setGiftForm] = useState({
    name: '',
    description: '',
    coinPrice: '',
    imageUrl: '',
    animationUrl: '',
    category: 'standard',
    rarity: 'common'
  });

  useEffect(() => {
    fetchGifts();
    fetchStats();
  }, []);

  const fetchGifts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(
        `/api/admin/gifts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response?.data?.gifts || response?.gifts || response?.data || response;
      setGifts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(
        `/api/admin/gifts/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response?.data || response || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSaveGift = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (editingGift) {
        await api.put(
          `/api/admin/gifts/${editingGift._id}`,
          giftForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Gift updated successfully');
      } else {
        await api.post(
          `/api/admin/gifts`,
          giftForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Gift created successfully');
      }

      setGiftDialog(false);
      setEditingGift(null);
      setGiftForm({
        name: '',
        description: '',
        coinPrice: '',
        imageUrl: '',
        animationUrl: '',
        category: 'standard',
        rarity: 'common'
      });
      fetchGifts();
      fetchStats();
    } catch (error) {
      console.error('Error saving gift:', error);
      alert('Failed to save gift');
    }
  };

  const handleEditGift = (gift) => {
    setEditingGift(gift);
    setGiftForm({
      name: gift.name,
      description: gift.description || '',
      coinPrice: gift.coinPrice,
      imageUrl: gift.imageUrl || '',
      animationUrl: gift.animationUrl || '',
      category: gift.category || 'standard',
      rarity: gift.rarity || 'common'
    });
    setGiftDialog(true);
  };

  const handleDeleteGift = async (giftId) => {
    if (!window.confirm('Are you sure you want to delete this gift?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(
        `/api/admin/gifts/${giftId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Gift deleted successfully');
      fetchGifts();
      fetchStats();
    } catch (error) {
      console.error('Error deleting gift:', error);
      alert('Failed to delete gift');
    }
  };

  const filteredGifts = gifts.filter(gift =>
    gift.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gifts Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingGift(null);
            setGiftForm({
              name: '',
              description: '',
              coinPrice: '',
              imageUrl: '',
              animationUrl: '',
              category: 'standard',
              rarity: 'common'
            });
            setGiftDialog(true);
          }}
        >
          Create Gift
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Gifts</Typography>
              <Typography variant="h4">{stats.totalGifts || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Revenue</Typography>
              <Typography variant="h4" color="success.main">
                ${(stats.totalRevenue || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Gifts Sent Today</Typography>
              <Typography variant="h4" color="primary.main">{stats.giftsSentToday || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Most Popular</Typography>
              <Typography variant="h6">{stats.popularGift || 'N/A'}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search gifts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Paper>

      {/* Gifts Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Gift</TableCell>
                <TableCell>Price (Coins)</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Rarity</TableCell>
                <TableCell>Times Sent</TableCell>
                <TableCell>Revenue</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGifts.map((gift) => (
                <TableRow key={gift._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        component="img"
                        src={gift.imageUrl || '/default-gift.png'}
                        alt={gift.name}
                        sx={{ width: 50, height: 50, borderRadius: 1 }}
                        onError={(e) => { e.target.src = '/default-gift.png'; }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">{gift.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {gift.description}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold" color="primary.main">
                      🪙 {gift.coinPrice}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={gift.category} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={gift.rarity}
                      color={
                        gift.rarity === 'legendary' ? 'error' :
                        gift.rarity === 'epic' ? 'secondary' :
                        gift.rarity === 'rare' ? 'primary' :
                        'default'
                      }
                    />
                  </TableCell>
                  <TableCell>{gift.timesSent || 0}</TableCell>
                  <TableCell>
                    ${((gift.timesSent || 0) * gift.coinPrice * 0.01).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditGift(gift)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteGift(gift._id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Gift Dialog */}
      <Dialog open={giftDialog} onClose={() => setGiftDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGift ? 'Edit Gift' : 'Create Gift'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Gift Name"
                value={giftForm.name}
                onChange={(e) => setGiftForm({ ...giftForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={giftForm.description}
                onChange={(e) => setGiftForm({ ...giftForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Price (Coins)"
                value={giftForm.coinPrice}
                onChange={(e) => setGiftForm({ ...giftForm, coinPrice: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Rarity"
                value={giftForm.rarity}
                onChange={(e) => setGiftForm({ ...giftForm, rarity: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL"
                value={giftForm.imageUrl}
                onChange={(e) => setGiftForm({ ...giftForm, imageUrl: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Animation URL (optional)"
                value={giftForm.animationUrl}
                onChange={(e) => setGiftForm({ ...giftForm, animationUrl: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGiftDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveGift}>
            {editingGift ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Gifts;
