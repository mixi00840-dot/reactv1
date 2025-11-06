# Quick deploy for new routes
Write-Host "Deploying backend with Stories, Wallets, Analytics routes..." -ForegroundColor Cyan

cd backend
gcloud run deploy mixillo-backend --source . --region europe-west1 --allow-unauthenticated

Write-Host "`nDeployment complete! Testing endpoint..." -ForegroundColor Green
Start-Sleep -Seconds 5
$response = Invoke-RestMethod -Uri "https://mixillo-backend-52242135857.europe-west1.run.app/health"
Write-Host "Health check: $($response.status)" -ForegroundColor Yellow
