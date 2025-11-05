import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Tooltip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalShipping as ShippingIcon,
  Speed as SpeedIcon,
  LocationOn as LocationIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import api from '../utils/apiFirebase';
import toast from 'react-hot-toast';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`shipping-tabpanel-${index}`}
      aria-labelledby={`shipping-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Shipping() {
  const [tabValue, setTabValue] = useState(0);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [shippingZones, setShippingZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('method'); // 'method' or 'zone'
  const [selectedItem, setSelectedItem] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalMethods: 0,
    totalZones: 0,
    avgDeliveryTime: 0,
    totalCarriers: 0
  });

  const [methodFormData, setMethodFormData] = useState({
    name: '',
    description: '',
    carrier: '',
    type: 'standard',
    cost: {
      baseRate: 0,
      perKgRate: 0,
      perDistanceRate: 0,
      freeShippingThreshold: null
    },
    deliveryTime: {
      min: 1,
      max: 7,
      unit: 'days'
    },
    isActive: true,
    availability: {
      domestic: true,
      international: false
    }
  });

  const [zoneFormData, setZoneFormData] = useState({
    name: '',
    description: '',
    countries: [],
    shippingMethods: [],
    isActive: true
  });

  useEffect(() => {
    fetchShippingData();
    fetchAnalytics();
  }, []);

  const fetchShippingData = async () => {
    try {
      setLoading(true);
      const [methodsRes, zonesRes] = await Promise.all([
        api.get('/api/shipping/methods'),
        api.get('/api/shipping/zones')
      ]);

      if (methodsRes.data.success) {
        const methodsData = methodsRes.data.data?.methods || methodsRes.data.data;
        setShippingMethods(Array.isArray(methodsData) ? methodsData : []);
      }
      if (zonesRes.data.success) {
        const zonesData = zonesRes.data.data?.zones || zonesRes.data.data;
        setShippingZones(Array.isArray(zonesData) ? zonesData : []);
      }
    } catch (error) {
      console.error('Error fetching shipping data:', error);
      toast.error('Failed to fetch shipping data');
      setShippingMethods([]); // Ensure it's always an array
      setShippingZones([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
  const response = await api.get('/api/shipping/analytics');
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleCreateMethod = async () => {
    try {
  const response = await api.post('/api/shipping/methods', methodFormData);
      if (response.data.success) {
        toast.success('Shipping method created successfully');
        setDialogOpen(false);
        fetchShippingData();
        fetchAnalytics();
        resetMethodForm();
      }
    } catch (error) {
      console.error('Error creating shipping method:', error);
      toast.error(error.response?.data?.message || 'Failed to create shipping method');
    }
  };

  const handleCreateZone = async () => {
    try {
  const response = await api.post('/api/shipping/zones', zoneFormData);
      if (response.data.success) {
        toast.success('Shipping zone created successfully');
        setDialogOpen(false);
        fetchShippingData();
        resetZoneForm();
      }
    } catch (error) {
      console.error('Error creating shipping zone:', error);
      toast.error(error.response?.data?.message || 'Failed to create shipping zone');
    }
  };

  const resetMethodForm = () => {
    setMethodFormData({
      name: '',
      description: '',
      carrier: '',
      type: 'standard',
      cost: {
        baseRate: 0,
        perKgRate: 0,
        perDistanceRate: 0,
        freeShippingThreshold: null
      },
      deliveryTime: {
        min: 1,
        max: 7,
        unit: 'days'
      },
      isActive: true,
      availability: {
        domestic: true,
        international: false
      }
    });
  };

  const resetZoneForm = () => {
    setZoneFormData({
      name: '',
      description: '',
      countries: [],
      shippingMethods: [],
      isActive: true
    });
  };

  const handleDialogOpen = (type, item = null) => {
    setDialogType(type);
    setSelectedItem(item);
    if (item && type === 'method') {
      setMethodFormData({
        name: item.name || '',
        description: item.description || '',
        carrier: item.carrier || '',
        type: item.type || 'standard',
        cost: {
          baseRate: item.cost?.baseRate || 0,
          perKgRate: item.cost?.perKgRate || 0,
          perDistanceRate: item.cost?.perDistanceRate || 0,
          freeShippingThreshold: item.cost?.freeShippingThreshold || null
        },
        deliveryTime: {
          min: item.deliveryTime?.min || 1,
          max: item.deliveryTime?.max || 7,
          unit: item.deliveryTime?.unit || 'days'
        },
        isActive: item.isActive !== false,
        availability: {
          domestic: item.availability?.domestic !== false,
          international: item.availability?.international || false
        }
      });
    } else if (item && type === 'zone') {
      setZoneFormData({
        name: item.name || '',
        description: item.description || '',
        countries: item.countries || [],
        shippingMethods: item.shippingMethods || [],
        isActive: item.isActive !== false
      });
    } else {
      resetMethodForm();
      resetZoneForm();
    }
    setDialogOpen(true);
  };

  const getStatusChip = (isActive) => {
    return isActive ? 
      <Chip label="Active" color="success" size="small" /> :
      <Chip label="Inactive" color="default" size="small" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Shipping & Logistics
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleDialogOpen('zone')}
          >
            Add Zone
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleDialogOpen('method')}
          >
            Add Method
          </Button>
        </Box>
      </Box>

      {/* Analytics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <ShippingIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Shipping Methods
              </Typography>
              <Typography variant="h4" color="primary">
                {analytics.totalMethods || shippingMethods.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <LocationIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Shipping Zones
              </Typography>
              <Typography variant="h4" color="success.main">
                {analytics.totalZones || shippingZones.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <SpeedIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Avg. Delivery Time
              </Typography>
              <Typography variant="h4" color="secondary.main">
                {analytics.avgDeliveryTime || 3} days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <SettingsIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Active Carriers
              </Typography>
              <Typography variant="h4" color="warning.main">
                {analytics.totalCarriers || 
                [...new Set(shippingMethods.map(m => m.carrier))].filter(Boolean).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Shipping Methods" />
            <Tab label="Shipping Zones" />
          </Tabs>
        </Box>

        {/* Shipping Methods Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Carrier</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Base Rate</TableCell>
                  <TableCell>Delivery Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shippingMethods.map((method) => (
                  <TableRow key={method._id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {method.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{method.carrier || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={method.type} 
                        variant="outlined" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>${method.cost?.baseRate || 0}</TableCell>
                    <TableCell>
                      {method.deliveryTime?.min}-{method.deliveryTime?.max} {method.deliveryTime?.unit}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(method.isActive)}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Edit Method">
                          <IconButton
                            size="small"
                            onClick={() => handleDialogOpen('method', method)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Method">
                          <IconButton
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {shippingMethods.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No shipping methods configured
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Shipping Zones Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Zone Name</TableCell>
                  <TableCell>Countries</TableCell>
                  <TableCell>Methods</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shippingZones.map((zone) => (
                  <TableRow key={zone._id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {zone.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {zone.countries?.length || 0} countries
                    </TableCell>
                    <TableCell>
                      {zone.shippingMethods?.length || 0} methods
                    </TableCell>
                    <TableCell>
                      {getStatusChip(zone.isActive)}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Edit Zone">
                          <IconButton
                            size="small"
                            onClick={() => handleDialogOpen('zone', zone)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Zone">
                          <IconButton
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {shippingZones.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No shipping zones configured
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Card>

      {/* Dialog for Creating/Editing */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'method' ? 
            (selectedItem ? 'Edit Shipping Method' : 'Create Shipping Method') :
            (selectedItem ? 'Edit Shipping Zone' : 'Create Shipping Zone')
          }
        </DialogTitle>
        <DialogContent>
          {dialogType === 'method' ? (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Method Name"
                    value={methodFormData.name}
                    onChange={(e) => setMethodFormData({ ...methodFormData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Carrier"
                    value={methodFormData.carrier}
                    onChange={(e) => setMethodFormData({ ...methodFormData, carrier: e.target.value })}
                    placeholder="e.g., FedEx, UPS, DHL"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Description"
                    value={methodFormData.description}
                    onChange={(e) => setMethodFormData({ ...methodFormData, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Type"
                    value={methodFormData.type}
                    onChange={(e) => setMethodFormData({ ...methodFormData, type: e.target.value })}
                  >
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="express">Express</MenuItem>
                    <MenuItem value="overnight">Overnight</MenuItem>
                    <MenuItem value="same_day">Same Day</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Base Rate"
                    value={methodFormData.cost.baseRate}
                    onChange={(e) => setMethodFormData({ 
                      ...methodFormData, 
                      cost: { ...methodFormData.cost, baseRate: parseFloat(e.target.value) || 0 }
                    })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Min Delivery Days"
                    value={methodFormData.deliveryTime.min}
                    onChange={(e) => setMethodFormData({ 
                      ...methodFormData, 
                      deliveryTime: { ...methodFormData.deliveryTime, min: parseInt(e.target.value) || 1 }
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Delivery Days"
                    value={methodFormData.deliveryTime.max}
                    onChange={(e) => setMethodFormData({ 
                      ...methodFormData, 
                      deliveryTime: { ...methodFormData.deliveryTime, max: parseInt(e.target.value) || 7 }
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={methodFormData.isActive}
                        onChange={(e) => setMethodFormData({ ...methodFormData, isActive: e.target.checked })}
                      />
                    }
                    label="Active"
                  />
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Zone Name"
                    value={zoneFormData.name}
                    onChange={(e) => setZoneFormData({ ...zoneFormData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Description"
                    value={zoneFormData.description}
                    onChange={(e) => setZoneFormData({ ...zoneFormData, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info">
                    Zone configuration requires additional setup for countries and shipping methods.
                  </Alert>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={zoneFormData.isActive}
                        onChange={(e) => setZoneFormData({ ...zoneFormData, isActive: e.target.checked })}
                      />
                    }
                    label="Active"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={dialogType === 'method' ? handleCreateMethod : handleCreateZone}
            disabled={dialogType === 'method' ? !methodFormData.name : !zoneFormData.name}
          >
            {selectedItem ? 'Update' : 'Create'} {dialogType === 'method' ? 'Method' : 'Zone'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Shipping;
