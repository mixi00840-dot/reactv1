# Production Deployment Checklist

## Pre-Deployment Verification

### 1. Dependencies Installation
```bash
cd backend
npm install
```

**Verify:**
- [ ] `node_modules` directory exists
- [ ] All packages from `package.json` are installed
- [ ] No installation errors or warnings

### 2. Environment Variables
**Required:**
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` OR `FIREBASE_PROJECT_ID` set
- [ ] `NODE_ENV=production` (if applicable)
- [ ] All other required environment variables configured

**Check:**
```bash
echo $GOOGLE_APPLICATION_CREDENTIALS
echo $FIREBASE_PROJECT_ID
```

### 3. Route Loading Test
**Run diagnostic script:**
```bash
cd backend
node test-route-loading.js
```

**Expected Output:**
- ✅ All routes load successfully
- ✅ No "Cannot find module" errors
- ✅ Firebase Admin initialized
- ✅ Database utility working

### 4. Server Startup Test
**Start server locally:**
```bash
cd backend
npm start
```

**Check logs for:**
- ✅ Content routes loaded (Firestore)
- ✅ Feed routes loaded (Firestore)
- ✅ Recommendations routes loaded (Firestore)
- ✅ No route loading errors

### 5. Production Readiness Test
**Run test suite:**
```bash
cd backend
node test-production-ready.js
```

**Target Results:**
- ✅ All critical tests passing
- ✅ Success rate > 80%
- ✅ No route loading failures

---

## Deployment Steps

### Google Cloud Run Deployment

1. **Build and Deploy:**
   ```bash
   gcloud run deploy mixillo-backend \
     --source . \
     --region europe-west1 \
     --platform managed
   ```

2. **Set Environment Variables:**
   ```bash
   gcloud run services update mixillo-backend \
     --set-env-vars FIREBASE_PROJECT_ID=your-project-id \
     --region europe-west1
   ```

3. **Verify Deployment:**
   - Check Cloud Run logs for route loading messages
   - Run production readiness test against deployed URL
   - Test admin dashboard access
   - Test Flutter app API endpoints

---

## Post-Deployment Verification

### 1. Check Server Logs
**Look for:**
- ✅ "Content routes loaded (Firestore)"
- ✅ "Feed routes loaded (Firestore)"
- ✅ "Recommendations routes loaded (Firestore)"
- ❌ No "⚠️ Content routes error" messages

### 2. Test Health Endpoints
```bash
# Server health
curl https://your-api-url/health

# Content health
curl https://your-api-url/api/content/health

# Feed health
curl https://your-api-url/api/feed/health

# Recommendations health
curl https://your-api-url/api/recommendations/health
```

### 3. Test Authenticated Endpoints
```bash
# Get Firebase ID token from Flutter app
TOKEN="your-firebase-id-token"

# Test content endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://your-api-url/api/content?limit=1

# Test feed endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://your-api-url/api/feed/for-you?limit=1

# Test recommendations
curl -H "Authorization: Bearer $TOKEN" \
  https://your-api-url/api/recommendations?limit=1
```

### 4. Run Production Test Suite
```bash
cd backend
API_URL=https://your-api-url/api node test-production-ready.js
```

---

## Common Issues & Solutions

### Issue: Routes Not Loading
**Symptom:** Endpoints return "Feature being migrated to Firestore"

**Solutions:**
1. Check if `node_modules` exists: `ls node_modules`
2. Install dependencies: `npm install`
3. Check server logs for route loading errors
4. Verify Firebase credentials are set
5. Run `node test-route-loading.js` to diagnose

### Issue: "Cannot find module 'express'"
**Solution:**
```bash
cd backend
npm install
```

### Issue: Firebase Admin Not Initialized
**Solution:**
- Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- OR set `FIREBASE_PROJECT_ID` for automatic initialization
- Verify in Cloud Run environment variables

### Issue: Routes Load But Return 401
**Solution:**
- This is expected - routes require Firebase authentication
- Test with valid Firebase ID token
- Check `verifyFirebaseToken` middleware is working

---

## Monitoring

### Key Metrics to Monitor
- Route loading success rate
- API endpoint response times
- Error rates (401, 403, 500)
- Firebase authentication success rate

### Logs to Watch
- Route loading messages
- Firebase initialization
- Authentication errors
- Database query errors

---

## Rollback Plan

If deployment fails:

1. **Check Cloud Run logs** for specific errors
2. **Revert to previous revision:**
   ```bash
   gcloud run services update-traffic mixillo-backend \
     --to-revisions PREVIOUS_REVISION=100 \
     --region europe-west1
   ```
3. **Fix issues** and redeploy
4. **Re-run tests** before switching traffic back

---

## Success Criteria

✅ All routes load successfully  
✅ Production readiness test passes (>80%)  
✅ Admin dashboard accessible  
✅ Flutter app can connect to API  
✅ All health endpoints respond  
✅ No critical errors in logs  

**Once all criteria are met, the system is production-ready!**

