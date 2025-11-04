# Firestore Composite Indexes Required

This document lists ALL Firestore composite indexes needed for the Mixillo application based on actual query patterns in the codebase.

## 🔍 Why Indexes Are Needed

Firestore requires a composite index when a query:
1. Filters on multiple fields (e.g., `where('status', '==', 'active').where('userId', '==', '123')`)
2. Filters on one field AND orders by another field (e.g., `where('status', '==', 'active').orderBy('createdAt')`)
3. Orders by multiple fields

## ✅ Already Created (From Error Logs)

### Products Collection
- **Index:** `status (Ascending) + createdAt (Ascending) + __name__ (Ascending)`
- **Query Pattern:** `.where('status', '==', 'active').orderBy('createdAt', 'desc')`
- **Used In:** `productController.js` - getAllProducts()
- **Status:** ⏳ Awaiting creation

### Stores Collection
- **Index:** `status (Ascending) + createdAt (Ascending) + __name__ (Ascending)`
- **Query Pattern:** `.where('status', '==', 'active').orderBy('createdAt', 'desc')`
- **Used In:** `storeController.js` - getAllStores()
- **Status:** ⏳ Awaiting creation

## 🔴 CRITICAL - High Priority (E-commerce & Core Features)

### Orders Collection (Multiple indexes needed)

#### 1. Orders: userId + createdAt
- **Index:** `userId (Ascending) + createdAt (Descending)`
- **Query Pattern:** `.where('userId', '==', userId).orderBy('createdAt', 'desc')`
- **Used In:** `orderController.js` - getOrders() for users viewing their own orders
- **Priority:** P0 - Blocks user order history
- **Status:** ❌ Not created

#### 2. Orders: storeId + createdAt
- **Index:** `storeId (Ascending) + createdAt (Descending)`
- **Query Pattern:** `.where('storeId', '==', storeId).orderBy('createdAt', 'desc')`
- **Used In:** `orderController.js` - getOrders() for sellers viewing their store orders
- **Priority:** P0 - Blocks seller order management
- **Status:** ❌ Not created

#### 3. Orders: status + createdAt
- **Index:** `status (Ascending) + createdAt (Descending)`
- **Query Pattern:** `.where('status', '==', 'pending').orderBy('createdAt', 'desc')`
- **Used In:** `orderController.js` - getOrders() with status filter
- **Priority:** P0 - Blocks order filtering by status
- **Status:** ❌ Not created

#### 4. Orders: userId + status + createdAt
- **Index:** `userId (Ascending) + status (Ascending) + createdAt (Descending)`
- **Query Pattern:** `.where('userId', '==', userId).where('status', '==', 'completed').orderBy('createdAt', 'desc')`
- **Used In:** `orderController.js` - Advanced filtering
- **Priority:** P1 - Nice to have for filtered views
- **Status:** ❌ Not created

### Products Collection (Additional indexes)

#### 1. Products: storeId + status
- **Index:** `storeId (Ascending) + status (Ascending)`
- **Query Pattern:** `.where('storeId', '==', storeId).where('status', '==', 'active')`
- **Used In:** `storeController.js` - getStoreDetails() and getStoreProducts()
- **Priority:** P0 - Blocks store product listings
- **Status:** ❌ Not created

#### 2. Products: category + status + createdAt
- **Index:** `category (Ascending) + status (Ascending) + createdAt (Descending)`
- **Query Pattern:** `.where('category', '==', 'electronics').where('status', '==', 'active').orderBy('createdAt', 'desc')`
- **Used In:** `productController.js` - getAllProducts() with category filter
- **Priority:** P1 - Blocks category browsing
- **Status:** ❌ Not created

#### 3. Products: brand + status + createdAt
- **Index:** `brand (Ascending) + status (Ascending) + createdAt (Descending)`
- **Query Pattern:** `.where('brand', '==', 'Apple').where('status', '==', 'active').orderBy('createdAt', 'desc')`
- **Used In:** `productController.js` - getAllProducts() with brand filter
- **Priority:** P2 - Nice to have for brand filtering
- **Status:** ❌ Not created

### Stores Collection (Additional indexes)

#### 1. Stores: ownerId + status
- **Index:** `ownerId (Ascending) + status (Ascending)`
- **Query Pattern:** `.where('ownerId', '==', userId).where('status', '==', 'active')`
- **Used In:** `orderController.js` - Getting seller's stores
- **Priority:** P0 - Blocks seller dashboard
- **Status:** ❌ Not created

#### 2. Stores: category + status + createdAt
- **Index:** `category (Ascending) + status (Ascending) + createdAt (Descending)`
- **Query Pattern:** `.where('category', '==', 'fashion').where('status', '==', 'active').orderBy('createdAt', 'desc')`
- **Used In:** `storeController.js` - getAllStores() with category filter
- **Priority:** P1 - Blocks store category browsing
- **Status:** ❌ Not created

