# Deploy Admin Dashboard to Firebase Hosting

Write-Host "`n🚀 Deploying Mixillo Admin Dashboard to Firebase Hosting`n" -ForegroundColor Cyan

# Step 1: Update API URL
Write-Host "[1/5] Updating API URL..." -ForegroundColor Yellow
$envContent = "REACT_APP_API_URL=https://mixillo-backend-52242135857.europe-west1.run.app"
Set-Content -Path ".env.production" -Value $envContent
Write-Host "   ✅ API URL set to Cloud Run backend" -ForegroundColor Green

# Step 2: Install dependencies
Write-Host "`n[2/5] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Dependencies installed" -ForegroundColor Green

# Step 3: Build production bundle
Write-Host "`n[3/5] Building production bundle..." -ForegroundColor Yellow
$env:CI = "false"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Build successful (build/ folder created)" -ForegroundColor Green

# Step 4: Initialize Firebase (if not already done)
Write-Host "`n[4/5] Checking Firebase configuration..." -ForegroundColor Yellow
if (!(Test-Path "firebase.json")) {
    Write-Host "   Creating firebase.json..." -ForegroundColor Yellow
    
    $firebaseConfig = @{
        hosting = @{
            public = "build"
            ignore = @(
                "firebase.json",
                "**/.*",
                "**/node_modules/**"
            )
            rewrites = @(
                @{
                    source = "**"
                    destination = "/index.html"
                }
            )
            headers = @(
                @{
                    source = "**/*.@(jpg|jpeg|gif|png|svg|webp|js|css)"
                    headers = @(
                        @{
                            key = "Cache-Control"
                            value = "max-age=31536000"
                        }
                    )
                }
            )
        }
    } | ConvertTo-Json -Depth 10
    
    Set-Content -Path "firebase.json" -Value $firebaseConfig
    Write-Host "   ✅ firebase.json created" -ForegroundColor Green
} else {
    Write-Host "   ✅ firebase.json exists" -ForegroundColor Green
}

# Step 5: Deploy to Firebase Hosting
Write-Host "`n[5/5] Deploying to Firebase Hosting..." -ForegroundColor Yellow
Write-Host "   Running: firebase deploy --only hosting" -ForegroundColor Gray
firebase deploy --only hosting --project mixillo

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment successful!" -ForegroundColor Green
    Write-Host "`n🌐 Admin Dashboard URL:" -ForegroundColor Cyan
    Write-Host "   https://mixillo.web.app" -ForegroundColor White
    Write-Host "   or" -ForegroundColor Gray
    Write-Host "   https://mixillo.firebaseapp.com" -ForegroundColor White
} else {
    Write-Host "`n❌ Deployment failed" -ForegroundColor Red
    Write-Host "   Make sure Firebase CLI is installed: npm install -g firebase-tools" -ForegroundColor Yellow
    Write-Host "   And logged in: firebase login" -ForegroundColor Yellow
}
