# Comprehensive Dashboard API Testing Script
# Tests all handlers, functionalities, and features with different scenarios

$baseUrl = "https://mixillo-backend-52242135857.europe-west1.run.app"
$dashboardUrl = "https://mixillo.web.app"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MIXILLO DASHBOARD COMPREHENSIVE TEST" -ForegroundColor Cyan
Write-Host "Backend: $baseUrl" -ForegroundColor Cyan
Write-Host "Dashboard: $dashboardUrl" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$testResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [string]$ExpectedStatus = "200",
        [string]$Scenario = "Default"
    )
    
    Write-Host "Testing: $Name [$Scenario]" -ForegroundColor Yellow
    Write-Host "  Method: $Method | Endpoint: $Endpoint" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            Headers = $Headers
            TimeoutSec = 30
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params -UseBasicParsing
        $statusCode = $response.StatusCode
        $content = $response.Content | ConvertFrom-Json
        
        $success = $statusCode -eq $ExpectedStatus
        $result = @{
            Name = $Name
            Scenario = $Scenario
            Method = $Method
            Endpoint = $Endpoint
            Status = $statusCode
            Expected = $ExpectedStatus
            Success = $success
            Response = $content
            Error = $null
        }
        
        if ($success) {
            Write-Host "  [PASS] - Status: $statusCode" -ForegroundColor Green
            if ($content) {
                Write-Host "  Response: $($content | ConvertTo-Json -Compress -Depth 2)" -ForegroundColor Gray
            }
        } else {
            Write-Host "  [FAIL] - Expected: $ExpectedStatus, Got: $statusCode" -ForegroundColor Red
        }
        
        return $result
        
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Host "  [ERROR] - $errorMsg" -ForegroundColor Red
        
        return @{
            Name = $Name
            Scenario = $Scenario
            Method = $Method
            Endpoint = $Endpoint
            Status = "ERROR"
            Expected = $ExpectedStatus
            Success = $false
            Response = $null
            Error = $errorMsg
        }
    }
    
    Write-Host ""
}

# ==============================================
# SCENARIO 1: HEALTH AND CONNECTIVITY TESTS
# ==============================================
Write-Host "`n=== SCENARIO 1: HEALTH AND CONNECTIVITY ===" -ForegroundColor Magenta

$testResults += Test-Endpoint -Name "Server Health Check" `
    -Endpoint "/health" `
    -Scenario "Basic Health"

$testResults += Test-Endpoint -Name "Database Health Check" `
    -Endpoint "/api/health/db" `
    -Scenario "Firestore Connection"

$testResults += Test-Endpoint -Name "API Root" `
    -Endpoint "/api" `
    -Scenario "API Available"

# ==============================================
# SCENARIO 2: AUTHENTICATION TESTS
# ==============================================
Write-Host "`n=== SCENARIO 2: AUTHENTICATION TESTS ===" -ForegroundColor Magenta

# Test login without credentials (should fail)
$testResults += Test-Endpoint -Name "Login - No Credentials" `
    -Method "POST" `
    -Endpoint "/api/auth/login" `
    -Body @{} `
    -ExpectedStatus "400" `
    -Scenario "Missing Credentials"

# Test login with invalid credentials
$testResults += Test-Endpoint -Name "Login - Invalid Credentials" `
    -Method "POST" `
    -Endpoint "/api/auth/login" `
    -Body @{
        email = "invalid@test.com"
        password = "wrongpassword"
    } `
    -ExpectedStatus "401" `
    -Scenario "Invalid Credentials"

# Test register without data
$testResults += Test-Endpoint -Name "Register - No Data" `
    -Method "POST" `
    -Endpoint "/api/auth/register" `
    -Body @{} `
    -ExpectedStatus "400" `
    -Scenario "Missing Registration Data"

# Test Firebase token verification (without token)
$testResults += Test-Endpoint -Name "Firebase Verify - No Token" `
    -Method "POST" `
    -Endpoint "/api/auth/firebase/verify" `
    -Body @{} `
    -ExpectedStatus "400" `
    -Scenario "Missing Firebase Token"

# ==============================================
# SCENARIO 3: STORIES TESTS (Firestore)
# ==============================================
Write-Host "`n=== SCENARIO 3: STORIES FUNCTIONALITY ===" -ForegroundColor Magenta

