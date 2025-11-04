# Complete Firebase Authentication Test Script
# Tests all Firebase Auth endpoints after deployment

Write-Host "`n" -NoNewline
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  🔐 Firebase Authentication Test Suite" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "https://mixillo-backend-52242135857.europe-west1.run.app"
$testsPassed = 0
$testsFailed = 0

# Helper function
function Test-Endpoint {
    param($name, $scriptBlock)
    Write-Host "Testing: $name" -ForegroundColor Yellow
    try {
        & $scriptBlock
        Write-Host "✅ PASSED: $name`n" -ForegroundColor Green
        $script:testsPassed++
        return $true
    } catch {
        Write-Host "❌ FAILED: $name" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)`n" -ForegroundColor Red
        $script:testsFailed++
        return $false
    }
}

# Test 1: Health Check
Test-Endpoint "Health Check" {
    $response = Invoke-RestMethod "$baseUrl/api/auth/firebase/health"
    if ($response.success -ne $true) {
        throw "Health check failed"
    }
    Write-Host "   Status: $($response.message)" -ForegroundColor Gray
}

# Test 2: Login with Admin Credentials
$token = $null
$loginSuccess = Test-Endpoint "Admin Login" {
    $body = @{
        login = "admin@mixillo.com"
        password = "Admin123!"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/firebase/login" `
        -Method POST `
        -Body $body `
        -ContentType "application/json"

    if (-not $response.data.idToken) {
        throw "No token received"
    }

    $script:token = $response.data.idToken
    Write-Host "   User: $($response.data.user.email)" -ForegroundColor Gray
    Write-Host "   Role: $($response.data.user.role)" -ForegroundColor Gray
    Write-Host "   Email Verified: $($response.data.emailVerified)" -ForegroundColor Gray
    
    # Check if admin role
    if ($response.data.user.role -ne "admin") {
        Write-Host "   ⚠️  Warning: User is not admin!" -ForegroundColor Yellow
    }
}

# Test 3: Get Current User (Protected Route)
if ($loginSuccess -and $token) {
    Test-Endpoint "Get Current User" {
        $headers = @{ Authorization = "Bearer $token" }
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/firebase/me" -Headers $headers
        
        if (-not $response.user) {
            throw "No user data returned"
        }
        
        Write-Host "   Username: $($response.user.username)" -ForegroundColor Gray
        Write-Host "   Full Name: $($response.user.fullName)" -ForegroundColor Gray
    }
}

# Test 4: Verify Token
if ($loginSuccess -and $token) {
    Test-Endpoint "Verify Token" {
        $body = @{ idToken = $token } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/firebase/verify-token" `
            -Method POST `
            -Body $body `
            -ContentType "application/json"
        
        if ($response.data.tokenValid -ne $true) {
            throw "Token is not valid"
        }
        
        Write-Host "   Token Valid: $($response.data.tokenValid)" -ForegroundColor Gray
    }
}

# Test 5: Password Reset (Don't actually send email)
Test-Endpoint "Password Reset API" {
    $body = @{ email = "test@example.com" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/firebase/reset-password" `
        -Method POST `
        -Body $body `
        -ContentType "application/json"
    
    # This should succeed even if email doesn't exist (security measure)
    if ($response.success -ne $true) {
        throw "Password reset endpoint failed"
    }
    
    Write-Host "   Message: $($response.message)" -ForegroundColor Gray
}

# Test 6: Invalid Login (Should Fail)
Test-Endpoint "Invalid Login Detection" {
    $body = @{
        login = "admin@mixillo.com"
        password = "WrongPassword123"
    } | ConvertTo-Json

    try {
        Invoke-RestMethod -Uri "$baseUrl/api/auth/firebase/login" `
            -Method POST `
            -Body $body `
            -ContentType "application/json"
        
        # If we get here, the test failed (should have thrown error)
        throw "Invalid login was accepted (should have been rejected)"
    } catch {
        # Expected to fail - check if it's the right error
        if ($_.Exception.Message -like "*Invalid credentials*" -or 
            $_.Exception.Message -like "*401*" -or
            $_.Exception.Message -like "*authentication*") {
            Write-Host "   Correctly rejected invalid credentials" -ForegroundColor Gray
        } else {
            throw "Unexpected error: $($_.Exception.Message)"
        }
    }
}

# Test 7: Protected Route Without Token (Should Fail)
Test-Endpoint "Unauthorized Access Prevention" {
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/auth/firebase/me"
        throw "Protected route accessible without token"
    } catch {
        # Expected to fail with 401
        if ($_.Exception.Message -like "*401*" -or 
            $_.Exception.Message -like "*Unauthorized*" -or
            $_.Exception.Message -like "*authentication*") {
            Write-Host "   Correctly blocked unauthorized access" -ForegroundColor Gray
        } else {
            throw "Unexpected error: $($_.Exception.Message)"
        }
    }
}

# Test 8: Logout
if ($loginSuccess -and $token) {
    Test-Endpoint "Logout (Token Revocation)" {
        $headers = @{ Authorization = "Bearer $token" }
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/firebase/logout" `
            -Method POST `
            -Headers $headers
        
        if ($response.success -ne $true) {
            throw "Logout failed"
        }
        
        Write-Host "   Message: $($response.message)" -ForegroundColor Gray
    }
}

# Print Summary
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "             Test Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($testsPassed + $testsFailed)" -ForegroundColor White
Write-Host "Passed:      $testsPassed" -ForegroundColor Green
Write-Host "Failed:      $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host "============================================" -ForegroundColor Cyan

if ($testsFailed -eq 0) {
    Write-Host "`n🎉 All tests passed! Firebase Authentication is working correctly." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Test admin dashboard login at https://mixillo.web.app" -ForegroundColor White
    Write-Host "  2. Verify admin user role in Firestore (should be 'admin')" -ForegroundColor White
    Write-Host "  3. Choose migration option (A or B) and proceed" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "`n⚠️  Some tests failed. Please check the errors above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common Issues:" -ForegroundColor Yellow
    Write-Host "  - Admin user role not set to admin in Firestore" -ForegroundColor White
    Write-Host "  - Firebase Email/Password provider not enabled" -ForegroundColor White
    Write-Host "  - Backend not deployed yet" -ForegroundColor White
    Write-Host ""
    Write-Host "Check:" -ForegroundColor Yellow
    Write-Host "  - Firebase Console: https://console.firebase.google.com/project/mixillo/authentication/providers" -ForegroundColor White
    Write-Host "  - Admin User: https://console.firebase.google.com/project/mixillo/firestore" -ForegroundColor White
    Write-Host ""
}

exit $testsFailed
