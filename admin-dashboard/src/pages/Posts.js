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
  Tabs,
  Tab,
  IconButton,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Article as PostIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon
} from '@mui/icons-material';

const Posts = () => {
  const [tabValue, setTabValue] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [postDialog, setPostDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    scheduled: 0,
    totalEngagement: 0
  });

  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    imageUrl: '',
    category: '',
    tags: '',
    visibility: 'public',
    allowComments: true
  });

  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, [tabValue]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const statusFilter = tabValue === 0 ? 'all' : tabValue === 1 ? 'active' : 'scheduled';
      const payload = await api.get(`/api/content?type=post&status=${statusFilter}&limit=100`);
      setPosts(payload?.content || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const payload = await api.get('/api/content/stats?type=post');
      setStats(payload || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSavePost = async () => {
    try {
      const postData = {
        ...postForm,
        tags: postForm.tags.split(',').map(t => t.trim()),
        type: 'post'
      };

      if (selectedPost) {
        await api.put(`/api/content/${selectedPost._id}`, postData);
        alert('Post updated successfully');
      } else {
        await api.post('/api/content', postData);
        alert('Post created successfully');
      }

      setPostDialog(false);
      setSelectedPost(null);
      setPostForm({
        title: '',
        content: '',
        imageUrl: '',
        category: '',
        tags: '',
        visibility: 'public',
        allowComments: true
      });
      fetchPosts();
      fetchStats();
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.delete(`/api/content/${postId}`);
      alert('Post deleted successfully');
      fetchPosts();
      fetchStats();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Posts Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedPost(null);
            setPostForm({
              title: '',
              content: '',
              imageUrl: '',
              category: '',
              tags: '',
              visibility: 'public',
              allowComments: true
            });
            setPostDialog(true);
          }}
        >
          Create Post
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Posts</Typography>
              <Typography variant="h4">{stats.total || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Active</Typography>
              <Typography variant="h4" color="success.main">{stats.active || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Scheduled</Typography>
              <Typography variant="h4" color="warning.main">{stats.scheduled || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Engagement</Typography>
              <Typography variant="h4" color="primary.main">
                {formatNumber(stats.totalEngagement || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
          <Tab label="All Posts" />
          <Tab label="Published" />
          <Tab label="Scheduled" />
        </Tabs>
      </Paper>

      {/* Posts Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Post</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Engagement</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {post.imageUrl ? (
                        <Avatar src={post.imageUrl} variant="rounded" sx={{ width: 60, height: 60 }}>
                          <ImageIcon />
                        </Avatar>
                      ) : (
                        <Avatar variant="rounded" sx={{ width: 60, height: 60 }}>
                          <PostIcon />
                        </Avatar>
                      )}
                      <Box sx={{ maxWidth: 300 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {post.title || 'Untitled Post'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" noWrap>
                          {post.description?.substring(0, 60)}...
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={post.creator?.avatar} sx={{ width: 32, height: 32 }} />
                      <Typography variant="body2">{post.creator?.username}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={post.category || 'General'} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block">
                      ❤️ {formatNumber(post.likes || 0)}
                    </Typography>
                    <Typography variant="caption" display="block">
                      💬 {formatNumber(post.comments || 0)}
                    </Typography>
                    <Typography variant="caption" display="block">
                      🔄 {formatNumber(post.shares || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={post.status}
                      color={
                        post.status === 'active' ? 'success' :
                        post.status === 'scheduled' ? 'warning' :
                        'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedPost(post);
                          setPostForm({
                            title: post.title || '',
                            content: post.description || '',
                            imageUrl: post.imageUrl || '',
                            category: post.category || '',
                            tags: post.tags?.join(', ') || '',
                            visibility: post.visibility || 'public',
                            allowComments: post.allowComments !== false
                          });
                          setPostDialog(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeletePost(post._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Post Dialog */}
      <Dialog open={postDialog} onClose={() => setPostDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedPost ? 'Edit Post' : 'Create Post'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={postForm.title}
                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Content"
                value={postForm.content}
                onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Category"
                value={postForm.category}
                onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tags (comma-separated)"
                value={postForm.tags}
                onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })}
                placeholder="tech, news, trending"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL (optional)"
                value={postForm.imageUrl}
                onChange={(e) => setPostForm({ ...postForm, imageUrl: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Visibility</InputLabel>
                <Select
                  value={postForm.visibility}
                  onChange={(e) => setPostForm({ ...postForm, visibility: e.target.value })}
                >
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="followers">Followers Only</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPostDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePost}>
            {selectedPost ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Posts;
