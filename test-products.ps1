$baseUrl = "https://mixillo-backend-52242135857.europe-west1.run.app"

Write-Host "`n=== Testing Products API ===" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method GET -ErrorAction Stop
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "   Total products: $($response.total)" -ForegroundColor White
    Write-Host "   Products count: $($response.data.products.Count)" -ForegroundColor White
} catch {
    Write-Host "❌ Failed" -ForegroundColor Red
    Write-Host "   Status Code: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    try {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response Body: $responseBody" -ForegroundColor Yellow
    } catch {}
}