## 🟡 IMPORTANT - Medium Priority (User Management & Admin)

### Users Collection

#### 1. Users: status + createdAt
- **Index:** `status (Ascending) + createdAt (Descending)`
- **Query Pattern:** `.where('status', '==', 'active').orderBy('createdAt', 'desc')`
- **Used In:** `admin.js` - getUsers() admin panel
- **Priority:** P1 - Admin user management
- **Status:** ❌ Not created

#### 2. Users: role + createdAt
- **Index:** `role (Ascending) + createdAt (Descending)`
- **Query Pattern:** `.where('role', '==', 'seller').orderBy('createdAt', 'desc')`
- **Used In:** `admin.js` - getUsers() filtering by role
- **Priority:** P1 - Admin filtering
- **Status:** ❌ Not created

#### 3. Users: isVerified + createdAt
- **Index:** `isVerified (Ascending) + createdAt (Descending)`
- **Query Pattern:** `.where('isVerified', '==', true).orderBy('createdAt', 'desc')`
- **Used In:** `admin.js` - getUsers() filtering by verification
- **Priority:** P2 - Admin filtering
- **Status:** ❌ Not created

#### 4. Users: status + role + createdAt
- **Index:** `status (Ascending) + role (Ascending) + createdAt (Descending)`
- **Query Pattern:** `.where('status', '==', 'active').where('role', '==', 'seller').orderBy('createdAt', 'desc')`
- **Used In:** `admin.js` - getUsers() with multiple filters
- **Priority:** P2 - Advanced admin filtering
- **Status:** ❌ Not created

### Seller Applications Collection

#### 1. Applications: status + createdAt
- **Index:** `status (Ascending) + createdAt (Descending)`
- **Query Pattern:** `.where('status', '==', 'pending').orderBy('createdAt', 'desc')`
- **Used In:** `admin.js` - getSellerApplications()
- **Priority:** P1 - Seller approval workflow
- **Status:** ❌ Not created

#### 2. Applications: userId + status
- **Index:** `userId (Ascending) + status (Ascending)`
- **Query Pattern:** `.where('userId', '==', userId).where('status', '==', 'pending')`
- **Used In:** `sellerController.js` - Checking user's applications
- **Priority:** P1 - User application status
- **Status:** ❌ Not created

### Strikes Collection

#### 1. Strikes: userId + isActive + createdAt
- **Index:** `userId (Ascending) + isActive (Ascending) + createdAt (Descending)`
- **Query Pattern:** `.where('userId', '==', userId).where('isActive', '==', true).orderBy('createdAt', 'desc')`
- **Used In:** `admin.js` - getStrikes() and issueStrike()
- **Priority:** P1 - Moderation system
- **Status:** ❌ Not created

#### 2. Strikes: isActive + createdAt
- **Index:** `isActive (Ascending) + createdAt (Descending)`
- **Query Pattern:** `.where('isActive', '==', true).orderBy('createdAt', 'desc')`
- **Used In:** `admin.js` - getStrikes() listing all active strikes
- **Priority:** P2 - Admin moderation dashboard
- **Status:** ❌ Not created

## 🟢 OPTIONAL - Low Priority (CMS & Advanced Features)

### Banners Collection

#### 1. Banners: status + placement + order
- **Index:** `status (Ascending) + placement (Ascending) + order (Ascending)`
- **Query Pattern:** `.where('status', '==', 'active').where('placement', '==', 'home').orderBy('order', 'asc')`
- **Used In:** `cmsController.js` - getBanners() with placement filter
- **Priority:** P2 - CMS banner management
- **Status:** ❌ Not created

#### 2. Banners: status + order
- **Index:** `status (Ascending) + order (Ascending)`
- **Query Pattern:** `.where('status', '==', 'active').orderBy('order', 'asc')`
- **Used In:** `cmsController.js` - getBanners()
- **Priority:** P2 - Banner display
- **Status:** ❌ Not created

### Pages Collection (CMS)

#### 1. Pages: status + publishedAt
- **Index:** `status (Ascending) + publishedAt (Descending)`
- **Query Pattern:** `.where('status', '==', 'published').orderBy('publishedAt', 'desc')`
- **Used In:** `cmsController.js` - getPages()
- **Priority:** P3 - CMS page management
- **Status:** ❌ Not created

### Settings Collection

#### 1. Settings: category + key
- **Index:** `category (Ascending) + key (Ascending)`
- **Query Pattern:** `.where('category', '==', 'general').orderBy('key', 'asc')`
- **Used In:** `settingsController.js` - getSettings() grouped by category
- **Priority:** P3 - Settings management
- **Status:** ❌ Not created

