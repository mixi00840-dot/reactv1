import React from 'react';
import ReactPlayer from 'react-player';
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

  // Use videoUrl from API or fallback to mock video
  const videoSource = video.videoUrl || video.url || 'https://www.w3schools.com/html/mov_bbb.mp4';

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
        <Typography variant="h6">{video.title || 'Video Player'}</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ bgcolor: 'black', p: 0 }}>
        <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <ReactPlayer
            url={videoSource}
            controls
            playing
            width="100%"
            height="100%"
            style={{
              position: 'absolute',
              top: 0,
              left: 0
            }}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload'
                }
              }
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ bgcolor: 'black', color: 'white', justifyContent: 'space-between', px: 3, py: 2 }}>
        <Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Views: {video.views?.toLocaleString() || 0} • Likes: {video.likes?.toLocaleString() || 0} • Comments: {video.comments || 0}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Duration: {video.duration} • Uploaded: {video.uploadDate}
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

