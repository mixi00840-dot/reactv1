# Quick deploy script for backend
Write-Host "🚀 Starting deployment..." -ForegroundColor Cyan

# Deploy to Cloud Run
gcloud run deploy mixillo-backend `
  --source . `
  --region europe-west1 `
  --platform managed `
  --allow-unauthenticated `
  --memory 1Gi `
  --cpu 1 `
  --timeout 300 `
  --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🔗 Backend URL: https://mixillo-backend-52242135857.europe-west1.run.app" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}
