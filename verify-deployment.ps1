# Deployment Verification Script
# Tests both backend and frontend after deployment

Write-Host "🚀 Mixillo Admin Dashboard - Deployment Verification" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

$backendUrl = "https://mixillo-backend-52242135857.europe-west1.run.app"
$frontendUrl = Read-Host "Enter Vercel URL (or press Enter to skip frontend test)"

# Test 1: Backend Health
Write-Host "📡 Test 1: Backend Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$backendUrl/health" -Method Get
    if ($response.status -eq "operational" -and $response.database -eq "MongoDB") {
        Write-Host "✅ Backend is healthy!" -ForegroundColor Green
        Write-Host "   Database: $($response.database)" -ForegroundColor Gray
        Write-Host "   Mode: $($response.databaseMode)" -ForegroundColor Gray
        Write-Host "   MongoDB: Connected = $($response.mongodb.connected)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Backend health check returned unexpected data" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Admin API Health
Write-Host "📡 Test 2: Admin API Health" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/admin/mongodb/health" -Method Get
    if ($response.success -eq $true) {
        Write-Host "✅ Admin API is working!" -ForegroundColor Green
        Write-Host "   Message: $($response.message)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Admin API health check returned unexpected data" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Admin API health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Make-Seller Endpoint Exists
Write-Host "📡 Test 3: Make-Seller Endpoint Check" -ForegroundColor Yellow
Write-Host "   Note: This will fail with 401 (expected - needs JWT)" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/admin/mongodb/users/test123/make-seller" -Method Put -ErrorAction Stop
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "✅ Make-Seller endpoint exists (401 = needs auth, which is correct)" -ForegroundColor Green
    } elseif ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "❌ Make-Seller endpoint NOT FOUND (404)" -ForegroundColor Red
    } else {
        Write-Host "⚠️  Unexpected response: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 4: Frontend (if URL provided)
if ($frontendUrl) {
    Write-Host "📡 Test 4: Frontend Accessibility" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $frontendUrl -Method Get
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Frontend is accessible!" -ForegroundColor Green
            Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Gray
        } else {
            Write-Host "⚠️  Unexpected status code: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Frontend not accessible: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    
    # Test login page
    Write-Host "📡 Test 5: Login Page" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$frontendUrl/login" -Method Get
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Login page is accessible!" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ Login page not accessible: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Summary
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "📊 Deployment Verification Summary" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend URL: $backendUrl" -ForegroundColor White
if ($frontendUrl) {
    Write-Host "Frontend URL: $frontendUrl" -ForegroundColor White
}
Write-Host ""
Write-Host "✅ Next Steps:" -ForegroundColor Green
Write-Host "   1. Open admin dashboard in browser" -ForegroundColor Gray
Write-Host "   2. Login with admin credentials" -ForegroundColor Gray
Write-Host "   3. Follow test checklist in FINAL_DEPLOYMENT_TEST_CHECKLIST.md" -ForegroundColor Gray
Write-Host "   4. Test make-seller workflow" -ForegroundColor Gray
Write-Host "   5. Test all tabs (Videos, Posts, Products, etc.)" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   - FINAL_DEPLOYMENT_TEST_CHECKLIST.md" -ForegroundColor Gray
Write-Host "   - 🎊_ADMIN_DASHBOARD_ENHANCEMENT_FINAL.md" -ForegroundColor Gray
Write-Host "   - ⚡_QUICK_REFERENCE_CARD.md" -ForegroundColor Gray
Write-Host ""