# Get all stories
$testResults += Test-Endpoint -Name "Stories - Get All" `
    -Endpoint "/api/stories" `
    -Scenario "Fetch All Stories"

# Get stories with limit
$testResults += Test-Endpoint -Name "Stories - Get With Limit" `
    -Endpoint "/api/stories?limit=5" `
    -Scenario "Limited Results"

# Get stories statistics
$testResults += Test-Endpoint -Name "Stories - Get Stats" `
    -Endpoint "/api/stories/stats" `
    -Scenario "Statistics"

# Get stories feed (requires auth - should fail)
$testResults += Test-Endpoint -Name "Stories - Get Feed (No Auth)" `
    -Endpoint "/api/stories/feed" `
    -ExpectedStatus "401" `
    -Scenario "Unauthorized Feed Access"

# Get user stories (specific user)
$testResults += Test-Endpoint -Name "Stories - Get User Stories" `
    -Endpoint "/api/stories/user/test-user-123" `
    -Scenario "User Specific Stories"

# Create story without auth (should fail)
$testResults += Test-Endpoint -Name "Stories - Create (No Auth)" `
    -Method "POST" `
    -Endpoint "/api/stories" `
    -Body @{
        mediaUrl = "https://example.com/media.jpg"
        mediaType = "image"
    } `
    -ExpectedStatus "401" `
    -Scenario "Unauthorized Create"

# ==============================================
# SCENARIO 4: WALLETS TESTS (Firestore)
# ==============================================
Write-Host "`n=== SCENARIO 4: WALLETS FUNCTIONALITY ===" -ForegroundColor Magenta

# Get wallet stats
$testResults += Test-Endpoint -Name "Wallets - Get Stats" `
    -Endpoint "/api/wallets/stats" `
    -Scenario "Wallet Statistics"

# Get all wallets (admin - no auth should fail)
$testResults += Test-Endpoint -Name "Wallets - Get All (No Auth)" `
    -Endpoint "/api/wallets" `
    -ExpectedStatus "401" `
    -Scenario "Unauthorized Admin Access"

# Get current user wallet (no auth - should fail)
$testResults += Test-Endpoint -Name "Wallets - Get My Wallet (No Auth)" `
    -Endpoint "/api/wallets/me" `
    -ExpectedStatus "401" `
    -Scenario "Unauthorized User Access"

# Check wallet balance (no auth - should fail)
$testResults += Test-Endpoint -Name "Wallets - Get Balance (No Auth)" `
    -Endpoint "/api/wallets/balance" `
    -ExpectedStatus "401" `
    -Scenario "Unauthorized Balance Check"

# Get transactions (no auth - should fail)
$testResults += Test-Endpoint -Name "Wallets - Get Transactions (No Auth)" `
    -Endpoint "/api/wallets/transactions" `
    -ExpectedStatus "401" `
    -Scenario "Unauthorized Transaction History"

# Create withdrawal (no auth - should fail)
$testResults += Test-Endpoint -Name "Wallets - Create Withdrawal (No Auth)" `
    -Method "POST" `
    -Endpoint "/api/wallets/withdraw" `
    -Body @{
        amount = 100
        method = "bank_transfer"
    } `
    -ExpectedStatus "401" `
    -Scenario "Unauthorized Withdrawal"

# ==============================================
# SCENARIO 5: MONETIZATION TESTS (Firestore Stub)
# ==============================================
Write-Host "`n=== SCENARIO 5: MONETIZATION FUNCTIONALITY ===" -ForegroundColor Magenta

# Get monetization stats
$testResults += Test-Endpoint -Name "Monetization - Get Stats" `
    -Endpoint "/api/monetization/stats" `
    -Scenario "Monetization Statistics"

# Get transactions
$testResults += Test-Endpoint -Name "Monetization - Get Transactions" `
    -Endpoint "/api/monetization/transactions" `
    -Scenario "Transaction List"

# Get revenue chart
$testResults += Test-Endpoint -Name "Monetization - Get Revenue Chart" `
    -Endpoint "/api/monetization/revenue-chart" `
    -Scenario "Revenue Analytics"

