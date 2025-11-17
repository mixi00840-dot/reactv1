import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Avatar,
  Chip,
  Button,
  Typography,
  CircularProgress,
  TextField,
  InputAdornment,
  Pagination,
  Tooltip,
  Card,
  CardContent
} from '@mui/material';
import {
  Article as TextIcon,
  Image as ImageIcon,
  PlayArrow as VideoIcon,
  Comment as CommentIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Favorite as LikeIcon,
  Share as ShareIcon,
  Visibility as EyeIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import mongoAPI from '../../utils/apiMongoDB';
import toast from 'react-hot-toast';
import CommentsModal from '../CommentsModal';

function UserPostsTab({ userId }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, [userId, page, searchQuery]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await mongoAPI.get(`/api/content`, {
        params: {
          userId,
          type: 'post',
          page,
          limit: 10,
          search: searchQuery
        }
      });

      if (response.success && response.data) {
        setPosts(response.data.content || response.data.posts || []);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setPosts([]);
        toast.error('No posts found');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPost = (post) => {
    // Navigate to a new page to view full post
    navigate(`/posts/${post._id}`);
  };

  const handleViewComments = (post) => {
    setSelectedPost(post);
    setCommentsOpen(true);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await mongoAPI.delete(`/api/content/${postId}`);
      setPosts(posts.filter(p => p._id !== postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const getPostTypeIcon = (type) => {
    switch (type) {
      case 'text':
        return <TextIcon />;
      case 'image':
        return <ImageIcon />;
      case 'video':
        return <VideoIcon />;
      default:
        return <TextIcon />;
    }
  };

  const getPostTypeColor = (type) => {
    switch (type) {
      case 'text':
        return 'default';
      case 'image':
        return 'info';
      case 'video':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Search and Filters */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ width: 300 }}
        />
        <Typography variant="body2" color="textSecondary">
          Total Posts: {posts.length}
        </Typography>
      </Box>

      {/* Posts Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Thumbnail</TableCell>
              <TableCell>Title</TableCell>
              <TableCell align="center">Views</TableCell>
              <TableCell align="center">Likes</TableCell>
              <TableCell align="center">Comments</TableCell>
              <TableCell align="center">Duration</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                    No posts found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post._id} hover>
                  <TableCell>
                    <Box
                      sx={{
                        position: 'relative',
                        width: 120,
                        height: 67,
                        borderRadius: 1,
                        overflow: 'hidden',
                        bgcolor: 'grey.200',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={() => handleViewPost(post)}
                    >
                      {post.thumbnail ? (
                        <img
                          src={post.thumbnail}
                          alt={post.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Avatar sx={{ width: 48, height: 48, bgcolor: getPostTypeColor(post.type) + '.main' }}>
                          {getPostTypeIcon(post.type)}
                        </Avatar>
                      )}
                      {/* Post Type Badge */}
                      <Chip
                        label={post.type?.toUpperCase() || 'TEXT'}
                        size="small"
                        color={getPostTypeColor(post.type)}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          height: 20,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 300 }}>
                      {post.title || post.content?.substring(0, 50) + '...'}
                    </Typography>
                    {post.content && (
                      <Typography variant="caption" color="textSecondary" noWrap sx={{ maxWidth: 300, display: 'block' }}>
                        {post.content.substring(0, 60)}...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={<EyeIcon />}
                      label={post.views?.toLocaleString() || 0}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={<LikeIcon />}
                      label={post.likes?.toLocaleString() || 0}
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={<CommentIcon />}
                      label={post.comments || 0}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {post.type === 'video' ? post.duration : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {post.uploadDate || new Date(post.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="View Post">
                        <IconButton size="small" color="primary" onClick={() => handleViewPost(post)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Comments">
                        <IconButton size="small" color="info" onClick={() => handleViewComments(post)}>
                          <CommentIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDeletePost(post._id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* Comments Modal */}
      <CommentsModal
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        contentId={selectedPost?._id}
        contentType="post"
        contentTitle={selectedPost?.title || 'Post'}
      />
    </Box>
  );
}

export default UserPostsTab;

