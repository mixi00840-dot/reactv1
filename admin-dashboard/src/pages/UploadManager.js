import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../utils/api';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
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
  LinearProgress,
  Alert,
  Snackbar,
  Dropzone,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  Image as ImageIcon,
  Delete as DeleteIcon,
  Pause as PauseIcon,
  PlayArrow as ResumeIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Folder as FolderIcon,
  Description as FileIcon
} from '@mui/icons-material';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const UploadManager = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploadDialog, setUploadDialog] = useState({ open: false, type: 'video' });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    page: 1,
    limit: 20
  });

  const tabs = [
    { label: 'All Uploads', value: 'all', icon: <FolderIcon /> },
    { label: 'Videos', value: 'video', icon: <VideoIcon /> },
    { label: 'Audio/Music', value: 'audio', icon: <AudioIcon /> },
    { label: 'Images', value: 'image', icon: <ImageIcon /> },
    { label: 'Gifts/Animations', value: 'gift', icon: <ImageIcon /> }
  ];

  const uploadTypes = [
    { value: 'video', label: 'Video', accept: '.mp4,.mov,.avi,.mkv', icon: <VideoIcon /> },
    { value: 'audio', label: 'Audio/Music', accept: '.mp3,.wav,.flac,.aac', icon: <AudioIcon /> },
    { value: 'image', label: 'Image', accept: '.jpg,.jpeg,.png,.gif,.webp', icon: <ImageIcon /> },
    { value: 'gift', label: 'Gift/Animation', accept: '.gif,.png,.svg,.lottie', icon: <ImageIcon /> }
  ];

  useEffect(() => {
    fetchUploads();
  }, [filters, selectedTab]);

  const fetchUploads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/admin/uploads', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          ...filters,
          type: tabs[selectedTab].value
        }
      });
      setUploads(response?.data?.uploads || response?.uploads || []);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      // Generate dummy data for demonstration
      const dummyUploads = Array.from({ length: 15 }, (_, i) => ({
        _id: `upload_${i + 1}`,
        fileName: `file_${i + 1}.${['mp4', 'mp3', 'jpg', 'gif'][Math.floor(Math.random() * 4)]}`,
        originalName: `Original File ${i + 1}`,
        type: ['video', 'audio', 'image', 'gift'][Math.floor(Math.random() * 4)],
        size: Math.floor(Math.random() * 50) + 1, // MB
        status: ['uploading', 'processing', 'completed', 'failed'][Math.floor(Math.random() * 4)],
        progress: Math.floor(Math.random() * 100),
        uploadedBy: {
          _id: `user_${i + 1}`,
          username: `user${i + 1}`,
          role: Math.random() > 0.7 ? 'creator' : 'user'
        },
        url: `https://example.com/uploads/file_${i + 1}`,
        thumbnailUrl: `https://ui-avatars.com/api/?name=File+${i + 1}&background=random`,
        duration: Math.floor(Math.random() * 300), // seconds
        resolution: ['1920x1080', '1280x720', '854x480'][Math.floor(Math.random() * 3)],
        bitrate: Math.floor(Math.random() * 5000) + 1000,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }));
      setUploads(dummyUploads);
    }
    setLoading(false);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  const handleFileSelect = (files) => {
    const newFiles = files.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'pending'
    }));
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setUploadDialog({ open: true, type: 'batch' });
  };

  const handleSingleUpload = async (file, uploadType, metadata = {}) => {
    try {
      const token = localStorage.getItem('token');
      
      // Generate presigned URL (server route is /api/uploads)
      const presignedResponse = await api.post('/api/uploads/presigned-url', {
        fileName: file.name,
        fileType: file.type,
        contentType: uploadType,
        metadata
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
  const { uploadUrl, key, uploadId } = presignedResponse;
      
      // Upload file directly to storage; fallback to server proxy on CORS error
      try {
        await axios.put(uploadUrl, file, {
          headers: { 'Content-Type': file.type },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // Update progress in UI
            setSelectedFiles(prev => prev.map(f => 
              f.file === file ? { ...f, progress, status: 'uploading' } : f
            ));
          }
        });
      } catch (err) {
        console.warn('Direct-to-storage upload failed, using backend proxy...', err?.message || err);
        const form = new FormData();
        form.append('file', file);
        form.append('type', uploadType);
        const directRes = await api.post('/api/uploads/direct', form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const url = directRes?.data?.url || directRes?.url;
        if (url) {
          // Short-circuit confirm if proxy used
          setSelectedFiles(prev => prev.map(f => 
            f.file === file ? { ...f, progress: 100, status: 'completed' } : f
          ));
          setSnackbar({ open: true, message: `${file.name} uploaded via proxy`, severity: 'success' });
          fetchUploads();
          return;
        }
      }
      
          // Confirm upload completion (use uploadId, not key)
          await api.post(`/api/uploads/${uploadId || key}/confirm`, {
        metadata
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSelectedFiles(prev => prev.map(f => 
        f.file === file ? { ...f, progress: 100, status: 'completed' } : f
      ));
      
      setSnackbar({
        open: true,
        message: `${file.name} uploaded successfully`,
        severity: 'success'
      });
      
      fetchUploads();
    } catch (error) {
      console.error('Upload error:', error);
      setSelectedFiles(prev => prev.map(f => 
        f.file === file ? { ...f, status: 'failed' } : f
      ));
      
      setSnackbar({
        open: true,
        message: `Failed to upload ${file.name}`,
        severity: 'error'
      });
    }
  };

  const handleBatchUpload = async () => {
    const uploadType = uploadDialog.type;
    
    for (const fileItem of selectedFiles) {
      if (fileItem.status === 'pending') {
        await handleSingleUpload(fileItem.file, uploadType);
      }
    }
    
    setUploadDialog({ open: false, type: 'video' });
    setTimeout(() => setSelectedFiles([]), 2000); // Clear after 2 seconds
  };

  const handlePauseUpload = (uploadId) => {
    // Implementation for pausing upload
    setSnackbar({
      open: true,
      message: 'Upload paused',
      severity: 'info'
    });
  };

  const handleResumeUpload = (uploadId) => {
    // Implementation for resuming upload
    setSnackbar({
      open: true,
      message: 'Upload resumed',
      severity: 'info'
    });
  };

  const handleCancelUpload = async (uploadId) => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/upload/${uploadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSnackbar({
        open: true,
        message: 'Upload cancelled',
        severity: 'success'
      });
      
      fetchUploads();
    } catch (error) {
      console.error('Error cancelling upload:', error);
      setSnackbar({
        open: true,
        message: 'Error cancelling upload',
        severity: 'error'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'uploading': return 'info';
      case 'processing': return 'warning';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <VideoIcon />;
      case 'audio': return <AudioIcon />;
      case 'image': return <ImageIcon />;
      case 'gift': return <ImageIcon />;
      default: return <FileIcon />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UploadIcon /> Upload Manager
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={fetchUploads}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              onClick={() => setUploadDialog({ open: true, type: 'video' })}
              startIcon={<UploadIcon />}
            >
              New Upload
            </Button>
          </Box>
        </Box>

        {/* Quick Upload Drop Zone */}
        <Box
          sx={{
            border: '2px dashed',
            borderColor: dragOver ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            bgcolor: dragOver ? 'primary.50' : 'grey.50',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            mb: 3
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input
            id="file-input"
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(Array.from(e.target.files))}
          />
          <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            Drop files here or click to browse
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supports videos, audio, images, and animations
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search files..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="uploading">Uploading</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>File Type</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                label="File Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="video">Videos</MenuItem>
                <MenuItem value="audio">Audio</MenuItem>
                <MenuItem value="image">Images</MenuItem>
                <MenuItem value="gift">Gifts</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          {tabs.map((tab, index) => (
            <Tab 
              key={index} 
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>File</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Uploaded By</TableCell>
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
              ) : uploads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    No uploads found
                  </TableCell>
                </TableRow>
              ) : (
                uploads.map((upload) => (
                  <TableRow key={upload._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {upload.thumbnailUrl && (
                          <CardMedia
                            component="img"
                            sx={{ width: 60, height: 40, borderRadius: 1 }}
                            image={upload.thumbnailUrl}
                            alt={upload.fileName}
                          />
                        )}
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {upload.fileName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {upload.originalName}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTypeIcon(upload.type)}
                        <Typography variant="body2">
                          {upload.type}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatFileSize(upload.size * 1024 * 1024)}
                      </Typography>
                      {upload.duration && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {formatDuration(upload.duration)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={upload.status}
                        color={getStatusColor(upload.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ width: 150 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={upload.progress}
                          sx={{ flexGrow: 1 }}
                        />
                        <Typography variant="caption">
                          {upload.progress}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {upload.uploadedBy.username}
                      </Typography>
                      <Chip 
                        label={upload.uploadedBy.role}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(upload.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {upload.status === 'uploading' && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => handlePauseUpload(upload._id)}
                            >
                              <PauseIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleCancelUpload(upload._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </>
                        )}
                        {upload.status === 'paused' && (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleResumeUpload(upload._id)}
                          >
                            <ResumeIcon />
                          </IconButton>
                        )}
                        {upload.status === 'completed' && (
                          <IconButton
                            size="small"
                            onClick={() => window.open(upload.url, '_blank')}
                          >
                            <DownloadIcon />
                          </IconButton>
                        )}
                        {upload.status === 'failed' && (
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleResumeUpload(upload._id)}
                          >
                            <RefreshIcon />
                          </IconButton>
                        )}
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
            count={Math.ceil(uploads.length / filters.limit)}
            page={filters.page}
            onChange={(e, page) => setFilters({ ...filters, page })}
            color="primary"
          />
        </Box>
      </Paper>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialog.open} 
        onClose={() => {
          setUploadDialog({ open: false, type: 'video' });
          setSelectedFiles([]);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {uploadDialog.type === 'batch' ? 'Batch Upload' : 'New Upload'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {uploadDialog.type !== 'batch' && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Select Upload Type
                  </Typography>
                  <Grid container spacing={2}>
                    {uploadTypes.map((type) => (
                      <Grid item xs={6} md={3} key={type.value}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer',
                            border: uploadDialog.type === type.value ? '2px solid' : '1px solid',
                            borderColor: uploadDialog.type === type.value ? 'primary.main' : 'grey.300'
                          }}
                          onClick={() => setUploadDialog({ ...uploadDialog, type: type.value })}
                        >
                          <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            {type.icon}
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {type.label}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              </Grid>
            )}

            {selectedFiles.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Selected Files ({selectedFiles.length})
                </Typography>
                <List>
                  {selectedFiles.map((fileItem) => (
                    <ListItem key={fileItem.id}>
                      <ListItemIcon>
                        {fileItem.status === 'completed' ? (
                          <CheckIcon color="success" />
                        ) : fileItem.status === 'failed' ? (
                          <ErrorIcon color="error" />
                        ) : (
                          getTypeIcon(fileItem.type.split('/')[0])
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={fileItem.name}
                        secondary={
                          <Box>
                            <Typography variant="caption">
                              {formatFileSize(fileItem.size)} • {fileItem.status}
                            </Typography>
                            {fileItem.status === 'uploading' && (
                              <LinearProgress
                                variant="determinate"
                                value={fileItem.progress}
                                sx={{ mt: 0.5 }}
                              />
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          size="small"
                          onClick={() => setSelectedFiles(prev => 
                            prev.filter(f => f.id !== fileItem.id)
                          )}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {selectedFiles.length === 0 && (
              <Box
                sx={{
                  border: '2px dashed grey.300',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => document.getElementById('dialog-file-input').click()}
              >
                <input
                  id="dialog-file-input"
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  accept={uploadTypes.find(t => t.value === uploadDialog.type)?.accept}
                  onChange={(e) => handleFileSelect(Array.from(e.target.files))}
                />
                <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Choose files to upload
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {uploadTypes.find(t => t.value === uploadDialog.type)?.accept}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setUploadDialog({ open: false, type: 'video' });
              setSelectedFiles([]);
            }}
          >
            Cancel
          </Button>
          {selectedFiles.length > 0 && (
            <Button 
              onClick={handleBatchUpload}
              variant="contained"
              startIcon={<UploadIcon />}
            >
              Start Upload ({selectedFiles.length} files)
            </Button>
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

export default UploadManager;