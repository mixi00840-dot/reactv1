# 🚀 Deploy Mixillo Admin Dashboard to Firebase Hosting

## Overview
Firebase Hosting is Google's CDN for static websites - perfect for React apps!

**Benefits:**
- ✅ Free tier (10GB storage, 360MB/day bandwidth)
- ✅ Global CDN (fast worldwide)
- ✅ Automatic SSL certificates
- ✅ Custom domain support
- ✅ Automatic deployments from GitHub

---

## Prerequisites

### 1. Install Firebase CLI
```powershell
npm install -g firebase-tools
```

### 2. Login to Firebase
```powershell
firebase login
```
This opens a browser to authenticate with your Google account.

---

## Quick Deploy (Automated)

### Option A: Use PowerShell Script
```powershell
cd admin-dashboard
powershell -ExecutionPolicy Bypass -File deploy-firebase.ps1
```

---

## Manual Deploy (Step by Step)

### Step 1: Update API URL
Edit `.env.production`:
```env
REACT_APP_API_URL=https://mixillo-backend-52242135857.europe-west1.run.app
```

### Step 2: Install Dependencies
```powershell
cd admin-dashboard
npm install
```

### Step 3: Build Production Bundle
```powershell
$env:CI="false"
npm run build
```
This creates an optimized `build/` folder.

### Step 4: Initialize Firebase Hosting
```powershell
firebase init hosting
```

**Configuration prompts:**
- **Project?** Select "mixillo" (or create new)
- **Public directory?** `build`
- **Single-page app?** Yes
- **Automatic builds?** No (we'll do manual for now)
- **Overwrite index.html?** No

### Step 5: Deploy
```powershell
firebase deploy --only hosting
```

**Your dashboard will be live at:**
- https://mixillo.web.app
- https://mixillo.firebaseapp.com

---

## Alternative: Cloud Storage Static Hosting

If you prefer Cloud Storage over Firebase:

### Step 1: Create Storage Bucket
```powershell
gsutil mb -c STANDARD -l europe-west1 -b on gs://mixillo-admin
```

### Step 2: Build and Upload
```powershell
cd admin-dashboard
npm run build
gsutil -m rsync -r -d build/ gs://mixillo-admin/
```

### Step 3: Configure for Web Hosting
```powershell
gsutil web set -m index.html -e index.html gs://mixillo-admin
gsutil iam ch allUsers:objectViewer gs://mixillo-admin
```

### Step 4: Set up Cloud CDN (Optional)
1. Go to Cloud Console > Network Services > Cloud CDN
2. Create Load Balancer
3. Add backend bucket: mixillo-admin
4. Get public IP

**URL:** `http://LOAD_BALANCER_IP`

---

## Continuous Deployment with GitHub Actions

Create `.github/workflows/deploy-admin.yml`:

```yaml
name: Deploy Admin Dashboard

on:
  push:
    branches: [ main ]
    paths:
      - 'admin-dashboard/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd admin-dashboard
        npm ci
    
    - name: Build
      run: |
        cd admin-dashboard
        npm run build
      env:
        CI: false
        REACT_APP_API_URL: https://mixillo-backend-52242135857.europe-west1.run.app
    
    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: ${{ secrets.GITHUB_TOKEN }}
        firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
        projectId: mixillo
        channelId: live
```

---

## Environment Variables

The admin dashboard needs to know where the API is:

**Development** (`.env.development`):
```env
REACT_APP_API_URL=http://localhost:5000
```

**Production** (`.env.production`):
```env
REACT_APP_API_URL=https://mixillo-backend-52242135857.europe-west1.run.app
```

**Usage in React:**
```javascript
const API_URL = process.env.REACT_APP_API_URL;
axios.get(`${API_URL}/api/users`);
```

---

## Custom Domain Setup

### 1. Add Domain to Firebase Hosting
```powershell
firebase hosting:channel:deploy production --expires 30d
```

### 2. Add Domain in Firebase Console
1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Enter: `admin.mixillo.com`
4. Add DNS records provided by Firebase

### 3. DNS Configuration (Example for Cloudflare)
```
Type: A
Name: admin
Value: 151.101.1.195 (Firebase IP)

Type: A
Name: admin  
Value: 151.101.65.195 (Firebase IP)
```

---

## Monitoring & Analytics

### Add Firebase Analytics to Dashboard
Edit `admin-dashboard/src/index.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "mixillo.firebaseapp.com",
  projectId: "mixillo",
  storageBucket: "mixillo.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
```

---

## Cost Estimate

### Firebase Hosting (Free Tier):
- ✅ 10 GB storage
- ✅ 360 MB/day bandwidth (10.8 GB/month)
- ✅ Custom domain + SSL

**If you exceed free tier:**
- Storage: $0.026/GB/month
- Bandwidth: $0.15/GB

**Typical admin dashboard:** ~2-5 MB (well within free tier)

---

## Troubleshooting

### Build Errors
```powershell
# Clear cache and rebuild
rm -r node_modules
rm package-lock.json
npm install
npm run build
```

### CORS Errors
Make sure backend allows your Firebase domain in CORS settings:
```javascript
// backend/src/app.js
const allowedOrigins = [
  'https://mixillo.web.app',
  'https://mixillo.firebaseapp.com',
  // ... other origins
];
```

### 404 on Refresh
Ensure `firebase.json` has rewrites:
```json
{
  "hosting": {
    "public": "build",
    "rewrites": [{
      "source": "**",
      "destination": "/index.html"
    }]
  }
}
```

---

## Next Steps

1. ✅ Install Firebase CLI: `npm install -g firebase-tools`
2. ✅ Login: `firebase login`
3. ✅ Deploy: `powershell -ExecutionPolicy Bypass -File deploy-firebase.ps1`
4. ✅ Test: Visit https://mixillo.web.app
5. ✅ Setup custom domain (optional)
6. ✅ Configure GitHub Actions for auto-deploy

**Ready to deploy?** Run the commands above! 🚀
