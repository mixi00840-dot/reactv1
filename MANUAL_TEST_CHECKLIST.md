# Admin Dashboard - Manual Test Checklist
**Date:** November 16, 2025
**Backend URL:** https://mixillo-backend-52242135857.europe-west1.run.app
**Frontend URL:** http://localhost:3000

## ✅ Backend Deployment Status
- **Status:** DEPLOYED ✅
- **Health Check:** 200 OK ✅
- **MongoDB:** Connected ✅
- **Uptime:** 121 seconds ✅

---

## 🎯 Critical P0 Issues - Test These First

### 1. **Coin Packages Page** (CRITICAL - WAS 404)
**Path:** Dashboard → Coins → Coin Packages
- [ ] Page loads without errors
- [ ] Package list displays correctly
- [ ] Can view package statistics
- [ ] Can create new package
- [ ] Can edit existing package
- [ ] Can toggle active/inactive status
- [ ] Can delete package
**Expected:** All 7 endpoints working (GET /, GET /stats, GET /:id, POST /, PUT /:id, DELETE /:id, PATCH /:id/toggle)

### 2. **Dashboard - Realtime Stats** (CRITICAL - WAS 404)
**Path:** Dashboard → Main Dashboard
- [ ] Page loads without errors
- [ ] Active users count displays
- [ ] Live streams count displays
- [ ] Recent orders display
- [ ] Hourly metrics chart shows data
- [ ] Daily metrics chart shows data
- [ ] System performance indicators visible
**Expected:** GET /api/admin/realtime/stats returns live data

### 3. **API Settings - Cache Monitoring** (CRITICAL - WAS 404)
**Path:** Dashboard → Settings → API Settings → Cache Monitoring
- [ ] Page loads without errors
- [ ] Redis connection status displays
- [ ] Total keys count shows
- [ ] Memory usage displays
- [ ] Cache hit rate shows
- [ ] Can clear cache
**Expected:** GET /api/admin/cache/stats returns Redis metrics

### 4. **API Settings - AI Usage** (CRITICAL - WAS 404)
**Path:** Dashboard → Settings → API Settings → AI Usage
- [ ] Page loads without errors
- [ ] AI caption generation count displays
- [ ] Hashtag generation count displays
- [ ] Content moderation count displays
- [ ] Estimated costs display
- [ ] Daily breakdown chart shows
- [ ] AI features status visible
**Expected:** GET /api/admin/ai/vertex-usage returns AI metrics

---

## 🔧 Path Mismatch Fixes - Test These Next

### 5. **Database Monitoring** (PATH FIXED)
**Path:** Dashboard → Database Monitoring
- [ ] Page loads without errors
- [ ] Database statistics display
- [ ] Collection list shows
- [ ] Can view collection details
**Expected:** GET /api/database/admin/stats works (was /api/admin/database/stats)

### 6. **Product Upload Confirmation** (PATH FIXED)
**Path:** Dashboard → Products → Add Product → Upload Images
- [ ] Can upload product image
- [ ] Upload progress shows
- [ ] Upload confirmation works
- [ ] Image appears in product form
**Expected:** POST /api/uploads/:id/confirm works (was /api/admin/uploads/confirm)

---

## 📊 All 43 Admin Pages - Quick Smoke Test

### Core Pages
- [ ] Dashboard (Main)
- [ ] Users Management
- [ ] Content Management
- [ ] Products Management
- [ ] Orders Management

### User Management
- [ ] Users List
- [ ] User Details
- [ ] User Analytics
- [ ] Seller Verification
- [ ] User Reports

### Content Management
- [ ] Videos List
- [ ] Video Details
- [ ] Content Moderation
- [ ] Comments Management
- [ ] Reports Management

### E-commerce
- [ ] Products List
- [ ] Product Details
- [ ] Product Categories
- [ ] Product Variants
- [ ] Inventory Management
- [ ] Orders List
- [ ] Order Details
- [ ] Order Fulfillment

### Monetization
- [ ] Coin Packages (NEWLY FIXED)
- [ ] Transactions
- [ ] Wallet Management
- [ ] Gift Management
- [ ] Revenue Analytics

### Live Streaming
- [ ] Live Streams List
- [ ] Stream Details
- [ ] Stream Analytics
- [ ] Live Gifts

### Communication
- [ ] Chat Rooms
- [ ] Messages
- [ ] Notifications
- [ ] Customer Support

### Settings
- [ ] System Settings
- [ ] API Settings (Cache & AI - NEWLY FIXED)
- [ ] Payment Settings
- [ ] Notification Settings

### Analytics
- [ ] Dashboard Analytics (Realtime - NEWLY FIXED)
- [ ] User Analytics
- [ ] Content Analytics
- [ ] Revenue Analytics
- [ ] System Analytics

### Admin
- [ ] Admin Users
- [ ] Admin Roles
- [ ] Admin Logs
- [ ] Audit Trail

---

## 🧪 Automated Test Suite

After manual testing, run the automated verification:

```powershell
# Set your admin JWT token
$env:ADMIN_TOKEN = "your-jwt-token-here"

# Run verification script
cd backend
node verify-all-admin-endpoints.js
```

**Expected:** 100% pass rate on all endpoint tests

---

## 🎯 Success Criteria

✅ **All P0 Critical Issues Fixed:**
- Coin Packages page fully functional (7 endpoints)
- Realtime stats displaying on dashboard
- Cache monitoring operational
- AI usage tracking working

✅ **All Path Mismatches Resolved:**
- Database monitoring accessible
- Product upload confirmation working
- All dual-path aliases operational

✅ **Zero Console Errors:**
- No 404 errors in browser console
- No 500 errors in network tab
- All API calls return 200 or 401 (auth required)

✅ **100% Page Functionality:**
- All 43 pages load without errors
- All CRUD operations work
- All charts and stats display correctly

---

## 🐛 If You Find Issues

1. **Check Browser Console** (F12)
   - Look for red errors
   - Note which endpoint is failing

2. **Check Network Tab**
   - Verify request URL matches backend routes
   - Check response status code
   - Review response body for error messages

3. **Check Backend Logs**
   ```powershell
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=mixillo-backend" --limit=50
   ```

4. **Report Format:**
   - Page name
   - Expected behavior
   - Actual behavior
   - Console error message
   - Network request details

---

## 📝 Test Results

**Date Tested:** _______________
**Tester:** _______________

**Overall Status:** 
- [ ] ✅ All tests passed
- [ ] ⚠️ Some issues found (list below)
- [ ] ❌ Critical failures

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

## 🎉 Ready to Test!

1. Open browser: **http://localhost:3000**
2. Login with admin credentials
3. Start testing from P0 critical issues
4. Work through all 43 pages
5. Run automated test suite
6. Document any issues found

**Good luck! Let me know what you find.** 🚀
