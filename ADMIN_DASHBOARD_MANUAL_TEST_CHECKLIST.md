# 📋 Admin Dashboard Manual Testing Checklist

**URL:** https://mixillo.web.app/  
**Login:** admin@mixillo.com  
**Password:** Admin123!

---

## 🎯 **PRE-TEST SETUP**

1. **Open Browser DevTools** (F12)
   - Go to Console tab
   - Go to Network tab
   - Clear console and network logs

2. **Navigate to Dashboard**
   - URL: https://mixillo.web.app/
   - Verify page loads

---

## 🔐 **AUTHENTICATION TESTING**

### Login
- [ ] Navigate to login page
- [ ] Enter email: `admin@mixillo.com`
- [ ] Enter password: `Admin123!`
- [ ] Click Login
- [ ] **Check Console:** No "Invalid token format" errors
- [ ] **Check Network:** Verify Firebase auth requests succeed
- [ ] **Expected:** Redirected to dashboard

### Token Verification
- [ ] After login, check Network tab
- [ ] Verify all API requests include `Authorization: Bearer <token>`
- [ ] **Check Console:** No authentication errors
- [ ] **Expected:** All requests have Firebase token

---

## 📊 **DASHBOARD PAGE**

### Main Dashboard
- [ ] Navigate to Dashboard
- [ ] **Check Console:** No errors
- [ ] **Check Network:** API calls succeed (200 OK)
- [ ] Verify stats cards display (may show 0 if no data)
- [ ] Verify charts/graphs render (if present)
- [ ] **Expected:** Dashboard loads without errors

**API Endpoints Tested:**
- `/api/admin/dashboard`

---

## 👥 **USER MANAGEMENT**

### Users List
- [ ] Navigate to Users page
- [ ] **Check Console:** No errors
- [ ] **Check Network:** `/api/admin/users` returns 200
- [ ] Verify user list displays (or empty state)
- [ ] Test search functionality
- [ ] **Expected:** Users page loads

**API Endpoints Tested:**
- `/api/admin/users`
- `/api/admin/users/search?q=test`

### User Details
- [ ] Click on a user (if available)
- [ ] **Check Console:** No errors
- [ ] Verify user details display
- [ ] **Expected:** User details page loads

### Create User
- [ ] Navigate to Create User
- [ ] **Check Console:** No errors
- [ ] Verify form loads
- [ ] **Expected:** Create user form accessible

---

## 🏪 **SELLER APPLICATIONS**

- [ ] Navigate to Seller Applications
- [ ] **Check Console:** No errors
- [ ] **Check Network:** `/api/admin/seller-applications` returns 200
- [ ] Verify applications list displays (or empty state)
- [ ] **Expected:** Seller applications page loads

**API Endpoints Tested:**
- `/api/admin/seller-applications`

---

## 📈 **ANALYTICS & METRICS**

### Platform Analytics
- [ ] Navigate to Platform Analytics
- [ ] **Check Console:** No errors
- [ ] **Check Network:** `/api/analytics/content` returns 200
- [ ] Verify analytics data displays
- [ ] **Expected:** Analytics page loads

**API Endpoints Tested:**
- `/api/analytics`
- `/api/analytics/content`
- `/api/metrics`

---

## 📝 **CONTENT MANAGEMENT**

### Content Manager
- [ ] Navigate to Content Manager
- [ ] **Check Console:** No errors
- [ ] **Check Network:** `/api/content` returns 200
- [ ] Verify content list displays
- [ ] Test filters/search
- [ ] **Expected:** Content manager loads

**API Endpoints Tested:**
- `/api/content`
- `/api/stories`
- `/api/comments`

---

## 🛡️ **MODERATION**

### Moderation Queue
- [ ] Navigate to Moderation
- [ ] **Check Console:** No errors
- [ ] **Check Network:** `/api/moderation/queue` returns 200
- [ ] Verify moderation queue displays
- [ ] **Expected:** Moderation page loads

**API Endpoints Tested:**
- `/api/moderation/queue`

---

## 🛒 **E-COMMERCE**

### Products
- [ ] Navigate to Products
- [ ] **Check Console:** No errors
- [ ] **Check Network:** `/api/products` returns 200
- [ ] Verify products list displays
- [ ] **Expected:** Products page loads

### Stores
- [ ] Navigate to Stores
- [ ] **Check Console:** No errors
- [ ] **Check Network:** `/api/stores` returns 200
- [ ] Verify stores list displays
- [ ] **Expected:** Stores page loads

### Orders
- [ ] Navigate to Orders
- [ ] **Check Console:** No errors
- [ ] **Check Network:** `/api/orders` returns 200
- [ ] Verify orders list displays
- [ ] **Expected:** Orders page loads

### Cart
- [ ] Navigate to Cart (if accessible)
- [ ] **Check Console:** No errors
- [ ] **Check Network:** `/api/cart` returns 200
- [ ] **Expected:** Cart page loads

