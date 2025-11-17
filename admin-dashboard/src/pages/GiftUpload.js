import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  Stack,
  InputAdornment
} from '@mui/material';
import {
  CardGiftcard as GiftIcon,
  Save as SaveIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import UniversalUploader from '../components/upload/UniversalUploader';
import mongoAPI from '../utils/apiMongoDB';
import toast from 'react-hot-toast';

/**
 * Virtual Gifts Upload Page
 * 
 * Features:
 * - Upload gift icons/animations
 * - Pricing in coins
 * - Rarity levels
 * - Categories
 * - Limited edition settings
 */
const GiftUpload = () => {
  // Gift details
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coinPrice, setCoinPrice] = useState('');
  const [category, setCategory] = useState('');
  const [rarity, setRarity] = useState('common');
  
  // Settings
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isLimitedEdition, setIsLimitedEdition] = useState(false);
  const [limitedQuantity, setLimitedQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Upload state
  const [uploadedIcon, setUploadedIcon] = useState([]);
  const [saving, setSaving] = useState(false);

  const categories = [
    { value: 'love', label: '❤️ Love', emoji: '💕' },
    { value: 'fun', label: '😄 Fun', emoji: '🎉' },
    { value: 'support', label: '👏 Support', emoji: '💪' },
    { value: 'celebration', label: '🎊 Celebration', emoji: '🎈' },
    { value: 'luxury', label: '💎 Luxury', emoji: '👑' },
    { value: 'special', label: '⭐ Special', emoji: '✨' }
  ];

  const rarities = [
    { value: 'common', label: 'Common', color: '#9e9e9e' },
    { value: 'rare', label: 'Rare', color: '#2196f3' },
    { value: 'epic', label: 'Epic', color: '#9c27b0' },
    { value: 'legendary', label: 'Legendary', color: '#ff9800' }
  ];

  const handleIconUploaded = (files) => {
    setUploadedIcon(files);
    toast.success('Gift icon uploaded');
  };

  const handleSaveGift = async () => {
    // Validation
    if (!name.trim()) {
      toast.error('Gift name is required');
      return;
    }

    if (!coinPrice || parseFloat(coinPrice) <= 0) {
      toast.error('Please enter a valid coin price');
      return;
    }

    if (uploadedIcon.length === 0) {
      toast.error('Please upload a gift icon');
      return;
    }

    if (!category) {
      toast.error('Please select a category');
      return;
    }

    setSaving(true);

    try {
      const giftData = {
        name: name,
        description: description,
        iconUrl: uploadedIcon[0].url,
        coinPrice: parseFloat(coinPrice),
        category: category,
        rarity: rarity,
        isActive: isActive,
        isFeatured: isFeatured,
        limitedEdition: isLimitedEdition ? {
          isLimited: true,
          quantity: limitedQuantity ? parseInt(limitedQuantity) : null,
          expiryDate: expiryDate || null
        } : undefined,
        cloudinaryData: {
          publicId: uploadedIcon[0].publicId,
          format: uploadedIcon[0].format
        }
      };

      const response = await mongoAPI.post('/api/admin/gifts', giftData);
      
      if (response.success) {
        toast.success('✓ Gift created successfully');
        
        // Reset form
        setName('');
        setDescription('');
        setCoinPrice('');
        setCategory('');
        setRarity('common');
        setIsActive(true);
        setIsFeatured(false);
        setIsLimitedEdition(false);
        setLimitedQuantity('');
        setExpiryDate('');
        setUploadedIcon([]);
      }
    } catch (error) {
      console.error('Error creating gift:', error);
      toast.error('Failed to create gift: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        🎁 Virtual Gifts Upload
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Create virtual gifts that users can send during live streams
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column - Icon & Details */}
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            {/* Gift Icon */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                1️⃣ Gift Icon/Animation
              </Typography>
              <UniversalUploader
                uploadType="image"
                onUploadComplete={handleIconUploaded}
                maxFiles={1}
                maxSizeMB={2}
                multiple={false}
              />
              
              {uploadedIcon.length > 0 && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  ✓ Icon uploaded: {uploadedIcon[0].name}
                </Alert>
              )}
            </Paper>

            {/* Gift Details */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                2️⃣ Gift Details
              </Typography>
              
              <Stack spacing={2}>
                <TextField
                  label="Gift Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  fullWidth
                  placeholder="e.g., Golden Rose, Diamond Ring"
                />

                <TextField
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="What makes this gift special?"
                />

                <TextField
                  label="Coin Price"
                  type="number"
                  value={coinPrice}
                  onChange={(e) => setCoinPrice(e.target.value)}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TrophyIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: <InputAdornment position="end">coins</InputAdornment>
                  }}
                />

                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    label="Category"
                  >
                    {categories.map(cat => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.emoji} {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Rarity</InputLabel>
                  <Select
                    value={rarity}
                    onChange={(e) => setRarity(e.target.value)}
                    label="Rarity"
                  >
                    {rarities.map(rare => (
                      <MenuItem key={rare.value} value={rare.value}>
                        <Chip
                          label={rare.label}
                          size="small"
                          sx={{ bgcolor: rare.color, color: 'white', mr: 1 }}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column - Settings */}
        <Grid item xs={12} md={5}>
          <Stack spacing={3}>
            {/* Status */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                3️⃣ Settings
              </Typography>
              
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                  }
                  label="Active (Available for purchase)"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                    />
                  }
                  label="Featured (Show in highlights)"
                />
              </Stack>
            </Paper>

            {/* Limited Edition */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                4️⃣ Limited Edition
              </Typography>
              
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isLimitedEdition}
                      onChange={(e) => setIsLimitedEdition(e.target.checked)}
                    />
                  }
                  label="Limited Edition"
                />

                {isLimitedEdition && (
                  <>
                    <TextField
                      label="Available Quantity"
                      type="number"
                      value={limitedQuantity}
                      onChange={(e) => setLimitedQuantity(e.target.value)}
                      fullWidth
                      placeholder="Leave empty for unlimited"
                    />

                    <TextField
                      label="Expiry Date"
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />

                    <Alert severity="warning" sx={{ fontSize: '0.875rem' }}>
                      Limited edition gifts create urgency and exclusivity
                    </Alert>
                  </>
                )}
              </Stack>
            </Paper>

            {/* Preview */}
            {uploadedIcon.length > 0 && coinPrice && (
              <Paper sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
                <Typography variant="h6" gutterBottom>
                  Gift Preview
                </Typography>
                <Box textAlign="center" py={2}>
                  <img
                    src={uploadedIcon[0].url}
                    alt={name}
                    style={{ maxWidth: '100px', maxHeight: '100px' }}
                  />
                  <Typography variant="h6" mt={2}>
                    {name || 'Gift Name'}
                  </Typography>
                  <Chip
                    label={`${coinPrice} coins`}
                    sx={{ bgcolor: 'white', color: 'primary.main', mt: 1 }}
                  />
                  <Chip
                    label={rarities.find(r => r.value === rarity)?.label}
                    sx={{
                      bgcolor: rarities.find(r => r.value === rarity)?.color,
                      color: 'white',
                      mt: 1,
                      ml: 1
                    }}
                  />
                </Box>
              </Paper>
            )}

            {/* Save Button */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<SaveIcon />}
              onClick={handleSaveGift}
              disabled={saving || !name || !coinPrice || uploadedIcon.length === 0 || !category}
              sx={{ py: 2 }}
            >
              {saving ? 'Creating Gift...' : 'Create Gift'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default GiftUpload;
