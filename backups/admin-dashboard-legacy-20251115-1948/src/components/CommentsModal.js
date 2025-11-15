import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  TextField,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Favorite as LikeIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon
} from '@mui/icons-material';
import mongoAPI from '../utils/apiMongoDB';
import toast from 'react-hot-toast';

function CommentsModal({ open, onClose, contentId, contentType = 'video', contentTitle }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && contentId) {
      fetchComments();
    }
  }, [open, contentId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      // Fetch comments for this specific content
      const response = await mongoAPI.get(`/api/comments/mongodb?contentId=${contentId}&contentType=${contentType}`);
      
      if (response.success && response.data) {
        setComments(response.data.comments || []);
      } else {
        // Mock data for demo if API fails
        setComments([
          {
            _id: '1',
            userId: { username: 'user123', avatar: null },
            text: 'This is amazing! Great content! 🔥',
            likes: 24,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            _id: '2',
            userId: { username: 'creator456', avatar: null },
            text: 'Love this! Can you make more videos like this?',
            likes: 15,
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
          },
          {
            _id: '3',
            userId: { username: 'fan789', avatar: null },
            text: 'Excellent work! Keep it up! 👏👏',
            likes: 8,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await mongoAPI.delete(`/api/comments/mongodb/${commentId}`);
      setComments(comments.filter(c => c._id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">Comments</Typography>
          <Typography variant="caption" color="textSecondary">
            {contentTitle}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ minHeight: 400, maxHeight: 600 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        ) : comments.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <Typography variant="body2" color="textSecondary">
              No comments yet
            </Typography>
          </Box>
        ) : (
          <List>
            {comments.map((comment, index) => (
              <React.Fragment key={comment._id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar src={comment.userId?.avatar}>
                      {comment.userId?.username?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2" component="span">
                          {comment.userId?.username || 'Anonymous'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatTimeAgo(comment.createdAt)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" sx={{ mt: 0.5, mb: 1 }}>
                          {comment.text}
                        </Typography>
                        <Box display="flex" gap={1} alignItems="center">
                          <Chip
                            icon={<LikeIcon />}
                            label={comment.likes || 0}
                            size="small"
                            variant="outlined"
                          />
                          <IconButton size="small" color="error" onClick={() => handleDeleteComment(comment._id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </>
                    }
                  />
                </ListItem>
                {index < comments.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default CommentsModal;

