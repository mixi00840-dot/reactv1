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
  Switch,
  FormControlLabel,
  Divider,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Email as EmailIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [settings, setSettings] = useState({
    general: {
      siteName: 'Mixillo',
      siteDescription: '',
      siteUrl: '',
      maintenanceMode: false,
      registrationEnabled: true,
      emailVerificationRequired: true
    },
    email: {
      provider: 'smtp',
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: ''
    },
    payment: {
      stripeEnabled: false,
      stripePublicKey: '',
      stripeSecretKey: '',
      paypalEnabled: false,
      paypalClientId: '',
      paypalSecret: '',
      currency: 'USD'
    },
    moderation: {
      autoModeration: true,
      aiModerationEnabled: true,
      manualReviewRequired: false,
      nsfwThreshold: 0.75,
      violenceThreshold: 0.70,
      hateThreshold: 0.85
    },
    features: {
      liveStreamingEnabled: true,
      ecommerceEnabled: true,
      walletEnabled: true,
      giftsEnabled: true,
      subscriptionsEnabled: true,
      storiesEnabled: true,
      soundsEnabled: true
    },
    limits: {
      maxVideoSize: 500,
      maxImageSize: 50,
      maxAudioSize: 50,
      maxVideoDuration: 600,
      maxFollowers: 10000,
      rateLimit: 100
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const payload = await api.get('/api/settings');
      if (payload?.settings) {
        setSettings(payload.settings);
      } else if (payload) {
        setSettings(payload);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section) => {
    setSaving(true);
    try {
      await api.put(`/api/settings/${section}`, { settings: settings[section] });
      setSuccessMessage(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(`Failed to save ${section} settings`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (section, field, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
  };

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
        Platform Settings
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
          <Tab label="General" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="Email" icon={<EmailIcon />} iconPosition="start" />
          <Tab label="Payment" icon={<PaymentIcon />} iconPosition="start" />
          <Tab label="Moderation" icon={<SecurityIcon />} iconPosition="start" />
          <Tab label="Features" icon={<NotificationsIcon />} iconPosition="start" />
          <Tab label="Limits" icon={<LanguageIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* General Settings */}
      {selectedTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            General Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Site Name"
                value={settings.general.siteName}
                onChange={(e) => handleChange('general', 'siteName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Site URL"
                value={settings.general.siteUrl}
                onChange={(e) => handleChange('general', 'siteUrl', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Site Description"
                value={settings.general.siteDescription}
                onChange={(e) => handleChange('general', 'siteDescription', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.general.maintenanceMode}
                    onChange={(e) => handleChange('general', 'maintenanceMode', e.target.checked)}
                  />
                }
                label="Maintenance Mode"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.general.registrationEnabled}
                    onChange={(e) => handleChange('general', 'registrationEnabled', e.target.checked)}
                  />
                }
                label="Registration Enabled"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.general.emailVerificationRequired}
                    onChange={(e) => handleChange('general', 'emailVerificationRequired', e.target.checked)}
                  />
                }
                label="Email Verification Required"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => handleSave('general')}
              disabled={saving}
            >
              Save General Settings
            </Button>
          </Box>
        </Paper>
      )}

      {/* Email Settings */}
      {selectedTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Email Configuration
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Email Provider</InputLabel>
                <Select
                  value={settings.email.provider}
                  onChange={(e) => handleChange('email', 'provider', e.target.value)}
                  label="Email Provider"
                >
                  <MenuItem value="smtp">SMTP</MenuItem>
                  <MenuItem value="sendgrid">SendGrid</MenuItem>
                  <MenuItem value="mailgun">Mailgun</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SMTP Host"
                value={settings.email.smtpHost}
                onChange={(e) => handleChange('email', 'smtpHost', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="SMTP Port"
                value={settings.email.smtpPort}
                onChange={(e) => handleChange('email', 'smtpPort', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SMTP User"
                value={settings.email.smtpUser}
                onChange={(e) => handleChange('email', 'smtpUser', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="password"
                label="SMTP Password"
                value={settings.email.smtpPassword}
                onChange={(e) => handleChange('email', 'smtpPassword', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="From Email"
                value={settings.email.fromEmail}
                onChange={(e) => handleChange('email', 'fromEmail', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="From Name"
                value={settings.email.fromName}
                onChange={(e) => handleChange('email', 'fromName', e.target.value)}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => handleSave('email')}
              disabled={saving}
            >
              Save Email Settings
            </Button>
          </Box>
        </Paper>
      )}

      {/* Payment Settings */}
      {selectedTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Payment Configuration
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Stripe</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.payment.stripeEnabled}
                    onChange={(e) => handleChange('payment', 'stripeEnabled', e.target.checked)}
                  />
                }
                label="Enable Stripe"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Stripe Public Key"
                value={settings.payment.stripePublicKey}
                onChange={(e) => handleChange('payment', 'stripePublicKey', e.target.value)}
                disabled={!settings.payment.stripeEnabled}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="password"
                label="Stripe Secret Key"
                value={settings.payment.stripeSecretKey}
                onChange={(e) => handleChange('payment', 'stripeSecretKey', e.target.value)}
                disabled={!settings.payment.stripeEnabled}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>PayPal</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.payment.paypalEnabled}
                    onChange={(e) => handleChange('payment', 'paypalEnabled', e.target.checked)}
                  />
                }
                label="Enable PayPal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="PayPal Client ID"
                value={settings.payment.paypalClientId}
                onChange={(e) => handleChange('payment', 'paypalClientId', e.target.value)}
                disabled={!settings.payment.paypalEnabled}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="password"
                label="PayPal Secret"
                value={settings.payment.paypalSecret}
                onChange={(e) => handleChange('payment', 'paypalSecret', e.target.value)}
                disabled={!settings.payment.paypalEnabled}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={settings.payment.currency}
                  onChange={(e) => handleChange('payment', 'currency', e.target.value)}
                  label="Currency"
                >
                  <MenuItem value="USD">USD - US Dollar</MenuItem>
                  <MenuItem value="EUR">EUR - Euro</MenuItem>
                  <MenuItem value="GBP">GBP - British Pound</MenuItem>
                  <MenuItem value="JPY">JPY - Japanese Yen</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => handleSave('payment')}
              disabled={saving}
            >
              Save Payment Settings
            </Button>
          </Box>
        </Paper>
      )}

      {/* Moderation Settings */}
      {selectedTab === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Moderation Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.moderation.autoModeration}
                    onChange={(e) => handleChange('moderation', 'autoModeration', e.target.checked)}
                  />
                }
                label="Auto Moderation"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.moderation.aiModerationEnabled}
                    onChange={(e) => handleChange('moderation', 'aiModerationEnabled', e.target.checked)}
                  />
                }
                label="AI Moderation (Sightengine)"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.moderation.manualReviewRequired}
                    onChange={(e) => handleChange('moderation', 'manualReviewRequired', e.target.checked)}
                  />
                }
                label="Manual Review Required"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>AI Detection Thresholds (0.0 - 1.0)</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="NSFW Threshold"
                value={settings.moderation.nsfwThreshold}
                onChange={(e) => handleChange('moderation', 'nsfwThreshold', parseFloat(e.target.value))}
                inputProps={{ min: 0, max: 1, step: 0.05 }}
                helperText="Higher = stricter (0.75 recommended)"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Violence Threshold"
                value={settings.moderation.violenceThreshold}
                onChange={(e) => handleChange('moderation', 'violenceThreshold', parseFloat(e.target.value))}
                inputProps={{ min: 0, max: 1, step: 0.05 }}
                helperText="Higher = stricter (0.70 recommended)"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Hate Speech Threshold"
                value={settings.moderation.hateThreshold}
                onChange={(e) => handleChange('moderation', 'hateThreshold', parseFloat(e.target.value))}
                inputProps={{ min: 0, max: 1, step: 0.05 }}
                helperText="Higher = stricter (0.85 recommended)"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => handleSave('moderation')}
              disabled={saving}
            >
              Save Moderation Settings
            </Button>
          </Box>
        </Paper>
      )}

      {/* Feature Toggles */}
      {selectedTab === 4 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Feature Toggles
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.features.liveStreamingEnabled}
                        onChange={(e) => handleChange('features', 'liveStreamingEnabled', e.target.checked)}
                      />
                    }
                    label="Live Streaming"
                  />
                  <Typography variant="caption" color="textSecondary" display="block">
                    Enable live streaming features for users
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.features.ecommerceEnabled}
                        onChange={(e) => handleChange('features', 'ecommerceEnabled', e.target.checked)}
                      />
                    }
                    label="E-commerce"
                  />
                  <Typography variant="caption" color="textSecondary" display="block">
                    Enable shopping and product features
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.features.walletEnabled}
                        onChange={(e) => handleChange('features', 'walletEnabled', e.target.checked)}
                      />
                    }
                    label="Digital Wallet"
                  />
                  <Typography variant="caption" color="textSecondary" display="block">
                    Enable wallet and virtual currency
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.features.giftsEnabled}
                        onChange={(e) => handleChange('features', 'giftsEnabled', e.target.checked)}
                      />
                    }
                    label="Virtual Gifts"
                  />
                  <Typography variant="caption" color="textSecondary" display="block">
                    Enable sending virtual gifts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.features.subscriptionsEnabled}
                        onChange={(e) => handleChange('features', 'subscriptionsEnabled', e.target.checked)}
                      />
                    }
                    label="Subscriptions"
                  />
                  <Typography variant="caption" color="textSecondary" display="block">
                    Enable creator subscriptions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.features.storiesEnabled}
                        onChange={(e) => handleChange('features', 'storiesEnabled', e.target.checked)}
                      />
                    }
                    label="Stories"
                  />
                  <Typography variant="caption" color="textSecondary" display="block">
                    Enable 24-hour stories feature
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.features.soundsEnabled}
                        onChange={(e) => handleChange('features', 'soundsEnabled', e.target.checked)}
                      />
                    }
                    label="Sounds Library"
                  />
                  <Typography variant="caption" color="textSecondary" display="block">
                    Enable music/sound library
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => handleSave('features')}
              disabled={saving}
            >
              Save Feature Settings
            </Button>
          </Box>
        </Paper>
      )}

      {/* Limits Settings */}
      {selectedTab === 5 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Platform Limits
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Video Size (MB)"
                value={settings.limits.maxVideoSize}
                onChange={(e) => handleChange('limits', 'maxVideoSize', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Image Size (MB)"
                value={settings.limits.maxImageSize}
                onChange={(e) => handleChange('limits', 'maxImageSize', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Audio Size (MB)"
                value={settings.limits.maxAudioSize}
                onChange={(e) => handleChange('limits', 'maxAudioSize', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Video Duration (seconds)"
                value={settings.limits.maxVideoDuration}
                onChange={(e) => handleChange('limits', 'maxVideoDuration', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Followers per User"
                value={settings.limits.maxFollowers}
                onChange={(e) => handleChange('limits', 'maxFollowers', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="API Rate Limit (requests/15min)"
                value={settings.limits.rateLimit}
                onChange={(e) => handleChange('limits', 'rateLimit', parseInt(e.target.value))}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => handleSave('limits')}
              disabled={saving}
            >
              Save Limit Settings
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default Settings;

