import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  InputAdornment
} from '@mui/material';
import {
  Translate as TranslateIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  TextRotationNone as RTLIcon
} from '@mui/icons-material';
import mongoAPI from '../utils/apiMongoDB';
import toast from 'react-hot-toast';

/**
 * Translation Manager
 * 
 * Features:
 * - Multi-language support
 * - RTL (Right-to-Left) toggle
 * - Key-value translation editor
 * - Import/Export CSV/JSON
 * - Search translations
 * - Missing translations highlighter
 * - Translation statistics
 */
const TranslationManager = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translations, setTranslations] = useState([]);
  const [filteredTranslations, setFilteredTranslations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState(null);
  
  // New translation form
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧', rtl: false },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦', rtl: true },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', rtl: false },
    { code: 'fr', name: 'French', flag: '🇫🇷', rtl: false },
    { code: 'de', name: 'German', flag: '🇩🇪', rtl: false },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳', rtl: false },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵', rtl: false },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳', rtl: false },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹', rtl: false },
    { code: 'ru', name: 'Russian', flag: '🇷🇺', rtl: false },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷', rtl: false },
    { code: 'he', name: 'Hebrew', flag: '🇮🇱', rtl: true }
  ];

  const currentLanguage = languages.find(lang => lang.code === selectedLanguage);

  useEffect(() => {
    loadTranslations();
  }, [selectedLanguage]);

  useEffect(() => {
    filterTranslations();
  }, [searchTerm, translations]);

  const loadTranslations = async () => {
    setLoading(true);
    try {
      const response = await mongoAPI.get('/api/admin/translations', {
        params: { language: selectedLanguage }
      });
      
      if (response.success) {
        setTranslations(response.data.translations || []);
      }
    } catch (error) {
      console.error('Error loading translations:', error);
      // Load sample data for demo
      setTranslations([
        { key: 'app.welcome', value: 'Welcome to Mixillo', category: 'general' },
        { key: 'auth.login', value: 'Login', category: 'auth' },
        { key: 'auth.register', value: 'Register', category: 'auth' },
        { key: 'feed.like', value: 'Like', category: 'feed' },
        { key: 'feed.comment', value: 'Comment', category: 'feed' },
        { key: 'feed.share', value: 'Share', category: 'feed' },
        { key: 'profile.edit', value: 'Edit Profile', category: 'profile' },
        { key: 'store.addToCart', value: 'Add to Cart', category: 'store' },
        { key: 'live.goLive', value: 'Go Live', category: 'live' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterTranslations = () => {
    if (!searchTerm) {
      setFilteredTranslations(translations);
    } else {
      const filtered = translations.filter(t =>
        t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.value.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTranslations(filtered);
    }
  };

  const handleAddTranslation = () => {
    setEditingTranslation(null);
    setNewKey('');
    setNewValue('');
    setDialogOpen(true);
  };

  const handleEditTranslation = (translation) => {
    setEditingTranslation(translation);
    setNewKey(translation.key);
    setNewValue(translation.value);
    setDialogOpen(true);
  };

  const handleSaveTranslation = async () => {
    if (!newKey || !newValue) {
      toast.error('Key and value are required');
      return;
    }

    try {
      const translationData = {
        language: selectedLanguage,
        key: newKey,
        value: newValue,
        category: newKey.split('.')[0] // Extract category from key (e.g., 'auth' from 'auth.login')
      };

      if (editingTranslation) {
        await mongoAPI.put(`/api/admin/translations/${editingTranslation._id}`, translationData);
        toast.success('Translation updated');
      } else {
        await mongoAPI.post('/api/admin/translations', translationData);
        toast.success('Translation added');
      }

      loadTranslations();
      setDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save translation');
    }
  };

  const handleDeleteTranslation = async (translation) => {
    if (!window.confirm('Delete this translation?')) return;

    try {
      await mongoAPI.delete(`/api/admin/translations/${translation._id}`);
      toast.success('Translation deleted');
      loadTranslations();
    } catch (error) {
      toast.error('Failed to delete translation');
    }
  };

  const handleExportJSON = () => {
    const exportData = {};
    translations.forEach(t => {
      exportData[t.key] = t.value;
    });

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translations_${selectedLanguage}.json`;
    a.click();
    toast.success('Translations exported');
  };

  const handleExportCSV = () => {
    const csv = ['Key,Value,Category\n'];
    translations.forEach(t => {
      csv.push(`"${t.key}","${t.value}","${t.category}"\n`);
    });

    const blob = new Blob(csv, { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translations_${selectedLanguage}.csv`;
    a.click();
    toast.success('Translations exported');
  };

  const handleImportFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let importedData = [];

        if (file.name.endsWith('.json')) {
          const json = JSON.parse(e.target.result);
          importedData = Object.entries(json).map(([key, value]) => ({
            language: selectedLanguage,
            key,
            value,
            category: key.split('.')[0]
          }));
        } else if (file.name.endsWith('.csv')) {
          const lines = e.target.result.split('\n');
          lines.slice(1).forEach(line => {
            const [key, value, category] = line.split(',').map(s => s.replace(/"/g, '').trim());
            if (key && value) {
              importedData.push({ language: selectedLanguage, key, value, category });
            }
          });
        }

        // Bulk import
        await mongoAPI.post('/api/admin/translations/bulk', { translations: importedData });
        toast.success(`${importedData.length} translations imported`);
        loadTranslations();
      } catch (error) {
        toast.error('Failed to import file');
      }
    };
    reader.readAsText(file);
  };

  const getStatistics = () => {
    const total = translations.length;
    const missing = translations.filter(t => !t.value || t.value.trim() === '').length;
    const categories = [...new Set(translations.map(t => t.category))];
    
    return { total, missing, categories: categories.length };
  };

  const stats = getStatistics();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        🌍 Translation Manager
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Manage multi-language translations with RTL support
      </Typography>

      <Grid container spacing={3}>
        {/* Top Bar - Language Selector & Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    label="Language"
                  >
                    {languages.map(lang => (
                      <MenuItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                        {lang.rtl && <Chip label="RTL" size="small" sx={{ ml: 1 }} />}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search translations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} md={5}>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddTranslation}
                  >
                    Add Translation
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportJSON}
                  >
                    Export JSON
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportCSV}
                  >
                    Export CSV
                  </Button>
                  
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                  >
                    Import
                    <input type="file" hidden accept=".json,.csv" onChange={handleImportFile} />
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h3" color="primary">{stats.total}</Typography>
                <Typography variant="body2" color="text.secondary">Total Translations</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h3" color={stats.missing > 0 ? 'error' : 'success'}>
                  {stats.missing}
                </Typography>
                <Typography variant="body2" color="text.secondary">Missing Translations</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h3" color="secondary">{stats.categories}</Typography>
                <Typography variant="body2" color="text.secondary">Categories</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* RTL Alert */}
        {currentLanguage?.rtl && (
          <Grid item xs={12}>
            <Alert severity="info" icon={<RTLIcon />}>
              <strong>RTL Mode Active:</strong> This language uses right-to-left text direction. 
              Text fields will automatically adjust.
            </Alert>
          </Grid>
        )}

        {/* Translation Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Key</strong></TableCell>
                  <TableCell><strong>Translation</strong></TableCell>
                  <TableCell><strong>Category</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTranslations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="text.secondary" py={4}>
                        {loading ? 'Loading...' : 'No translations found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTranslations.map((translation, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {translation.key}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          dir={currentLanguage?.rtl ? 'rtl' : 'ltr'}
                          sx={{ fontWeight: !translation.value ? 'normal' : 'bold' }}
                          color={!translation.value ? 'error' : 'inherit'}
                        >
                          {translation.value || '(missing)'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={translation.category} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleEditTranslation(translation)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteTranslation(translation)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTranslation ? 'Edit Translation' : 'Add Translation'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Translation Key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              fullWidth
              placeholder="e.g., auth.login, feed.like"
              helperText="Use dot notation: category.key"
              disabled={!!editingTranslation}
            />
            
            <TextField
              label="Translation Value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              fullWidth
              multiline
              rows={3}
              dir={currentLanguage?.rtl ? 'rtl' : 'ltr'}
              placeholder={currentLanguage?.rtl ? 'أدخل الترجمة هنا' : 'Enter translation here'}
            />

            {currentLanguage?.rtl && (
              <Alert severity="info" icon={<RTLIcon />}>
                Text will display right-to-left in the app
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTranslation} variant="contained" startIcon={<SaveIcon />}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TranslationManager;
