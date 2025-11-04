$baseUrl = "https://mixillo-backend-52242135857.europe-west1.run.app"

Write-Host "`n=== Testing Mixillo Backend API ===" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n[1] Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Status: $($response.status)" -ForegroundColor Green
    Write-Host "   Database: $($response.database)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}

# Test 2: Products (Phase 2 - Firestore migrated)
Write-Host "`n[2] Products API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method GET
    Write-Host "✅ Success: $($response.success)" -ForegroundColor Green
    Write-Host "   Total products: $($response.total)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "⚠️  Status $statusCode" -ForegroundColor Magenta
    if ($statusCode -eq 503) {
        Write-Host "   (503 = Feature in fallback mode)" -ForegroundColor Magenta
    }
}

# Test 3: Stores (Phase 2 - Firestore migrated)
Write-Host "`n[3] Stores API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/stores" -Method GET
    Write-Host "✅ Success: $($response.success)" -ForegroundColor Green
    Write-Host "   Total stores: $($response.total)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "⚠️  Status $statusCode" -ForegroundColor Magenta
    if ($statusCode -eq 503) {
        Write-Host "   (503 = Feature in fallback mode)" -ForegroundColor Magenta
    }
}

# Test 4: Orders (Phase 2 - Firestore migrated)
Write-Host "`n[4] Orders API (requires auth)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/orders" -Method GET
    Write-Host "✅ Success: $($response.success)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✅ Status 401 (Authentication required - endpoint working)" -ForegroundColor Green
    } elseif ($statusCode -eq 503) {
        Write-Host "⚠️  Status 503 (Feature in fallback mode)" -ForegroundColor Magenta
    } else {
        Write-Host "❌ Status $statusCode" -ForegroundColor Red
    }
}

# Test 5: CMS Banners (Phase 2 - Firestore migrated)
Write-Host "`n[5] CMS Banners API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/banners" -Method GET
    Write-Host "✅ Success: $($response.success)" -ForegroundColor Green
    Write-Host "   Total banners: $($response.total)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "⚠️  Status $statusCode" -ForegroundColor Magenta
    if ($statusCode -eq 503) {
        Write-Host "   (503 = Feature in fallback mode)" -ForegroundColor Magenta
    }
}

# Test 6: Settings (Phase 2 - Firestore migrated)
Write-Host "`n[6] Settings API (public)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/settings/public" -Method GET
    Write-Host "✅ Success: $($response.success)" -ForegroundColor Green
    Write-Host "   Total settings: $($response.total)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "⚠️  Status $statusCode" -ForegroundColor Magenta
    if ($statusCode -eq 503) {
        Write-Host "   (503 = Feature in fallback mode)" -ForegroundColor Magenta
    }
}

# Test 7: Cart (NOT migrated - should be 503)
Write-Host "`n[7] Cart API (unmigrated)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/cart" -Method GET
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 503) {
        Write-Host "✅ Status 503 (Correctly using fallback)" -ForegroundColor Green
    } else {
        Write-Host "❌ Status $statusCode (Expected 503)" -ForegroundColor Red
    }
}

# Test 8: Categories (NOT migrated - should be 503)
Write-Host "`n[8] Categories API (unmigrated)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method GET
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 503) {
        Write-Host "✅ Status 503 (Correctly using fallback)" -ForegroundColor Green
    } else {
        Write-Host "❌ Status $statusCode (Expected 503)" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
