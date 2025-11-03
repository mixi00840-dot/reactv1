# Firestore Migration & Deployment Guide

## Overview

The Mixillo backend has been migrated from MongoDB to Google Cloud Firestore. This guide covers deployment and configuration.

## What Changed

### Removed
- `mongoose` package
- All Mongoose models (`User`, `Wallet`, `Profile`, etc.)
- MongoDB connection logic
- `MONGODB_URI` environment variable

### Added
- `@google-cloud/firestore` package
- Direct Firestore queries in routes and middleware
- Automatic credential detection for Cloud Run

## Firestore Collections

The backend uses these Firestore collections:

- **users** - User accounts
  - Fields: `username`, `email`, `password` (hashed), `fullName`, `role`, `status`, `isVerified`, `avatar`, `bio`, `createdAt`, `updatedAt`, `lastLogin`
  
- **wallets** - User wallets
  - Fields: `userId`, `balance`, `currency`, `transactions`, `createdAt`, `updatedAt`

More collections will be created as other routes are migrated.

## Deployment to Google Cloud Run

### Prerequisites

1. **Enable Firestore** in your Google Cloud project:
   ```bash
   gcloud firestore databases create --location=eur3 --type=firestore-native
   ```

2. **Remove MongoDB Secret** from Secret Manager (no longer needed):
   ```bash
   gcloud secrets delete MONGODB_URI
   ```

### Deploy Command

```powershell
cd C:\Users\ASUS\Desktop\reactv1\backend

gcloud run deploy mixillo-backend `
  --source . `
  --region europe-west1 `
  --platform managed `
  --allow-unauthenticated `
  --port 5000 `
  --set-env-vars NODE_ENV=production,PORT=5000,ENABLE_CRON=false,REDIS_ENABLED=false,FRONTEND_URL=https://main.d2rfj1fx7t69dy.amplifyapp.com `
  --set-secrets JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest
```

**Note:** No `MONGODB_URI` needed! Firestore credentials are automatic in Cloud Run.

### Verify Deployment

```powershell
# Test health endpoint
Invoke-WebRequest -Uri "https://mixillo-backend-XXXXXXX.europe-west1.run.app/health" -UseBasicParsing

# Test auth endpoints
$body = @{
    username = "testuser"
    email = "test@example.com"
    password = "Test123!"
    fullName = "Test User"
    dateOfBirth = "2000-01-01"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://mixillo-backend-XXXXXXX.europe-west1.run.app/api/auth/register" `
  -Method POST `
  -Body $body `
  -ContentType "application/json" `
  -UseBasicParsing
```

## Firestore Security Rules

Create security rules in the Google Cloud Console (Firestore → Rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Allow read if authenticated
      allow read: if request.auth != null;
      // Allow write only to own document or if admin
      allow write: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Wallets collection
    match /wallets/{walletId} {
      // Allow read/write only to wallet owner or admin
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Default: deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Firestore Indexes

Create composite indexes for common queries:

### Via Console
Go to Firestore → Indexes → Create Index

### Via CLI
```bash
# Index for finding users by email
gcloud firestore indexes composite create \
  --collection-group=users \
  --field-config field-path=email,order=ascending \
  --query-scope=collection

# Index for finding users by username
gcloud firestore indexes composite create \
  --collection-group=users \
  --field-config field-path=username,order=ascending \
  --query-scope=collection
```

## Local Development

### Option 1: Firestore Emulator (Recommended)

```powershell
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize project
firebase init firestore

# Start emulator
firebase emulators:start --only firestore

# In .env file
FIRESTORE_EMULATOR_HOST=localhost:8080
```

### Option 2: Use Production Firestore

```powershell
# Download service account key from Google Cloud Console
# IAM & Admin → Service Accounts → Create Key (JSON)

# Set environment variable
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account-key.json"
```

## Migration Status

### ✅ Completed
- Dependencies updated (`mongoose` → `@google-cloud/firestore`)
- Database connection refactored
- Authentication routes (`/api/auth/*`) fully migrated
- Authentication middleware updated
- Token generation and validation working

### 🔄 In Progress
- User management routes
- Admin routes
- Seller routes

### ⏳ Pending
- Content routes
- Upload routes
- Wallet routes
- Analytics routes
- All other feature routes

## Differences from MongoDB

### Query Syntax

**MongoDB (Mongoose):**
```javascript
const user = await User.findOne({ email: 'test@example.com' });
```

**Firestore:**
```javascript
const snapshot = await db.collection('users')
  .where('email', '==', 'test@example.com')
  .limit(1)
  .get();
const user = snapshot.docs[0].data();
```

### Document Updates

**MongoDB (Mongoose):**
```javascript
await user.save();
```

**Firestore:**
```javascript
await db.collection('users').doc(userId).update({ field: value });
```

### Transactions

**MongoDB (Mongoose):**
```javascript
const session = await mongoose.startSession();
await session.startTransaction();
// ... operations
await session.commitTransaction();
```

**Firestore:**
```javascript
const batch = db.batch();
batch.set(ref1, data1);
batch.update(ref2, data2);
await batch.commit();
```

## Troubleshooting

### Error: "Missing or insufficient permissions"

**Solution:** Check Firestore security rules. For development, you can temporarily allow all access:
```javascript
allow read, write: if true; // WARNING: Only for testing!
```

### Error: "7 PERMISSION_DENIED: Missing or insufficient permissions"

**Solution:** Ensure Cloud Run service account has Firestore permissions:
```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/datastore.user"
```

### Error: "The query requires an index"

**Solution:** Create the required index via Console or CLI (see "Firestore Indexes" section above).

## Cost Optimization

Firestore pricing is based on:
- **Reads:** $0.06 per 100,000 documents
- **Writes:** $0.18 per 100,000 documents
- **Deletes:** $0.02 per 100,000 documents
- **Storage:** $0.18/GB per month

**Free tier:**
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day
- 1 GB storage

**Tips:**
- Use `.limit()` on queries to reduce reads
- Batch writes when possible
- Cache frequently accessed data
- Use Cloud Run's built-in caching

## Monitoring

### View Logs
```powershell
gcloud run services logs tail mixillo-backend --region europe-west1
```

### Firestore Usage
Go to Google Cloud Console → Firestore → Usage tab

## Next Steps

1. **Deploy the current changes** to Cloud Run
2. **Test authentication endpoints** thoroughly
3. **Migrate remaining routes** one module at a time:
   - User routes (`/api/users/*`)
   - Admin routes (`/api/admin/*`)
   - Seller routes (`/api/sellers/*`)
   - Continue with other features
4. **Set up proper security rules** in production
5. **Create composite indexes** for complex queries

## Support

- **Firestore Docs:** https://cloud.google.com/firestore/docs
- **Cloud Run Docs:** https://cloud.google.com/run/docs
- **Pricing Calculator:** https://cloud.google.com/products/calculator

---

**Last Updated:** November 3, 2025  
**Migration Status:** Core authentication complete, additional routes in progress
