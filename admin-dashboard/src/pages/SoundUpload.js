import React, { useState, useRef } from 'react';
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
  Alert,
  Stack,
  Card,
  CardContent,
  IconButton,
  LinearProgress
} from '@mui/material';
import {
  MusicNote as MusicIcon,
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import UniversalUploader from '../components/upload/UniversalUploader';
import mongoAPI from '../utils/apiMongoDB';
import toast from 'react-hot-toast';

/**
 * Audio Library Upload Page
 * 
 * Features:
 * - Upload audio files (MP3, WAV, OGG, M4A)
 * - Metadata (title, artist, album, genre, mood)
 * - Audio preview player
 * - License/rights management
 * - Categories and tags
 * - Duration auto-detection
 */
const SoundUpload = () => {
  // Audio metadata
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState([]);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);

  // Licensing
  const [license, setLicense] = useState('royalty-free');
  const [rightsHolder, setRightsHolder] = useState('');
  const [allowCommercialUse, setAllowCommercialUse] = useState(true);

  // Category
  const [category, setCategory] = useState('music');

  // Upload state
  const [uploadedAudio, setUploadedAudio] = useState([]);
  const [saving, setSaving] = useState(false);

  // Audio player state
  const [playing, setPlaying] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const genres = [
    'Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical',
    'Country', 'R&B', 'Reggae', 'Blues', 'Folk', 'Latin',
    'Metal', 'Indie', 'Ambient', 'World', 'Other'
  ];

  const moods = [
    'Happy', 'Sad', 'Energetic', 'Calm', 'Romantic', 'Epic',
    'Mysterious', 'Uplifting', 'Dark', 'Playful', 'Dramatic', 'Inspirational'
  ];

  const categories = [
    { value: 'music', label: '🎵 Music' },
    { value: 'sound-effect', label: '🔊 Sound Effect' },
    { value: 'voiceover', label: '🎙️ Voiceover' },
    { value: 'podcast', label: '📻 Podcast' },
    { value: 'jingle', label: '🎶 Jingle/Short' }
  ];

  const licenses = [
    { value: 'royalty-free', label: 'Royalty Free' },
    { value: 'creative-commons', label: 'Creative Commons' },
    { value: 'copyrighted', label: 'Copyrighted' },
    { value: 'public-domain', label: 'Public Domain' },
    { value: 'licensed', label: 'Licensed' }
  ];

  const handleAudioUploaded = (files) => {
    setUploadedAudio(prev => [...prev, ...files]);
    toast.success(`${files.length} audio files uploaded`);
  };

  const handlePlayPause = (audioUrl, index) => {
    if (playing === index) {
      audioRef.current?.pause();
      setPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setPlaying(index);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleAudioEnded = () => {
    setPlaying(null);
    setCurrentTime(0);
  };

  const removeAudio = (index) => {
    const updated = uploadedAudio.filter((_, i) => i !== index);
    setUploadedAudio(updated);
    if (playing === index) {
      audioRef.current?.pause();
      setPlaying(null);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveAudio = async () => {
    // Validation
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (uploadedAudio.length === 0) {
      toast.error('Please upload at least one audio file');
      return;
    }

    setSaving(true);

    try {
      // Create sound record for each uploaded file
      const soundPromises = uploadedAudio.map(async (audio) => {
        const soundData = {
          title: title,
          artist: artist || 'Unknown Artist',
          album: album,
          genre: genre,
          mood: mood,
          description: description,
          category: category,
          audioUrl: audio.url,
          tags: tags,
          license: {
            type: license,
            rightsHolder: rightsHolder,
            allowCommercialUse: allowCommercialUse
          },
          cloudinaryData: {
            publicId: audio.publicId,
            format: audio.format,
            duration: audio.duration,
            resourceType: audio.resourceType
          },
          status: 'active'
        };

        const response = await mongoAPI.post('/api/admin/sounds', soundData);
        return response.data;
      });

      const results = await Promise.all(soundPromises);
      
      toast.success(`✓ ${results.length} audio files added to library`);
      
      // Reset form
      setTitle('');
      setArtist('');
      setAlbum('');
      setGenre('');
      setMood([]);
      setDescription('');
      setTags([]);
      setUploadedAudio([]);
      
    } catch (error) {
      console.error('Error saving audio:', error);
      toast.error('Failed to save audio: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        style={{ display: 'none' }}
      />

      <Typography variant="h4" gutterBottom fontWeight="bold">
        🎵 Audio Library Upload
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Upload music, sound effects, and audio content for the platform
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column - Upload & Metadata */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            {/* Audio Uploader */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                1️⃣ Upload Audio Files
              </Typography>
              <UniversalUploader
                uploadType="audio"
                onUploadComplete={handleAudioUploaded}
                maxFiles={20}
                maxSizeMB={50}
                multiple={true}
              />
            </Paper>

            {/* Uploaded Audio List with Player */}
            {uploadedAudio.length > 0 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Uploaded Audio ({uploadedAudio.length})
                </Typography>
                <Stack spacing={2}>
                  {uploadedAudio.map((audio, index) => (
                    <Card key={index} variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2}>
                          <IconButton
                            onClick={() => handlePlayPause(audio.url, index)}
                            color="primary"
                          >
                            {playing === index ? <PauseIcon /> : <PlayIcon />}
                          </IconButton>
                          
                          <Box flex={1}>
                            <Typography variant="body2" fontWeight="bold">
                              {audio.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {audio.format?.toUpperCase()} • {(audio.size / 1024 / 1024).toFixed(2)} MB
                              {audio.duration && ` • ${formatTime(audio.duration)}`}
                            </Typography>
                            
                            {playing === index && (
                              <Box sx={{ mt: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={(currentTime / duration) * 100}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {formatTime(currentTime)} / {formatTime(duration)}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                          
                          <IconButton
                            onClick={() => removeAudio(index)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Paper>
            )}

            {/* Basic Metadata */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                2️⃣ Audio Metadata
              </Typography>
              
              <Stack spacing={2}>
                <TextField
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  fullWidth
                  placeholder="Song title or audio name"
                />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Artist/Creator"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Album"
                      value={album}
                      onChange={(e) => setAlbum(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Genre</InputLabel>
                      <Select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        label="Genre"
                      >
                        {genres.map(g => (
                          <MenuItem key={g} value={g}>{g}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <Autocomplete
                      multiple
                      options={moods}
                      value={mood}
                      onChange={(e, newValue) => setMood(newValue)}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip label={option} {...getTagProps({ index })} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="Mood" />
                      )}
                    />
                  </Grid>
                </Grid>

                <Autocomplete
                  multiple
                  freeSolo
                  options={['instrumental', 'vocals', 'remix', 'cover', 'original']}
                  value={tags}
                  onChange={(e, newValue) => setTags(newValue)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip label={option} {...getTagProps({ index })} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Tags" placeholder="Add tags" />
                  )}
                />
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column - Category & License */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Category */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                3️⃣ Category
              </Typography>
              
              <FormControl fullWidth>
                <InputLabel>Audio Type</InputLabel>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  label="Audio Type"
                >
                  {categories.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>

            {/* License & Rights */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                4️⃣ License & Rights
              </Typography>
              
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>License Type</InputLabel>
                  <Select
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    label="License Type"
                  >
                    {licenses.map(lic => (
                      <MenuItem key={lic.value} value={lic.value}>
                        {lic.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Rights Holder"
                  value={rightsHolder}
                  onChange={(e) => setRightsHolder(e.target.value)}
                  fullWidth
                  placeholder="Who owns the rights?"
                />

                <Alert severity="info">
                  {license === 'royalty-free' && '✓ Can be used freely'}
                  {license === 'creative-commons' && 'ℹ️ Attribution required'}
                  {license === 'copyrighted' && '⚠️ Permission needed'}
                  {license === 'public-domain' && '✓ No restrictions'}
                  {license === 'licensed' && 'ℹ️ License agreement required'}
                </Alert>
              </Stack>
            </Paper>

            {/* Save Button */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<SaveIcon />}
              onClick={handleSaveAudio}
              disabled={saving || !title || uploadedAudio.length === 0}
              sx={{ py: 2 }}
            >
              {saving ? 'Saving...' : `Add ${uploadedAudio.length} to Library`}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SoundUpload;