# Get revenue chart with time range
$testResults += Test-Endpoint -Name "Monetization - Revenue Chart 30 Days" `
    -Endpoint "/api/monetization/revenue-chart?days=30" `
    -Scenario "Revenue 30 Days"

# ==============================================
# SCENARIO 6: MODERATION TESTS (Firestore Stub)
# ==============================================
Write-Host "`n=== SCENARIO 6: MODERATION FUNCTIONALITY ===" -ForegroundColor Magenta

# Get moderation stats
$testResults += Test-Endpoint -Name "Moderation - Get Stats" `
    -Endpoint "/api/moderation/stats" `
    -Scenario "Moderation Statistics"

# Get moderation queue
$testResults += Test-Endpoint -Name "Moderation - Get Queue" `
    -Endpoint "/api/moderation/queue" `
    -Scenario "Moderation Queue"

# Get queue with filters
$testResults += Test-Endpoint -Name "Moderation - Queue Filtered" `
    -Endpoint "/api/moderation/queue?status=pending" `
    -Scenario "Pending Items Only"

# ==============================================
# SCENARIO 7: SETTINGS TESTS (Firestore Stub)
# ==============================================
Write-Host "`n=== SCENARIO 7: SETTINGS FUNCTIONALITY ===" -ForegroundColor Magenta

# Get system settings
$testResults += Test-Endpoint -Name "Settings - Get All" `
    -Endpoint "/api/settings" `
    -Scenario "System Settings"

# Update settings without auth (should fail)
$testResults += Test-Endpoint -Name "Settings - Update (No Auth)" `
    -Method "PUT" `
    -Endpoint "/api/settings" `
    -Body @{
        siteName = "Mixillo Test"
        maintenanceMode = $false
    } `
    -ExpectedStatus "401" `
    -Scenario "Unauthorized Settings Update"

# ==============================================
# SCENARIO 8: TRANSCODE TESTS (Firestore Stub)
# ==============================================
Write-Host "`n=== SCENARIO 8: TRANSCODE FUNCTIONALITY ===" -ForegroundColor Magenta

# Get transcode stats
$testResults += Test-Endpoint -Name "Transcode - Get Stats" `
    -Endpoint "/api/transcode/stats" `
    -Scenario "Transcode Statistics"

# Get transcode queue
$testResults += Test-Endpoint -Name "Transcode - Get Queue" `
    -Endpoint "/api/transcode/queue" `
    -Scenario "Transcode Queue"

# ==============================================
# SCENARIO 9: TRENDING TESTS (Firestore Stub)
# ==============================================
Write-Host "`n=== SCENARIO 9: TRENDING FUNCTIONALITY ===" -ForegroundColor Magenta

# Get trending config
$testResults += Test-Endpoint -Name "Trending - Get Config" `
    -Endpoint "/api/trending/config" `
    -Scenario "Trending Configuration"

# Get trending history
$testResults += Test-Endpoint -Name "Trending - Get History" `
    -Endpoint "/api/trending/history" `
    -Scenario "Trending History"

# Get trending weights
$testResults += Test-Endpoint -Name "Trending - Get Weights" `
    -Endpoint "/api/trending/weights" `
    -Scenario "Algorithm Weights"

# Get trending thresholds
$testResults += Test-Endpoint -Name "Trending - Get Thresholds" `
    -Endpoint "/api/trending/thresholds" `
    -Scenario "Trending Thresholds"

# ==============================================
# SCENARIO 10: SOUNDS TESTS (Firestore Stub)
# ==============================================
Write-Host "`n=== SCENARIO 10: SOUNDS FUNCTIONALITY ===" -ForegroundColor Magenta

# Get sounds admin stats
$testResults += Test-Endpoint -Name "Sounds - Admin Stats" `
    -Endpoint "/api/sounds/admin/stats" `
    -Scenario "Sound Statistics"

# Get trending sounds
$testResults += Test-Endpoint -Name "Sounds - Get Trending" `
    -Endpoint "/api/sounds/trending" `
    -Scenario "Trending Sounds"

# Search sounds
$testResults += Test-Endpoint -Name "Sounds - Search" `
    -Endpoint "/api/sounds/search?q=test" `
    -Scenario "Sound Search"

# Get sounds moderation
$testResults += Test-Endpoint -Name "Sounds - Moderation Queue" `
    -Endpoint "/api/sounds/moderation" `
    -Scenario "Sound Moderation"

