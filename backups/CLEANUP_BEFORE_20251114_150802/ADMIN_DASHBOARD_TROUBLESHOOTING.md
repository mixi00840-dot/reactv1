# Admin Dashboard API Issues - Troubleshooting Guide

**Date**: November 13, 2025  
**Status**: ⚠️ CRITICAL - Authentication & API Endpoint Issues

## 🔴 Critical Issues Identified

### 1. Missing API Routes (404 Errors)
**Issue**: Dashboard calling `/api/settings/mongodb/api-keys/*` endpoints that don't exist in backend

**Affected URLs**:
- `PUT /api/settings/mongodb/api-keys/streaming` - 404
- `GET /api/settings/mongodb/api-keys` - 404

**Fix Applied**: ✅ Added new routes in `backend/src/routes/settings.js`:
- `GET /api/settings/mongodb/api-keys` - Returns all API integration settings
- `PUT /api/settings/mongodb/api-keys/:section` - Updates specific integration section

**Files Modified**:
- `backend/src/routes/settings.js` - Added MongoDB-style routes for backward compatibility

---

### 2. Authentication Required (401/500 Errors)
**Issue**: Admin dashboard making API calls without proper JWT authentication

**Affected Endpoints**:
- `/api/admin/realtime/stats` - 500 (Internal Server Error - likely auth issue)
- `/api/admin/cache/stats` - 500 (Internal Server Error - likely auth issue)

**Root Cause**: 
- User not logged in to admin dashboard
- JWT token not stored in localStorage
- Token expired or invalid

**Solution**: 
1. Create admin user account
2. Login to admin dashboard
3. JWT token automatically sent with all requests

---

## 🔧 How to Fix

### Step 1: Create Admin User

```powershell
# From backend directory
cd C:\Users\ASUS\Desktop\reactv1\backend
node create-admin-user.js
```

**Expected Output**:
```
✅ Admin user created successfully!

🔑 Login Credentials:
   URL: https://admin-dashboard-9uby7vts2-mixillo.vercel.app/login
   Username: admin
   Email: admin@mixillo.com
   Password: Admin@123456
```

### Step 2: Deploy Updated Backend

```powershell
# From root directory
cd C:\Users\ASUS\Desktop\reactv1\backend

# Build and deploy to Cloud Run
gcloud run deploy mixillo-backend `
  --source . `
  --region europe-west1 `
  --platform managed `
  --allow-unauthenticated
```

### Step 3: Login to Admin Dashboard

1. Open: https://admin-dashboard-9uby7vts2-mixillo.vercel.app/login
2. Enter credentials:
   - Email: `admin@mixillo.com`
   - Password: `Admin@123456`
3. Click "Login"
4. Check browser DevTools → Application → Local Storage
5. Verify `mongodb_jwt_token` exists

### Step 4: Verify API Calls

1. Open Admin Dashboard
2. Open Browser DevTools → Network tab
3. Navigate to "API Settings" page
4. Check network requests:
   - Should see `Authorization: Bearer <token>` header
   - Status codes should be 200 (not 401/404/500)

---

## 🔍 Debugging Guide

### Check Authentication Status

**In Browser Console** (while on admin dashboard):
```javascript
// Check if token exists
localStorage.getItem('mongodb_jwt_token')

// Check user data
JSON.parse(localStorage.getItem('mongodb_user') || '{}')

// Manually test API call
fetch('https://mixillo-backend-52242135857.europe-west1.run.app/api/admin/dashboard', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('mongodb_jwt_token')}`
  }
})
.then(r => r.json())
.then(console.log)
```

### Check Backend Logs

```powershell
# View Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=mixillo-backend" `
  --limit=50 `
  --format=json
```

### Test Endpoints Directly

```powershell
# Test with authentication (replace <TOKEN> with actual JWT)
$token = "your_jwt_token_here"
$headers = @{ "Authorization" = "Bearer $token" }

# Test realtime stats
Invoke-WebRequest -Uri "https://mixillo-backend-52242135857.europe-west1.run.app/api/admin/realtime/stats" `
  -Headers $headers `
  -Method GET

# Test cache stats
Invoke-WebRequest -Uri "https://mixillo-backend-52242135857.europe-west1.run.app/api/admin/cache/stats" `
  -Headers $headers `
  -Method GET

# Test API settings
Invoke-WebRequest -Uri "https://mixillo-backend-52242135857.europe-west1.run.app/api/settings/mongodb/api-keys" `
  -Headers $headers `
  -Method GET
```

