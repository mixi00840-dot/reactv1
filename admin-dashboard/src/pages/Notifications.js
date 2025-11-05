import React, { useState, useEffect } from 'react';
import api from '../utils/apiFirebase';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import {
  Send as SendIcon
} from '@mui/icons-material';

const Notifications = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    totalSent: 0,
    sentToday: 0,
    delivered: 0,
    failed: 0
  });

  // Send Notification Form
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    recipientType: 'all',
    targetUsers: '',
    targetSegment: 'all-users',
    link: ''
  });

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(
        `/api/notifications/history?limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistory(response?.notifications || response?.data?.notifications || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(
        `/api/notifications/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      alert('Please fill in title and message');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.post(
        `/api/notifications/send`,
        notificationForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Notification sent successfully!');
      setNotificationForm({
        title: '',
        message: '',
        recipientType: 'all',
        targetUsers: '',
        targetSegment: 'all-users',
        link: ''
      });
      fetchHistory();
      fetchStats();
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Notification Center
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Sent</Typography>
              <Typography variant="h4">{stats.totalSent || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Sent Today</Typography>
              <Typography variant="h4" color="primary.main">{stats.sentToday || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Delivered</Typography>
              <Typography variant="h4" color="success.main">{stats.delivered || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Failed</Typography>
              <Typography variant="h4" color="error.main">{stats.failed || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
          <Tab label="Send Notification" />
          <Tab label="History" />
        </Tabs>
      </Paper>

      {/* Send Notification Tab */}
      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notification Title"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Message"
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl component="fieldset">
                <Typography variant="subtitle2" gutterBottom>Recipients</Typography>
                <RadioGroup
                  value={notificationForm.recipientType}
                  onChange={(e) => setNotificationForm({ ...notificationForm, recipientType: e.target.value })}
                >
                  <FormControlLabel value="all" control={<Radio />} label="All Users" />
                  <FormControlLabel value="segment" control={<Radio />} label="User Segment" />
                  <FormControlLabel value="specific" control={<Radio />} label="Specific Users" />
                </RadioGroup>
              </FormControl>
            </Grid>

            {notificationForm.recipientType === 'segment' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select Segment</InputLabel>
                  <Select
                    value={notificationForm.targetSegment}
                    onChange={(e) => setNotificationForm({ ...notificationForm, targetSegment: e.target.value })}
                  >
                    <MenuItem value="all-users">All Users</MenuItem>
                    <MenuItem value="active-users">Active Users (Last 7 Days)</MenuItem>
                    <MenuItem value="sellers">Sellers Only</MenuItem>
                    <MenuItem value="verified">Verified Users</MenuItem>
                    <MenuItem value="premium">Premium Users</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {notificationForm.recipientType === 'specific' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="User IDs"
                  placeholder="Enter user IDs separated by commas"
                  value={notificationForm.targetUsers}
                  onChange={(e) => setNotificationForm({ ...notificationForm, targetUsers: e.target.value })}
                  helperText="Example: 60d5ec49f1b2c72b8c8e4f1a, 60d5ec49f1b2c72b8c8e4f1b"
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Link (Optional)"
                placeholder="https://..."
                value={notificationForm.link}
                onChange={(e) => setNotificationForm({ ...notificationForm, link: e.target.value })}
                helperText="Users will be directed to this link when clicking the notification"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                size="large"
                startIcon={<SendIcon />}
                onClick={handleSendNotification}
              >
                Send Notification
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* History Tab */}
      {tabValue === 1 && (
        <>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Recipients</TableCell>
                    <TableCell>Delivered</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Sent At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((notification) => (
                    <TableRow key={notification._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {notification.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                          {notification.message}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={notification.recipientType}
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        {notification.deliveredCount || 0} / {notification.totalRecipients || 0}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={notification.status || 'sent'}
                          color={notification.status === 'delivered' ? 'success' : notification.status === 'failed' ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(notification.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  );
};

export default Notifications;