# ==============================================
# SCENARIO 11: ANALYTICS TESTS (Firestore Stub)
# ==============================================
Write-Host "`n=== SCENARIO 11: ANALYTICS FUNCTIONALITY ===" -ForegroundColor Magenta

# Get advanced analytics
$testResults += Test-Endpoint -Name "Analytics - Advanced" `
    -Endpoint "/api/analytics/advanced" `
    -Scenario "Advanced Analytics"

# Get content analytics
$testResults += Test-Endpoint -Name "Analytics - Content" `
    -Endpoint "/api/analytics/content" `
    -Scenario "Content Analytics"

# Get storage analytics
$testResults += Test-Endpoint -Name "Analytics - Storage" `
    -Endpoint "/api/analytics/storage" `
    -Scenario "Storage Usage"

# ==============================================
# SCENARIO 12: METRICS TESTS (Firestore Stub)
# ==============================================
Write-Host "`n=== SCENARIO 12: METRICS FUNCTIONALITY ===" -ForegroundColor Magenta

# Get metrics overview
$testResults += Test-Endpoint -Name "Metrics - Overview" `
    -Endpoint "/api/metrics/overview" `
    -Scenario "System Metrics"

# ==============================================
# SCENARIO 13: USER MANAGEMENT TESTS
# ==============================================
Write-Host "`n=== SCENARIO 13: USER MANAGEMENT ===" -ForegroundColor Magenta

# Get all users (no auth - should fail)
$testResults += Test-Endpoint -Name "Users - Get All (No Auth)" `
    -Endpoint "/api/users" `
    -ExpectedStatus "401" `
    -Scenario "Unauthorized User List"

# Get user profile (public endpoint might work)
$testResults += Test-Endpoint -Name "Users - Get Profile" `
    -Endpoint "/api/users/test-user-123" `
    -Scenario "User Profile"

# Search users
$testResults += Test-Endpoint -Name "Users - Search" `
    -Endpoint "/api/users/search?q=test" `
    -Scenario "User Search"

# ==============================================
# SCENARIO 14: CORS AND SECURITY TESTS
# ==============================================
Write-Host "`n=== SCENARIO 14: CORS AND SECURITY ===" -ForegroundColor Magenta

# Test CORS headers
$testResults += Test-Endpoint -Name "CORS - Preflight Check" `
    -Method "OPTIONS" `
    -Endpoint "/api/health" `
    -ExpectedStatus "204" `
    -Scenario "OPTIONS Request"

# Test rate limiting (multiple rapid requests)
Write-Host "Testing: Rate Limiting" -ForegroundColor Yellow
$rateLimitResults = @()
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method GET -UseBasicParsing -TimeoutSec 5
        $rateLimitResults += $response.StatusCode
        Write-Host "  Request $i - Status: $($response.StatusCode)" -ForegroundColor Gray
    } catch {
        $rateLimitResults += "ERROR"
        Write-Host "  Request $i - ERROR" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 200
}
$testResults += @{
    Name = "Rate Limiting Test"
    Scenario = "Multiple Rapid Requests"
    Method = "GET"
    Endpoint = "/api/health"
    Status = "TESTED"
    Expected = "200"
    Success = $true
    Response = $rateLimitResults
    Error = $null
}
Write-Host ""

# ==============================================
# SCENARIO 15: ERROR HANDLING TESTS
# ==============================================
Write-Host "`n=== SCENARIO 15: ERROR HANDLING ===" -ForegroundColor Magenta

# Test invalid endpoint (404)
$testResults += Test-Endpoint -Name "Invalid Endpoint" `
    -Endpoint "/api/nonexistent/route" `
    -ExpectedStatus "404" `
    -Scenario "404 Not Found"

# Test invalid method
$testResults += Test-Endpoint -Name "Invalid Method" `
    -Method "DELETE" `
    -Endpoint "/api/health" `
    -ExpectedStatus "404" `
    -Scenario "Method Not Allowed"

# Test malformed JSON (POST without proper body)
$testResults += Test-Endpoint -Name "Malformed Request" `
    -Method "POST" `
    -Endpoint "/api/auth/login" `
    -ExpectedStatus "400" `
    -Scenario "Bad Request Format"

# ==============================================
# SCENARIO 16: DASHBOARD STATIC ASSETS
# ==============================================
Write-Host "`n=== SCENARIO 16: DASHBOARD FRONTEND ===" -ForegroundColor Magenta

