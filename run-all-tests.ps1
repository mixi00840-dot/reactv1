# Comprehensive Test Runner for Mixillo Platform
# This script runs all backend and frontend tests

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "  MIXILLO TEST SUITE" -ForegroundColor Yellow
Write-Host "================================`n" -ForegroundColor Cyan

$ErrorActionPreference = "Continue"
$backendPassed = $false
$frontendPassed = $false

# Backend Tests
Write-Host "[1/3] Running Backend Tests..." -ForegroundColor Yellow
Write-Host "Starting Firebase Emulators..." -ForegroundColor Gray

# Start Firebase Emulators in background
$emulatorJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    firebase emulators:start --only firestore,auth
}

Start-Sleep -Seconds 10

Write-Host "Running backend test suite..." -ForegroundColor Gray
cd backend

$backendTestResult = npm test -- --coverage --maxWorkers=2 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Backend tests PASSED" -ForegroundColor Green
    $backendPassed = $true
} else {
    Write-Host "`n❌ Backend tests FAILED" -ForegroundColor Red
    Write-Host $backendTestResult
}

cd ..

# Frontend Tests
Write-Host "`n[2/3] Running Frontend Tests..." -ForegroundColor Yellow
cd admin-dashboard

$frontendTestResult = npm test -- --coverage --watchAll=false --maxWorkers=2 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Frontend tests PASSED" -ForegroundColor Green
    $frontendPassed = $true
} else {
    Write-Host "`n❌ Frontend tests FAILED" -ForegroundColor Red
    Write-Host $frontendTestResult
}

cd ..

# Cleanup
Write-Host "`n[3/3] Cleaning up..." -ForegroundColor Yellow
Stop-Job $emulatorJob -ErrorAction SilentlyContinue
Remove-Job $emulatorJob -ErrorAction SilentlyContinue

# Summary
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan

if ($backendPassed) {
    Write-Host "Backend:  ✅ PASSED" -ForegroundColor Green
} else {
    Write-Host "Backend:  ❌ FAILED" -ForegroundColor Red
}

if ($frontendPassed) {
    Write-Host "Frontend: ✅ PASSED" -ForegroundColor Green
} else {
    Write-Host "Frontend: ❌ FAILED" -ForegroundColor Red
}

Write-Host "`n================================`n" -ForegroundColor Cyan

if ($backendPassed -and $frontendPassed) {
    Write-Host "🎉 All tests passed! Ready to deploy." -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Some tests failed. Please fix before deploying." -ForegroundColor Yellow
    exit 1
}
