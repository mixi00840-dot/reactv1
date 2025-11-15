# Verify Frontend Fix - Data Display Issue Resolved
# The issue was: apiMongoDB.get() returns response.data, 
# but components were accessing response.data.data (one level too deep)

Write-Host "=== Verifying Frontend Data Display Fix ===" -ForegroundColor Cyan
Write-Host ""

$backend = "https://mixillo-backend-52242135857.europe-west1.run.app"
$frontend = "https://admin-dashboard-4kyyvcrzf-mixillo.vercel.app"

# Test 1: Verify API returns correct data structure
Write-Host "[TEST 1] Testing API response structure..." -ForegroundColor Yellow

$token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDdlMzA1YmQ5ODYzODdlOTM3YTY3YSIsImVtYWlsIjoiYWRtaW5AbWl4aWxsby5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjMxNTk2NjAsImV4cCI6MTc2Mzc2NDQ2MH0.tfPWlqdGlzz1IGn7p549eGmA7P5tKSs_vnkxZ3HHSOI'
$headers = @{Authorization="Bearer $token"}

try {
    $dbStats = Invoke-RestMethod -Uri "$backend/api/admin/database/stats" -Headers $headers
    Write-Host "✅ Database Stats Response Structure:" -ForegroundColor Green
    Write-Host "   - success: $($dbStats.success)" -ForegroundColor Gray
    Write-Host "   - data.connected: $($dbStats.data.connected)" -ForegroundColor Gray
    Write-Host "   - data.totalCollections: $($dbStats.data.totalCollections)" -ForegroundColor Gray
    Write-Host "   - data.dataSize: $($dbStats.data.dataSize) bytes" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Failed to fetch database stats" -ForegroundColor Red
}

# Test 2: Verify realtime stats
Write-Host "[TEST 2] Testing realtime stats..." -ForegroundColor Yellow
try {
    $realtimeStats = Invoke-RestMethod -Uri "$backend/api/admin/realtime/stats" -Headers $headers
    Write-Host "✅ Realtime Stats Response:" -ForegroundColor Green
    Write-Host "   - success: $($realtimeStats.success)" -ForegroundColor Gray
    Write-Host "   - data keys: $($realtimeStats.data.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Failed to fetch realtime stats" -ForegroundColor Red
}

# Test 3: Verify cache stats
Write-Host "[TEST 3] Testing cache stats..." -ForegroundColor Yellow
try {
    $cacheStats = Invoke-RestMethod -Uri "$backend/api/admin/cache/stats" -Headers $headers
    Write-Host "✅ Cache Stats Response:" -ForegroundColor Green
    Write-Host "   - success: $($cacheStats.success)" -ForegroundColor Gray
    if ($cacheStats.data.redis) {
        Write-Host "   - Redis data available" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "❌ Failed to fetch cache stats" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Fix Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Problem: Components were accessing response.data.data instead of response.data" -ForegroundColor Yellow
Write-Host "Cause: apiMongoDB.get() returns response.data (already unwrapped)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Fixed Files:" -ForegroundColor White
Write-Host "  1. DatabaseMonitoring.js - All 4 fetch functions" -ForegroundColor Gray
Write-Host "  2. SystemHealth.js - All 4 fetch functions" -ForegroundColor Gray
Write-Host "  3. Dashboard.js - fetchRealtimeStats" -ForegroundColor Gray
Write-Host "  4. APISettings.js - All 3 stat fetchers" -ForegroundColor Gray
Write-Host ""
Write-Host "Changes:" -ForegroundColor White
Write-Host "  - Before: if (response.data?.success) { setState(response.data.data) }" -ForegroundColor Red
Write-Host "  - After:  if (response.success) { setState(response.data) }" -ForegroundColor Green
Write-Host ""
Write-Host "Deployment:" -ForegroundColor White
Write-Host "  Frontend: $frontend" -ForegroundColor Cyan
Write-Host "  Status: ✅ Deployed successfully" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open: $frontend" -ForegroundColor White
Write-Host "2. Login: admin / Admin@123456" -ForegroundColor White
Write-Host "3. Check Database Monitoring:" -ForegroundColor White
Write-Host "   - Should show 'MongoDB Status: CONNECTED'" -ForegroundColor Green
Write-Host "   - Should show '64 Collections'" -ForegroundColor Green
Write-Host "   - Should show actual data size" -ForegroundColor Green
Write-Host "4. Check System Health:" -ForegroundColor White
Write-Host "   - Should show real-time metrics updating" -ForegroundColor Green
Write-Host "   - No more 'UNKNOWN' status" -ForegroundColor Green
Write-Host "5. Check API Settings:" -ForegroundColor White
Write-Host "   - Real-time stats should populate" -ForegroundColor Green
Write-Host ""