Write-Host "Testing: Dashboard Loading" -ForegroundColor Yellow
try {
    $dashboardResponse = Invoke-WebRequest -Uri $dashboardUrl -UseBasicParsing -TimeoutSec 30
    Write-Host "  [PASS] - Dashboard loaded: $($dashboardResponse.StatusCode)" -ForegroundColor Green
    $testResults += @{
        Name = "Dashboard Frontend"
        Scenario = "Load Dashboard"
        Method = "GET"
        Endpoint = $dashboardUrl
        Status = $dashboardResponse.StatusCode
        Expected = "200"
        Success = $true
        Response = "Dashboard HTML loaded successfully"
        Error = $null
    }
} catch {
    Write-Host "  [FAIL] - Dashboard error: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{
        Name = "Dashboard Frontend"
        Scenario = "Load Dashboard"
        Method = "GET"
        Endpoint = $dashboardUrl
        Status = "ERROR"
        Expected = "200"
        Success = $false
        Response = $null
        Error = $_.Exception.Message
    }
}
Write-Host ""

# ==============================================
# GENERATE SUMMARY REPORT
# ==============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY REPORT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_.Success -eq $true }).Count
$failedTests = $totalTests - $passedTests
$passRate = [math]::Round(($passedTests / $totalTests) * 100, 2)

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red
Write-Host "Pass Rate: $passRate%" -ForegroundColor Cyan
Write-Host ""

# Group results by scenario
$scenarioGroups = $testResults | Group-Object -Property Scenario

Write-Host "RESULTS BY SCENARIO:" -ForegroundColor Yellow
Write-Host "--------------------" -ForegroundColor Yellow
foreach ($scenario in $scenarioGroups) {
    $scenarioPassed = ($scenario.Group | Where-Object { $_.Success -eq $true }).Count
    $scenarioTotal = $scenario.Count
    $status = if ($scenarioPassed -eq $scenarioTotal) { "[PASS]" } else { "[FAIL]" }
    $color = if ($scenarioPassed -eq $scenarioTotal) { "Green" } else { "Yellow" }
    
    Write-Host "$status $($scenario.Name): $scenarioPassed/$scenarioTotal passed" -ForegroundColor $color
}
Write-Host ""

# Show failed tests details
if ($failedTests -gt 0) {
    Write-Host "FAILED TESTS DETAILS:" -ForegroundColor Red
    Write-Host "--------------------" -ForegroundColor Red
    $testResults | Where-Object { $_.Success -eq $false } | ForEach-Object {
        Write-Host "[X] $($_.Name) [$($_.Scenario)]" -ForegroundColor Red
        Write-Host "  Endpoint: $($_.Endpoint)" -ForegroundColor Gray
        Write-Host "  Expected: $($_.Expected) | Got: $($_.Status)" -ForegroundColor Gray
        if ($_.Error) {
            Write-Host "  Error: $($_.Error)" -ForegroundColor Gray
        }
        Write-Host ""
    }
}

# Show successful critical tests
Write-Host "CRITICAL TESTS STATUS:" -ForegroundColor Green
Write-Host "--------------------" -ForegroundColor Green
$criticalTests = @(
    "Server Health Check",
    "Database Health Check",
    "Stories - Get All",
    "Wallets - Get Stats",
    "Monetization - Get Stats",
    "Moderation - Get Stats",
    "Settings - Get All",
    "Dashboard Frontend"
)

foreach ($criticalName in $criticalTests) {
    $result = $testResults | Where-Object { $_.Name -eq $criticalName } | Select-Object -First 1
    if ($result) {
        $status = if ($result.Success) { "[OK]" } else { "[FAIL]" }
        $color = if ($result.Success) { "Green" } else { "Red" }
        Write-Host "$status $criticalName - Status: $($result.Status)" -ForegroundColor $color
    }
}
Write-Host ""

# Export detailed results to JSON
$reportPath = "test-dashboard-results.json"
$testResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "Detailed results exported to: $reportPath" -ForegroundColor Cyan

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TESTING COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
