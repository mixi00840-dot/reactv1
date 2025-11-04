# Test Mixillo APIs after Firestore indexes are created
Write-Host "`n🧪 Testing Mixillo APIs after Firestore Index Creation..." -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$baseUrl = "https://mixillo-backend-52242135857.europe-west1.run.app"

# Test endpoints
$endpoints = @(
    @{ Name = "Health Check"; Url = "$baseUrl/health"; ExpectedStatus = 200 },
    @{ Name = "Products (should work now)"; Url = "$baseUrl/api/products?limit=5"; ExpectedStatus = 200 },
    @{ Name = "Stores (should work now)"; Url = "$baseUrl/api/stores?limit=5"; ExpectedStatus = 200 },
    @{ Name = "Banners"; Url = "$baseUrl/api/banners"; ExpectedStatus = 200 },
    @{ Name = "Orders (auth required)"; Url = "$baseUrl/api/orders"; ExpectedStatus = 401 }
)

foreach ($endpoint in $endpoints) {
    Write-Host "Testing: $($endpoint.Name)" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url -UseBasicParsing -ErrorAction Stop
        $status = $response.StatusCode
        
        if ($status -eq $endpoint.ExpectedStatus) {
            Write-Host "  ✅ Status: $status - PASS" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Status: $status (expected $($endpoint.ExpectedStatus))" -ForegroundColor Yellow
        }
        
        # Show response snippet
        $content = $response.Content | ConvertFrom-Json
        if ($content.data) {
            Write-Host "  📊 Data count: $($content.data.Count) items" -ForegroundColor Gray
        }
    }
    catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status -eq $endpoint.ExpectedStatus) {
            Write-Host "  ✅ Status: $status - PASS (expected error)" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Status: $status - FAIL" -ForegroundColor Red
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    Write-Host ""
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "✅ Test complete!" -ForegroundColor Green
Write-Host "`n📱 Admin Dashboard: https://mixillo.web.app" -ForegroundColor Cyan
Write-Host "🔧 Firebase Console: https://console.firebase.google.com/project/mixillo/firestore/indexes" -ForegroundColor Cyan
