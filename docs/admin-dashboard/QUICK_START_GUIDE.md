# 🚀 Admin Dashboard Quick Start - MongoDB Migration

## ✅ What's Been Updated

The Admin Dashboard has been migrated from Firebase to MongoDB + JWT authentication.

### Files Changed:
1. ✅ `src/utils/apiMongoDB.js` - New MongoDB API client
2. ✅ `src/contexts/AuthContextMongoDB.js` - New JWT auth context  
3. ✅ `src/index.js` - Using MongoDB AuthProvider
4. ✅ `src/App.js` - Using MongoDB auth
5. ✅ `src/pages/Login.js` - MongoDB login
6. ✅ `src/pages/Users.js` - MongoDB user management
7. ✅ `src/pages/Dashboard.js` - MongoDB analytics
8. ✅ `src/pages/Moderation.js` - MongoDB content moderation
9. ✅ `src/pages/Products.js` - MongoDB products (import updated)

---

## 🏃‍♂️ How to Run Locally

### 1. Install Dependencies
```bash
cd admin-dashboard
npm install
```

### 2. Set Environment Variables

The `.env` file should already be configured with:
```bash
REACT_APP_API_URL=https://mixillo-backend-52242135857.europe-west1.run.app/api
REACT_APP_DB_MODE=mongodb
```

### 3. Start Dev Server
```bash
npm start
```

The dashboard will open at `http://localhost:3000`

---

## 🔐 Login Instructions

### Admin Credentials
You need to create an admin user in MongoDB first.

#### Option A: Use Backend Script (Recommended)
```bash
cd backend
node create-admin.js
```

#### Option B: Login with Test Admin
If you've already created an admin user during backend setup, use those credentials:
- **Username/Email**: Your admin username or email
- **Password**: Your admin password

---

## 📊 Features Working

### ✅ Fully Functional:
- **Login** - JWT-based authentication
- **Users List** - View all users with filters
- **User Actions** - Ban, suspend, activate users
- **Dashboard** - Analytics overview
- **Moderation** - Approve/reject content
- **User Search** - Search by name, username, email
- **Pagination** - Navigate through user pages
- **Status Filters** - Filter by active/suspended/banned

### ⏳ Partially Functional:
- **User Verify** - Backend endpoint needs implementation
- **Make Seller** - Backend endpoint needs implementation
- **Feature User** - Backend endpoint needs implementation
- **Products Management** - Import updated, full migration pending
- **Orders** - Not yet migrated
- **Wallets** - Not yet migrated

---

## 🛠️ API Endpoints Being Used

### Authentication
- `POST /api/auth/mongodb/login` - Login with username/email + password
- `POST /api/auth/mongodb/refresh` - Refresh JWT token
- `POST /api/auth/mongodb/logout` - Logout
- `GET /api/auth/mongodb/me` - Get current user

### Users
- `GET /api/admin/mongodb/users` - List all users (with filters)
- `GET /api/users/mongodb/:userId` - Get user details
- `PUT /api/admin/mongodb/users/:userId/status` - Update user status
- `GET /api/users/mongodb/search` - Search users

### Analytics
- `GET /api/admin/mongodb/dashboard` - Dashboard statistics

### Moderation
- `GET /api/moderation/mongodb/queue` - Get moderation queue
- `POST /api/moderation/mongodb/content/:contentId/approve` - Approve content
- `POST /api/moderation/mongodb/content/:contentId/reject` - Reject content

---

## 🔧 Troubleshooting

### Issue: "No token provided" error
**Solution**: Clear localStorage and login again
```javascript
localStorage.clear()
```

### Issue: "Invalid or expired token"
**Solution**: The JWT token has expired. Refresh the page - auto-refresh should handle it. If not, logout and login again.

### Issue: Dashboard shows empty data
**Solution**: Make sure you've run the data migration script:
```bash
cd backend
node src/scripts/migrate-firestore-to-mongodb.js
```

### Issue: Can't login as admin
**Solution**: Verify your user has `role: 'admin'` or `role: 'superadmin'` in MongoDB:
```javascript
// In MongoDB Atlas or Compass
db.users.findOne({ email: 'your-email@example.com' })

// If role is not admin, update it:
db.users.updateOne(
  { email: 'your-email@example.com' },
  { $set: { role: 'admin' } }
)
```

### Issue: API requests failing with CORS
**Solution**: Make sure backend is deployed and running in DUAL mode:
```bash
# Check backend health
curl https://mixillo-backend-52242135857.europe-west1.run.app/health

# Should show: "databaseMode": "dual"
```

---

## 📱 Testing Checklist

Before deployment, test these features:

- [ ] **Login**
  - [ ] Login with username
  - [ ] Login with email
  - [ ] Invalid credentials error
  - [ ] Non-admin user denied

- [ ] **Users Page**
  - [ ] View users list
  - [ ] Pagination works
  - [ ] Search users
  - [ ] Filter by status
  - [ ] Filter by verified
  - [ ] Filter by featured
  - [ ] Ban user
  - [ ] Suspend user
  - [ ] Activate user
  - [ ] View user details

- [ ] **Dashboard**
  - [ ] Stats cards display
  - [ ] Charts render
  - [ ] Recent users list
  - [ ] Top earners list

- [ ] **Moderation**
  - [ ] View pending content
  - [ ] View flagged content
  - [ ] Approve content
  - [ ] Reject content
  - [ ] Stats update

---

## 🚀 Deploy to Production

### Option A: Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables:
   ```
   REACT_APP_API_URL=https://mixillo-backend-52242135857.europe-west1.run.app/api
   REACT_APP_DB_MODE=mongodb
   ```
4. Deploy

### Option B: Netlify

1. Build production bundle:
   ```bash
   npm run build:netlify
   ```
2. Deploy `build/` folder to Netlify
3. Set environment variables in Netlify dashboard
4. Configure redirects for SPA routing

### Option C: Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

---

## 📝 Next Steps

1. ✅ Complete remaining page migrations:
   - Products (full CRUD)
   - Orders
   - Wallets
   - Stores
   - Settings
   - Notifications

2. ✅ Add missing admin endpoints in backend:
   - `/api/admin/mongodb/users/:userId/verify`
   - `/api/admin/mongodb/users/:userId/make-seller`
   - `/api/admin/mongodb/users/:userId/feature`

3. ✅ Remove Firebase completely:
   - Delete `firebase.js`
   - Delete `apiFirebase.js`
   - Delete `AuthContextFirebase.js`
   - Remove `firebase` from `package.json`

4. ✅ Enhanced Features:
   - Add bulk actions (ban multiple users)
   - Add export to CSV
   - Add advanced filters
   - Add user activity logs

---

## 🆘 Support

If you encounter issues:

1. Check browser console for errors
2. Check Network tab for failed API requests
3. Verify backend is running: https://mixillo-backend-52242135857.europe-west1.run.app/health
4. Check backend logs in Google Cloud Console
5. Clear localStorage and try again

---

**Last Updated:** November 7, 2025
**Status:** Core features working, additional pages in progress

