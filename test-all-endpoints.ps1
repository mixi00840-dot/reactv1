# Comprehensive Backend API Test Script
# Tests all major endpoints across all modules

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   COMPREHENSIVE BACKEND API TEST               ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$baseUrl = "https://mixillo-backend-52242135857.europe-west1.run.app"
$passed = 0
$failed = 0
$protected = 0

function Test-Endpoint {
    param(
        [string]$Path,
        [string]$Method = "GET",
        [string]$Category
    )
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$Path" -Method $Method -ErrorAction Stop
        $script:passed++
        Write-Host "✅ [$Category] $Method $Path - $($response.StatusCode)" -ForegroundColor Green
        return $response.StatusCode
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401 -or $statusCode -eq 403) {
            $script:protected++
            Write-Host "🔒 [$Category] $Method $Path - Auth Required (401/403)" -ForegroundColor Yellow
            return 401
        }
        elseif ($statusCode -eq 404) {
            $script:failed++
            Write-Host "❌ [$Category] $Method $Path - Not Found (404)" -ForegroundColor Red
            return 404
        }
        else {
            $script:failed++
            Write-Host "⚠️  [$Category] $Method $Path - Error ($statusCode)" -ForegroundColor Magenta
            return $statusCode
        }
    }
}

Write-Host "Testing Core System Endpoints..." -ForegroundColor Cyan
Test-Endpoint "/health" "GET" "System"
Test-Endpoint "/api/health" "GET" "System"

Write-Host "`nTesting Authentication Endpoints..." -ForegroundColor Cyan
Test-Endpoint "/api/auth/health" "GET" "Auth"
Test-Endpoint "/api/auth/me" "GET" "Auth"

Write-Host "`nTesting Admin Endpoints..." -ForegroundColor Cyan
Test-Endpoint "/api/admin/dashboard" "GET" "Admin"
Test-Endpoint "/api/admin/users" "GET" "Admin"
Test-Endpoint "/api/admin/seller-applications" "GET" "Admin"
Test-Endpoint "/api/admin/strikes" "GET" "Admin"
Test-Endpoint "/api/admin/uploads" "GET" "Admin"

Write-Host "`nTesting NEW Feature Endpoints (Stories, Wallets, Analytics)..." -ForegroundColor Cyan
Test-Endpoint "/api/admin/stories" "GET" "Stories"
Test-Endpoint "/api/admin/stories/stats" "GET" "Stories"
Test-Endpoint "/api/admin/stories/trending" "GET" "Stories"
Test-Endpoint "/api/admin/wallets" "GET" "Wallets"
Test-Endpoint "/api/admin/wallets/stats" "GET" "Wallets"
Test-Endpoint "/api/admin/wallets/transactions" "GET" "Wallets"
Test-Endpoint "/api/admin/analytics/dashboard" "GET" "Analytics"
Test-Endpoint "/api/admin/analytics/users" "GET" "Analytics"
Test-Endpoint "/api/admin/analytics/revenue" "GET" "Analytics"
Test-Endpoint "/api/admin/analytics/products" "GET" "Analytics"
Test-Endpoint "/api/admin/analytics/orders" "GET" "Analytics"
Test-Endpoint "/api/admin/analytics/sellers" "GET" "Analytics"
Test-Endpoint "/api/admin/analytics/engagement" "GET" "Analytics"

Write-Host "`nTesting E-Commerce Endpoints..." -ForegroundColor Cyan
Test-Endpoint "/api/products" "GET" "Products"
Test-Endpoint "/api/orders" "GET" "Orders"
Test-Endpoint "/api/cart" "GET" "Cart"
Test-Endpoint "/api/categories" "GET" "Categories"

Write-Host "`nTesting Content Management Endpoints..." -ForegroundColor Cyan
Test-Endpoint "/api/content" "GET" "Content"
Test-Endpoint "/api/content/trending" "GET" "Content"
Test-Endpoint "/api/feed/for-you" "GET" "Feed"
Test-Endpoint "/api/livestreams" "GET" "Livestream"
Test-Endpoint "/api/livestreams/trending" "GET" "Livestream"

Write-Host "`nTesting Social Features..." -ForegroundColor Cyan
Test-Endpoint "/api/comments" "GET" "Comments"
Test-Endpoint "/api/notifications" "GET" "Notifications"
Test-Endpoint "/api/messaging/conversations" "GET" "Messaging"

Write-Host "`nTesting Moderation Endpoints..." -ForegroundColor Cyan
Test-Endpoint "/api/moderation/queue" "GET" "Moderation"
Test-Endpoint "/api/moderation/stats" "GET" "Moderation"
Test-Endpoint "/api/ai/moderation/review" "GET" "AI Moderation"

Write-Host "`nTesting Monetization & Gifts..." -ForegroundColor Cyan
Test-Endpoint "/api/gifts" "GET" "Gifts"
Test-Endpoint "/api/monetization/stats" "GET" "Monetization"
Test-Endpoint "/api/monetization/transactions" "GET" "Monetization"

Write-Host "`nTesting Analytics & Metrics..." -ForegroundColor Cyan
Test-Endpoint "/api/metrics/trending" "GET" "Metrics"
Test-Endpoint "/api/metrics-firestore/overview" "GET" "Metrics"
Test-Endpoint "/api/analytics-firestore/dashboard" "GET" "Analytics"

Write-Host "`nTesting CMS & Banners..." -ForegroundColor Cyan
Test-Endpoint "/api/banners" "GET" "CMS"
Test-Endpoint "/api/banners/active" "GET" "CMS"
Test-Endpoint "/api/languages" "GET" "CMS"

Write-Host "`nTesting Customer Service..." -ForegroundColor Cyan
Test-Endpoint "/api/customer-service/tickets" "GET" "Support"
Test-Endpoint "/api/audit-logs" "GET" "Audit"

Write-Host "`n════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n📊 TEST RESULTS SUMMARY" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════`n" -ForegroundColor Cyan

$total = $passed + $failed + $protected

Write-Host "Total Endpoints Tested:  $total" -ForegroundColor White
Write-Host "✅ Public Accessible:     $passed" -ForegroundColor Green
Write-Host "🔒 Protected (Auth Req):  $protected" -ForegroundColor Yellow
Write-Host "❌ Failed/Not Found:      $failed" -ForegroundColor Red

$healthPercentage = [math]::Round((($passed + $protected) / $total) * 100, 1)

Write-Host "`nOverall Health: $healthPercentage%" -ForegroundColor $(if ($healthPercentage -gt 90) { "Green" } elseif ($healthPercentage -gt 75) { "Yellow" } else { "Red" })

if ($healthPercentage -gt 90) {
    Write-Host "`n🎉 EXCELLENT! Backend is in great shape!" -ForegroundColor Green
} elseif ($healthPercentage -gt 75) {
    Write-Host "`n⚠️  GOOD, but some endpoints need attention" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ ATTENTION NEEDED: Multiple endpoints failing" -ForegroundColor Red
}

Write-Host "`n════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Save report
$report = @"
Backend API Test Report
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Base URL: $baseUrl

Total Endpoints: $total
Public Accessible: $passed
Protected (Auth): $protected
Failed: $failed
Health: $healthPercentage%
"@

$report | Out-File -FilePath "backend-api-test-report.txt" -Encoding UTF8
Write-Host "📄 Report saved to: backend-api-test-report.txt" -ForegroundColor Cyan
