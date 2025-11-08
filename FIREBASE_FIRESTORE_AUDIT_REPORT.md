# 🔥 Firebase/Firestore Audit Report
## Complete End-to-End Scan of All Firebase/Firestore Dependencies

**Generated:** November 8, 2025  
**Status:** CRITICAL - Backend references Firebase but package.json doesn't include it!

---

## 🚨 CRITICAL ISSUES

### 1. **Missing `database.js` File**
Multiple files reference `backend/src/utils/database.js` which doesn't exist:
- ❌ `backend/src/middleware/unifiedAuth.js` (line 10)
- ❌ `backend/src/utils/walletsHelpers.js` (line 1)
- ❌ `backend/src/utils/storiesHelpers.js` (line 1)
- ❌ `backend/src/socket/events.js` (line 2)
- ❌ `backend/src/scripts/seedDatabase.js` (line 11)
- ❌ `backend/src/middleware/auth.js` (line 2)

**Impact:** Server will crash immediately on startup when any of these modules are loaded.

### 2. **Firebase Admin NOT in package.json**
The backend `package.json` does NOT include `firebase-admin` or `@google-cloud/firestore`, yet multiple files require them:
```json
// backend/package.json - NO firebase dependencies!
{
  "dependencies": {
    // ❌ No firebase-admin
    // ❌ No @google-cloud/firestore
  }
}
```

---

## 📁 BACKEND FILES WITH FIREBASE/FIRESTORE REFERENCES

### **Category A: Direct Firebase Admin Usage** (23 files)

#### **Middleware Files:**
1. ✅ **`backend/src/middleware/dualDatabase.js`**
   - Lines: 11-12, 89, 92, 134, 139, 206, 253, 300
   - Uses: `require('firebase-admin')`, `admin.firestore()`
   - Purpose: Dual database support (Firebase + MongoDB)
   - Action: DELETE or stub out

2. ✅ **`backend/src/middleware/unifiedAuth.js`**
   - Lines: 7, 10, 70, 91, 97, 114-115
   - Uses: `require('firebase-admin')`, Firestore operations
   - Purpose: Authentication with Firebase + JWT
   - Action: MIGRATE to JWT-only

3. ✅ **`backend/src/middleware/auth.js`**
   - Lines: 2, 44
   - Uses: Firestore `db.collection('users')`
   - Purpose: JWT auth with Firestore user lookup
   - Action: MIGRATE to MongoDB

#### **Utility Files:**
4. ✅ **`backend/src/utils/walletsHelpers.js`**
   - Uses: Firestore operations throughout (32 references)
   - Lines: 1, 11, 32, 46, 70, 99, 134, 147, 173, 181, 227, 247, 266-267
   - Action: MIGRATE to MongoDB or DELETE

5. ✅ **`backend/src/utils/storiesHelpers.js`**
   - Uses: Firestore operations throughout (37 references)
   - Lines: 1, 11, 47, 77, 108, 128, 139, 163, 187, 211, 223, 240
   - Action: MIGRATE to MongoDB or DELETE

6. ❌ **`backend/src/utils/databaseFactory.js`**
   - Depends on: dualDatabase.js
   - Action: UPDATE to use MongoDB only

#### **Socket/Real-time:**
7. ✅ **`backend/src/socket/events.js`**
   - Line: 2, 21-22
   - Uses: `getDb()` from missing database.js, Firestore operations
   - Action: MIGRATE to MongoDB

#### **Scripts:**
8. ✅ **`backend/src/scripts/createUser.js`**
   - Lines: 1, 11, 16, 45-46, 53
   - Uses: Full Firebase Admin SDK
   - Action: MIGRATE to MongoDB

9. ✅ **`backend/src/scripts/verifyStreamingProviders.js`**
   - Lines: 1, 10, 15, 21
   - Uses: Firebase Admin SDK
   - Action: MIGRATE to MongoDB

