# 🚀 Admin Dashboard Deployment Guide - MongoDB Version

## ✅ Pre-Deployment Checklist

### Backend Requirements
- [x] Backend deployed and running in DUAL mode
- [x] MongoDB database populated with data
- [x] JWT secrets configured
- [x] All 25 MongoDB route groups working
- [x] Admin user created in MongoDB

### Dashboard Requirements
- [x] All pages updated to use MongoDB API
- [x] Environment variables configured
- [x] Dependencies installed
- [x] Local testing completed

---

## 🧪 Local Testing (Required Before Deployment)

### Step 1: Verify Backend is Running

```bash
# Check backend health
curl https://mixillo-backend-52242135857.europe-west1.run.app/health

# Expected response:
# {
#   "success": true,
#   "message": "Mixillo API is running",
#   "databaseMode": "dual",
#   "mongodb": { "status": "connected" }
# }
```

### Step 2: Create Admin User (if not done)

```bash
cd backend

# Create admin user script
cat > create-admin-user.js << 'EOF'
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  fullName: String,
  role: String,
  status: String,
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('Admin@123456', 10);

    const admin = new User({
      username: 'admin',
      email: 'admin@mixillo.com',
      password: hashedPassword,
      fullName: 'Admin User',
      role: 'admin',
      status: 'active',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('Username:', admin.username);
    console.log('Email:', admin.email);
    console.log('Password: Admin@123456');
    console.log('\n⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createAdmin();
EOF

# Run the script
node create-admin-user.js

# Clean up
rm create-admin-user.js
```

### Step 3: Test Locally

```bash
cd admin-dashboard

# Install dependencies
npm install

# Start dev server
npm start
```

### Step 4: Test Core Features

Open `http://localhost:3000` and test:

#### Authentication
- [ ] Login with admin credentials
- [ ] Should see "✅ Now using MongoDB + JWT Authentication"
- [ ] Should redirect to dashboard
- [ ] Logout and verify redirect to login

#### Users Page
- [ ] Users list loads
- [ ] Pagination works
- [ ] Search works
- [ ] Filters work (status, verified, featured)
- [ ] Ban user (check status changes)
- [ ] Activate user (check status changes)
- [ ] Click user to view details

#### Dashboard
- [ ] Stats cards display correct numbers
- [ ] Charts render without errors
- [ ] Recent users list shows
- [ ] No console errors

#### Moderation
- [ ] Queue loads
- [ ] Can view content details
- [ ] Approve works
- [ ] Reject works

#### Orders
- [ ] Orders list loads
- [ ] Can update order status
- [ ] Filters work

#### Wallets
- [ ] Wallets list loads
- [ ] Can view wallet details
- [ ] Can add funds

### Step 5: Check Browser Console

Open browser DevTools (F12) and check:
- ✅ No errors in Console tab
- ✅ All API calls return 200/201 status in Network tab
- ✅ JWT token is present in requests (Authorization header)

---

## 🌐 Deploy to Vercel (Recommended)

### Option A: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd admin-dashboard
vercel

# Follow prompts:
# - Project name: mixillo-admin
# - Setup: N
# - Settings confirmed: Y

# Set environment variables
vercel env add REACT_APP_API_URL
# Enter: https://mixillo-backend-52242135857.europe-west1.run.app/api

vercel env add REACT_APP_DB_MODE
# Enter: mongodb

# Deploy to production
vercel --prod
```

### Option B: Vercel GitHub Integration

1. **Push to GitHub**
```bash
cd admin-dashboard
git add .
git commit -m "MongoDB migration complete"
git push origin main
```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select `admin-dashboard` as root directory

3. **Configure Environment Variables**
   - In project settings, add:
   ```
   REACT_APP_API_URL=https://mixillo-backend-52242135857.europe-west1.run.app/api
   REACT_APP_DB_MODE=mongodb
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your dashboard will be live at `https://mixillo-admin.vercel.app`

---

## 🔷 Deploy to Netlify

### Step 1: Build

```bash
cd admin-dashboard
npm run build:netlify
```

### Step 2: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=build

