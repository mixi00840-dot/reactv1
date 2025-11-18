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
  InputAdornment,
  Badge,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Reply as ReplyIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Support as SupportIcon,
  Chat as ChatIcon,
  HelpOutline as FAQIcon,
  AccessTime as PriorityIcon,
  Assignment as TicketIcon,
} from '@mui/icons-material';
// MongoDB Migration
import mongoAPI from '../utils/apiMongoDB';
import toast from 'react-hot-toast';
const api = mongoAPI; // Alias for backward compatibility

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`support-tabpanel-${index}`}
      aria-labelledby={`support-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function CustomerSupport() {
  const [tabValue, setTabValue] = useState(0);
  const [tickets, setTickets] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('ticket'); // 'ticket', 'faq', 'reply'
  const [selectedItem, setSelectedItem] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    avgResponseTime: 0,
    totalFAQs: 0
  });

  const [ticketFormData, setTicketFormData] = useState({
    subject: '',
    description: '',
    category: 'other',
    priority: 'medium',
    assignedTo: '',
    status: 'open'
  });

  const [faqFormData, setFaqFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    isPublished: true,
    order: 0
  });

  const [replyFormData, setReplyFormData] = useState({
    message: '',
    isPublic: true
  });

  useEffect(() => {
    fetchSupportData();
    fetchAnalytics();
  }, []);

  const fetchSupportData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, faqRes] = await Promise.all([
        api.get('/api/admin/support/tickets'),
        api.get('/api/admin/support/faq')
      ]);

      if (ticketsRes.data.success) {
        const ticketsData = ticketsRes.data.data?.tickets || ticketsRes.data.data;
        setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      }
      if (faqsRes.data.success) {
        const faqsData = faqsRes.data.data?.faqs || faqsRes.data.data;
        setFaqs(Array.isArray(faqsData) ? faqsData : []);
      }
    } catch (error) {
      console.error('Error fetching support data:', error);
      setTickets([]); // Ensure it's always an array
      setFaqs([]); // Ensure it's always an array
      toast.error('Failed to fetch support data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
  const response = await api.get('/api/admin/support/analytics');
      if (response.data.success) {
        setAnalytics(response.data.data || {});
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics({}); // Ensure it's always an object
    }
  };

  const handleCreateTicket = async () => {
    try {
  const response = await api.post('/api/support/tickets', ticketFormData);
      if (response.data.success) {
        toast.success('Ticket created successfully');
        setDialogOpen(false);
        fetchSupportData();
        fetchAnalytics();
        resetTicketForm();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    }
  };

  const handleCreateFAQ = async () => {
    try {
  const response = await api.post('/api/support/faq', faqFormData);
      if (response.data.success) {
        toast.success('FAQ created successfully');
        setDialogOpen(false);
        fetchSupportData();
        resetFAQForm();
      }
    } catch (error) {
      console.error('Error creating FAQ:', error);
      toast.error(error.response?.data?.message || 'Failed to create FAQ');
    }
  };

  const handleReplyToTicket = async () => {
    try {
  const response = await api.post(`/api/support/tickets/${selectedItem._id}/reply`, replyFormData);
      if (response.data.success) {
        toast.success('Reply sent successfully');
        setDialogOpen(false);
        fetchSupportData();
        resetReplyForm();
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error(error.response?.data?.message || 'Failed to send reply');
    }
  };

  const handleCloseTicket = async (ticketId) => {
    try {
  await api.patch(`/api/support/tickets/${ticketId}/close`);
      toast.success('Ticket closed successfully');
      fetchSupportData();
      fetchAnalytics();
    } catch (error) {
      console.error('Error closing ticket:', error);
      toast.error('Failed to close ticket');
    }
  };

  const resetTicketForm = () => {
    setTicketFormData({
      subject: '',
      description: '',
      category: 'other',
      priority: 'medium',
      assignedTo: '',
      status: 'open'
    });
  };

  const resetFAQForm = () => {
    setFaqFormData({
      question: '',
      answer: '',
      category: 'general',
      isPublished: true,
      order: 0
    });
  };

  const resetReplyForm = () => {
    setReplyFormData({
      message: '',
      isPublic: true
    });
  };

  const handleDialogOpen = (type, item = null) => {
    setDialogType(type);
    setSelectedItem(item);
    
    if (item && type === 'ticket') {
      setTicketFormData({
        subject: item.subject || '',
        description: item.description || '',
        category: item.category || 'other',
        priority: item.priority || 'medium',
        assignedTo: item.assignedTo?._id || '',
        status: item.status || 'open'
      });
    } else if (item && type === 'faq') {
      setFaqFormData({
        question: item.question || '',
        answer: item.answer || '',
        category: item.category || 'general',
        isPublished: item.isPublished !== false,
        order: item.order || 0
      });
    } else {
      resetTicketForm();
      resetFAQForm();
      resetReplyForm();
    }
    
    setDialogOpen(true);
  };

  const getPriorityChip = (priority) => {
    const config = {
      low: { label: 'Low', color: 'info' },
      medium: { label: 'Medium', color: 'warning' },
      high: { label: 'High', color: 'error' },
      urgent: { label: 'Urgent', color: 'error' }
    };
    
    const { label, color } = config[priority] || config.medium;
    return <Chip label={label} color={color} size="small" />;
  };

  const getStatusChip = (status) => {
    const config = {
      open: { label: 'Open', color: 'primary' },
      in_progress: { label: 'In Progress', color: 'warning' },
      resolved: { label: 'Resolved', color: 'success' },
      closed: { label: 'Closed', color: 'default' },
      escalated: { label: 'Escalated', color: 'error' }
    };
    
    const { label, color } = config[status] || config.open;
    return <Chip label={label} color={color} size="small" />;
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
          Customer Support
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleDialogOpen('faq')}
          >
            Add FAQ
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleDialogOpen('ticket')}
          >
            Create Ticket
          </Button>
        </Box>
      </Box>

      {/* Analytics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <TicketIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Total Tickets
              </Typography>
              <Typography variant="h4" color="primary">
                {analytics.totalTickets || tickets.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <SupportIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Open Tickets
              </Typography>
              <Typography variant="h4" color="warning.main">
                {analytics.openTickets || tickets.filter(t => t.status === 'open').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <ChatIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Resolved
              </Typography>
              <Typography variant="h4" color="success.main">
                {analytics.resolvedTickets || tickets.filter(t => t.status === 'resolved').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <PriorityIcon sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Avg Response
              </Typography>
              <Typography variant="h4" color="secondary.main">
                {analytics.avgResponseTime || 2}h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <FAQIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                FAQ Articles
              </Typography>
              <Typography variant="h4" color="info.main">
                {analytics.totalFAQs || faqs.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab 
              label={
                <Badge badgeContent={tickets.filter(t => t.status === 'open').length} color="error">
                  Support Tickets
                </Badge>
              } 
            />
            <Tab label="FAQ Management" />
          </Tabs>
        </Box>

        {/* Support Tickets Tab */}
        <TabPanel value={tabValue} index={0}>
          {/* Filters */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Priority"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="all">All Priority</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ticket ID</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets
                  .filter(ticket => 
                    (statusFilter === 'all' || ticket.status === statusFilter) &&
                    (priorityFilter === 'all' || ticket.priority === priorityFilter) &&
                    (searchTerm === '' || 
                      ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      ticket.ticketId?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                  )
                  .map((ticket) => (
                    <TableRow key={ticket._id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          #{ticket.ticketId || ticket._id?.slice(-6)}
                        </Typography>
                      </TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {ticket.userId?.username?.[0]?.toUpperCase() || 'U'}
                          </Avatar>
                          <Typography variant="body2">
                            {ticket.userId?.username || 'Unknown User'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={ticket.category?.replace('_', ' ')} 
                          variant="outlined" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        {getPriorityChip(ticket.priority)}
                      </TableCell>
                      <TableCell>
                        {getStatusChip(ticket.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Reply">
                            <IconButton
                              size="small"
                              onClick={() => handleDialogOpen('reply', ticket)}
                            >
                              <ReplyIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleDialogOpen('ticket', ticket)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {ticket.status !== 'closed' && (
                            <Tooltip title="Close Ticket">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleCloseTicket(ticket._id)}
                              >
                                <CloseIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          {tickets.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No support tickets found
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* FAQ Management Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Question</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {faqs.map((faq) => (
                  <TableRow key={faq._id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {faq.question}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={faq.category} 
                        variant="outlined" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={faq.isPublished ? 'Published' : 'Draft'} 
                        color={faq.isPublished ? 'success' : 'default'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{faq.order}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Edit FAQ">
                          <IconButton
                            size="small"
                            onClick={() => handleDialogOpen('faq', faq)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {faqs.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No FAQ articles found
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
          {dialogType === 'ticket' && (selectedItem ? 'Edit Ticket' : 'Create New Ticket')}
          {dialogType === 'faq' && (selectedItem ? 'Edit FAQ' : 'Create New FAQ')}
          {dialogType === 'reply' && 'Reply to Ticket'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'ticket' && (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={ticketFormData.subject}
                    onChange={(e) => setTicketFormData({ ...ticketFormData, subject: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Description"
                    value={ticketFormData.description}
                    onChange={(e) => setTicketFormData({ ...ticketFormData, description: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Category"
                    value={ticketFormData.category}
                    onChange={(e) => setTicketFormData({ ...ticketFormData, category: e.target.value })}
                  >
                    <MenuItem value="order_issue">Order Issue</MenuItem>
                    <MenuItem value="payment_problem">Payment Problem</MenuItem>
                    <MenuItem value="shipping_inquiry">Shipping Inquiry</MenuItem>
                    <MenuItem value="product_question">Product Question</MenuItem>
                    <MenuItem value="account_issue">Account Issue</MenuItem>
                    <MenuItem value="technical_support">Technical Support</MenuItem>
                    <MenuItem value="refund_request">Refund Request</MenuItem>
                    <MenuItem value="complaint">Complaint</MenuItem>
                    <MenuItem value="suggestion">Suggestion</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Priority"
                    value={ticketFormData.priority}
                    onChange={(e) => setTicketFormData({ ...ticketFormData, priority: e.target.value })}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Box>
          )}

          {dialogType === 'faq' && (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Question"
                    value={faqFormData.question}
                    onChange={(e) => setFaqFormData({ ...faqFormData, question: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Answer"
                    value={faqFormData.answer}
                    onChange={(e) => setFaqFormData({ ...faqFormData, answer: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Category"
                    value={faqFormData.category}
                    onChange={(e) => setFaqFormData({ ...faqFormData, category: e.target.value })}
                  >
                    <MenuItem value="general">General</MenuItem>
                    <MenuItem value="orders">Orders</MenuItem>
                    <MenuItem value="shipping">Shipping</MenuItem>
                    <MenuItem value="payments">Payments</MenuItem>
                    <MenuItem value="returns">Returns</MenuItem>
                    <MenuItem value="account">Account</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Display Order"
                    value={faqFormData.order}
                    onChange={(e) => setFaqFormData({ ...faqFormData, order: parseInt(e.target.value) || 0 })}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {dialogType === 'reply' && selectedItem && (
            <Box component="form" sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Replying to ticket: {selectedItem.subject}
              </Alert>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Reply Message"
                value={replyFormData.message}
                onChange={(e) => setReplyFormData({ ...replyFormData, message: e.target.value })}
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          {dialogType === 'ticket' && (
            <Button
              variant="contained"
              onClick={handleCreateTicket}
              disabled={!ticketFormData.subject || !ticketFormData.description}
            >
              {selectedItem ? 'Update' : 'Create'} Ticket
            </Button>
          )}
          {dialogType === 'faq' && (
            <Button
              variant="contained"
              onClick={handleCreateFAQ}
              disabled={!faqFormData.question || !faqFormData.answer}
            >
              {selectedItem ? 'Update' : 'Create'} FAQ
            </Button>
          )}
          {dialogType === 'reply' && (
            <Button
              variant="contained"
              onClick={handleReplyToTicket}
              disabled={!replyFormData.message}
            >
              Send Reply
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CustomerSupport;

