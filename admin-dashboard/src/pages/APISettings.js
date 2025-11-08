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
  Switch,
  FormControlLabel,
  Divider,
  Tab,
  Tabs,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  Save as SaveIcon
} from '@mui/icons-material';

const APISettings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [settings, setSettings] = useState({
    // Payment Gateways
    stripe: { enabled: false, publicKey: '', secretKey: '', webhookSecret: '' },
    paypal: { enabled: false, clientId: '', clientSecret: '', mode: 'sandbox' },
    
    // Live Streaming
    zegoCloud: { enabled: false, appId: '', appSign: '', serverSecret: '' },
    agora: { enabled: false, appId: '', appCertificate: '', customerId: '', customerSecret: '' },
    webrtc: { enabled: true, stunServers: '', turnServers: '', turnUsername: '', turnCredential: '' },
    
    // Cloud Storage
    aws: { enabled: false, accessKeyId: '', secretAccessKey: '', region: 'us-east-1', bucket: '' },
    firebase: { enabled: false, apiKey: '', authDomain: '', projectId: '', storageBucket: '' },
    cloudflare: { enabled: false, accountId: '', apiToken: '', r2Bucket: '' },
    digitalOcean: { enabled: false, accessKey: '', secretKey: '', region: 'nyc3', bucket: '' },
    
    // AI Services
    sightengine: { enabled: false, apiUser: '', apiSecret: '' },
    openai: { enabled: false, apiKey: '', model: 'gpt-4', organization: '' },
    
    // SMS & Communication
    twilio: { enabled: false, accountSid: '', authToken: '', phoneNumber: '' },
    sendgrid: { enabled: false, apiKey: '', fromEmail: '', fromName: '' },
    
    // Analytics
    googleAnalytics: { enabled: false, trackingId: '', measurementId: '' },
    mixpanel: { enabled: false, projectToken: '' },
    
    // Maps
    googleMaps: { enabled: false, apiKey: '' },
    mapbox: { enabled: false, accessToken: '' },
    
    // Social Login
    google: { enabled: false, clientId: '', clientSecret: '' },
    facebook: { enabled: false, appId: '', appSecret: '' },
    apple: { enabled: false, serviceId: '', teamId: '', keyId: '', privateKey: '' },
    
    // Currencies
    currencies: {
      default: 'USD',
      enabled: ['USD', 'EUR', 'GBP', 'JPY'],
      exchangeRateAPI: '',
      autoUpdate: true
    },
    
    // Languages
    languages: {
      default: 'en',
      enabled: ['en', 'es', 'fr', 'de', 'ar', 'zh'],
      autoDetect: true,
      rtlSupport: true
    },
    
    // CMS
    cms: {
      editor: 'quill',
      uploadMaxSize: 100,
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
      enableVersioning: true
    }
  });

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    try {
      const payload = await api.get('/api/settings/mongodb/api-keys');
      if (payload?.settings) {
        setSettings({ ...settings, ...payload.settings });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async (section) => {
    setSaving(true);
    try {
      await api.put(`/api/settings/mongodb/api-keys/${section}`, { settings: settings[section] });
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section, key, value) => {
    setSettings({
      ...settings,
      [section]: { ...settings[section], [key]: value }
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        API & Integration Settings
      </Typography>

      {message && <Alert severity={message.includes('Failed') ? 'error' : 'success'} sx={{ mb: 2 }}>{message}</Alert>}

      <Paper>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} variant="scrollable">
          <Tab label="Payment Gateways" />
          <Tab label="Live Streaming" />
          <Tab label="Cloud Storage" />
          <Tab label="AI Services" />
          <Tab label="Communication" />
          <Tab label="Analytics" />
          <Tab label="Social Login" />
          <Tab label="Localization" />
          <Tab label="CMS" />
        </Tabs>

        {/* Payment Gateways */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="h6">Stripe</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={settings.stripe.enabled} onChange={(e) => updateSetting('stripe', 'enabled', e.target.checked)} />}
                      label="Enable Stripe"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Public Key" value={settings.stripe.publicKey} onChange={(e) => updateSetting('stripe', 'publicKey', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Secret Key" type="password" value={settings.stripe.secretKey} onChange={(e) => updateSetting('stripe', 'secretKey', e.target.value)} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Webhook Secret" value={settings.stripe.webhookSecret} onChange={(e) => updateSetting('stripe', 'webhookSecret', e.target.value)} />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="h6">PayPal</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={settings.paypal.enabled} onChange={(e) => updateSetting('paypal', 'enabled', e.target.checked)} />}
                      label="Enable PayPal"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Client ID" value={settings.paypal.clientId} onChange={(e) => updateSetting('paypal', 'clientId', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Client Secret" type="password" value={settings.paypal.clientSecret} onChange={(e) => updateSetting('paypal', 'clientSecret', e.target.value)} />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Mode</InputLabel>
                      <Select value={settings.paypal.mode} onChange={(e) => updateSetting('paypal', 'mode', e.target.value)}>
                        <MenuItem value="sandbox">Sandbox</MenuItem>
                        <MenuItem value="live">Live</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSave('stripe')} sx={{ mt: 2 }} disabled={saving}>
              Save Payment Settings
            </Button>
          </Box>
        )}

        {/* Live Streaming */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="h6">ZegoCloud</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={settings.zegoCloud.enabled} onChange={(e) => updateSetting('zegoCloud', 'enabled', e.target.checked)} />}
                      label="Enable ZegoCloud"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="App ID" value={settings.zegoCloud.appId} onChange={(e) => updateSetting('zegoCloud', 'appId', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="App Sign" value={settings.zegoCloud.appSign} onChange={(e) => updateSetting('zegoCloud', 'appSign', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Server Secret" type="password" value={settings.zegoCloud.serverSecret} onChange={(e) => updateSetting('zegoCloud', 'serverSecret', e.target.value)} />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="h6">Agora</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={settings.agora.enabled} onChange={(e) => updateSetting('agora', 'enabled', e.target.checked)} />}
                      label="Enable Agora"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="App ID" value={settings.agora.appId} onChange={(e) => updateSetting('agora', 'appId', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="App Certificate" value={settings.agora.appCertificate} onChange={(e) => updateSetting('agora', 'appCertificate', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Customer ID" value={settings.agora.customerId} onChange={(e) => updateSetting('agora', 'customerId', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Customer Secret" type="password" value={settings.agora.customerSecret} onChange={(e) => updateSetting('agora', 'customerSecret', e.target.value)} />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="h6">WebRTC</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={settings.webrtc.enabled} onChange={(e) => updateSetting('webrtc', 'enabled', e.target.checked)} />}
                      label="Enable WebRTC"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="STUN Servers (comma-separated)" value={settings.webrtc.stunServers} onChange={(e) => updateSetting('webrtc', 'stunServers', e.target.value)} placeholder="stun:stun.l.google.com:19302" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="TURN Servers (comma-separated)" value={settings.webrtc.turnServers} onChange={(e) => updateSetting('webrtc', 'turnServers', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="TURN Username" value={settings.webrtc.turnUsername} onChange={(e) => updateSetting('webrtc', 'turnUsername', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="TURN Credential" type="password" value={settings.webrtc.turnCredential} onChange={(e) => updateSetting('webrtc', 'turnCredential', e.target.value)} />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSave('streaming')} sx={{ mt: 2 }} disabled={saving}>
              Save Streaming Settings
            </Button>
          </Box>
        )}

        {/* Cloud Storage */}
        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="h6">AWS S3</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={settings.aws.enabled} onChange={(e) => updateSetting('aws', 'enabled', e.target.checked)} />}
                      label="Enable AWS S3"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Access Key ID" value={settings.aws.accessKeyId} onChange={(e) => updateSetting('aws', 'accessKeyId', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Secret Access Key" type="password" value={settings.aws.secretAccessKey} onChange={(e) => updateSetting('aws', 'secretAccessKey', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Region" value={settings.aws.region} onChange={(e) => updateSetting('aws', 'region', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Bucket Name" value={settings.aws.bucket} onChange={(e) => updateSetting('aws', 'bucket', e.target.value)} />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="h6">Firebase Storage</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={settings.firebase.enabled} onChange={(e) => updateSetting('firebase', 'enabled', e.target.checked)} />}
                      label="Enable Firebase"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="API Key" value={settings.firebase.apiKey} onChange={(e) => updateSetting('firebase', 'apiKey', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Auth Domain" value={settings.firebase.authDomain} onChange={(e) => updateSetting('firebase', 'authDomain', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Project ID" value={settings.firebase.projectId} onChange={(e) => updateSetting('firebase', 'projectId', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Storage Bucket" value={settings.firebase.storageBucket} onChange={(e) => updateSetting('firebase', 'storageBucket', e.target.value)} />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="h6">Cloudflare R2</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={settings.cloudflare.enabled} onChange={(e) => updateSetting('cloudflare', 'enabled', e.target.checked)} />}
                      label="Enable Cloudflare R2"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Account ID" value={settings.cloudflare.accountId} onChange={(e) => updateSetting('cloudflare', 'accountId', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="API Token" type="password" value={settings.cloudflare.apiToken} onChange={(e) => updateSetting('cloudflare', 'apiToken', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="R2 Bucket" value={settings.cloudflare.r2Bucket} onChange={(e) => updateSetting('cloudflare', 'r2Bucket', e.target.value)} />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="h6">DigitalOcean Spaces</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={settings.digitalOcean.enabled} onChange={(e) => updateSetting('digitalOcean', 'enabled', e.target.checked)} />}
                      label="Enable DigitalOcean Spaces"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Access Key" value={settings.digitalOcean.accessKey} onChange={(e) => updateSetting('digitalOcean', 'accessKey', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Secret Key" type="password" value={settings.digitalOcean.secretKey} onChange={(e) => updateSetting('digitalOcean', 'secretKey', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Region" value={settings.digitalOcean.region} onChange={(e) => updateSetting('digitalOcean', 'region', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Bucket/Space Name" value={settings.digitalOcean.bucket} onChange={(e) => updateSetting('digitalOcean', 'bucket', e.target.value)} />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSave('storage')} sx={{ mt: 2 }} disabled={saving}>
              Save Storage Settings
            </Button>
          </Box>
        )}

        {/* AI Services */}
        {tabValue === 3 && (
          <Box sx={{ p: 3 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="h6">Sightengine (Content Moderation)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={settings.sightengine.enabled} onChange={(e) => updateSetting('sightengine', 'enabled', e.target.checked)} />}
                      label="Enable Sightengine"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="API User" value={settings.sightengine.apiUser} onChange={(e) => updateSetting('sightengine', 'apiUser', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="API Secret" type="password" value={settings.sightengine.apiSecret} onChange={(e) => updateSetting('sightengine', 'apiSecret', e.target.value)} />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="h6">OpenAI</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={settings.openai.enabled} onChange={(e) => updateSetting('openai', 'enabled', e.target.checked)} />}
                      label="Enable OpenAI"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="API Key" type="password" value={settings.openai.apiKey} onChange={(e) => updateSetting('openai', 'apiKey', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Model" value={settings.openai.model} onChange={(e) => updateSetting('openai', 'model', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Organization ID (optional)" value={settings.openai.organization} onChange={(e) => updateSetting('openai', 'organization', e.target.value)} />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSave('ai')} sx={{ mt: 2 }} disabled={saving}>
              Save AI Settings
            </Button>
          </Box>
        )}

        {/* Localization */}
        {tabValue === 7 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Currency Settings</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Default Currency</InputLabel>
                  <Select value={settings.currencies.default} onChange={(e) => updateSetting('currencies', 'default', e.target.value)}>
                    <MenuItem value="USD">USD - US Dollar</MenuItem>
                    <MenuItem value="EUR">EUR - Euro</MenuItem>
                    <MenuItem value="GBP">GBP - British Pound</MenuItem>
                    <MenuItem value="JPY">JPY - Japanese Yen</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Exchange Rate API Key" value={settings.currencies.exchangeRateAPI} onChange={(e) => updateSetting('currencies', 'exchangeRateAPI', e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={settings.currencies.autoUpdate} onChange={(e) => updateSetting('currencies', 'autoUpdate', e.target.checked)} />}
                  label="Auto-update Exchange Rates"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>Language Settings</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Default Language</InputLabel>
                  <Select value={settings.languages.default} onChange={(e) => updateSetting('languages', 'default', e.target.value)}>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                    <MenuItem value="de">German</MenuItem>
                    <MenuItem value="ar">Arabic</MenuItem>
                    <MenuItem value="zh">Chinese</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={settings.languages.autoDetect} onChange={(e) => updateSetting('languages', 'autoDetect', e.target.checked)} />}
                  label="Auto-detect User Language"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={settings.languages.rtlSupport} onChange={(e) => updateSetting('languages', 'rtlSupport', e.target.checked)} />}
                  label="Enable RTL Support (for Arabic, Hebrew)"
                />
              </Grid>
            </Grid>

            <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSave('localization')} sx={{ mt: 2 }} disabled={saving}>
              Save Localization Settings
            </Button>
          </Box>
        )}

        {/* CMS */}
        {tabValue === 8 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>CMS Configuration</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Rich Text Editor</InputLabel>
                  <Select value={settings.cms.editor} onChange={(e) => updateSetting('cms', 'editor', e.target.value)}>
                    <MenuItem value="quill">Quill</MenuItem>
                    <MenuItem value="tinymce">TinyMCE</MenuItem>
                    <MenuItem value="ckeditor">CKEditor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth type="number" label="Max Upload Size (MB)" value={settings.cms.uploadMaxSize} onChange={(e) => updateSetting('cms', 'uploadMaxSize', e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={settings.cms.enableVersioning} onChange={(e) => updateSetting('cms', 'enableVersioning', e.target.checked)} />}
                  label="Enable Content Versioning"
                />
              </Grid>
            </Grid>

            <Button variant="contained" startIcon={<SaveIcon />} onClick={() => handleSave('cms')} sx={{ mt: 2 }} disabled={saving}>
              Save CMS Settings
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default APISettings;

