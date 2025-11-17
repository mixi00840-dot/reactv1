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
  IconButton,
  Divider,
  Alert,
  Stack,
  Card,
  CardContent,
  InputAdornment,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Inventory as ProductIcon
} from '@mui/icons-material';
import UniversalUploader from '../components/upload/UniversalUploader';
import mongoAPI from '../utils/apiMongoDB';
import toast from 'react-hot-toast';

/**
 * E-commerce Product Upload Page
 * 
 * Features:
 * - Upload product images (multiple per product)
 * - Assign to store
 * - Categories and subcategories
 * - Product variants (size, color, material)
 * - Pricing and inventory
 * - Attributes (pre-defined + custom)
 * - Bulk product creation
 */
const ProductUpload = () => {
  // Store & Category
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');

  // Product Details
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [tags, setTags] = useState([]);

  // Pricing
  const [basePrice, setBasePrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [cost, setCost] = useState('');

  // Inventory
  const [stockQuantity, setStockQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [trackInventory, setTrackInventory] = useState(true);

  // Shipping
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');

  // Variants
  const [variants, setVariants] = useState([
    { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
    { name: 'Color', values: ['Black', 'White', 'Blue'] }
  ]);

  // Attributes
  const [attributes, setAttributes] = useState([
    { key: 'Material', value: '' },
    { key: 'Care Instructions', value: '' }
  ]);

  // Upload state
  const [uploadedImages, setUploadedImages] = useState([]);
  const [saving, setSaving] = useState(false);

  // Load stores on mount
  React.useEffect(() => {
    loadStores();
    loadCategories();
  }, []);

  const loadStores = async () => {
    try {
      const response = await mongoAPI.get('/api/admin/stores');
      if (response.success) {
        setStores(response.data.stores || []);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const loadCategories = async () => {
    setCategories([
      'Electronics',
      'Fashion',
      'Home & Garden',
      'Sports',
      'Beauty',
      'Books',
      'Toys',
      'Food & Beverage'
    ]);
  };

  const handleImagesUploaded = (images) => {
    setUploadedImages(prev => [...prev, ...images]);
    toast.success(`${images.length} product images uploaded`);
  };

  const addVariant = () => {
    setVariants([...variants, { name: '', values: [] }]);
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const addAttribute = () => {
    setAttributes([...attributes, { key: '', value: '' }]);
  };

  const removeAttribute = (index) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (index, field, value) => {
    const updated = [...attributes];
    updated[index][field] = value;
    setAttributes(updated);
  };

  const calculateMargin = () => {
    const price = parseFloat(basePrice) || 0;
    const productCost = parseFloat(cost) || 0;
    if (price > 0 && productCost > 0) {
      const margin = ((price - productCost) / price) * 100;
      return margin.toFixed(1);
    }
    return '0';
  };

  const handleSaveProduct = async () => {
    // Validation
    if (!productName.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!selectedStore) {
      toast.error('Please select a store');
      return;
    }

    if (uploadedImages.length === 0) {
      toast.error('Please upload at least one product image');
      return;
    }

    if (!basePrice || parseFloat(basePrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setSaving(true);

    try {
      const productData = {
        storeId: selectedStore._id,
        name: productName,
        description: description,
        sku: sku || `SKU-${Date.now()}`,
        brand: brand,
        category: selectedCategory,
        subcategory: subcategory,
        tags: tags,
        images: uploadedImages.map(img => img.url),
        pricing: {
          basePrice: parseFloat(basePrice),
          comparePrice: comparePrice ? parseFloat(comparePrice) : null,
          cost: cost ? parseFloat(cost) : null,
          currency: 'USD'
        },
        inventory: {
          quantity: trackInventory ? parseInt(stockQuantity) : null,
          lowStockThreshold: parseInt(lowStockThreshold),
          trackInventory: trackInventory
        },
        shipping: {
          weight: weight ? parseFloat(weight) : null,
          dimensions: {
            length: length ? parseFloat(length) : null,
            width: width ? parseFloat(width) : null,
            height: height ? parseFloat(height) : null
          }
        },
        variants: variants.filter(v => v.name && v.values.length > 0),
        attributes: attributes.filter(a => a.key && a.value),
        status: 'active'
      };

      const response = await mongoAPI.post('/api/admin/products', productData);
      
      if (response.success) {
        toast.success('✓ Product created successfully');
        
        // Reset form
        setProductName('');
        setDescription('');
        setSku('');
        setBrand('');
        setTags([]);
        setBasePrice('');
        setComparePrice('');
        setCost('');
        setStockQuantity('');
        setUploadedImages([]);
        setVariants([
          { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
          { name: 'Color', values: ['Black', 'White', 'Blue'] }
        ]);
        setAttributes([
          { key: 'Material', value: '' },
          { key: 'Care Instructions', value: '' }
        ]);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        🛍️ Product Upload
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Create products with variants, pricing, and inventory management
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column - Images & Store */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            {/* Product Images */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                1️⃣ Product Images
              </Typography>
              <UniversalUploader
                uploadType="image"
                onUploadComplete={handleImagesUploaded}
                maxFiles={10}
                maxSizeMB={5}
                multiple={true}
              />
              
              {uploadedImages.length > 0 && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  ✓ {uploadedImages.length} images ready
                </Alert>
              )}
            </Paper>

            {/* Basic Details */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                2️⃣ Product Details
              </Typography>
              
              <Stack spacing={2}>
                <TextField
                  label="Product Name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                  fullWidth
                />

                <TextField
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={4}
                  fullWidth
                />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="SKU"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="Auto-generated if empty"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Brand"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        label="Category"
                      >
                        {categories.map(cat => (
                          <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Subcategory"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <Autocomplete
                  multiple
                  freeSolo
                  options={['new', 'featured', 'sale', 'bestseller']}
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

            {/* Pricing */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                3️⃣ Pricing
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <TextField
                    label="Price"
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Compare Price"
                    type="number"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                    helperText="Original price"
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Cost"
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                    helperText="Your cost"
                  />
                </Grid>
              </Grid>

              {basePrice && cost && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Margin: <strong>{calculateMargin()}%</strong>
                </Alert>
              )}
            </Paper>

            {/* Inventory */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                4️⃣ Inventory
              </Typography>
              
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={trackInventory}
                      onChange={(e) => setTrackInventory(e.target.checked)}
                    />
                  }
                  label="Track Inventory"
                />

                {trackInventory && (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Stock Quantity"
                        type="number"
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value)}
                        required={trackInventory}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Low Stock Alert"
                        type="number"
                        value={lowStockThreshold}
                        onChange={(e) => setLowStockThreshold(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                )}
              </Stack>
            </Paper>

            {/* Shipping */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                5️⃣ Shipping (Optional)
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Weight (kg)"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    label="Length (cm)"
                    type="number"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    label="Width (cm)"
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    label="Height (cm)"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column - Variants & Attributes */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Store Selection */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Select Store
              </Typography>
              
              <Autocomplete
                options={stores}
                value={selectedStore}
                onChange={(e, newValue) => setSelectedStore(newValue)}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField {...params} label="Store" required />
                )}
              />

              {selectedStore && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Product will be added to: <strong>{selectedStore.name}</strong>
                </Alert>
              )}
            </Paper>

            {/* Variants */}
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Variants
                </Typography>
                <IconButton onClick={addVariant} size="small" color="primary">
                  <AddIcon />
                </IconButton>
              </Box>

              <Stack spacing={2}>
                {variants.map((variant, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <TextField
                          label="Variant Name"
                          value={variant.name}
                          onChange={(e) => updateVariant(index, 'name', e.target.value)}
                          size="small"
                          fullWidth
                          sx={{ mr: 1 }}
                        />
                        <IconButton onClick={() => removeVariant(index)} size="small">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      <Autocomplete
                        multiple
                        freeSolo
                        options={[]}
                        value={variant.values}
                        onChange={(e, newValue) => updateVariant(index, 'values', newValue)}
                        renderTags={(value, getTagProps) =>
                          value.map((option, i) => (
                            <Chip label={option} size="small" {...getTagProps({ index: i })} />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField {...params} label="Values" size="small" />
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Paper>

            {/* Attributes */}
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Attributes
                </Typography>
                <IconButton onClick={addAttribute} size="small" color="primary">
                  <AddIcon />
                </IconButton>
              </Box>

              <Stack spacing={2}>
                {attributes.map((attr, index) => (
                  <Box key={index} display="flex" gap={1}>
                    <TextField
                      label="Key"
                      value={attr.key}
                      onChange={(e) => updateAttribute(index, 'key', e.target.value)}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="Value"
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                      size="small"
                      fullWidth
                    />
                    <IconButton onClick={() => removeAttribute(index)} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            </Paper>

            {/* Save Button */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<SaveIcon />}
              onClick={handleSaveProduct}
              disabled={saving || !selectedStore || !productName || uploadedImages.length === 0}
              sx={{ py: 2 }}
            >
              {saving ? 'Creating Product...' : 'Create Product'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProductUpload;
