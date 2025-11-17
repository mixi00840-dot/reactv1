import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Grid,
  IconButton,
  Chip,
  Alert,
  Stack
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Universal File Uploader Component
 * 
 * Features:
 * - Drag & drop or click to upload
 * - Multiple file support
 * - Progress tracking per file
 * - Preview thumbnails
 * - Direct URL input
 * - Cloudinary integration
 * - Supports images, videos, audio, documents
 * 
 * @param {Object} props
 * @param {string} props.uploadType - Type of upload (image, video, audio, document, any)
 * @param {Function} props.onUploadComplete - Callback with uploaded file URLs
 * @param {number} props.maxFiles - Maximum files allowed (default: 50)
 * @param {number} props.maxSizeMB - Max file size in MB (default: 100)
 * @param {boolean} props.multiple - Allow multiple files (default: true)
 * @param {Array} props.acceptedFormats - Accepted file formats
 */
const UniversalUploader = ({
  uploadType = 'any',
  onUploadComplete,
  maxFiles = 50,
  maxSizeMB = 100,
  multiple = true,
  acceptedFormats = null
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [urlInput, setUrlInput] = useState('');

  // Define accepted file types
  const getAcceptedTypes = () => {
    if (acceptedFormats) return acceptedFormats;
    
    switch (uploadType) {
      case 'image':
        return {
          'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
        };
      case 'video':
        return {
          'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
        };
      case 'audio':
        return {
          'audio/*': ['.mp3', '.wav', '.ogg', '.m4a']
        };
      case 'document':
        return {
          'application/pdf': ['.pdf'],
          'application/msword': ['.doc', '.docx'],
          'application/vnd.ms-excel': ['.xls', '.xlsx']
        };
      default:
        return undefined; // Accept all
    }
  };

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach(error => {
          if (error.code === 'file-too-large') {
            toast.error(`${file.name} is too large. Max size: ${maxSizeMB}MB`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`${file.name} has invalid format`);
          } else {
            toast.error(`${file.name}: ${error.message}`);
          }
        });
      });
    }

    // Check total files limit
    if (files.length + acceptedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Add accepted files
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') 
        ? URL.createObjectURL(file) 
        : null,
      status: 'pending', // pending, uploading, success, error
      progress: 0,
      url: null,
      error: null
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [files, maxFiles, maxSizeMB]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptedTypes(),
    maxSize: maxSizeMB * 1024 * 1024,
    multiple,
    disabled: uploading
  });

  // Upload files to Cloudinary
  const uploadToCloudinary = async (fileData) => {
    const formData = new FormData();
    formData.append('file', fileData.file);
    formData.append('upload_preset', 'mixillo_uploads'); // Configure in Cloudinary

    // Determine resource type
    let resourceType = 'auto';
    if (fileData.type.startsWith('video/')) resourceType = 'video';
    else if (fileData.type.startsWith('image/')) resourceType = 'image';
    else if (fileData.type.startsWith('audio/')) resourceType = 'video'; // Cloudinary uses 'video' for audio

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'mixillo'}/${resourceType}/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({
              ...prev,
              [fileData.id]: progress
            }));
          }
        }
      );

      return {
        url: response.data.secure_url,
        publicId: response.data.public_id,
        format: response.data.format,
        width: response.data.width,
        height: response.data.height,
        duration: response.data.duration,
        resourceType: response.data.resource_type
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(error.response?.data?.error?.message || 'Upload failed');
    }
  };

  // Handle bulk upload
  const handleUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) {
      toast.error('No files to upload');
      return;
    }

    setUploading(true);
    const uploadedUrls = [];

    // Upload files one by one (can be parallelized with Promise.all)
    for (const fileData of pendingFiles) {
      try {
        // Update status
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'uploading' } : f
        ));

        // Upload to Cloudinary
        const result = await uploadToCloudinary(fileData);

        // Update success status
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: 'success', url: result.url, cloudinaryData: result } 
            : f
        ));

        uploadedUrls.push(result);
        toast.success(`✓ ${fileData.name} uploaded`);

      } catch (error) {
        // Update error status
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: 'error', error: error.message } 
            : f
        ));
        toast.error(`✗ ${fileData.name} failed: ${error.message}`);
      }
    }

    setUploading(false);

    // Callback with all uploaded URLs
    if (uploadedUrls.length > 0 && onUploadComplete) {
      onUploadComplete(uploadedUrls);
    }
  };

  // Add URL manually
  const handleAddUrl = () => {
    if (!urlInput.trim()) return;

    const newFile = {
      id: `url-${Date.now()}`,
      name: urlInput.split('/').pop() || 'URL File',
      size: 0,
      type: uploadType,
      preview: uploadType === 'image' ? urlInput : null,
      status: 'success',
      progress: 100,
      url: urlInput,
      error: null
    };

    setFiles(prev => [...prev, newFile]);
    setUrlInput('');
    toast.success('URL added');

    if (onUploadComplete) {
      onUploadComplete([{ url: urlInput }]);
    }
  };

  // Remove file
  const handleRemove = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // Clear all
  const handleClearAll = () => {
    setFiles([]);
    setUploadProgress({});
  };

  // Get file icon
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <ImageIcon />;
    if (type.startsWith('video/')) return <VideoIcon />;
    if (type.startsWith('audio/')) return <AudioIcon />;
    return <FileIcon />;
  };

  // Format file size
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const pendingCount = files.filter(f => f.status === 'pending').length;

  return (
    <Box>
      {/* Dropzone Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          bgcolor: isDragActive ? 'primary.50' : 'background.paper',
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.50'
          }
        }}
      >
        <input {...getInputProps()} />
        <Stack alignItems="center" spacing={2}>
          <UploadIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary">
            {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to select'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Max {maxFiles} files • {maxSizeMB}MB each • {uploadType === 'any' ? 'All formats' : `${uploadType}s only`}
          </Typography>
        </Stack>
      </Paper>

      {/* URL Input */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <input
          type="text"
          placeholder="Or paste file URL (Cloudinary, CDN, etc.)"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
          style={{
            flex: 1,
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
          disabled={uploading}
        />
        <Button
          variant="outlined"
          onClick={handleAddUrl}
          disabled={!urlInput.trim() || uploading}
        >
          Add URL
        </Button>
      </Box>

      {/* Files List */}
      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          {/* Stats */}
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="body2">
              Total: <strong>{files.length}</strong>
            </Typography>
            {successCount > 0 && (
              <Chip
                icon={<CheckIcon />}
                label={`${successCount} uploaded`}
                color="success"
                size="small"
              />
            )}
            {pendingCount > 0 && (
              <Chip
                label={`${pendingCount} pending`}
                color="default"
                size="small"
              />
            )}
            {errorCount > 0 && (
              <Chip
                icon={<ErrorIcon />}
                label={`${errorCount} failed`}
                color="error"
                size="small"
              />
            )}
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              onClick={handleClearAll}
              disabled={uploading}
            >
              Clear All
            </Button>
          </Box>

          {/* File Grid */}
          <Grid container spacing={2}>
            {files.map(fileData => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={fileData.id}>
                <Paper
                  sx={{
                    p: 2,
                    position: 'relative',
                    border: '1px solid',
                    borderColor: 
                      fileData.status === 'success' ? 'success.main' :
                      fileData.status === 'error' ? 'error.main' :
                      fileData.status === 'uploading' ? 'primary.main' :
                      'grey.300'
                  }}
                >
                  {/* Remove Button */}
                  <IconButton
                    size="small"
                    onClick={() => handleRemove(fileData.id)}
                    disabled={uploading}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'background.paper'
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>

                  {/* Preview */}
                  {fileData.preview ? (
                    <Box
                      component="img"
                      src={fileData.preview}
                      sx={{
                        width: '100%',
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 1,
                        mb: 1
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: 120,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      {getFileIcon(fileData.type)}
                    </Box>
                  )}

                  {/* File Info */}
                  <Typography variant="body2" noWrap title={fileData.name}>
                    {fileData.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatSize(fileData.size)}
                  </Typography>

                  {/* Progress */}
                  {fileData.status === 'uploading' && (
                    <LinearProgress
                      variant="determinate"
                      value={uploadProgress[fileData.id] || 0}
                      sx={{ mt: 1 }}
                    />
                  )}

                  {/* Status */}
                  {fileData.status === 'success' && (
                    <Alert severity="success" sx={{ mt: 1, py: 0 }}>
                      Uploaded ✓
                    </Alert>
                  )}
                  {fileData.status === 'error' && (
                    <Alert severity="error" sx={{ mt: 1, py: 0 }}>
                      {fileData.error}
                    </Alert>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Upload Button */}
          {pendingCount > 0 && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<UploadIcon />}
                onClick={handleUpload}
                disabled={uploading}
                sx={{ minWidth: 200 }}
              >
                {uploading ? `Uploading... (${successCount}/${files.length})` : `Upload ${pendingCount} Files`}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default UniversalUploader;
