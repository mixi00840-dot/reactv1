import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Stack,
  Card,
  CardContent
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Save as SaveIcon,
  VideoLibrary as VideoIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import UniversalUploader from '../components/upload/UniversalUploader';
import mongoAPI from '../utils/apiMongoDB';
import toast from 'react-hot-toast';

/**
 * Bulk Content Upload Page
 * 
 * Features:
 * - Upload videos/images for users
 * - Choose content type (Feed/Post)
 * - Add tags, hashtags, captions
 * - Assign to specific user
 * - Schedule publishing
 * - Bulk metadata application
 */
const ContentUploadPage = () => {
  // Form state
  const [contentType, setContentType] = useState('video'); // video or image
  const [postType, setPostType] = useState('feed'); // feed or post
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userOptions, setUserOptions] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Metadata
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('active'); // active, draft, scheduled
  const [scheduledDate, setScheduledDate] = useState(null);
  const [allowComments, setAllowComments] = useState(true);
  const [allowSharing, setAllowSharing] = useState(true);
  
  // Upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  // Search users
  const handleUserSearch = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) return;
    
    setSearchingUsers(true);
    try {
      const response = await mongoAPI.get('/api/admin/users', {
        params: {
          search: searchTerm,
          limit: 20
        }
      });
      
      if (response.success) {
        setUserOptions(response.data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Handle file uploads complete
  const handleUploadComplete = (files) => {
    setUploadedFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} files uploaded to Cloudinary`);
  };

  // Save content to database
  const handleSaveContent = async () => {
    // Validation
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }
    
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    if (!caption.trim()) {
      toast.error('Please add a caption');
      return;
    }

    setSaving(true);

    try {
      // Get user ID (handle both _id and id)
      const userId = selectedUser._id || selectedUser.id;
      
      if (!userId) {
        throw new Error('Selected user has no valid ID');
      }

      console.log('Creating content with userId:', userId);
      console.log('Selected user object:', selectedUser);

      // Create content for each uploaded file
      const contentPromises = uploadedFiles.map(async (file) => {
        const contentData = {
          userId: userId,
          type: contentType, // 'video' or 'image'
          postType: postType, // 'feed' or 'post' - determines which tab
          mediaUrl: file.url,
          caption: caption,
          tags: tags,
          hashtags: hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`),
          location: location || undefined,
          status: status,
          scheduledDate: status === 'scheduled' ? scheduledDate : undefined,
          settings: {
            allowComments,
            allowSharing
          },
          cloudinaryData: {
            publicId: file.publicId,
            format: file.format,
            width: file.width,
            height: file.height,
            duration: file.duration,
            resourceType: file.resourceType,
            thumbnailUrl: file.resourceType === 'video' 
              ? file.url.replace('/video/upload/', '/video/upload/so_0,w_400,h_225,c_fill,f_jpg/')
              : file.url
          }
        };

        console.log('Sending content data:', contentData);
        const response = await mongoAPI.post('/api/admin/content', contentData);
        console.log('Content response:', response);
        return response.data;
      });

      const results = await Promise.all(contentPromises);
      
      toast.success(`✓ ${results.length} content items created successfully`);
      
      // Reset form
      setUploadedFiles([]);
      setCaption('');
      setTags([]);
      setHashtags([]);
      setLocation('');
      setScheduledDate(null);
      
    } catch (error) {
      console.error('Error saving content:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Unknown error occurred';
      
      toast.error('Failed to save content: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          📤 Bulk Content Upload
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Upload videos/images on behalf of users. Add metadata and publish to feed or posts.
        </Typography>

        <Grid container spacing={3}>
          {/* Left Column - Upload & Settings */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              {/* Content Type Selector */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    1️⃣ Select Content Type
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant={contentType === 'video' ? 'contained' : 'outlined'}
                        startIcon={<VideoIcon />}
                        onClick={() => setContentType('video')}
                        sx={{ py: 2 }}
                      >
                        Video Content
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant={contentType === 'image' ? 'contained' : 'outlined'}
                        startIcon={<ImageIcon />}
                        onClick={() => setContentType('image')}
                        sx={{ py: 2 }}
                      >
                        Image Content
                      </Button>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Post Type</InputLabel>
                      <Select
                        value={postType}
                        onChange={(e) => setPostType(e.target.value)}
                        label="Post Type"
                      >
                        <MenuItem value="feed">📱 Feed (TikTok-style)</MenuItem>
                        <MenuItem value="post">📸 Post (Instagram-style)</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </Card>

              {/* File Uploader */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  2️⃣ Upload Files
                </Typography>
                <UniversalUploader
                  uploadType={contentType}
                  onUploadComplete={handleUploadComplete}
                  maxFiles={50}
                  maxSizeMB={100}
                  multiple={true}
                />
                
                {uploadedFiles.length > 0 && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    ✓ {uploadedFiles.length} files ready to publish
                  </Alert>
                )}
              </Paper>

              {/* Metadata Form */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  3️⃣ Add Metadata (Applied to all files)
                </Typography>
                
                <Stack spacing={2}>
                  {/* Caption */}
                  <TextField
                    label="Caption"
                    multiline
                    rows={4}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Enter caption for the content..."
                    helperText={`${caption.length} characters`}
                    fullWidth
                  />

                  {/* Tags */}
                  <Autocomplete
                    multiple
                    freeSolo
                    options={['trending', 'viral', 'featured', 'new', 'popular']}
                    value={tags}
                    onChange={(e, newValue) => setTags(newValue)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip label={option} {...getTagProps({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Tags"
                        placeholder="Add tags (press Enter)"
                      />
                    )}
                  />

                  {/* Hashtags */}
                  <Autocomplete
                    multiple
                    freeSolo
                    options={['#viral', '#trending', '#funny', '#dance', '#music']}
                    value={hashtags}
                    onChange={(e, newValue) => setHashtags(newValue)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip 
                          label={option.startsWith('#') ? option : `#${option}`} 
                          color="primary"
                          {...getTagProps({ index })} 
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Hashtags"
                        placeholder="Add hashtags (# optional)"
                      />
                    )}
                  />

                  {/* Location */}
                  <TextField
                    label="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Add location (optional)"
                    fullWidth
                  />
                </Stack>
              </Paper>
            </Stack>
          </Grid>

          {/* Right Column - User & Settings */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              {/* User Selection */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  4️⃣ Assign to User
                </Typography>
                
                <Autocomplete
                  options={userOptions}
                  loading={searchingUsers}
                  value={selectedUser}
                  onChange={(e, newValue) => setSelectedUser(newValue)}
                  onInputChange={(e, newInputValue) => {
                    setUserSearch(newInputValue);
                    handleUserSearch(newInputValue);
                  }}
                  getOptionLabel={(option) => 
                    `${option.username} (${option.email})`
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search User"
                      placeholder="Type username or email..."
                      helperText="Search by username or email"
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {option.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.email}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />

                {selectedUser && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Content will be uploaded as: <strong>{selectedUser.username}</strong>
                  </Alert>
                )}
              </Paper>

              {/* Publishing Settings */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  5️⃣ Publishing Settings
                </Typography>
                
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="active">✅ Publish Now</MenuItem>
                      <MenuItem value="draft">📝 Save as Draft</MenuItem>
                      <MenuItem value="scheduled">⏰ Schedule</MenuItem>
                    </Select>
                  </FormControl>

                  {status === 'scheduled' && (
                    <DateTimePicker
                      label="Schedule Date & Time"
                      value={scheduledDate}
                      onChange={setScheduledDate}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                      minDateTime={new Date()}
                    />
                  )}

                  <Divider />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={allowComments}
                        onChange={(e) => setAllowComments(e.target.checked)}
                      />
                    }
                    label="Allow Comments"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={allowSharing}
                        onChange={(e) => setAllowSharing(e.target.checked)}
                      />
                    }
                    label="Allow Sharing"
                  />
                </Stack>
              </Paper>

              {/* Save Button */}
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<SaveIcon />}
                onClick={handleSaveContent}
                disabled={saving || !selectedUser || uploadedFiles.length === 0}
                sx={{ py: 2 }}
              >
                {saving ? 'Publishing...' : `Publish ${uploadedFiles.length} Items`}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
};

export default ContentUploadPage;
