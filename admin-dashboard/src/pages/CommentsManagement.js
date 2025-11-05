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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Avatar,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Comment as CommentIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Check as CheckIcon,
  Flag as FlagIcon,
  Person as PersonIcon,
  VideoLibrary as VideoIcon,
  Image as ImageIcon,
  Reply as ReplyIcon,
  Favorite as LikeIcon,
  Visibility as ViewIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CommentsManagement = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedComments, setSelectedComments] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    contentType: 'all',
    page: 1,
    limit: 20
  });
  const [commentDialog, setCommentDialog] = useState({ open: false, comment: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const tabs = [
    { label: 'All Comments', value: 'all' },
    { label: 'Pending Review', value: 'pending' },
    { label: 'Reported', value: 'reported' },
    { label: 'Approved', value: 'approved' },
    { label: 'Blocked', value: 'blocked' }
  ];

  useEffect(() => {
    fetchComments();
  }, [filters, selectedTab]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/admin/comments', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          ...filters,
          status: tabs[selectedTab].value
        }
      });
      const list = response?.data?.data?.comments || response?.data?.comments || response?.comments || response?.data || response;
      setComments(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      // Generate dummy data for demonstration
      const dummyComments = Array.from({ length: 20 }, (_, i) => ({
        _id: `comment_${i + 1}`,
        content: `This is a sample comment ${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. ${Math.random() > 0.8 ? 'This comment contains inappropriate content and should be reviewed.' : ''}`,
        author: {
          _id: `user_${i + 1}`,
          username: `user${i + 1}`,
          avatar: `https://ui-avatars.com/api/?name=User+${i + 1}&background=random`,
          role: Math.random() > 0.8 ? 'creator' : 'user'
        },
        contentId: {
          _id: `content_${i + 1}`,
          title: `Video/Post ${i + 1}`,
          type: Math.random() > 0.5 ? 'video' : 'post'
        },
        status: ['pending', 'approved', 'reported', 'blocked'][Math.floor(Math.random() * 4)],
        likes: Math.floor(Math.random() * 100),
        replies: Math.floor(Math.random() * 20),
        isReported: Math.random() > 0.8,
        reportCount: Math.floor(Math.random() * 5),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }));
      setComments(dummyComments);
    }
    setLoading(false);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    setSelectedComments([]);
  };

  const handleSelectComment = (commentId) => {
    setSelectedComments(prev => 
      prev.includes(commentId) 
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };

  const handleSelectAll = () => {
    const commentsArray = Array.isArray(comments) ? comments : [];
    if (selectedComments.length === commentsArray.length && commentsArray.length > 0) {
      setSelectedComments([]);
    } else {
      setSelectedComments(commentsArray.map(comment => comment._id));
    }
  };

  const handleCommentAction = async (action, commentId = null) => {
    const commentsToUpdate = commentId ? [commentId] : selectedComments;
    
    try {
      const token = localStorage.getItem('token');
      
      for (const id of commentsToUpdate) {
        await api.patch(`/api/admin/comments/${id}`, 
          { action },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      setSnackbar({
        open: true,
        message: `Comments ${action}ed successfully`,
        severity: 'success'
      });
      
      fetchComments();
      setSelectedComments([]);
    } catch (error) {
      console.error('Error updating comments:', error);
      setSnackbar({
        open: true,
        message: `Error ${action}ing comments`,
        severity: 'error'
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await api.delete('/api/admin/comments/bulk', {
        headers: { Authorization: `Bearer ${token}` },
        data: { commentIds: selectedComments }
      });
      
      setSnackbar({
        open: true,
        message: 'Comments deleted successfully',
        severity: 'success'
      });
      
      fetchComments();
      setSelectedComments([]);
    } catch (error) {
      console.error('Error deleting comments:', error);
      setSnackbar({
        open: true,
        message: 'Error deleting comments',
        severity: 'error'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'reported': return 'error';
      case 'blocked': return 'default';
      default: return 'default';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CommentIcon /> Comments Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selectedComments.length > 0 && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleCommentAction('approve')}
                  startIcon={<CheckIcon />}
                >
                  Approve ({selectedComments.length})
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={() => handleCommentAction('block')}
                  startIcon={<BlockIcon />}
                >
                  Block ({selectedComments.length})
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleBulkDelete}
                  startIcon={<DeleteIcon />}
                >
                  Delete ({selectedComments.length})
                </Button>
              </>
            )}
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search comments, users, content..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Content Type</InputLabel>
              <Select
                value={filters.contentType}
                onChange={(e) => setFilters({ ...filters, contentType: e.target.value })}
                label="Content Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="video">Videos</MenuItem>
                <MenuItem value="post">Posts</MenuItem>
                <MenuItem value="product">Products</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={fetchComments}
              sx={{ height: '40px' }}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>

        <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={(Array.isArray(comments) ? comments : []).length === selectedComments.length && selectedComments.length > 0}
                    indeterminate={selectedComments.length > 0 && selectedComments.length < (Array.isArray(comments) ? comments : []).length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Comment</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Content</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Engagement</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : !Array.isArray(comments) || comments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    No comments found
                  </TableCell>
                </TableRow>
              ) : (
                comments.map((comment) => (
                  <TableRow key={comment._id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedComments.includes(comment._id)}
                        onChange={() => handleSelectComment(comment._id)}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {comment.content}
                      </Typography>
                      {comment.isReported && (
                        <Chip 
                          size="small" 
                          icon={<FlagIcon />} 
                          label={`${comment.reportCount} reports`}
                          color="error"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar 
                          src={comment.author.avatar} 
                          sx={{ width: 32, height: 32 }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {comment.author.username}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={comment.author.role} 
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {comment.contentId.type === 'video' ? <VideoIcon /> : <ImageIcon />}
                        <Typography variant="body2">
                          {comment.contentId.title}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={comment.status}
                        color={getStatusColor(comment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip 
                          icon={<LikeIcon />}
                          label={comment.likes}
                          size="small"
                          variant="outlined"
                        />
                        <Chip 
                          icon={<ReplyIcon />}
                          label={comment.replies}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(comment.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => setCommentDialog({ open: true, comment })}
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleCommentAction('approve', comment._id)}
                        >
                          <CheckIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleCommentAction('block', comment._id)}
                        >
                          <BlockIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleCommentAction('delete', comment._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination
            count={Math.ceil((Array.isArray(comments) ? comments.length : 0) / filters.limit)}
            page={filters.page}
            onChange={(e, page) => setFilters({ ...filters, page })}
            color="primary"
          />
        </Box>
      </Paper>

      {/* Comment Detail Dialog */}
      <Dialog 
        open={commentDialog.open} 
        onClose={() => setCommentDialog({ open: false, comment: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Comment Details</DialogTitle>
        <DialogContent>
          {commentDialog.comment && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Comment Content</Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography>{commentDialog.comment.content}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" gutterBottom>Author Info</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar src={commentDialog.comment.author.avatar} />
                    <Box>
                      <Typography fontWeight="bold">
                        {commentDialog.comment.author.username}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Role: {commentDialog.comment.author.role}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" gutterBottom>Content Info</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {commentDialog.comment.contentId.type === 'video' ? <VideoIcon /> : <ImageIcon />}
                    <Typography>{commentDialog.comment.contentId.title}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Engagement Stats</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <LikeIcon color="primary" />
                        <Typography variant="h6">{commentDialog.comment.likes}</Typography>
                        <Typography variant="body2">Likes</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <ReplyIcon color="primary" />
                        <Typography variant="h6">{commentDialog.comment.replies}</Typography>
                        <Typography variant="body2">Replies</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <FlagIcon color="error" />
                        <Typography variant="h6">{commentDialog.comment.reportCount || 0}</Typography>
                        <Typography variant="body2">Reports</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Chip 
                          label={commentDialog.comment.status}
                          color={getStatusColor(commentDialog.comment.status)}
                        />
                        <Typography variant="body2" sx={{ mt: 1 }}>Status</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialog({ open: false, comment: null })}>
            Close
          </Button>
          {commentDialog.comment && (
            <>
              <Button 
                color="success"
                onClick={() => {
                  handleCommentAction('approve', commentDialog.comment._id);
                  setCommentDialog({ open: false, comment: null });
                }}
              >
                Approve
              </Button>
              <Button 
                color="warning"
                onClick={() => {
                  handleCommentAction('block', commentDialog.comment._id);
                  setCommentDialog({ open: false, comment: null });
                }}
              >
                Block
              </Button>
              <Button 
                color="error"
                onClick={() => {
                  handleCommentAction('delete', commentDialog.comment._id);
                  setCommentDialog({ open: false, comment: null });
                }}
              >
                Delete
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CommentsManagement;
