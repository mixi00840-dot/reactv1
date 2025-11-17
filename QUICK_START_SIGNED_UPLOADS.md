# Quick Start: Signed Uploads Configuration

## For Administrators

### Step 1: Configure Cloudinary Settings

1. Login to Admin Dashboard: https://admin-dashboard-eiupweiij-mixillo.vercel.app
2. Navigate to **API & Integration Settings**
3. Click **Cloud Storage** tab
4. Expand **Cloudinary (Active)** accordion

### Step 2: Enter Credentials

**Required Fields**:
- Cloud Name: `dlg6dnlj4`
- API Key: `287216393992378`
- API Secret: `kflDVBjiq-Jkc-IgDWlggtdc6Yw`

### Step 3: Enable Signed Uploads

1. Toggle **"Enable Signed Uploads (Recommended)"** to ON
2. Set **Signature Expiry**: 3600 seconds (1 hour)
3. Set **Default Folder**: `mixillo/uploads`
4. Select **Access Mode**: Public

### Step 4: Configure File Limits

**Recommended Settings**:
- Video Max Size: 100 MB
- Image Max Size: 10 MB
- Audio Max Size: 50 MB
- Document Max Size: 20 MB

### Step 5: Set Allowed Formats

**Video**: mp4, mov, avi, webm  
**Image**: jpg, jpeg, png, gif, webp  
**Audio**: mp3, wav, ogg  
**Document**: pdf, doc, docx, txt

### Step 6: Save Settings

Click **"Save Storage Settings"** button at bottom of page.

---

## For Developers

### Backend API Usage

```javascript
// Get signature for upload
const getUploadSignature = async (fileType) => {
  const response = await fetch('https://mixillo-backend.a.run.app/api/uploads/signature', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      folder: `mixillo/uploads/${fileType}s`,
      resourceType: fileType // 'video', 'image', 'audio'
    })
  });
  
  const { data } = await response.json();
  return data; // { signature, timestamp, apiKey, cloudName, folder }
};

// Upload file to Cloudinary
const uploadFile = async (file, signatureData) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('signature', signatureData.signature);
  formData.append('timestamp', signatureData.timestamp);
  formData.append('api_key', signatureData.apiKey);
  formData.append('folder', signatureData.folder);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/auto/upload`,
    { method: 'POST', body: formData }
  );
  
  return await response.json(); // { secure_url, public_id, ... }
};
```

### React Component Example

```javascript
import { useState } from 'react';
import api from '../utils/apiMongoDB';

const FileUploader = () => {
  const [uploading, setUploading] = useState(false);
  
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setUploading(true);
    
    try {
      // Step 1: Get signature from backend
      const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
      const signResponse = await api.post('/api/uploads/signature', {
        folder: `mixillo/uploads/${resourceType}s`,
        resourceType
      });
      
      const { signature, timestamp, apiKey, cloudName, folder } = signResponse.data.data;
      
      // Step 2: Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('api_key', apiKey);
      formData.append('folder', folder);
      
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        { method: 'POST', body: formData }
      );
      
      const result = await uploadResponse.json();
      console.log('Upload successful:', result.secure_url);
      
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <input 
      type="file" 
      onChange={handleUpload} 
      disabled={uploading}
      accept="video/*,image/*"
    />
  );
};
```

---

## Troubleshooting

### Error: "Invalid signature"

**Check**:
1. Verify API Secret is correct in admin settings
2. Ensure server time is synchronized
3. Check signature hasn't expired

**Fix**: Re-save Cloudinary settings in admin dashboard

### Error: "Upload preset not found"

**Cause**: Signed uploads enabled but still using upload_preset  
**Fix**: Clear browser cache and ensure frontend is updated

### Error: "401 Unauthorized"

**Cause**: JWT token expired or missing  
**Fix**: Login again to refresh authentication token

### Settings not saving

**Check**:
1. Verify you have admin role
2. Check browser console for errors
3. Verify backend is running

**Debug**:
```javascript
// Check API response
const response = await api.put('/api/settings/mongodb/api-keys/cloudinary', {
  settings: { /* your settings */ }
});
console.log(response);
```

---

## Testing Checklist

- [ ] Admin can save Cloudinary settings
- [ ] Settings persist after page refresh
- [ ] Signed upload toggle works
- [ ] File upload succeeds with signature
- [ ] Upload appears in correct Cloudinary folder
- [ ] File size limits are enforced
- [ ] Format restrictions work
- [ ] Signature expires after set time
- [ ] Unauthorized users cannot get signatures

---

## Production Checklist

- [ ] Environment variables set in Google Cloud Run
- [ ] MongoDB connection string configured
- [ ] JWT secrets are secure (256-bit minimum)
- [ ] Cloudinary API secret is secure
- [ ] CORS origins whitelisted
- [ ] Rate limiting enabled on signature endpoint
- [ ] Admin dashboard deployed to Vercel
- [ ] Backend deployed to Google Cloud Run
- [ ] SSL/TLS certificates active
- [ ] Monitoring alerts configured

---

## Security Best Practices

1. **Never expose API secrets** in frontend code
2. **Rotate secrets** periodically (every 90 days)
3. **Use HTTPS only** for all API calls
4. **Implement rate limiting** on signature endpoint
5. **Validate file types** server-side before signing
6. **Set reasonable expiry** times (1 hour recommended)
7. **Monitor upload patterns** for abuse
8. **Log all signature** generations for audit
9. **Use authenticated access** mode for sensitive content
10. **Backup settings** regularly

---

## Support

**Documentation**: `/docs/backend/uploads.md`  
**API Reference**: `/docs/api/uploads-endpoints.md`  
**GitHub**: https://github.com/mixi00840-dot/reactv1  
**Implementation Guide**: `/SIGNED_UPLOAD_IMPLEMENTATION.md`
