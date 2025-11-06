# Comprehensive Backend API Test
Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   COMPREHENSIVE BACKEND API TEST               ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$baseUrl = "https://mixillo-backend-52242135857.europe-west1.run.app"
$endpoints = @(
    @{Path="/health"; Category="System"},
    @{Path="/api/admin/dashboard"; Category="Admin"},
    @{Path="/api/admin/users"; Category="Admin"},
    @{Path="/api/admin/seller-applications"; Category="Admin"},
    @{Path="/api/admin/strikes"; Category="Admin"},
    @{Path="/api/admin/uploads"; Category="Admin"},
    @{Path="/api/admin/stories"; Category="Stories (NEW)"},
    @{Path="/api/admin/stories/stats"; Category="Stories (NEW)"},
    @{Path="/api/admin/stories/trending"; Category="Stories (NEW)"},
    @{Path="/api/admin/wallets"; Category="Wallets (NEW)"},
    @{Path="/api/admin/wallets/stats"; Category="Wallets (NEW)"},
    @{Path="/api/admin/wallets/transactions"; Category="Wallets (NEW)"},
    @{Path="/api/admin/analytics/dashboard"; Category="Analytics (NEW)"},
    @{Path="/api/admin/analytics/users"; Category="Analytics (NEW)"},
    @{Path="/api/admin/analytics/revenue"; Category="Analytics (NEW)"},
    @{Path="/api/admin/analytics/products"; Category="Analytics (NEW)"},
    @{Path="/api/admin/analytics/orders"; Category="Analytics (NEW)"},
    @{Path="/api/admin/analytics/sellers"; Category="Analytics (NEW)"},
    @{Path="/api/admin/analytics/engagement"; Category="Analytics (NEW)"},
    @{Path="/api/admin/analytics/export"; Category="Analytics (NEW)"},
    @{Path="/api/products"; Category="E-Commerce"},
    @{Path="/api/orders"; Category="E-Commerce"},
    @{Path="/api/cart"; Category="E-Commerce"},
    @{Path="/api/categories"; Category="E-Commerce"},
    @{Path="/api/content"; Category="Content"},
    @{Path="/api/content/trending"; Category="Content"},
    @{Path="/api/livestreams"; Category="Livestream"},
    @{Path="/api/livestreams/trending"; Category="Livestream"},
    @{Path="/api/comments"; Category="Social"},
    @{Path="/api/gifts"; Category="Monetization"},
    @{Path="/api/banners"; Category="CMS"},
    @{Path="/api/banners/active"; Category="CMS"},
    @{Path="/api/languages"; Category="CMS"}
)

$passed = 0
$protected = 0
$failed = 0

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$($endpoint.Path)" -Method GET -ErrorAction Stop
        $passed++
        Write-Host "✅ [$($endpoint.Category)] $($endpoint.Path) - 200 OK" -ForegroundColor Green
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401 -or $statusCode -eq 403) {
            $protected++
            Write-Host "🔒 [$($endpoint.Category)] $($endpoint.Path) - Auth Required" -ForegroundColor Yellow
        }
        elseif ($statusCode -eq 404) {
            $failed++
            Write-Host "❌ [$($endpoint.Category)] $($endpoint.Path) - NOT FOUND" -ForegroundColor Red
        }
        else {
            $failed++
            Write-Host "⚠️  [$($endpoint.Category)] $($endpoint.Path) - Error $statusCode" -ForegroundColor Magenta
        }
    }
}

$total = $passed + $protected + $failed
$healthPercentage = [math]::Round((($passed + $protected) / $total) * 100, 1)

Write-Host "`n════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n📊 TEST RESULTS" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════`n" -ForegroundColor Cyan
Write-Host "Total Tested:     $total" -ForegroundColor White
Write-Host "✅ Public:         $passed" -ForegroundColor Green
Write-Host "🔒 Protected:      $protected" -ForegroundColor Yellow
Write-Host "❌ Failed:         $failed" -ForegroundColor Red
Write-Host "`nHealth Score:     $healthPercentage%" -ForegroundColor $(if ($healthPercentage -gt 90) { "Green" } else { "Yellow" })

if ($healthPercentage -gt 95) {
    Write-Host "`n🎉 EXCELLENT! All endpoints working!" -ForegroundColor Green
}
elseif ($healthPercentage -gt 85) {
    Write-Host "`n✅ GOOD! Backend is healthy" -ForegroundColor Yellow
}
else {
    Write-Host "`n⚠️  NEEDS ATTENTION" -ForegroundColor Red
}

Write-Host "`n════════════════════════════════════════════════`n" -ForegroundColor Cyan
