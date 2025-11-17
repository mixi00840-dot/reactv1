import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  Pagination,
  Tooltip,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button
} from '@mui/material';
import {
  VideoLibrary as VideoIcon,
  Image as ImageIcon,
  AudioFile as AudioIcon,
  Description as DocumentIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Download as ExportIcon
} from '@mui/icons-material';
import mongoAPI from '../../utils/apiMongoDB';
import toast from 'react-hot-toast';

function UserUploadsTab({ userId }) {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [storageStats, setStorageStats] = useState({
    used: 0,
    total: 0,
    percentage: 0
  });

  useEffect(() => {
    fetchUploads();
    fetchStorageStats();
  }, [userId, filterType, page]);

  const fetchUploads = async () => {
    setLoading(true);
    try {
      const response = await mongoAPI.get(`/api/admin/content`, {
        params: {
          userId,
          type: filterType !== 'all' ? filterType : undefined,
          page,
          limit: 20
        }
      });

      if (response.contents || response.data?.contents) {
        const contentList = response.contents || response.data.contents || [];
        setUploads(contentList);
        const pagination = response.pagination || response.data?.pagination || {};
        setTotalPages(pagination.pages || 1);
      } else {
        setUploads([]);
      }
    } catch (error) {
      console.error('Error fetching uploads:', error);
      setUploads([]);
      toast.error('Failed to load uploads');
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageStats = async () => {
    try {
      // Calculate storage from content count
      const response = await mongoAPI.get(`/api/admin/users/${userId}`);
      if (response.data || response.user) {
        const userData = response.data || response.user;
        const contentCount = userData.stats?.contentCount || 0;
        // Estimate: 10MB average per content item
        const usedBytes = contentCount * 10 * 1024 * 1024;
        const totalBytes = 5 * 1024 * 1024 * 1024; // 5GB
        setStorageStats({ 
          used: usedBytes, 
          total: totalBytes, 
          percentage: (usedBytes / totalBytes) * 100 
        });
      } else {
        setStorageStats({ used: 0, total: 5 * 1024 * 1024 * 1024, percentage: 0 });
      }
    } catch (error) {
      console.error('Error fetching storage stats:', error);
      setStorageStats({ used: 0, total: 5 * 1024 * 1024 * 1024, percentage: 0 });
    }
  };

  const generateMockUploads = () => {
    const types = ['video', 'image', 'audio', 'document'];
    const mock = Array.from({ length: 15 }, (_, i) => {
      const type = types[Math.floor(Math.random() * types.length)];
      return {
        _id: `upload${i + 1}`,
        fileName: `${type}_file_${i + 1}.${getExtension(type)}`,
        type,
        size: Math.floor(Math.random() * 50000000) + 100000, // 0.1MB to 50MB
        url: `https://cdn.example.com/${type}_${i + 1}`,
        status: Math.random() > 0.1 ? 'completed' : 'processing',
        uploadDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        thumbnail: type === 'image' || type === 'video' ? `https://via.placeholder.com/60?text=${type}` : null
      };
    });
    setUploads(mock);
  };

  const getExtension = (type) => {
    switch (type) {
      case 'video':
        return 'mp4';
      case 'image':
        return 'jpg';
      case 'audio':
        return 'mp3';
      case 'document':
        return 'pdf';
      default:
        return 'file';
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'video':
        return <VideoIcon />;
      case 'image':
        return <ImageIcon />;
      case 'audio':
        return <AudioIcon />;
      case 'document':
        return <DocumentIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  const getFileColor = (type) => {
    switch (type) {
      case 'video':
        return 'primary';
      case 'image':
        return 'success';
      case 'audio':
        return 'secondary';
      case 'document':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = (upload) => {
    if (upload.url) {
      window.open(upload.url, '_blank');
      toast.success('Download started');
    } else {
      toast.error('File not available');
    }
  };

  const handleDelete = async (uploadId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await mongoAPI.delete(`/api/admin/content/${uploadId}`);
      setUploads(uploads.filter(u => u._id !== uploadId));
      toast.success('File deleted successfully');
      fetchStorageStats(); // Refresh storage stats
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const filteredUploads = uploads.filter(upload => {
    const matchesType = filterType === 'all' || upload.type === filterType;
    const matchesSearch = (upload.caption || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Storage Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Storage Usage
              </Typography>
              <Box sx={{ mt: 2, mb: 1 }}>
                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    {formatFileSize(storageStats.used * 1024 * 1024)} of {formatFileSize(storageStats.total * 1024 * 1024)} used
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {storageStats.percentage.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={storageStats.percentage}
                  sx={{ height: 10, borderRadius: 1 }}
                  color={storageStats.percentage > 80 ? 'error' : storageStats.percentage > 60 ? 'warning' : 'primary'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Files
              </Typography>
              <Typography variant="h3" color="primary" sx={{ mt: 2 }}>
                {uploads.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ minWidth: 300 }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>File Type</InputLabel>
          <Select
            value={filterType}
            label="File Type"
            onChange={(e) => setFilterType(e.target.value)}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="video">Videos</MenuItem>
            <MenuItem value="image">Images</MenuItem>
            <MenuItem value="audio">Audio</MenuItem>
            <MenuItem value="document">Documents</MenuItem>
          </Select>
        </FormControl>

        <Box flexGrow={1} />

        <Typography variant="body2" color="textSecondary" sx={{ alignSelf: 'center' }}>
          {filteredUploads.length} files
        </Typography>
      </Box>

      {/* Files Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Preview</TableCell>
              <TableCell>File Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUploads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                    No files found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUploads.map((upload) => (
                <TableRow key={upload._id} hover>
                  <TableCell>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 1,
                        overflow: 'hidden',
                        bgcolor: 'grey.200',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {upload.thumbnailUrl ? (
                        <img
                          src={upload.thumbnailUrl}
                          alt={upload.caption || 'Upload'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Box color={`${getFileColor(upload.type)}.main`}>
                          {getFileIcon(upload.type)}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 300 }}>
                      {upload.caption || 'Untitled'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getFileIcon(upload.type)}
                      label={upload.type?.toUpperCase()}
                      size="small"
                      color={getFileColor(upload.type)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatFileSize(upload.size)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={upload.status}
                      size="small"
                      color={upload.status === 'completed' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(upload.uploadDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="Download">
                        <IconButton size="small" color="primary" onClick={() => handleDownload(upload)}>
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(upload._id)}>
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
    </Box>
  );
}

export default UserUploadsTab;

