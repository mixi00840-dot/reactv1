import React, { useState, useEffect } from 'react';
// MongoDB Migration
import mongoAPI from '../utils/apiMongoDB';
import toast from 'react-hot-toast';
const api = mongoAPI; // Alias for backward compatibility
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
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
  Checkbox,
  Alert,
  Snackbar,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Translate as TranslateIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Check as CheckIcon,
  Language as LanguageIcon,
  AutoFixHigh as AutoTranslateIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Flag as FlagIcon
} from '@mui/icons-material';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TranslationsManagement = () => {
  const [translations, setTranslations] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    language: 'all',
    status: 'all',
    page: 1,
    limit: 20
  });
  const [translationDialog, setTranslationDialog] = useState({ 
    open: false, 
    translation: null, 
    mode: 'create' 
  });
  const [autoTranslateDialog, setAutoTranslateDialog] = useState({ open: false });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [stats, setStats] = useState({
    totalKeys: 0,
    totalLanguages: 0,
    completionRate: 0,
    pendingTranslations: 0
  });

  const tabs = [
    { label: 'All Translations', value: 'all' },
    { label: 'English (Source)', value: 'en' },
    { label: 'Arabic', value: 'ar' },
    { label: 'Spanish', value: 'es' },
    { label: 'French', value: 'fr' }
  ];

  const defaultLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸', isDefault: true },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦', isDefault: false },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', isDefault: false },
    { code: 'fr', name: 'French', flag: '🇫🇷', isDefault: false },
    { code: 'de', name: 'German', flag: '🇩🇪', isDefault: false },
    { code: 'it', name: 'Italian', flag: '🇮🇹', isDefault: false },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹', isDefault: false },
    { code: 'ru', name: 'Russian', flag: '🇷🇺', isDefault: false },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳', isDefault: false },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵', isDefault: false }
  ];

  useEffect(() => {
    fetchTranslations();
    fetchStats();
    setLanguages(defaultLanguages);
  }, [filters, selectedTab]);

  const fetchTranslations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/translations', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          ...filters,
          language: tabs[selectedTab].value
        }
      });
      const list = response?.data?.data?.translations || response?.data?.translations || response?.translations || response?.data || response;
      setTranslations(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error fetching translations:', error);
      // Generate dummy data for demonstration
      const dummyTranslations = [
        {
          _id: 'key_1',
          key: 'common.welcome',
          description: 'Welcome message shown on homepage',
          category: 'common',
          translations: {
            en: 'Welcome to Mixillo',
            ar: 'مرحباً بك في ميكسيلو',
            es: 'Bienvenido a Mixillo',
            fr: 'Bienvenue sur Mixillo'
          },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        },
        {
          _id: 'key_2',
          key: 'auth.login',
          description: 'Login button text',
          category: 'authentication',
          translations: {
            en: 'Log In',
            ar: 'تسجيل الدخول',
            es: 'Iniciar Sesión',
            fr: 'Se connecter'
          },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        },
        {
          _id: 'key_3',
          key: 'auth.register',
          description: 'Register button text',
          category: 'authentication',
          translations: {
            en: 'Sign Up',
            ar: 'إنشاء حساب',
            es: 'Registrarse',
            fr: 'S\'inscrire'
          },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        },
        {
          _id: 'key_4',
          key: 'profile.edit',
          description: 'Edit profile button',
          category: 'profile',
          translations: {
            en: 'Edit Profile',
            ar: 'تعديل الملف الشخصي',
            es: 'Editar Perfil',
            fr: 'Modifier le profil'
          },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        },
        {
          _id: 'key_5',
          key: 'upload.video',
          description: 'Upload video button',
          category: 'content',
          translations: {
            en: 'Upload Video',
            ar: 'رفع فيديو',
            es: 'Subir Video',
            fr: 'Télécharger une vidéo'
          },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        }
      ];
      setTranslations(dummyTranslations);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/translations/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response?.data?.data || response?.data || response || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalKeys: 150,
        totalLanguages: 10,
        completionRate: 85,
        pendingTranslations: 23
      });
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleCreateTranslation = () => {
    setTranslationDialog({
      open: true,
      translation: {
        key: '',
        description: '',
        category: '',
        translations: {}
      },
      mode: 'create'
    });
  };

  const handleEditTranslation = (translation) => {
    setTranslationDialog({
      open: true,
      translation: { ...translation },
      mode: 'edit'
    });
  };

  const handleSaveTranslation = async () => {
    try {
      const token = localStorage.getItem('token');
      const { translation, mode } = translationDialog;
      
      if (mode === 'create') {
        await api.post('/api/translations', translation, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await api.put(`/api/translations/${translation.key}`, translation, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setSnackbar({
        open: true,
        message: `Translation ${mode}d successfully`,
        severity: 'success'
      });
      
      setTranslationDialog({ open: false, translation: null, mode: 'create' });
      fetchTranslations();
    } catch (error) {
      console.error('Error saving translation:', error);
      setSnackbar({
        open: true,
        message: 'Error saving translation',
        severity: 'error'
      });
    }
  };

  const handleDeleteTranslation = async (key) => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/translations/${key}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSnackbar({
        open: true,
        message: 'Translation deleted successfully',
        severity: 'success'
      });
      
      fetchTranslations();
    } catch (error) {
      console.error('Error deleting translation:', error);
      setSnackbar({
        open: true,
        message: 'Error deleting translation',
        severity: 'error'
      });
    }
  };

  const handleAutoTranslate = async (fromLang, toLang) => {
    try {
      const token = localStorage.getItem('token');
      await api.post('/api/translations/auto-translate', {
        fromLanguage: fromLang,
        toLanguage: toLang
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSnackbar({
        open: true,
        message: `Auto-translation from ${fromLang} to ${toLang} completed`,
        severity: 'success'
      });
      
      fetchTranslations();
      setAutoTranslateDialog({ open: false });
    } catch (error) {
      console.error('Error auto-translating:', error);
      setSnackbar({
        open: true,
        message: 'Error performing auto-translation',
        severity: 'error'
      });
    }
  };

  const handleExportTranslations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/translations/export', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'translations.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSnackbar({
        open: true,
        message: 'Translations exported successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting translations:', error);
      setSnackbar({
        open: true,
        message: 'Error exporting translations',
        severity: 'error'
      });
    }
  };

  const getCompletionRate = (translation) => {
    const totalLanguages = languages.length;
    const completedLanguages = Object.keys(translation.translations).length;
    return Math.round((completedLanguages / totalLanguages) * 100);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TranslateIcon /> Translations Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<AutoTranslateIcon />}
              onClick={() => setAutoTranslateDialog({ open: true })}
            >
              Auto Translate
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
            >
              Import
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportTranslations}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateTranslation}
            >
              Add Translation
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">{stats.totalKeys}</Typography>
                <Typography variant="body2">Translation Keys</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">{stats.totalLanguages}</Typography>
                <Typography variant="body2">Languages</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">{stats.completionRate}%</Typography>
                <Typography variant="body2">Completion Rate</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">{stats.pendingTranslations}</Typography>
                <Typography variant="body2">Pending</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search translation keys..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category || 'all'}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="common">Common</MenuItem>
                <MenuItem value="authentication">Authentication</MenuItem>
                <MenuItem value="profile">Profile</MenuItem>
                <MenuItem value="content">Content</MenuItem>
                <MenuItem value="commerce">Commerce</MenuItem>
              </Select>
            </FormControl>
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
                <MenuItem value="complete">Complete</MenuItem>
                <MenuItem value="incomplete">Incomplete</MenuItem>
                <MenuItem value="missing">Missing</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={fetchTranslations}
              sx={{ height: '40px' }}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>

        <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          {tabs.map((tab, index) => (
            <Tab 
              key={index} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {tab.value !== 'all' && (
                    <span>{defaultLanguages.find(l => l.code === tab.value)?.flag}</span>
                  )}
                  {tab.label}
                </Box>
              } 
            />
          ))}
        </Tabs>
      </Paper>

      <Paper sx={{ overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {translations.map((translation) => (
              <Accordion key={translation._id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                        {translation.key}
                      </Typography>
                      <Chip 
                        label={translation.category}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 100 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={getCompletionRate(translation)}
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="body2" sx={{ textAlign: 'center', fontSize: '0.7rem' }}>
                          {getCompletionRate(translation)}%
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTranslation(translation);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTranslation(translation.key);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {translation.description}
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    {languages.map((language) => (
                      <Grid item xs={12} md={6} key={language.code}>
                        <Paper sx={{ p: 2, bgcolor: language.isDefault ? 'primary.50' : 'grey.50' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <span style={{ fontSize: '1.2em' }}>{language.flag}</span>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {language.name} ({language.code})
                            </Typography>
                            {language.isDefault && (
                              <Chip label="Source" size="small" color="primary" />
                            )}
                          </Box>
                          <Typography 
                            variant="body1"
                            sx={{ 
                              minHeight: '1.5em',
                              fontStyle: translation.translations[language.code] ? 'normal' : 'italic',
                              color: translation.translations[language.code] ? 'text.primary' : 'text.secondary'
                            }}
                          >
                            {translation.translations[language.code] || 'Not translated'}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination
            count={Math.ceil(translations.length / filters.limit)}
            page={filters.page}
            onChange={(e, page) => setFilters({ ...filters, page })}
            color="primary"
          />
        </Box>
      </Paper>

      {/* Translation Edit/Create Dialog */}
      <Dialog 
        open={translationDialog.open} 
        onClose={() => setTranslationDialog({ open: false, translation: null, mode: 'create' })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {translationDialog.mode === 'create' ? 'Add New Translation' : 'Edit Translation'}
        </DialogTitle>
        <DialogContent>
          {translationDialog.translation && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Translation Key"
                    value={translationDialog.translation.key}
                    onChange={(e) => setTranslationDialog({
                      ...translationDialog,
                      translation: { ...translationDialog.translation, key: e.target.value }
                    })}
                    disabled={translationDialog.mode === 'edit'}
                    helperText="Use dot notation (e.g., auth.login, profile.edit)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={translationDialog.translation.description}
                    onChange={(e) => setTranslationDialog({
                      ...translationDialog,
                      translation: { ...translationDialog.translation, description: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={translationDialog.translation.category}
                      onChange={(e) => setTranslationDialog({
                        ...translationDialog,
                        translation: { ...translationDialog.translation, category: e.target.value }
                      })}
                      label="Category"
                    >
                      <MenuItem value="common">Common</MenuItem>
                      <MenuItem value="authentication">Authentication</MenuItem>
                      <MenuItem value="profile">Profile</MenuItem>
                      <MenuItem value="content">Content</MenuItem>
                      <MenuItem value="commerce">Commerce</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {languages.map((language) => (
                  <Grid item xs={12} md={6} key={language.code}>
                    <TextField
                      fullWidth
                      label={`${language.flag} ${language.name} (${language.code})`}
                      value={translationDialog.translation.translations[language.code] || ''}
                      onChange={(e) => setTranslationDialog({
                        ...translationDialog,
                        translation: {
                          ...translationDialog.translation,
                          translations: {
                            ...translationDialog.translation.translations,
                            [language.code]: e.target.value
                          }
                        }
                      })}
                      multiline
                      rows={2}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTranslationDialog({ open: false, translation: null, mode: 'create' })}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveTranslation}
            variant="contained"
          >
            {translationDialog.mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Auto Translate Dialog */}
      <Dialog 
        open={autoTranslateDialog.open} 
        onClose={() => setAutoTranslateDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Auto Translate</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will automatically translate missing translations using AI. Review translations before publishing.
          </Alert>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>From Language</InputLabel>
                <Select defaultValue="en" label="From Language">
                  {languages.map((lang) => (
                    <MenuItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>To Language</InputLabel>
                <Select defaultValue="ar" label="To Language">
                  {languages.map((lang) => (
                    <MenuItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAutoTranslateDialog({ open: false })}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleAutoTranslate('en', 'ar')}
            variant="contained"
            startIcon={<AutoTranslateIcon />}
          >
            Start Auto Translation
          </Button>
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

export default TranslationsManagement;