---

## 📊 API Endpoint Mapping

### ✅ Fixed Routes

| Dashboard Call | Backend Route | Status |
|---------------|---------------|--------|
| `GET /api/settings/mongodb/api-keys` | `GET /api/settings/mongodb/api-keys` | ✅ Added |
| `PUT /api/settings/mongodb/api-keys/:section` | `PUT /api/settings/mongodb/api-keys/:section` | ✅ Added |

### ✅ Existing Routes (Need Authentication)

| Dashboard Call | Backend Route | Auth Required |
|---------------|---------------|---------------|
| `GET /api/admin/realtime/stats` | `GET /api/admin/realtime/stats` | ✅ Yes |
| `GET /api/admin/cache/stats` | `GET /api/admin/cache/stats` | ✅ Yes |
| `GET /api/admin/dashboard` | `GET /api/admin/dashboard` | ✅ Yes |
| `GET /api/admin/users` | `GET /api/admin/users` | ✅ Yes |

---

## 🔐 Authentication Flow

```
┌─────────────────┐
│  User Opens     │
│  Dashboard      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Check          │
│  localStorage   │◄─── Token exists? ───┐
└────────┬────────┘                       │
         │                                │
         │ No token                    Yes│
         ▼                                │
┌─────────────────┐                      │
│  Redirect to    │                      │
│  /login         │                      │
└────────┬────────┘                      │
         │                                │
         ▼                                │
┌─────────────────┐                      │
│  User Enters    │                      │
│  Credentials    │                      │
└────────┬────────┘                      │
         │                                │
         ▼                                │
┌─────────────────┐                      │
│  POST /auth/    │                      │
│  login          │                      │
└────────┬────────┘                      │
         │                                │
         ▼                                │
┌─────────────────┐                      │
│  Save JWT to    │                      │
│  localStorage   │──────────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  All API calls  │
│  include token  │
│  in headers     │
└─────────────────┘
```

---

## ⚠️ Common Issues

### Issue 1: "No authentication token provided"
**Cause**: Not logged in or token expired  
**Solution**: Login again with admin credentials

### Issue 2: "Access denied. Admin privileges required"
**Cause**: User account is not admin role  
**Solution**: Run `create-admin-user.js` script or update user role in database

### Issue 3: 404 on /api/settings/mongodb/api-keys/*
**Cause**: Backend not deployed with new routes  
**Solution**: Deploy updated backend to Cloud Run

### Issue 4: CORS errors
**Cause**: Backend CORS not configured for Vercel domain  
**Solution**: Check CORS middleware in `backend/src/app.js`

### Issue 5: Token expired
**Cause**: JWT tokens expire after 7 days  
**Solution**: Login again or implement refresh token flow

---

## 🚀 Deployment Checklist

- [ ] Create admin user with `node create-admin-user.js`
- [ ] Commit backend changes to git
- [ ] Deploy backend to Cloud Run
- [ ] Test login with admin credentials
- [ ] Verify JWT token in localStorage
- [ ] Test API Settings page loads without errors
- [ ] Test Dashboard page loads stats correctly
- [ ] Verify all API calls return 200 (not 401/404/500)

---

## 📝 Next Steps

1. **Immediate** (Critical):
   - [x] Add missing `/api/settings/mongodb/api-keys/*` routes
   - [ ] Create admin user
   - [ ] Deploy updated backend
   - [ ] Test login flow

2. **Short Term** (High Priority):
   - [ ] Add comprehensive error handling in dashboard
   - [ ] Implement token refresh mechanism
   - [ ] Add loading states for all API calls
   - [ ] Show user-friendly error messages

3. **Long Term** (Medium Priority):
   - [ ] Implement automated tests for API endpoints
   - [ ] Add monitoring/alerting for API errors
   - [ ] Create admin user management UI
   - [ ] Implement role-based access control (RBAC)

---

## 📞 Support

If issues persist after following this guide:

1. Check browser console for JavaScript errors
2. Check Network tab for failed API calls
3. Check Cloud Run logs for backend errors
4. Verify environment variables are set correctly
5. Test backend endpoints directly with curl/Postman

**Backend URL**: https://mixillo-backend-52242135857.europe-west1.run.app  
**Dashboard URL**: https://admin-dashboard-9uby7vts2-mixillo.vercel.app  
**Repository**: https://github.com/mixi00840-dot/reactv1
