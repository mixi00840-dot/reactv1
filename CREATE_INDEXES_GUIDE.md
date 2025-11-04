# Quick Guide: Create Firestore Indexes Manually

I've opened the Firebase Console for you. Follow these steps to create each index:

## 🔴 P0 - CRITICAL INDEXES (Create These First - 5 minutes)

### 1. Orders: userId + createdAt
1. Click "Create Index"
2. Collection ID: `orders`
3. Add fields:
   - Field 1: `userId` → Ascending
   - Field 2: `createdAt` → Descending
4. Click "Create"

### 2. Orders: storeId + createdAt
1. Click "Create Index"
2. Collection ID: `orders`
3. Add fields:
   - Field 1: `storeId` → Ascending
   - Field 2: `createdAt` → Descending
4. Click "Create"

### 3. Orders: status + createdAt
1. Click "Create Index"
2. Collection ID: `orders`
3. Add fields:
   - Field 1: `status` → Ascending
   - Field 2: `createdAt` → Descending
4. Click "Create"

### 4. Products: storeId + status
1. Click "Create Index"
2. Collection ID: `products`
3. Add fields:
   - Field 1: `storeId` → Ascending
   - Field 2: `status` → Ascending
4. Click "Create"

### 5. Stores: ownerId + status
1. Click "Create Index"
2. Collection ID: `stores`
3. Add fields:
   - Field 1: `ownerId` → Ascending
   - Field 2: `status` → Ascending
4. Click "Create"

---

## 🟡 P1 - IMPORTANT INDEXES (Create Next - 3 minutes)

### 6. Users: status + createdAt
1. Collection ID: `users`
2. Fields:
   - `status` → Ascending
   - `createdAt` → Descending

### 7. Users: role + createdAt
1. Collection ID: `users`
2. Fields:
   - `role` → Ascending
   - `createdAt` → Descending

### 8. Seller Applications: status + createdAt
1. Collection ID: `sellerApplications`
2. Fields:
   - `status` → Ascending
   - `createdAt` → Descending

### 9. Strikes: userId + isActive + createdAt
1. Collection ID: `strikes`
2. Fields:
   - `userId` → Ascending
   - `isActive` → Ascending
   - `createdAt` → Descending

---

## 🟢 P2 - OPTIONAL (Create If Needed)

### 10. Products: category + status + createdAt
1. Collection ID: `products`
2. Fields:
   - `category` → Ascending
   - `status` → Ascending
   - `createdAt` → Descending

### 11. Stores: category + status + createdAt
1. Collection ID: `stores`
2. Fields:
   - `category` → Ascending
   - `status` → Ascending
   - `createdAt` → Descending

---

## ⏱️ Build Time
- Each index takes 2-5 minutes to build
- You can create multiple at once (they build in parallel)
- Total time for P0+P1 indexes: ~5-10 minutes

## ✅ Verification
After creating, run this test:
```powershell
powershell -ExecutionPolicy Bypass -File test-simple.ps1
```

## 🌐 Firebase Console
Currently open at: https://console.firebase.google.com/project/mixillo/firestore/indexes