10. ✅ **`backend/src/scripts/seedStreamingProviders.js`**
    - Lines: 1, 11, 16, 54-55, 94-95, 131-132, 143
    - Uses: Firebase Admin SDK + Firestore
    - Action: MIGRATE to MongoDB

#### **Test Files (All need migration):**
11-16. **Unit Tests** (6 files):
   - `backend/tests/unit/wallet.model.test.js`
   - `backend/tests/unit/user.model.test.js`
   - `backend/tests/unit/transaction.model.test.js`
   - `backend/tests/unit/story.model.test.js`
   - `backend/tests/unit/product.model.test.js`
   - `backend/tests/unit/order.model.test.js`
   - **Action:** REWRITE for MongoDB

17-23. **Integration Tests** (7 files):
   - `backend/tests/integration/e2e.workflows.test.js`
   - `backend/tests/integration/admin.wallets.test.js`
   - `backend/tests/integration/admin.users.test.js`
   - `backend/tests/integration/admin.uploads.test.js`
   - `backend/tests/integration/admin.stories.test.js`
   - `backend/tests/integration/admin.sellers.test.js`
   - `backend/tests/integration/admin.products.test.js`
   - `backend/tests/integration/admin.orders.test.js`
   - `backend/tests/integration/admin.analytics.test.js`
   - **Action:** REWRITE for MongoDB

24. **`backend/tests/helpers/testHelpers.js`**
    - Uses: Firebase Admin extensively
    - **Action:** REWRITE for MongoDB

25. **`backend/tests/setup.js`**
    - Uses: Firebase Admin initialization
    - **Action:** REWRITE for MongoDB

---

### **Category B: Files Referencing Missing database.js** (6 files)
All require non-existent `backend/src/utils/database.js`:
- `backend/src/middleware/unifiedAuth.js`
- `backend/src/utils/walletsHelpers.js`
- `backend/src/utils/storiesHelpers.js`
- `backend/src/socket/events.js`
- `backend/src/scripts/seedDatabase.js`
- `backend/src/middleware/auth.js`

---

### **Category C: Comment References** (Multiple files)
Files with Firebase/Firestore in comments (low priority):
- `backend/src/app.js` - Comments about Firestore routes
- `backend/src/app-with-mongodb.js` - Documentation comments
- All migration documentation files (*.md)

---

## 📱 FLUTTER APP FILES WITH FIREBASE

### **Active Firebase Usage in Flutter:**
1. ✅ **`mixillo_app/lib/core/services/api_service.dart`**
   - Lines: 2, 7-8, 15, 33, 37, 44, 98, 127-128, 140, 163-164, 1793
   - Uses: `firebase_auth` for authentication
   - **Status:** INTENTIONAL - Flutter uses Firebase Auth
   - **Action:** KEEP (Firebase Auth is still used client-side)

2. ✅ **`mixillo_app/lib/main.dart`**
   - Lines: 5, 30-31
   - Uses: `firebase_core` initialization
   - **Status:** INTENTIONAL - Required for Firebase Auth
   - **Action:** KEEP

3. ✅ **`mixillo_app/lib/features/auth/providers/auth_provider.dart`**
   - Lines: 2, 6
   - Uses: `firebase_auth`
   - **Status:** INTENTIONAL
   - **Action:** KEEP

### **Firebase Dependencies in pubspec.yaml:**
```yaml
dependencies:
  firebase_core: ^4.2.1        # ✅ KEEP
  firebase_auth: ^6.0.0         # ✅ KEEP
  firebase_messaging: ^16.0.4   # ✅ KEEP
  firebase_analytics: ^12.0.0   # ✅ KEEP
```

**Status:** ✅ CORRECT - Flutter should continue using Firebase Auth

---

## 🎯 ACTION PLAN

### **Phase 1: IMMEDIATE (Fix Deployment) - Critical**

