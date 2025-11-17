import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

function VideoPlayerModal({ open, onClose, video }) {
  if (!video) return null;

  // Use videoUrl from Content model
  const videoSource = video.videoUrl || video.url || video.mediaUrl;
  const videoTitle = video.caption || video.title || 'Video Player';

  console.log('VideoPlayerModal video object:', video);
  console.log('VideoPlayerModal videoSource:', videoSource);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { bgcolor: 'black' }
      }}
    >
      <DialogTitle sx={{ bgcolor: 'black', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{videoTitle}</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ bgcolor: 'black', p: 0 }}>
        <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <video
            src={videoSource}
            controls
            autoPlay
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ bgcolor: 'black', color: 'white', justifyContent: 'space-between', px: 3, py: 2 }}>
        <Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Views: {video.viewsCount?.toLocaleString() || 0} • Likes: {video.likesCount?.toLocaleString() || 0} • Comments: {video.commentsCount || 0}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Duration: {video.duration}s • Uploaded: {new Date(video.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
        <Button onClick={onClose} variant="outlined" sx={{ color: 'white', borderColor: 'white' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default VideoPlayerModal;


