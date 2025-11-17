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
  Tooltip
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Comment as CommentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Favorite as LikeIcon,
  Share as ShareIcon,
  Visibility as EyeIcon
} from '@mui/icons-material';
import mongoAPI from '../../utils/apiMongoDB';
import toast from 'react-hot-toast';
import VideoPlayerModal from '../VideoPlayerModal';
import CommentsModal from '../CommentsModal';

function UserVideosTab({ userId }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [selectedVideoForComments, setSelectedVideoForComments] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, [userId, page, searchQuery]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const response = await mongoAPI.get(`/api/admin/content`, {
        params: {
          userId,
          postType: 'feed',
          page,
          limit: 10,
          search: searchQuery
        }
      });

      console.log('Fetched videos response:', response);
      
      if (response.contents || response.data?.contents) {
        const contentList = response.contents || response.data.contents || [];
        setVideos(contentList);
        const pagination = response.pagination || response.data?.pagination || {};
        setTotalPages(pagination.pages || 1);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setVideos([]);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayVideo = (video) => {
    setSelectedVideo(video);
    setPlayerOpen(true);
  };

  const handleViewComments = (video) => {
    setSelectedVideoForComments(video);
    setCommentsOpen(true);
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;

    try {
      await mongoAPI.delete(`/api/content/${videoId}`);
      setVideos(videos.filter(v => v._id !== videoId));
      toast.success('Video deleted successfully');
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
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
          placeholder="Search videos..."
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
          Total Videos: {videos.length}
        </Typography>
      </Box>

      {/* Videos Table */}
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
            {videos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                    No videos found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              videos.map((video) => (
                <TableRow key={video._id} hover>
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
                        '&:hover .play-overlay': {
                          opacity: 1
                        }
                      }}
                      onClick={() => handlePlayVideo(video)}
                    >
                      <img
                        src={video.thumbnailUrl || video.videoUrl || 'https://via.placeholder.com/120x67?text=Video'}
                        alt={video.caption || 'Video'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <Box
                        className="play-overlay"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(0,0,0,0.5)',
                          opacity: 0,
                          transition: 'opacity 0.3s'
                        }}
                      >
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PlayIcon />
                        </Avatar>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {video.caption || 'Untitled'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={<CommentIcon />}
                      label={video.commentsCount?.toLocaleString() || 0}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={<LikeIcon />}
                      label={video.likes?.toLocaleString() || 0}
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={<CommentIcon />}
                      label={video.comments || 0}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{video.duration}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{video.uploadDate || new Date(video.createdAt).toLocaleDateString()}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="Play Video">
                        <IconButton size="small" color="primary" onClick={() => handlePlayVideo(video)}>
                          <PlayIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Comments">
                        <IconButton size="small" color="info" onClick={() => handleViewComments(video)}>
                          <CommentIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDeleteVideo(video._id)}>
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

      {/* Video Player Modal */}
      <VideoPlayerModal
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
        video={selectedVideo}
      />

      {/* Comments Modal */}
      <CommentsModal
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        contentId={selectedVideoForComments?._id}
        contentType="video"
        contentTitle={selectedVideoForComments?.title}
      />
    </Box>
  );
}

export default UserVideosTab;