#### **Option A: Stub Out Firebase (RECOMMENDED for quick fix)**
Create a dummy `database.js` file that throws errors:
```javascript
// backend/src/utils/database.js
module.exports = {
  getDb: () => {
    throw new Error('Firestore has been removed. Use MongoDB models instead.');
  },
  collection: () => {
    throw new Error('Firestore has been removed. Use MongoDB models instead.');
  }
};
```

#### **Option B: Remove All Firebase References (CLEAN but time-consuming)**
1. Delete all files in Category A (23 files)
2. Update routes to not use deleted files
3. Remove firebase-admin from any remaining imports

### **Phase 2: MEDIUM TERM (Fix Functionality)**

1. ✅ **Migrate `auth.js` middleware** → Use MongoDB User model
2. ✅ **Migrate `unifiedAuth.js`** → Convert to JWT-only
3. ✅ **Migrate `walletsHelpers.js`** → Use MongoDB Wallet model
4. ✅ **Migrate `storiesHelpers.js`** → Use MongoDB Story model
5. ✅ **Migrate Socket events** → Use MongoDB for user lookup
6. ✅ **Delete or stub `dualDatabase.js`** → No longer needed
7. ✅ **Update all scripts** → Use MongoDB seeding scripts

### **Phase 3: TESTING (Fix Tests)**

1. Rewrite all 13 test files to use MongoDB
2. Update test helpers for MongoDB
3. Update test setup for MongoDB

---

## 📊 STATISTICS

| Category | Files | Status | Priority |
|----------|-------|--------|----------|
| Backend Source Files | 10 | ❌ Need migration | HIGH |
| Backend Test Files | 13 | ❌ Need rewrite | MEDIUM |
| Backend Scripts | 3 | ❌ Need migration | MEDIUM |
| Missing Files | 1 | ❌ CRITICAL | URGENT |
| Flutter Files | 3 | ✅ OK (Intentional) | - |
| Documentation | 179 | ⚠️ References only | LOW |

**Total Files Needing Action: 27 files**

---

## ⚡ QUICK FIX FOR CLOUD RUN DEPLOYMENT

The immediate issue is that the server tries to load files that reference Firebase/Firestore, but:
1. Firebase Admin SDK is NOT in package.json
2. The database.js file is missing

**Quickest Fix:**
1. Create stub `database.js` file
2. Set `DATABASE_MODE=mongodb` (already done)
3. Ensure routes don't load Firebase-dependent files

---

## 🔍 VERIFICATION COMMANDS

```bash
# Find all firebase-admin requires
cd backend
grep -r "require('firebase-admin')" src/

# Find all database.js requires
grep -r "require.*database" src/

# Find all Firestore operations
grep -r "\.collection\(|\.doc\(" src/

# Check if firebase-admin is installed
npm list firebase-admin
```

---

## ✅ RECOMMENDATIONS

### **For Backend:**
1. **REMOVE** all Firebase/Firestore code from production backend
2. **USE** MongoDB exclusively (already configured)
3. **CREATE** stub `database.js` for backward compatibility during migration
4. **REWRITE** tests to use MongoDB

### **For Flutter:**
1. **KEEP** Firebase Auth (client-side authentication)
2. **KEEP** Firebase Messaging (push notifications)
3. **KEEP** Firebase Analytics (user tracking)
4. Backend will verify Firebase tokens via JWT conversion

---

## 📝 NOTES

- ✅ Your `DATABASE_MODE` is set to `mongodb` - correct!
- ✅ Your `package.json` doesn't have firebase-admin - correct!
- ❌ Your code still references Firebase - INCORRECT!
- ❌ Missing `database.js` file - CRITICAL!

**Root Cause:** Incomplete migration - some code was deleted but not all references were cleaned up.

---

**Next Steps:** 
1. Create stub `database.js` (immediate)
2. Deploy to fix current error
3. Clean up all Firebase references (follow-up)

