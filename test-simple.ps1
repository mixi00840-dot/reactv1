# Simple API Test for Firestore Indexes
Write-Host "`n🧪 Testing Mixillo APIs..." -ForegroundColor Cyan

$baseUrl = "https://mixillo-backend-52242135857.europe-west1.run.app"

$tests = @(
    @{Name="Health"; Url="$baseUrl/health"},
    @{Name="Products"; Url="$baseUrl/api/products?limit=5"},
    @{Name="Stores"; Url="$baseUrl/api/stores?limit=5"},
    @{Name="Banners"; Url="$baseUrl/api/banners"},
    @{Name="Orders (auth required)"; Url="$baseUrl/api/orders"}
)

foreach ($test in $tests) {
    Write-Host "`nTesting: $($test.Name)" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $test.Url -UseBasicParsing -ErrorAction Stop
        Write-Host "  ✅ Status: $($response.StatusCode)" -ForegroundColor Green
    }
    catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status -eq 500) {
            Write-Host "  ❌ Status: 500 - NEEDS INDEX" -ForegroundColor Red
        }
        elseif ($status -eq 401) {
            Write-Host "  ✅ Status: 401 - Auth Required (Working)" -ForegroundColor Green
        }
        elseif ($status -eq 503) {
            Write-Host "  ⏭️  Status: 503 - Not Migrated Yet" -ForegroundColor Cyan
        }
        else {
            Write-Host "  ❌ Status: $status" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "See FIRESTORE_INDEXES_REQUIRED.md for full list" -ForegroundColor Cyan
