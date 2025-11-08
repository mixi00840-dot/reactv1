import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Avatar,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Palette as ColorIcon,
  Inventory2 as InventoryIcon,
  LocalOffer as TagIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Star as StarIcon
} from '@mui/icons-material';
import axios from 'axios';
// MongoDB Migration - Use MongoDB API instead of Firebase
import mongoAPI from '../utils/apiMongoDB';
import toast from 'react-hot-toast';
const api = mongoAPI; // Alias for backward compatibility

// TabPanel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('view');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    sku: '',
    brand: '',
    categoryIds: [],
    tags: [],
    price: 0,
    salePrice: 0,
    costPrice: 0,
    inventory: {
      trackQuantity: true,
      quantity: 0,
      lowStockThreshold: 5,
      allowBackorders: false
    },
    hasVariants: false,
    variantOptions: {
      color: [],
      size: [],
      material: [],
      style: []
    },
    variants: [],
    images: [],
    videos: [],
    weight: {
      value: 0,
      unit: 'kg'
    },
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
      unit: 'cm'
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: []
    },
    status: 'draft',
    isFeatured: false,
    isDigital: false,
    storeId: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchStores();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/products');
      // Unwrapped client may return either {products, pagination} or array
      const productsData = response?.data?.products || response?.products || (Array.isArray(response) ? response : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
      setProducts([]); // Ensure products is always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      const categoriesData = response?.data || response;
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // Ensure categories is always an array
    }
  };

  const fetchStores = async () => {
    try {
      const response = await api.get('/api/stores');
      // API may return {stores, pagination} or array
      const storesData = response?.data?.stores || response?.stores || (Array.isArray(response) ? response : []);
      setStores(Array.isArray(storesData) ? storesData : []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      setStores([]); // Ensure stores is always an array
    }
  };

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const selectedFiles = Array.from(files);

      const uploadedImages = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        let finalUrl = '';
        let usedProxy = false;

        try {
          // Request presigned URL
          const presigned = await api.post('/api/uploads/presigned-url', {
            fileName: file.name,
            fileType: file.type,
            contentType: 'products',
            metadata: { scope: 'product-image' }
          }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);

          const uploadUrl = presigned?.uploadUrl || presigned?.presignedUrl;
          const key = presigned?.key;
          const uploadId = presigned?.uploadId;

          if (!uploadUrl || !key) throw new Error('Invalid presigned response');

          // Try direct-to-storage upload
          await axios.put(uploadUrl, file, {
            headers: { 'Content-Type': file.type }
          });

          // Derive final URL (strip query params)
          const idx = uploadUrl.indexOf('?');
          finalUrl = idx >= 0 ? uploadUrl.substring(0, idx) : uploadUrl;

          // Confirm upload using uploadId (no slashes) falling back to key
          await api.post(`/api/uploads/${uploadId || key}/confirm`, { metadata: { scope: 'product-image' } }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
        } catch (err) {
          // Fallback to server proxy
          try {
            const form = new FormData();
            form.append('file', file);
            form.append('type', 'product-image');
            const direct = await api.post('/api/uploads/direct', form, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
            finalUrl = direct?.data?.url || direct?.url || '';
            usedProxy = true;
          } catch (proxyErr) {
            console.error('Proxy upload failed:', proxyErr);
            throw proxyErr;
          }
        }

        if (finalUrl) {
          uploadedImages.push({
            url: finalUrl,
            alt: `Product image ${formData.images.length + uploadedImages.length + 1}`,
            isPrimary: formData.images.length === 0 && uploadedImages.length === 0
          });
        }

        if (usedProxy) {
          toast.success(`${file.name} uploaded via proxy`);
        }
      }

      if (uploadedImages.length > 0) {
        setFormData({
          ...formData,
          images: [...formData.images, ...uploadedImages]
        });
        toast.success('Images uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleAddVariant = () => {
    const newVariant = {
      sku: `${formData.sku || 'VAR'}-${formData.variants.length + 1}`,
      attributes: {},
      price: formData.price,
      stock: {
        quantity: 0,
        lowStockThreshold: 5
      },
      weight: 0,
      isActive: true
    };

    setFormData({
      ...formData,
      variants: [...formData.variants, newVariant]
    });
  };

  const handleCreateProduct = async () => {
    try {
      const response = await api.post('/api/products', formData);
      toast.success(response?.message || 'Product created successfully');
      setDialogOpen(false);
      fetchProducts();
      resetForm();
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error(error.message || error.response?.data?.message || 'Failed to create product');
    }
  };

  const handleUpdateProduct = async () => {
    try {
      const response = await api.put(`/api/products/${selectedProduct._id}`, formData);
      toast.success(response?.message || 'Product updated successfully');
      setDialogOpen(false);
      fetchProducts();
      resetForm();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error.message || error.response?.data?.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await api.delete(`/api/products/${selectedProduct._id}`);
      toast.success('Product deleted successfully');
      setDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      shortDescription: '',
      sku: '',
      brand: '',
      categoryIds: [],
      tags: [],
      price: 0,
      salePrice: 0,
      costPrice: 0,
      inventory: {
        trackQuantity: true,
        quantity: 0,
        lowStockThreshold: 5,
        allowBackorders: false
      },
      hasVariants: false,
      variantOptions: {
        color: [],
        size: [],
        material: [],
        style: []
      },
      variants: [],
      images: [],
      videos: [],
      weight: {
        value: 0,
        unit: 'kg'
      },
      dimensions: {
        length: 0,
        width: 0,
        height: 0,
        unit: 'cm'
      },
      seo: {
        metaTitle: '',
        metaDescription: '',
        keywords: []
      },
      status: 'draft',
      isFeatured: false,
      isDigital: false,
      storeId: ''
    });
    setTabValue(0);
  };

  const handleDialogOpen = (type, product = null) => {
    setDialogType(type);
    if (product) {
      setSelectedProduct(product);
      if (type === 'edit') {
        setFormData({
          title: product.title || '',
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          sku: product.sku || '',
          brand: product.brand || '',
          categoryIds: product.categoryIds || [],
          tags: product.tags || [],
          price: product.price || 0,
          salePrice: product.salePrice || 0,
          costPrice: product.costPrice || 0,
          inventory: {
            trackQuantity: product.inventory?.trackQuantity !== false,
            quantity: product.inventory?.quantity || 0,
            lowStockThreshold: product.inventory?.lowStockThreshold || 5,
            allowBackorders: product.inventory?.allowBackorders || false
          },
          hasVariants: product.hasVariants || false,
          variantOptions: product.variantOptions || {
            color: [],
            size: [],
            material: [],
            style: []
          },
          variants: product.variants || [],
          images: product.images || [],
          videos: product.videos || [],
          weight: product.weight || { value: 0, unit: 'kg' },
          dimensions: product.dimensions || { length: 0, width: 0, height: 0, unit: 'cm' },
          seo: product.seo || { metaTitle: '', metaDescription: '', keywords: [] },
          status: product.status || 'draft',
          isFeatured: product.isFeatured || false,
          isDigital: product.isDigital || false,
          storeId: product.storeId?._id || ''
        });
      }
    } else {
      setSelectedProduct(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      active: { label: 'Active', color: 'success' },
      inactive: { label: 'Inactive', color: 'default' },
      draft: { label: 'Draft', color: 'warning' },
      archived: { label: 'Archived', color: 'error' },
    };
    
    const config = statusConfig[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price || 0);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || 
                           product.categoryIds?.some(cat => cat._id === categoryFilter);
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Products Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen('create')}
        >
          Create Product
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                {filteredProducts.length} products
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        src={product.images?.[0]?.url}
                        alt={product.title}
                        variant="rounded"
                        sx={{ width: 50, height: 50 }}
                      >
                        <ImageIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {product.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {product.shortDescription}
                        </Typography>
                        {product.isFeatured && (
                          <Chip icon={<StarIcon />} label="Featured" size="small" color="primary" />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {product.sku || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {formatPrice(product.price)}
                      </Typography>
                      {product.salePrice > 0 && (
                        <Typography variant="body2" color="error">
                          Sale: {formatPrice(product.salePrice)}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color={product.inventory?.quantity <= product.inventory?.lowStockThreshold ? 'error' : 'text.primary'}
                    >
                      {product.inventory?.quantity || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(product.status)}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {product.categoryIds?.slice(0, 2).map((cat) => (
                        <Chip 
                          key={cat._id} 
                          label={cat.name} 
                          variant="outlined" 
                          size="small" 
                        />
                      ))}
                      {product.categoryIds?.length > 2 && (
                        <Chip 
                          label={`+${product.categoryIds.length - 2}`} 
                          variant="outlined" 
                          size="small" 
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5}>
                      <IconButton
                        size="small"
                        onClick={() => handleDialogOpen('view', product)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDialogOpen('edit', product)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDialogOpen('delete', product)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" py={4}>
                      No products found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Comprehensive Product Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {dialogType === 'view' && 'Product Details'}
              {dialogType === 'edit' && 'Edit Product'}
              {dialogType === 'create' && 'Create New Product'}
              {dialogType === 'delete' && 'Delete Product'}
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {(dialogType === 'create' || dialogType === 'edit') && (
            <Box>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tab label="Basic Info" icon={<EditIcon />} />
                <Tab label="Media" icon={<ImageIcon />} />
                <Tab label="Variants" icon={<ColorIcon />} />
                <Tab label="Inventory" icon={<InventoryIcon />} />
                <Tab label="SEO" icon={<TagIcon />} />
              </Tabs>

              {/* Basic Info Tab */}
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label="Product Title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      sx={{ mb: 3 }}
                    />
                    
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      sx={{ mb: 3 }}
                    />
                    
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Short Description"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      sx={{ mb: 3 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>Product Settings</Typography>
                        
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.isFeatured}
                              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                            />
                          }
                          label="Featured Product"
                          sx={{ mb: 2 }}
                        />
                        
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.isDigital}
                              onChange={(e) => setFormData({ ...formData, isDigital: e.target.checked })}
                            />
                          }
                          label="Digital Product"
                          sx={{ mb: 2 }}
                        />
                        
                        <TextField
                          fullWidth
                          select
                          label="Status"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          sx={{ mb: 2 }}
                        >
                          <MenuItem value="draft">Draft</MenuItem>
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                          <MenuItem value="archived">Archived</MenuItem>
                        </TextField>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="SKU"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                      placeholder="Auto-generated if empty"
                      sx={{ mb: 3 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      sx={{ mb: 3 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Sale Price"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Cost Price"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      select
                      label="Store"
                      value={formData.storeId}
                      onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                      required
                    >
                      {stores.map((store) => (
                        <MenuItem key={store._id} value={store._id}>
                          {store.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      select
                      label="Categories"
                      value={formData.categoryIds}
                      onChange={(e) => setFormData({ ...formData, categoryIds: e.target.value })}
                      SelectProps={{ multiple: true }}
                      required
                    >
                      {categories.map((category) => (
                        <MenuItem key={category._id} value={category._id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Media Tab */}
              <TabPanel value={tabValue} index={1}>
                <Box>
                  <Typography variant="h6" gutterBottom>Product Images</Typography>
                  
                  <Card variant="outlined" sx={{ p: 3, mb: 3, textAlign: 'center' }}>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="image-upload"
                      onChange={(e) => handleImageUpload(e.target.files)}
                    />
                    <label htmlFor="image-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={uploadingImages ? <CircularProgress size={20} /> : <UploadIcon />}
                        disabled={uploadingImages}
                        size="large"
                      >
                        {uploadingImages ? 'Uploading...' : 'Upload Images'}
                      </Button>
                    </label>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Drag and drop files here or click to browse
                    </Typography>
                  </Card>
                  
                  {formData.images.length > 0 && (
                    <ImageList variant="masonry" cols={4} gap={8}>
                      {formData.images.map((image, index) => (
                        <ImageListItem key={index}>
                          <img
                            src={image.url}
                            alt={image.alt}
                            loading="lazy"
                            style={{ borderRadius: 8 }}
                          />
                          <ImageListItemBar
                            title={image.isPrimary ? 'Primary Image' : `Image ${index + 1}`}
                            actionIcon={
                              <IconButton
                                sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                                onClick={() => {
                                  const newImages = formData.images.filter((_, i) => i !== index);
                                  setFormData({ ...formData, images: newImages });
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          />
                        </ImageListItem>
                      ))}
                    </ImageList>
                  )}
                </Box>
              </TabPanel>

              {/* Variants Tab */}
              <TabPanel value={tabValue} index={2}>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">Product Variants</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.hasVariants}
                          onChange={(e) => setFormData({ ...formData, hasVariants: e.target.checked })}
                        />
                      }
                      label="Enable Variants"
                    />
                  </Box>
                  
                  {formData.hasVariants && (
                    <Box>
                      <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography>Variant Options</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                              <TextField
                                fullWidth
                                label="Colors"
                                value={formData.variantOptions.color.join(', ')}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  variantOptions: {
                                    ...formData.variantOptions,
                                    color: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                  }
                                })}
                                placeholder="Red, Blue, Green"
                                helperText="Separate with commas"
                              />
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <TextField
                                fullWidth
                                label="Sizes"
                                value={formData.variantOptions.size.join(', ')}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  variantOptions: {
                                    ...formData.variantOptions,
                                    size: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                  }
                                })}
                                placeholder="S, M, L, XL"
                                helperText="Separate with commas"
                              />
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <TextField
                                fullWidth
                                label="Materials"
                                value={formData.variantOptions.material.join(', ')}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  variantOptions: {
                                    ...formData.variantOptions,
                                    material: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                  }
                                })}
                                placeholder="Cotton, Polyester"
                                helperText="Separate with commas"
                              />
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <TextField
                                fullWidth
                                label="Styles"
                                value={formData.variantOptions.style.join(', ')}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  variantOptions: {
                                    ...formData.variantOptions,
                                    style: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                  }
                                })}
                                placeholder="Casual, Formal"
                                helperText="Separate with commas"
                              />
                            </Grid>
                          </Grid>
                          
                          <Box mt={3}>
                            <Button
                              variant="outlined"
                              onClick={handleAddVariant}
                              startIcon={<AddIcon />}
                            >
                              Add Variant
                            </Button>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                      
                      {formData.variants.length > 0 && (
                        <Box mt={3}>
                          <Typography variant="subtitle1" gutterBottom>Variants ({formData.variants.length})</Typography>
                          {formData.variants.map((variant, index) => (
                            <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                              <CardContent>
                                <Grid container spacing={2} alignItems="center">
                                  <Grid item xs={12} md={3}>
                                    <TextField
                                      fullWidth
                                      label="SKU"
                                      value={variant.sku}
                                      onChange={(e) => {
                                        const newVariants = [...formData.variants];
                                        newVariants[index].sku = e.target.value;
                                        setFormData({ ...formData, variants: newVariants });
                                      }}
                                    />
                                  </Grid>
                                  <Grid item xs={12} md={2}>
                                    <TextField
                                      fullWidth
                                      type="number"
                                      label="Price"
                                      value={variant.price}
                                      onChange={(e) => {
                                        const newVariants = [...formData.variants];
                                        newVariants[index].price = parseFloat(e.target.value) || 0;
                                        setFormData({ ...formData, variants: newVariants });
                                      }}
                                      InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                      }}
                                    />
                                  </Grid>
                                  <Grid item xs={12} md={2}>
                                    <TextField
                                      fullWidth
                                      type="number"
                                      label="Stock"
                                      value={variant.stock.quantity}
                                      onChange={(e) => {
                                        const newVariants = [...formData.variants];
                                        newVariants[index].stock.quantity = parseInt(e.target.value) || 0;
                                        setFormData({ ...formData, variants: newVariants });
                                      }}
                                    />
                                  </Grid>
                                  <Grid item xs={12} md={2}>
                                    <TextField
                                      fullWidth
                                      type="number"
                                      label="Weight (kg)"
                                      value={variant.weight}
                                      onChange={(e) => {
                                        const newVariants = [...formData.variants];
                                        newVariants[index].weight = parseFloat(e.target.value) || 0;
                                        setFormData({ ...formData, variants: newVariants });
                                      }}
                                    />
                                  </Grid>
                                  <Grid item xs={12} md={2}>
                                    <FormControlLabel
                                      control={
                                        <Switch
                                          checked={variant.isActive}
                                          onChange={(e) => {
                                            const newVariants = [...formData.variants];
                                            newVariants[index].isActive = e.target.checked;
                                            setFormData({ ...formData, variants: newVariants });
                                          }}
                                        />
                                      }
                                      label="Active"
                                    />
                                  </Grid>
                                  <Grid item xs={12} md={1}>
                                    <IconButton
                                      color="error"
                                      onClick={() => {
                                        const newVariants = formData.variants.filter((_, i) => i !== index);
                                        setFormData({ ...formData, variants: newVariants });
                                      }}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Grid>
                                </Grid>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </TabPanel>

              {/* Inventory Tab */}
              <TabPanel value={tabValue} index={3}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Inventory Settings</Typography>
                        
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.inventory.trackQuantity}
                              onChange={(e) => setFormData({
                                ...formData,
                                inventory: { ...formData.inventory, trackQuantity: e.target.checked }
                              })}
                            />
                          }
                          label="Track Quantity"
                          sx={{ mb: 2 }}
                        />
                        
                        <TextField
                          fullWidth
                          type="number"
                          label="Stock Quantity"
                          value={formData.inventory.quantity}
                          onChange={(e) => setFormData({
                            ...formData,
                            inventory: { ...formData.inventory, quantity: parseInt(e.target.value) || 0 }
                          })}
                          disabled={!formData.inventory.trackQuantity}
                          sx={{ mb: 2 }}
                        />
                        
                        <TextField
                          fullWidth
                          type="number"
                          label="Low Stock Threshold"
                          value={formData.inventory.lowStockThreshold}
                          onChange={(e) => setFormData({
                            ...formData,
                            inventory: { ...formData.inventory, lowStockThreshold: parseInt(e.target.value) || 5 }
                          })}
                          sx={{ mb: 2 }}
                        />
                        
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.inventory.allowBackorders}
                              onChange={(e) => setFormData({
                                ...formData,
                                inventory: { ...formData.inventory, allowBackorders: e.target.checked }
                              })}
                            />
                          }
                          label="Allow Backorders"
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Physical Properties</Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={8}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Weight"
                              value={formData.weight.value}
                              onChange={(e) => setFormData({
                                ...formData,
                                weight: { ...formData.weight, value: parseFloat(e.target.value) || 0 }
                              })}
                            />
                          </Grid>
                          <Grid item xs={4}>
                            <TextField
                              fullWidth
                              select
                              label="Unit"
                              value={formData.weight.unit}
                              onChange={(e) => setFormData({
                                ...formData,
                                weight: { ...formData.weight, unit: e.target.value }
                              })}
                            >
                              <MenuItem value="kg">kg</MenuItem>
                              <MenuItem value="g">g</MenuItem>
                              <MenuItem value="lb">lb</MenuItem>
                              <MenuItem value="oz">oz</MenuItem>
                            </TextField>
                          </Grid>
                        </Grid>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="subtitle2" gutterBottom>Dimensions</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={3}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Length"
                              value={formData.dimensions.length}
                              onChange={(e) => setFormData({
                                ...formData,
                                dimensions: { ...formData.dimensions, length: parseFloat(e.target.value) || 0 }
                              })}
                            />
                          </Grid>
                          <Grid item xs={3}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Width"
                              value={formData.dimensions.width}
                              onChange={(e) => setFormData({
                                ...formData,
                                dimensions: { ...formData.dimensions, width: parseFloat(e.target.value) || 0 }
                              })}
                            />
                          </Grid>
                          <Grid item xs={3}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Height"
                              value={formData.dimensions.height}
                              onChange={(e) => setFormData({
                                ...formData,
                                dimensions: { ...formData.dimensions, height: parseFloat(e.target.value) || 0 }
                              })}
                            />
                          </Grid>
                          <Grid item xs={3}>
                            <TextField
                              fullWidth
                              select
                              label="Unit"
                              value={formData.dimensions.unit}
                              onChange={(e) => setFormData({
                                ...formData,
                                dimensions: { ...formData.dimensions, unit: e.target.value }
                              })}
                            >
                              <MenuItem value="cm">cm</MenuItem>
                              <MenuItem value="in">in</MenuItem>
                              <MenuItem value="m">m</MenuItem>
                            </TextField>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* SEO Tab */}
              <TabPanel value={tabValue} index={4}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Meta Title"
                      value={formData.seo.metaTitle}
                      onChange={(e) => setFormData({
                        ...formData,
                        seo: { ...formData.seo, metaTitle: e.target.value }
                      })}
                      helperText={`${formData.seo.metaTitle.length}/60 characters`}
                      sx={{ mb: 3 }}
                    />
                    
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Meta Description"
                      value={formData.seo.metaDescription}
                      onChange={(e) => setFormData({
                        ...formData,
                        seo: { ...formData.seo, metaDescription: e.target.value }
                      })}
                      helperText={`${formData.seo.metaDescription.length}/160 characters`}
                      sx={{ mb: 3 }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Tags"
                      value={formData.tags.join(', ')}
                      onChange={(e) => setFormData({
                        ...formData,
                        tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      placeholder="tag1, tag2, tag3"
                      helperText="Separate tags with commas"
                    />
                  </Grid>
                </Grid>
              </TabPanel>
            </Box>
          )}

          {selectedProduct && dialogType === 'view' && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    {selectedProduct.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedProduct.description}
                  </Typography>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {formatPrice(selectedProduct.price)}
                  </Typography>
                  <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                    {getStatusChip(selectedProduct.status)}
                    {selectedProduct.categoryIds?.slice(0, 3).map((cat) => (
                      <Chip key={cat._id} label={cat.name} variant="outlined" />
                    ))}
                    {selectedProduct.isFeatured && (
                      <Chip icon={<StarIcon />} label="Featured" color="primary" />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  {selectedProduct.images?.length > 0 && (
                    <ImageList variant="masonry" cols={2} gap={8}>
                      {selectedProduct.images.slice(0, 4).map((image, index) => (
                        <ImageListItem key={index}>
                          <img
                            src={image.url}
                            alt={image.alt}
                            loading="lazy"
                            style={{ borderRadius: 8 }}
                          />
                        </ImageListItem>
                      ))}
                    </ImageList>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}

          {dialogType === 'delete' && selectedProduct && (
            <Alert severity="warning">
              Are you sure you want to delete "{selectedProduct.title}"? This action cannot be undone.
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          {dialogType === 'create' && (
            <Button
              variant="contained"
              onClick={handleCreateProduct}
              disabled={!formData.title || !formData.description || !formData.price}
            >
              Create Product
            </Button>
          )}
          {dialogType === 'edit' && (
            <Button
              variant="contained"
              onClick={handleUpdateProduct}
              disabled={!formData.title || !formData.description || !formData.price}
            >
              Update Product
            </Button>
          )}
          {dialogType === 'delete' && (
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteProduct}
            >
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Products;
