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
    cloudinary: { 
      enabled: true, 
      cloudName: '', 
      apiKey: '', 
      apiSecret: '', 
      uploadPreset: 'mixillo_uploads', 
      folder: 'mixillo',
      signedUpload: true,
      maxFileSize: {
        video: 100,
        image: 10,
        audio: 50,
        document: 20
      },
      allowedFormats: {
        video: ['mp4', 'mov', 'avi', 'webm'],
        image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        audio: ['mp3', 'wav', 'ogg'],
        document: ['pdf', 'doc', 'docx', 'txt']
      },
      accessMode: 'public',
      signatureExpiry: 3600
    },
    aws: { enabled: false, accessKeyId: '', secretAccessKey: '', region: 'us-east-1', bucket: '' },
    firebase: { enabled: false, apiKey: '', authDomain: '', projectId: '', storageBucket: '' },
    cloudflare: { enabled: false, accountId: '', apiToken: '', r2Bucket: '' },
    digitalOcean: { enabled: false, accessKey: '', secretKey: '', region: 'nyc3', bucket: '' },
    
    // AI Services
    sightengine: { enabled: false, apiUser: '', apiSecret: '' },
    openai: { enabled: false, apiKey: '', model: 'gpt-4', organization: '' },
    vertexAI: { 
      enabled: true, 
      projectId: 'mixillo', 
      location: 'us-central1', 
      credentialsPath: '/backend/vertex-ai-key.json',
      quotaLimit: 1000000,
      currentUsage: 0 
    },
    redis: { 
      enabled: true, 
      host: '10.167.115.67', 
      port: 6379, 
      password: '', 
      maxMemory: '1gb',
      currentMemory: '0mb',
      cacheHitRate: 0 
    },
    socketIO: { 
      enabled: true, 
      corsOrigin: '*',
      connectedClients: 0,
      activeRooms: 0 
    },
    
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
    fetchRealtimeServiceStats();
    
    // Auto-refresh service stats every 10 seconds for realtime updates
    const interval = setInterval(fetchRealtimeServiceStats, 10000);
    return () => clearInterval(interval);
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

  const fetchRealtimeServiceStats = async () => {
    try {
      // Fetch realtime stats to update service status
      const realtimeResponse = await api.get('/admin/realtime/stats');
      if (realtimeResponse.success) {
        const socketData = realtimeResponse.data.socketIO;
        setSettings(prev => ({
          ...prev,
          socketIO: {
            ...prev.socketIO,
            connectedClients: socketData?.connectedClients || 0,
            activeRooms: socketData?.activeRooms || 0
          }
        }));
      }

      // Fetch cache stats
      const cacheResponse = await api.get('/admin/cache/stats');
      if (cacheResponse.success) {
        const redisData = cacheResponse.data.redis;
        setSettings(prev => ({
          ...prev,
          redis: {
            ...prev.redis,
            currentMemory: redisData?.memoryUsed || '0mb',
            cacheHitRate: parseFloat(redisData?.hitRate) || 0
          }
        }));
      }

      // Fetch Vertex AI usage
      const vertexResponse = await api.get('/admin/ai/vertex-usage');
      if (vertexResponse.success) {
        const vertexData = vertexResponse.data;
        setSettings(prev => ({
          ...prev,
          vertexAI: {
            ...prev.vertexAI,
            currentUsage: vertexData?.quotaUsed || 0
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching realtime service stats:', error);
    }
  };

  const handleSave = async (section) => {
    setSaving(true);
    setMessage('');
    try {
      // Send settings for the specific section only
      const sectionSettings = settings[section];
      
      // Map section names to match backend expectations
      // "cloudinary" in frontend becomes "storage" category or individual service
      const backendSection = section;
      
      const response = await api.put(`/api/settings/mongodb/api-keys/${backendSection}`, { 
        settings: sectionSettings 
      });
      
      if (response.success || response.data?.success) {
        toast.success(`${section} settings saved successfully!`);
        setMessage(`${section} settings saved successfully!`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error(response.message || response.data?.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save settings';
      toast.error(errorMsg);
      setMessage(`Failed: ${errorMsg}`);
      setTimeout(() => setMessage(''), 5000);
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
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="h6">Cloudinary (Active)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={settings.cloudinary.enabled} onChange={(e) => updateSetting('cloudinary', 'enabled', e.target.checked)} />}
                      label="Enable Cloudinary"
                    />
                  </Grid>
                  
                  {/* Basic Configuration */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary" sx={{ mt: 1, mb: 1 }}>
                      Basic Configuration
                    </Typography>
                    <Divider />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Cloud Name" value={settings.cloudinary.cloudName} onChange={(e) => updateSetting('cloudinary', 'cloudName', e.target.value)} placeholder="your-cloud-name" required />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="API Key" value={settings.cloudinary.apiKey} onChange={(e) => updateSetting('cloudinary', 'apiKey', e.target.value)} required />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="API Secret" type="password" value={settings.cloudinary.apiSecret} onChange={(e) => updateSetting('cloudinary', 'apiSecret', e.target.value)} required />
                  </Grid>
                  
                  {/* Upload Security */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary" sx={{ mt: 2, mb: 1 }}>
                      Upload Security
                    </Typography>
                    <Divider />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={<Switch checked={settings.cloudinary.signedUpload} onChange={(e) => updateSetting('cloudinary', 'signedUpload', e.target.checked)} />}
                      label="Enable Signed Uploads (Recommended)"
                    />
                    <Typography variant="caption" display="block" color="text.secondary">
                      Signed uploads provide better security by requiring backend signature for each upload
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Signature Expiry (seconds)" 
                      type="number"
                      value={settings.cloudinary.signatureExpiry} 
                      onChange={(e) => updateSetting('cloudinary', 'signatureExpiry', parseInt(e.target.value))}
                      helperText="How long upload signatures remain valid"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Upload Preset" value={settings.cloudinary.uploadPreset} onChange={(e) => updateSetting('cloudinary', 'uploadPreset', e.target.value)} helperText="For unsigned uploads (legacy)" disabled={settings.cloudinary.signedUpload} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Default Folder" value={settings.cloudinary.folder} onChange={(e) => updateSetting('cloudinary', 'folder', e.target.value)} helperText="Root folder for all uploads" />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Access Mode</InputLabel>
                      <Select 
                        value={settings.cloudinary.accessMode} 
                        onChange={(e) => updateSetting('cloudinary', 'accessMode', e.target.value)}
                        label="Access Mode"
                      >
                        <MenuItem value="public">Public (URLs accessible to anyone)</MenuItem>
                        <MenuItem value="authenticated">Authenticated (Requires signature)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {/* File Size Limits */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary" sx={{ mt: 2, mb: 1 }}>
                      File Size Limits (MB)
                    </Typography>
                    <Divider />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField 
                      fullWidth 
                      label="Video Max Size" 
                      type="number"
                      value={settings.cloudinary.maxFileSize?.video || 100} 
                      onChange={(e) => updateSetting('cloudinary', 'maxFileSize', {...(settings.cloudinary.maxFileSize || {}), video: parseInt(e.target.value)})}
                      InputProps={{ endAdornment: 'MB' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField 
                      fullWidth 
                      label="Image Max Size" 
                      type="number"
                      value={settings.cloudinary.maxFileSize?.image || 10} 
                      onChange={(e) => updateSetting('cloudinary', 'maxFileSize', {...(settings.cloudinary.maxFileSize || {}), image: parseInt(e.target.value)})}
                      InputProps={{ endAdornment: 'MB' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField 
                      fullWidth 
                      label="Audio Max Size" 
                      type="number"
                      value={settings.cloudinary.maxFileSize?.audio || 50} 
                      onChange={(e) => updateSetting('cloudinary', 'maxFileSize', {...(settings.cloudinary.maxFileSize || {}), audio: parseInt(e.target.value)})}
                      InputProps={{ endAdornment: 'MB' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField 
                      fullWidth 
                      label="Document Max Size" 
                      type="number"
                      value={settings.cloudinary.maxFileSize?.document || 20} 
                      onChange={(e) => updateSetting('cloudinary', 'maxFileSize', {...(settings.cloudinary.maxFileSize || {}), document: parseInt(e.target.value)})}
                      InputProps={{ endAdornment: 'MB' }}
                    />
                  </Grid>
                  
                  {/* Allowed Formats */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary" sx={{ mt: 2, mb: 1 }}>
                      Allowed File Formats
                    </Typography>
                    <Divider />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Video Formats" 
                      value={(settings.cloudinary.allowedFormats?.video || ['mp4', 'mov', 'avi', 'webm']).join(', ')} 
                      onChange={(e) => updateSetting('cloudinary', 'allowedFormats', {...(settings.cloudinary.allowedFormats || {}), video: e.target.value.split(',').map(f => f.trim())})}
                      helperText="Comma-separated (e.g., mp4, mov, avi)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Image Formats" 
                      value={(settings.cloudinary.allowedFormats?.image || ['jpg', 'jpeg', 'png', 'gif', 'webp']).join(', ')} 
                      onChange={(e) => updateSetting('cloudinary', 'allowedFormats', {...(settings.cloudinary.allowedFormats || {}), image: e.target.value.split(',').map(f => f.trim())})}
                      helperText="Comma-separated (e.g., jpg, png, gif)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Audio Formats" 
                      value={(settings.cloudinary.allowedFormats?.audio || ['mp3', 'wav', 'ogg']).join(', ')} 
                      onChange={(e) => updateSetting('cloudinary', 'allowedFormats', {...(settings.cloudinary.allowedFormats || {}), audio: e.target.value.split(',').map(f => f.trim())})}
                      helperText="Comma-separated (e.g., mp3, wav)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Document Formats" 
                      value={(settings.cloudinary.allowedFormats?.document || ['pdf', 'doc', 'docx', 'txt']).join(', ')} 
                      onChange={(e) => updateSetting('cloudinary', 'allowedFormats', {...(settings.cloudinary.allowedFormats || {}), document: e.target.value.split(',').map(f => f.trim())})}
                      helperText="Comma-separated (e.g., pdf, doc)"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Signed Uploads:</strong> When enabled, all uploads require a signature from your backend, providing better security and control. 
                        The upload preset is only used for unsigned uploads (legacy mode).
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

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
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="h6">Google Vertex AI (Primary AI)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={settings.vertexAI?.enabled} onChange={(e) => updateSetting('vertexAI', 'enabled', e.target.checked)} />}
                      label="Enable Vertex AI"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Project ID" 
                      value={settings.vertexAI?.projectId || ''} 
                      onChange={(e) => updateSetting('vertexAI', 'projectId', e.target.value)} 
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Location" 
                      value={settings.vertexAI?.location || ''} 
                      onChange={(e) => updateSetting('vertexAI', 'location', e.target.value)} 
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="Credentials Path" 
                      value={settings.vertexAI?.credentialsPath || ''} 
                      onChange={(e) => updateSetting('vertexAI', 'credentialsPath', e.target.value)} 
                      helperText="Path to service account JSON key file"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Monthly Quota Limit" 
                      type="number"
                      value={settings.vertexAI?.quotaLimit || 0} 
                      onChange={(e) => updateSetting('vertexAI', 'quotaLimit', parseInt(e.target.value))} 
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Current Usage" 
                      type="number"
                      value={settings.vertexAI?.currentUsage || 0} 
                      disabled
                      helperText="Auto-updated"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="h6">Redis Cache (Cloud Memorystore)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={settings.redis?.enabled} onChange={(e) => updateSetting('redis', 'enabled', e.target.checked)} />}
                      label="Enable Redis Caching"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Host" 
                      value={settings.redis?.host || ''} 
                      onChange={(e) => updateSetting('redis', 'host', e.target.value)} 
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Port" 
                      type="number"
                      value={settings.redis?.port || 6379} 
                      onChange={(e) => updateSetting('redis', 'port', parseInt(e.target.value))} 
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="Password (optional)" 
                      type="password"
                      value={settings.redis?.password || ''} 
                      onChange={(e) => updateSetting('redis', 'password', e.target.value)} 
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField 
                      fullWidth 
                      label="Max Memory" 
                      value={settings.redis?.maxMemory || '1gb'} 
                      onChange={(e) => updateSetting('redis', 'maxMemory', e.target.value)} 
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField 
                      fullWidth 
                      label="Current Memory" 
                      value={settings.redis?.currentMemory || '0mb'} 
                      disabled
                      helperText="Auto-updated"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField 
                      fullWidth 
                      label="Cache Hit Rate" 
                      value={settings.redis?.cacheHitRate ? `${settings.redis.cacheHitRate}%` : '0%'} 
                      disabled
                      helperText="Auto-updated"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="h6">Socket.IO (Real-Time Events)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={settings.socketIO?.enabled} onChange={(e) => updateSetting('socketIO', 'enabled', e.target.checked)} />}
                      label="Enable Socket.IO"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="CORS Origin" 
                      value={settings.socketIO?.corsOrigin || '*'} 
                      onChange={(e) => updateSetting('socketIO', 'corsOrigin', e.target.value)} 
                      helperText="Allowed origins for Socket.IO connections"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Connected Clients" 
                      value={settings.socketIO?.connectedClients || 0} 
                      disabled
                      helperText="Current active connections"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Active Rooms" 
                      value={settings.socketIO?.activeRooms || 0} 
                      disabled
                      helperText="Active video rooms"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="h6">Sightengine (Content Moderation)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch checked={settings.sightengine?.enabled} onChange={(e) => updateSetting('sightengine', 'enabled', e.target.checked)} />}
                      label="Enable Sightengine"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="API User" value={settings.sightengine?.apiUser || ''} onChange={(e) => updateSetting('sightengine', 'apiUser', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="API Secret" type="password" value={settings.sightengine?.apiSecret || ''} onChange={(e) => updateSetting('sightengine', 'apiSecret', e.target.value)} />
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
                      control={<Switch checked={settings.openai?.enabled} onChange={(e) => updateSetting('openai', 'enabled', e.target.checked)} />}
                      label="Enable OpenAI"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="API Key" type="password" value={settings.openai?.apiKey || ''} onChange={(e) => updateSetting('openai', 'apiKey', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Model" value={settings.openai?.model || 'gpt-4'} onChange={(e) => updateSetting('openai', 'model', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Organization ID (optional)" value={settings.openai?.organization || ''} onChange={(e) => updateSetting('openai', 'organization', e.target.value)} />
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

