# 🚀 Firebase Auth - Quick Command Reference

## Deployment Commands

### 1. Enable Firebase Authentication
```
Open: https://console.firebase.google.com/project/mixillo/authentication/providers
Click: Email/Password → Enable → Save
```

### 2. Fix Admin Role (CRITICAL!)
```
Open: https://console.firebase.google.com/project/mixillo/firestore/databases/-default-/data/~2Fusers~2FZBbhjKUBwWCDnBXFzMV9
Find: role field
Change: "user" → "admin"
Click: Update
```

### 3. Deploy Backend
```powershell
cd c:\Users\ASUS\Desktop\reactv1\backend
git add .
git commit -m "🔐 Firebase Auth Phase B complete"
git push origin main
# Wait 3-5 minutes for Cloud Run deployment
```

### 4. Deploy Frontend (Option B only)
```powershell
cd c:\Users\ASUS\Desktop\reactv1\admin-dashboard
npm run build
firebase deploy --only hosting
```

---

## Testing Commands

### Test Health Check
```powershell
Invoke-RestMethod "https://mixillo-backend-52242135857.europe-west1.run.app/api/auth/firebase/health"
```

### Test Login
```powershell
$body = @{
    login = "admin@mixillo.com"
    password = "Admin123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://mixillo-backend-52242135857.europe-west1.run.app/api/auth/firebase/login" -Method POST -Body $body -ContentType "application/json"

# Save token for next requests
$token = $response.data.idToken
Write-Host "Token: $token"
```

### Test Protected Endpoint
```powershell
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "https://mixillo-backend-52242135857.europe-west1.run.app/api/auth/firebase/me" -Headers $headers
```

### Test Registration
```powershell
$user = @{
    username = "testuser"
    email = "test@example.com"
    password = "Test123!"
    fullName = "Test User"
    dateOfBirth = "2000-01-01"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://mixillo-backend-52242135857.europe-west1.run.app/api/auth/firebase/register" -Method POST -Body $user -ContentType "application/json"
```

---

## Migration Commands

### Preview Migration (No Changes)
```powershell
cd c:\Users\ASUS\Desktop\reactv1\backend
node migrate-users-to-firebase.js --dry-run
```

### Migrate All Users
```powershell
cd c:\Users\ASUS\Desktop\reactv1\backend
node migrate-users-to-firebase.js
```

### Migrate Single User
```powershell
cd c:\Users\ASUS\Desktop\reactv1\backend
node migrate-users-to-firebase.js --email=admin@mixillo.com
```

---

## Verification Commands

### Check Cloud Run Status
```powershell
Start-Process "https://console.cloud.google.com/run/detail/europe-west1/mixillo-backend"
```

### Check Firebase Console
```powershell
Start-Process "https://console.firebase.google.com/project/mixillo"
```

### Check Admin Dashboard
```powershell
Start-Process "https://mixillo.web.app"
```

### Check Firestore Users
```powershell
Start-Process "https://console.firebase.google.com/project/mixillo/firestore/databases/-default-/data/~2Fusers"
```

---

## Git Commands

### Check Status
```powershell
cd c:\Users\ASUS\Desktop\reactv1
git status
```

### View Recent Commits
```powershell
git log --oneline -5
```

### Check Remote URL
```powershell
git remote -v
```

---

## Troubleshooting Commands

### Check Backend Logs
```powershell
# Open Cloud Run logs in browser
Start-Process "https://console.cloud.google.com/run/detail/europe-west1/mixillo-backend/logs"
```

### Test CORS
```powershell
$headers = @{
    Origin = "https://mixillo.web.app"
    "Access-Control-Request-Method" = "POST"
}
Invoke-RestMethod -Uri "https://mixillo-backend-52242135857.europe-west1.run.app/api/auth/firebase/login" -Method OPTIONS -Headers $headers
```

### View All Environment Variables
```powershell
cd c:\Users\ASUS\Desktop\reactv1\backend
Get-Content .env.example
```

---

## Quick Links