# Set environment variables in Netlify dashboard
```

### Step 3: Configure Environment Variables

In Netlify dashboard:
1. Go to Site settings > Build & deploy > Environment
2. Add variables:
   ```
   REACT_APP_API_URL=https://mixillo-backend-52242135857.europe-west1.run.app/api
   REACT_APP_DB_MODE=mongodb
   ```

### Step 4: Configure Redirects

Create `public/_redirects`:
```
/*    /index.html   200
```

---

## 🔥 Deploy to Firebase Hosting

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### Step 2: Initialize Firebase

```bash
cd admin-dashboard
firebase init hosting

# Choose:
# - Use existing project or create new
# - Public directory: build
# - Single-page app: Yes
# - GitHub auto-deploy: No
```

### Step 3: Build and Deploy

```bash
# Build
npm run build

# Deploy
firebase deploy --only hosting

# Your dashboard will be at:
# https://your-project.web.app
```

---

## 🔒 Post-Deployment Security

### 1. Change Admin Password

Immediately after first login:
```javascript
// In MongoDB Compass or Atlas:
db.users.updateOne(
  { email: 'admin@mixillo.com' },
  { $set: { 
    password: '<new-hashed-password>',
    updatedAt: new Date()
  }}
)
```

Or create a password change endpoint in backend.

### 2. Setup Environment Variables

Ensure these are set in production:
```bash
REACT_APP_API_URL=<production-backend-url>
REACT_APP_DB_MODE=mongodb
```

### 3. Enable HTTPS

All deployment platforms (Vercel, Netlify, Firebase) auto-enable HTTPS.

### 4. Configure CORS

In backend `app.js`, add your dashboard domain:
```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://mixillo-admin.vercel.app',  // Add your domain
    'https://your-custom-domain.com'
  ],
  credentials: true
};
```

### 5. Setup Custom Domain (Optional)

#### Vercel
```bash
vercel domains add admin.mixillo.com
```

#### Netlify
1. Go to Domain management
2. Add custom domain
3. Update DNS records

---

## 📊 Monitor Deployment

### Health Check

```bash
# Check if dashboard is accessible
curl -I https://your-dashboard-url.com

# Should return 200 OK
```

### API Connectivity Test

```bash
# Test backend from dashboard domain
curl https://mixillo-backend-52242135857.europe-west1.run.app/health
```

### Login Test

1. Go to your dashboard URL
2. Login with admin credentials
3. Check Network tab for successful API calls
4. Verify JWT token in localStorage

---

## 🔧 Troubleshooting Deployment

### Issue: "Network Error" on Login

**Cause**: CORS not configured

**Fix**: Add dashboard URL to backend CORS:
```javascript
// backend/src/app.js
origin: [
  'http://localhost:3000',
  'https://your-dashboard.vercel.app'  // Add this
]
```

### Issue: "Cannot read property of undefined"

**Cause**: Environment variables not set

**Fix**: Verify env vars in deployment platform:
```bash
# Vercel
vercel env ls

# Netlify
netlify env:list
```

### Issue: 404 on Page Refresh

**Cause**: SPA routing not configured

**Fix**: 
- **Vercel**: Create `vercel.json`:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- **Netlify**: Create `public/_redirects`:
  ```
  /*    /index.html   200
  ```

### Issue: Slow Load Times

**Cause**: Large bundle size

**Fix**: Enable code splitting:
```javascript
// Use lazy loading
const Users = React.lazy(() => import('./pages/Users'));
```

---

## 📈 Performance Optimization

### 1. Enable Caching

```javascript
// Add to public/index.html
<meta http-equiv="Cache-Control" content="max-age=31536000" />
```

### 2. Optimize Images

Use WebP format and lazy loading:
```jsx
<img loading="lazy" src="image.webp" />
```

### 3. Code Splitting

```javascript
// Use dynamic imports
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

### 4. Enable Gzip

All platforms enable Gzip by default, but verify:
```bash
curl -H "Accept-Encoding: gzip" -I https://your-dashboard.com
```

---

## 🎯 Success Criteria

### Deployment Successful If:
- ✅ Dashboard loads without errors
- ✅ Can login with admin credentials
- ✅ All API calls return 200/201
- ✅ JWT token is saved in localStorage
- ✅ Token refreshes automatically
- ✅ All pages load and function correctly
- ✅ No console errors
- ✅ HTTPS enabled
- ✅ Custom domain working (if configured)

---

## 📝 Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Test all features in production
- [ ] Change default admin password
- [ ] Monitor error logs
- [ ] Setup error tracking (Sentry)

### Short-term (Week 1)
- [ ] Remove Firebase dependencies
- [ ] Add missing backend endpoints
- [ ] Optimize performance
- [ ] Setup monitoring dashboards

### Long-term (Month 1)
- [ ] User feedback & improvements
- [ ] Add new features
- [ ] Security audit
- [ ] Performance tuning

---

## 🆘 Emergency Rollback

If deployment fails:

### Vercel
```bash
vercel rollback
```

### Netlify
```bash
netlify rollback
```

### Firebase
```bash
firebase hosting:clone <source-site-id>:<source-channel-id> <target-site-id>:<target-channel-id>
```

---

## 📞 Support Contacts

- **Backend Issues**: Check Google Cloud Logs
- **MongoDB Issues**: Check MongoDB Atlas Logs
- **Deployment Issues**: Check platform-specific logs

---

## 🎉 Congratulations!

Your Admin Dashboard is now live and powered by MongoDB! 🚀

**Next Steps:**
1. Share dashboard URL with team
2. Create additional admin accounts
3. Monitor usage and performance
4. Gather feedback and improve

---

**Deployment Guide Version:** 1.0  
**Last Updated:** November 7, 2025  
**Maintainer:** Mixillo Team

