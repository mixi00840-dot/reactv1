import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  TextField,
  Button,
  Stack,
  InputAdornment,
  Switch,
  FormControlLabel,
  Alert,
  Chip
} from '@mui/material';
import {
  EmojiEvents as LevelIcon,
  MilitaryTech as BadgeIcon,
  ViewCarousel as BannerIcon,
  MonetizationOn as CoinIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import UniversalUploader from '../components/upload/UniversalUploader';
import mongoAPI from '../utils/apiMongoDB';
import toast from 'react-hot-toast';

/**
 * System Assets Manager
 * 
 * Tabs:
 * - Levels
 * - Badges/Achievements
 * - Banners
 * - Coin Packages
 */
const SystemAssets = () => {
  const [currentTab, setCurrentTab] = useState(0);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          ⚙️ System Assets Manager
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Manage levels, badges, banners, and coin packages
        </Typography>

        <Paper sx={{ mb: 3 }}>
          <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
            <Tab icon={<LevelIcon />} label="Levels" />
            <Tab icon={<BadgeIcon />} label="Badges" />
            <Tab icon={<BannerIcon />} label="Banners" />
            <Tab icon={<CoinIcon />} label="Coin Packages" />
          </Tabs>
        </Paper>

        {currentTab === 0 && <LevelManager />}
        {currentTab === 1 && <BadgeManager />}
        {currentTab === 2 && <BannerManager />}
        {currentTab === 3 && <CoinPackageManager />}
      </Container>
    </LocalizationProvider>
  );
};

// Level Manager Component
const LevelManager = () => {
  const [levelNumber, setLevelNumber] = useState('');
  const [levelName, setLevelName] = useState('');
  const [xpRequired, setXpRequired] = useState('');
  const [perks, setPerks] = useState('');
  const [color, setColor] = useState('#1976d2');
  const [uploadedIcon, setUploadedIcon] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!levelNumber || !levelName || !xpRequired) {
      toast.error('Please fill all required fields');
      return;
    }

    if (uploadedIcon.length === 0) {
      toast.error('Please upload a level icon');
      return;
    }

    setSaving(true);
    try {
      await mongoAPI.post('/api/admin/levels', {
        levelNumber: parseInt(levelNumber),
        name: levelName,
        xpRequired: parseInt(xpRequired),
        perks: perks,
        color: color,
        iconUrl: uploadedIcon[0].url
      });
      
      toast.success('✓ Level created');
      setLevelNumber('');
      setLevelName('');
      setXpRequired('');
      setPerks('');
      setUploadedIcon([]);
    } catch (error) {
      toast.error('Failed to create level');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Create Level</Typography>
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Level Number"
                  type="number"
                  value={levelNumber}
                  onChange={(e) => setLevelNumber(e.target.value)}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Level Name"
                  value={levelName}
                  onChange={(e) => setLevelName(e.target.value)}
                  required
                  fullWidth
                  placeholder="e.g., Bronze, Silver, Gold"
                />
              </Grid>
            </Grid>

            <TextField
              label="XP Required"
              type="number"
              value={xpRequired}
              onChange={(e) => setXpRequired(e.target.value)}
              required
              fullWidth
              InputProps={{
                endAdornment: <InputAdornment position="end">XP</InputAdornment>
              }}
            />

            <TextField
              label="Perks/Benefits"
              value={perks}
              onChange={(e) => setPerks(e.target.value)}
              multiline
              rows={3}
              fullWidth
              placeholder="What benefits does this level unlock?"
            />

            <TextField
              label="Color Theme"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              fullWidth
            />
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Level Icon</Typography>
            <UniversalUploader
              uploadType="image"
              onUploadComplete={setUploadedIcon}
              maxFiles={1}
              maxSizeMB={1}
              multiple={false}
            />
          </Paper>

          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Creating...' : 'Create Level'}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
};

