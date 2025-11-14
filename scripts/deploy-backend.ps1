# Deploy Backend to Google Cloud Run
# This script deploys the updated backend with Firestore routes

Write-Host "🚀 Deploying Mixillo Backend to Google Cloud Run..." -ForegroundColor Cyan

# Navigate to backend directory
Set-Location -Path "$PSScriptRoot\backend"

Write-Host "`n📦 Building and deploying..." -ForegroundColor Yellow

# Deploy to Cloud Run
gcloud run deploy mixillo-backend `
  --source . `
  --region europe-west1 `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --set-secrets MONGODB_URI=MONGODB_URI:2,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest `
  --set-env-vars NODE_ENV=production,DATABASE_MODE=mongodb `
  --max-instances 10 `
  --memory 512Mi `
  --timeout 300

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment successful!" -ForegroundColor Green
    Write-Host "`n🔗 Your backend is now live at:" -ForegroundColor Cyan
    Write-Host "   https://mixillo-backend-52242135857.europe-west1.run.app" -ForegroundColor White
    
    Write-Host "`n📊 Testing critical endpoints..." -ForegroundColor Yellow
    
    # Test health endpoint
    $health = Invoke-RestMethod -Uri "https://mixillo-backend-52242135857.europe-west1.run.app/health" -Method GET
    if ($health.status -eq "ok") {
        Write-Host "   ✅ Health check passed" -ForegroundColor Green
    }
    
    Write-Host "`n✨ Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Open admin dashboard: https://main.d2rfj1fx7t69dy.amplifyapp.com" -ForegroundColor White
    Write-Host "   2. Test stories, wallets, and other sections" -ForegroundColor White
    Write-Host "   3. All routes should now return 200 OK (no more 503 errors)" -ForegroundColor White
    
} else {
    Write-Host "`n❌ Deployment failed. Check errors above." -ForegroundColor Red
    Write-Host "   Common issues:" -ForegroundColor Yellow
    Write-Host "   - Google Cloud SDK not authenticated: run 'gcloud auth login'" -ForegroundColor White
    Write-Host "   - Wrong project: run 'gcloud config set project mixillo'" -ForegroundColor White
    Write-Host "   - Missing permissions: check IAM roles" -ForegroundColor White
}

# Return to root directory
Set-Location -Path "$PSScriptRoot"
