# SYSTEM STABILIZATION PLAN
**Date:** November 13, 2025
**Goal:** Remove all mocks, placeholders, dummies. Stabilize for production.

---

## 🔴 CRITICAL ISSUES IDENTIFIED

### 1. **Backend API Failures**
- 404 errors on `/api/users/profile`
- CORS blocking admin dashboard
- MongoDB connection issues
- Multiple conflicting route files

### 2. **Database Configuration Chaos**
- Firebase + MongoDB mixed
- Duplicate models (firestore vs mongodb)
- Inconsistent connections

### 3. **Mock Data Everywhere**
- Flutter app using MockProfileData
- Admin dashboard with dummy data
- Test data in production code

### 4. **Configuration Mess**
- Multiple .env files
- Hardcoded URLs
- Inconsistent auth tokens

---

## ✅ CLEANUP PHASE 1: BACKEND CORE (Priority: CRITICAL)

### Delete These Files:
```
backend/src/routes/
  ❌ users-firestore.js (duplicate)
  ❌ content-firestore.js (duplicate)
  ❌ test-*.js (test routes in production)
  
backend/src/models-mongodb-backup/
  ❌ DELETE ENTIRE FOLDER (backup cruft)
  
backend/src/models/
  ❌ *-firestore.js (if any)
  
backend/src/config/
  ⚠️ Keep only: database.js, redis.js
  ❌ Remove: firebase-admin.js (if exists)
```

### Fix These Files:
```
✅ backend/src/app.js
   - Remove duplicate route registrations
   - Use ONLY MongoDB routes
   - Fix CORS properly
   
✅ backend/src/config/database.js
   - Single MongoDB connection
   - Proper error handling
   - Connection pooling
   
✅ backend/.env
   - Clean environment variables
   - Remove unused keys
```

---

## ✅ CLEANUP PHASE 2: FLUTTER APP (Priority: HIGH)

### Delete Mock Data:
```
flutter_app/lib/features/profile/data/
  ❌ mock_profile_data.dart (DELETE)
  
flutter_app/lib/features/*/data/
  ❌ All mock_*.dart files
```

### Update These:
```
✅ profile_page.dart
   - Remove fallback to MockProfileData
   - Proper error handling
   - Real API only
   
✅ profile_provider_riverpod.dart
   - Remove print statements
   - Proper auth token handling
   - Error reporting
```

---

## ✅ CLEANUP PHASE 3: ADMIN DASHBOARD (Priority: MEDIUM)

### Remove:
```
admin-dashboard/src/
  ❌ All test files in production build
  ❌ Mock API responses
  ❌ Dummy data generators
```

### Fix:
```
✅ API endpoints pointing to real backend
✅ Proper auth flow
✅ Remove localStorage mocks
```

---

## 🔧 STABILIZATION ACTIONS

### Action 1: Fix Backend Routes
**File:** `backend/src/app.js`
- [ ] Remove duplicate route registrations
- [ ] Use only MongoDB routes
- [ ] Fix CORS for admin dashboard
- [ ] Add proper error middleware

### Action 2: Fix Database Connection
**File:** `backend/src/config/database.js`
- [ ] Single MongoDB connection string
- [ ] Connection retry logic
- [ ] Proper connection pooling
- [ ] Health check endpoint

### Action 3: Fix Authentication
**Files:** `backend/src/middleware/jwtAuth.js`, `flutter_app auth`
- [ ] Consistent JWT secret
- [ ] Token refresh logic
- [ ] Proper auth headers
- [ ] Remove test tokens

### Action 4: Environment Variables
**Files:** `.env` files
- [ ] backend/.env - cleaned
- [ ] admin-dashboard/.env - cleaned
- [ ] flutter_app/.env - cleaned
- [ ] Remove all test/dummy values

### Action 5: Remove Mock Data
**All projects:**
- [ ] Delete all mock_*.dart files
- [ ] Delete MockProfileData
- [ ] Remove dummy data from admin
- [ ] Remove test data from backend

---

## 📋 EXECUTION CHECKLIST

### Phase 1: Backend Cleanup (30 min)
- [ ] Pull latest logs (DONE ✅)
- [ ] Backup current backend
- [ ] Delete duplicate route files
- [ ] Fix app.js route registration
- [ ] Clean database.js
- [ ] Update .env
- [ ] Test /health endpoint
- [ ] Test /api/users/profile
- [ ] Deploy to Cloud Run

### Phase 2: Flutter Cleanup (20 min)
- [ ] Delete mock data files
- [ ] Update profile_page.dart
- [ ] Fix profile_provider
- [ ] Update API service
- [ ] Test on emulator
- [ ] Build release

### Phase 3: Admin Dashboard (15 min)
- [ ] Remove mock data
- [ ] Fix API endpoints
- [ ] Update auth flow
- [ ] Test locally
- [ ] Deploy

### Phase 4: Testing (15 min)
- [ ] Backend health check
- [ ] User registration flow
- [ ] User login flow
- [ ] Profile API
- [ ] Content API
- [ ] Admin dashboard access

### Phase 5: Monitoring Setup (10 min)
- [ ] Set up Cloud Run alerts
- [ ] Database connection monitoring
- [ ] API error tracking
- [ ] Performance monitoring

---

## 🚨 ROLLBACK PLAN

If anything breaks:
1. Backend: Revert to last working revision
2. Database: Have backup of schema
3. Frontend: Git revert to last commit
4. Logs: Saved in BACKEND_ERRORS_*.log

---

## 📊 SUCCESS CRITERIA

✅ Backend returns 200 on health check
✅ No 404 errors on profile API
✅ No CORS errors
✅ Flutter app shows real user data
✅ Admin dashboard connects
✅ No mock data in codebase
✅ Clean logs (no errors)
✅ Auth flow works end-to-end

---

## 🎯 READY TO EXECUTE?

**Estimated Time:** 90 minutes
**Risk Level:** Medium (we have backups)
**Impact:** High (production-ready system)

**Next Steps:**
1. Review this plan
2. Confirm execution
3. Start with Phase 1 (Backend)
4. Test after each phase
5. Monitor logs continuously