### Categories
- [ ] Navigate to Categories
- [ ] **Check Console:** No errors
- [ ] **Check Network:** `/api/categories` returns 200
- [ ] Verify categories list displays
- [ ] **Expected:** Categories page loads

**API Endpoints Tested:**
- `/api/products`
- `/api/stores`
- `/api/orders`
- `/api/cart`
- `/api/categories`

---

## 💰 **PAYMENTS & WALLETS**

### Wallets
- [ ] Navigate to Wallets
- [ ] **Check Console:** No errors
- [ ] **Check Network:** `/api/wallets` returns 200
- [ ] Verify wallets list displays
- [ ] **Expected:** Wallets page loads

### Payments
- [ ] Navigate to Payments
- [ ] **Check Console:** No errors
- [ ] **Check Network:** `/api/payments` returns 200
- [ ] Verify payments list displays
- [ ] **Expected:** Payments page loads

### Monetization
- [ ] Navigate to Monetization
- [ ] **Check Console:** No errors
- [ ] **Check Network:** `/api/monetization` returns 200
- [ ] **Expected:** Monetization page loads

**API Endpoints Tested:**
- `/api/wallets`
- `/api/payments`
- `/api/monetization`

---

## 🎬 **MEDIA & STREAMING**

### Sound Manager
- [ ] Navigate to Sound Manager
- [ ] **Check Console:** No errors
- [ ] **Check Network:** `/api/sounds` returns 200
- [ ] **Expected:** Sound manager loads

### Livestreams
- [ ] Navigate to Livestreams
- [ ] **Check Console:** No errors
- [ ] **Check Network:** `/api/streaming/livestreams` returns 200
- [ ] **Expected:** Livestreams page loads

### Upload Manager
- [ ] Navigate to Upload Manager
- [ ] **Check Console:** No errors
- [ ] **Check Network:** `/api/uploads` returns 200
- [ ] **Expected:** Upload manager loads

**API Endpoints Tested:**
- `/api/sounds`
- `/api/streaming/providers`
- `/api/streaming/livestreams`
- `/api/uploads`
- `/api/player`

---

## ⚙️ **SETTINGS & CONFIGURATION**

### Settings
- [ ] Navigate to Settings
- [ ] **Check Console:** No errors
- [ ] **Check Network:** `/api/settings` returns 200
- [ ] Verify settings form loads
- [ ] **Expected:** Settings page loads

### CMS
- [ ] Navigate to CMS (if accessible)
- [ ] **Check Console:** No errors
- [ ] **Check Network:** `/api/cms` returns 200
- [ ] **Expected:** CMS page loads

**API Endpoints Tested:**
- `/api/settings`
- `/api/cms`
- `/api/trending`

---

## 🔍 **ERROR CHECKLIST**

### Console Errors
- [ ] No "Invalid token format" errors
- [ ] No "401 Unauthorized" errors
- [ ] No "Failed to fetch" errors
- [ ] No Firebase initialization errors
- [ ] No React rendering errors

### Network Errors
- [ ] No failed API requests (red in Network tab)
- [ ] All API requests return 200, 201, or expected status codes
- [ ] No CORS errors
- [ ] No timeout errors

---

## ✅ **SUCCESS CRITERIA**

### Must Pass:
- ✅ Login works without errors
- ✅ All pages load without console errors
- ✅ All API calls authenticated (have Bearer token)
- ✅ No "Invalid token format" errors
- ✅ No 401 Unauthorized errors

### Nice to Have:
- ✅ Data displays correctly
- ✅ Forms work
- ✅ Navigation smooth
- ✅ Fast page loads

---

## 📊 **TEST RESULTS TEMPLATE**

```
Date: ___________
Tester: ___________

Authentication: [ ] PASS [ ] FAIL
Dashboard: [ ] PASS [ ] FAIL
User Management: [ ] PASS [ ] FAIL
Seller Applications: [ ] PASS [ ] FAIL
Analytics: [ ] PASS [ ] FAIL
Content Management: [ ] PASS [ ] FAIL
Moderation: [ ] PASS [ ] FAIL
E-commerce: [ ] PASS [ ] FAIL
Payments: [ ] PASS [ ] FAIL
Media: [ ] PASS [ ] FAIL
Settings: [ ] PASS [ ] FAIL

Console Errors: [ ] NONE [ ] SOME [ ] MANY
Network Errors: [ ] NONE [ ] SOME [ ] MANY

Overall Status: [ ] READY [ ] NEEDS FIXES
```

---

## 🐛 **REPORTING ISSUES**

If you find errors, note:
1. **Page/Feature:** Which page has the issue
2. **Error Message:** Exact error from console
3. **Network Status:** HTTP status code
4. **Steps to Reproduce:** How to trigger the error
5. **Expected vs Actual:** What should happen vs what happens

---

**Test Date:** ___________
**Tested By:** ___________
**Status:** ___________