## 🔵 FUTURE - Phase 3-4 Features (When Migrated)

These collections are currently in fallback mode (returning 503) and will need indexes when migrated:

### Videos Collection (Phase 3)
- `userId (Asc) + status (Asc) + createdAt (Desc)`
- `status (Asc) + createdAt (Desc)`
- `status (Asc) + viewsCount (Desc)`
- `category (Asc) + status (Asc) + createdAt (Desc)`

### Posts Collection (Phase 3)
- `userId (Asc) + createdAt (Desc)`
- `status (Asc) + createdAt (Desc)`

### Stories Collection (Phase 3)
- `userId (Asc) + expiresAt (Asc)`
- `expiresAt (Asc) + createdAt (Desc)`

### Livestreams Collection (Phase 3)
- `userId (Asc) + status (Asc) + startedAt (Desc)`
- `status (Asc) + viewerCount (Desc)`
- `category (Asc) + status (Asc) + startedAt (Desc)`

### Comments Collection (Phase 4)
- `videoId (Asc) + parentId (Asc) + createdAt (Desc)`
- `userId (Asc) + createdAt (Desc)`

### Messages Collection (Phase 4)
- `conversationId (Asc) + createdAt (Asc)`
- `recipientId (Asc) + isRead (Asc) + createdAt (Desc)`

### Notifications Collection (Phase 4)
- `userId (Asc) + isRead (Asc) + createdAt (Desc)`
- `userId (Asc) + createdAt (Desc)`

### Payments Collection (Phase 4)
- `userId (Asc) + status (Asc) + createdAt (Desc)`
- `storeId (Asc) + status (Asc) + createdAt (Desc)`
- `status (Asc) + createdAt (Desc)`

## 📝 How to Create Indexes

### Method 1: Automatic (Recommended)
1. Try to use the feature that triggers the error
2. Cloud Run logs will show: "The query requires an index. You can create it here: https://console.firebase.google.com/..."
3. Click the URL (it pre-fills the index configuration)
4. Click "Create Index"
5. Wait 3-5 minutes for index to build

### Method 2: Manual Creation
1. Go to: https://console.firebase.google.com/project/mixillo/firestore/indexes
2. Click "Create Index"
3. Select collection (e.g., `orders`)
4. Add fields in order:
   - Field 1: `userId` - Ascending
   - Field 2: `createdAt` - Descending
5. Click "Create"

### Method 3: Firebase CLI (Bulk Creation)
Create `firestore.indexes.json` in backend/ folder with all indexes, then run:
```bash
firebase deploy --only firestore:indexes
```

## 🎯 Priority Summary

**P0 - Create NOW (Blocks critical features):**
- ✅ Products: status + createdAt (being created)
- ✅ Stores: status + createdAt (being created)
- ❌ Orders: userId + createdAt
- ❌ Orders: storeId + createdAt
- ❌ Orders: status + createdAt
- ❌ Products: storeId + status
- ❌ Stores: ownerId + status

**P1 - Create SOON (Important features):**
- ❌ Users: status + createdAt
- ❌ Users: role + createdAt
- ❌ Seller Applications: status + createdAt
- ❌ Strikes: userId + isActive + createdAt
- ❌ Products: category + status + createdAt
- ❌ Stores: category + status + createdAt

**P2 - Create LATER (Nice to have):**
- ❌ Users: isVerified + createdAt
- ❌ Users: status + role + createdAt
- ❌ Orders: userId + status + createdAt
- ❌ Products: brand + status + createdAt
- ❌ Banners: status + placement + order
- ❌ Strikes: isActive + createdAt

**P3 - Optional:**
- ❌ Pages: status + publishedAt
- ❌ Settings: category + key
- ❌ Banners: status + order

## 💡 Pro Tips

1. **Test Before Creating:** Try the feature in admin dashboard - if it returns 500, check Cloud Run logs for the exact index URL
2. **Index Build Time:** Simple indexes take 1-2 minutes, complex ones take 5-10 minutes
3. **Cost:** Firestore indexes are free, but queries against them count toward read quotas
4. **Order Matters:** Field order in composite indexes matters! `status + createdAt` is different from `createdAt + status`
5. **Equality First:** Always put equality filters (==) before range filters (>, <) or orderBy fields

## 🔗 Quick Links

- **Firestore Indexes Console:** https://console.firebase.google.com/project/mixillo/firestore/indexes
- **Cloud Run Logs:** https://console.cloud.google.com/run/detail/europe-west1/mixillo-backend/logs
- **Firestore Docs:** https://firebase.google.com/docs/firestore/query-data/indexing