- **Admin Dashboard**: https://mixillo.web.app
- **Backend API**: https://mixillo-backend-52242135857.europe-west1.run.app
- **Firebase Console**: https://console.firebase.google.com/project/mixillo
- **Cloud Run Console**: https://console.cloud.google.com/run/detail/europe-west1/mixillo-backend
- **Firestore Console**: https://console.firebase.google.com/project/mixillo/firestore
- **Auth Providers**: https://console.firebase.google.com/project/mixillo/authentication/providers
- **Admin User**: https://console.firebase.google.com/project/mixillo/firestore/databases/-default-/data/~2Fusers~2FZBbhjKUBwWCDnBXFzMV9

---

## API Endpoints Reference

### Public Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/firebase/health` | GET | Health check |
| `/api/auth/firebase/register` | POST | Register new user |
| `/api/auth/firebase/login` | POST | Login user |
| `/api/auth/firebase/verify-token` | POST | Verify ID token |
| `/api/auth/firebase/reset-password` | POST | Send password reset |

### Protected Endpoints (Require Token)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/firebase/me` | GET | Get current user |
| `/api/auth/firebase/send-verification-email` | POST | Resend verification |
| `/api/auth/firebase/logout` | POST | Revoke tokens |

---

## Complete Test Script

```powershell
# Complete Firebase Auth Test Script
# Run this after deployment to verify everything works

Write-Host "🔐 Testing Firebase Authentication" -ForegroundColor Cyan

# 1. Test Health Check
Write-Host "`n1️⃣ Testing health check..." -ForegroundColor Yellow
$health = Invoke-RestMethod "https://mixillo-backend-52242135857.europe-west1.run.app/api/auth/firebase/health"
Write-Host "✅ Health: $($health.message)" -ForegroundColor Green

# 2. Test Login
Write-Host "`n2️⃣ Testing login..." -ForegroundColor Yellow
$loginBody = @{
    login = "admin@mixillo.com"
    password = "Admin123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "https://mixillo-backend-52242135857.europe-west1.run.app/api/auth/firebase/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.idToken
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.data.user.email)" -ForegroundColor Gray
    Write-Host "   Role: $($loginResponse.data.user.role)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Test Protected Endpoint
Write-Host "`n3️⃣ Testing protected endpoint..." -ForegroundColor Yellow
$headers = @{ Authorization = "Bearer $token" }
try {
    $profile = Invoke-RestMethod -Uri "https://mixillo-backend-52242135857.europe-west1.run.app/api/auth/firebase/me" -Headers $headers
    Write-Host "✅ Profile retrieved!" -ForegroundColor Green
    Write-Host "   Username: $($profile.user.username)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Profile request failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Test Logout
Write-Host "`n4️⃣ Testing logout..." -ForegroundColor Yellow
try {
    $logout = Invoke-RestMethod -Uri "https://mixillo-backend-52242135857.europe-west1.run.app/api/auth/firebase/logout" -Method POST -Headers $headers
    Write-Host "✅ Logout successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Logout failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Test complete!" -ForegroundColor Cyan
```

Save as `test-firebase-auth.ps1` and run:
```powershell
.\test-firebase-auth.ps1
```

---

## Files Modified Summary

### Backend (7 files)
```
✅ backend/src/utils/database.js
✅ backend/src/middleware/firebaseAuth.js
✅ backend/src/routes/authFirebase.js
✅ backend/src/app.js
✅ backend/.env.example
✅ backend/migrate-users-to-firebase.js
✅ backend/package.json
```

### Frontend (4 files)
```
✅ admin-dashboard/src/firebase.js
✅ admin-dashboard/src/contexts/AuthContextFirebase.js
✅ admin-dashboard/src/utils/apiFirebase.js
✅ admin-dashboard/package.json
```

### Documentation (3 files)
```
✅ FIRESTORE_AUTH_MIGRATION_COMPLETE.md
✅ FIREBASE_AUTH_PHASE_B_COMPLETE.md
✅ FIREBASE_AUTH_COMMANDS.md (this file)
```

---

**Ready to deploy? Start with Step 1 above! 🚀**