// Badge Manager Component
const BadgeManager = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unlockCriteria, setUnlockCriteria] = useState('');
  const [points, setPoints] = useState('');
  const [rarity, setRarity] = useState('common');
  const [uploadedIcon, setUploadedIcon] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !description || !unlockCriteria) {
      toast.error('Please fill all required fields');
      return;
    }

    if (uploadedIcon.length === 0) {
      toast.error('Please upload a badge icon');
      return;
    }

    setSaving(true);
    try {
      await mongoAPI.post('/api/admin/badges', {
        name,
        description,
        unlockCriteria,
        points: points ? parseInt(points) : 0,
        rarity,
        iconUrl: uploadedIcon[0].url
      });
      
      toast.success('✓ Badge created');
      setName('');
      setDescription('');
      setUnlockCriteria('');
      setPoints('');
      setUploadedIcon([]);
    } catch (error) {
      toast.error('Failed to create badge');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Create Badge/Achievement</Typography>
          <Stack spacing={2}>
            <TextField
              label="Badge Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              placeholder="e.g., Early Bird, Video Creator"
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              multiline
              rows={2}
              fullWidth
            />

            <TextField
              label="Unlock Criteria"
              value={unlockCriteria}
              onChange={(e) => setUnlockCriteria(e.target.value)}
              required
              multiline
              rows={2}
              fullWidth
              placeholder="How do users earn this badge?"
            />

            <TextField
              label="Points Value"
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: <InputAdornment position="end">pts</InputAdornment>
              }}
            />
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Badge Icon</Typography>
            <UniversalUploader
              uploadType="image"
              onUploadComplete={setUploadedIcon}
              maxFiles={1}
              maxSizeMB={1}
              multiple={false}
            />
          </Paper>

          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Creating...' : 'Create Badge'}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
};

// Banner Manager Component
const BannerManager = () => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [position, setPosition] = useState('top');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [uploadedImage, setUploadedImage] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title || uploadedImage.length === 0) {
      toast.error('Title and banner image are required');
      return;
    }

    setSaving(true);
    try {
      await mongoAPI.post('/api/admin/banners', {
        title,
        subtitle,
        ctaText,
        targetUrl,
        imageUrl: uploadedImage[0].url,
        position,
        startDate,
        endDate,
        isActive
      });
      
      toast.success('✓ Banner created');
      setTitle('');
      setSubtitle('');
      setCtaText('');
      setTargetUrl('');
      setUploadedImage([]);
    } catch (error) {
      toast.error('Failed to create banner');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Banner Image</Typography>
            <UniversalUploader
              uploadType="image"
              onUploadComplete={setUploadedImage}
              maxFiles={1}
              maxSizeMB={5}
              multiple={false}
            />
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Banner Content</Typography>
            <Stack spacing={2}>
              <TextField
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                fullWidth
              />

              <TextField
                label="Subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                fullWidth
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="CTA Button Text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    fullWidth
                    placeholder="e.g., Shop Now, Learn More"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Target URL/Screen"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    fullWidth
                    placeholder="/products, /events"
                  />
                </Grid>
              </Grid>
            </Stack>
          </Paper>
        </Stack>
      </Grid>

      <Grid item xs={12} md={4}>
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Schedule</Typography>
            <Stack spacing={2}>
              <DateTimePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />

              <DateTimePicker
                label="End Date (Optional)"
                value={endDate}
                onChange={setEndDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />

              <FormControlLabel
                control={
                  <Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                }
                label="Active"
              />
            </Stack>
          </Paper>

          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Creating...' : 'Create Banner'}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
};

// Coin Package Manager Component
const CoinPackageManager = () => {
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [bonus, setBonus] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [uploadedIcon, setUploadedIcon] = useState([]);
  const [saving, setSaving] = useState(false);

  const calculateTotal = () => {
    const base = parseInt(amount) || 0;
    const bonusPercent = parseInt(bonus) || 0;
    return base + (base * bonusPercent / 100);
  };

  const handleSave = async () => {
    if (!amount || !price) {
      toast.error('Amount and price are required');
      return;
    }

    setSaving(true);
    try {
      await mongoAPI.post('/api/admin/coin-packages', {
        coinAmount: parseInt(amount),
        price: parseFloat(price),
        bonusPercentage: bonus ? parseInt(bonus) : 0,
        isFeatured,
        iconUrl: uploadedIcon.length > 0 ? uploadedIcon[0].url : null
      });
      
      toast.success('✓ Coin package created');
      setAmount('');
      setPrice('');
      setBonus('');
      setIsFeatured(false);
      setUploadedIcon([]);
    } catch (error) {
      toast.error('Failed to create coin package');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Create Coin Package</Typography>
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  label="Coin Amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">coins</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Price (USD)"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Bonus"
                  type="number"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                />
              </Grid>
            </Grid>

            {amount && (
              <Alert severity="info">
                Total coins with bonus: <strong>{calculateTotal()} coins</strong>
              </Alert>
            )}

            <FormControlLabel
              control={
                <Switch checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              }
              label="Featured Package (Best Value)"
            />
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Package Icon (Optional)</Typography>
            <UniversalUploader
              uploadType="image"
              onUploadComplete={setUploadedIcon}
              maxFiles={1}
              maxSizeMB={1}
              multiple={false}
            />
          </Paper>

          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Creating...' : 'Create Package'}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
};

export default SystemAssets;
