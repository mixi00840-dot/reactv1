# Simple Firebase Auth Test
Write-Host "`n=== Firebase Authentication Test ===" -ForegroundColor Cyan

$baseUrl = "https://mixillo-backend-52242135857.europe-west1.run.app"

# Test 1: Health Check
Write-Host "`nTest 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod "$baseUrl/api/auth/firebase/health"
    Write-Host "SUCCESS: $($health.message)" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Login
Write-Host "`nTest 2: Login" -ForegroundColor Yellow
$loginBody = @{
    login = "admin@mixillo.com"
    password = "Admin123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/firebase/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $response.data.idToken
    Write-Host "SUCCESS: Logged in as $($response.data.user.email)" -ForegroundColor Green
    Write-Host "  Role: $($response.data.user.role)" -ForegroundColor Gray
    Write-Host "  Token received: $(if($token) {'Yes'} else {'No'})" -ForegroundColor Gray
    
    # Test 3: Protected Route
    if ($token) {
        Write-Host "`nTest 3: Protected Route (Get Profile)" -ForegroundColor Yellow
        try {
            $headers = @{ Authorization = "Bearer $token" }
            $profile = Invoke-RestMethod -Uri "$baseUrl/api/auth/firebase/me" -Headers $headers
            Write-Host "SUCCESS: Profile retrieved for $($profile.user.username)" -ForegroundColor Green
        } catch {
            Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Test 4: Logout
        Write-Host "`nTest 4: Logout" -ForegroundColor Yellow
        try {
            $logout = Invoke-RestMethod -Uri "$baseUrl/api/auth/firebase/logout" -Method POST -Headers $headers
            Write-Host "SUCCESS: $($logout.message)" -ForegroundColor Green
        } catch {
            Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nPossible Issues:" -ForegroundColor Yellow
    Write-Host "  - Firebase Email/Password provider not enabled" -ForegroundColor White
    Write-Host "  - Admin user role not set to admin in Firestore" -ForegroundColor White
    Write-Host "  - Backend not yet deployed with Firebase routes" -ForegroundColor White
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
