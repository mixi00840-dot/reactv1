# Test All API Endpoints to Identify Missing Firestore Indexes
Write-Host "`n🔍 Testing All Mixillo APIs to Find Missing Indexes..." -ForegroundColor Cyan
Write-Host "=================================================`n" -ForegroundColor Cyan

$baseUrl = "https://mixillo-backend-52242135857.europe-west1.run.app"
$adminToken = ""  # You'll need to login and get this

# Test configuration
$tests = @(
    # Phase 2 - E-commerce APIs
    @{
        Name = "Products - All";
        Url = "$baseUrl/api/products?limit=10";
        Method = "GET";
        NeedsAuth = $false;
        ExpectedStatus = 200;
        MissingIndex = "products: status + createdAt";
        Priority = "P0"
    },
    @{
        Name = "Products - By Category";
        Url = "$baseUrl/api/products?category=electronics`&limit=10";
        Method = "GET";
        NeedsAuth = $false;
        ExpectedStatus = 200;
        MissingIndex = "products: category + status + createdAt";
        Priority = "P1"
    },
    @{
        Name = "Products - By Brand";
        Url = "$baseUrl/api/products?brand=Apple`&limit=10";
        Method = "GET";
        NeedsAuth = $false;
        ExpectedStatus = 200;
        MissingIndex = "products: brand + status + createdAt";
        Priority = "P2"
    },
    @{
        Name = "Stores - All";
        Url = "$baseUrl/api/stores?limit=10";
        Method = "GET";
        NeedsAuth = $false;
        ExpectedStatus = 200;
        MissingIndex = "stores: status + createdAt";
        Priority = "P0"
    },
    @{
        Name = "Stores - By Category";
        Url = "$baseUrl/api/stores?category=fashion`&limit=10";
        Method = "GET";
        NeedsAuth = $false;
        ExpectedStatus = 200;
        MissingIndex = "stores: category + status + createdAt";
        Priority = "P1"
    },
    @{
        Name = "Orders - All (needs auth)";
        Url = "$baseUrl/api/orders?limit=10";
        Method = "GET";
        NeedsAuth = $true;
        ExpectedStatus = 200;
        MissingIndex = "orders: userId + createdAt OR status + createdAt";
        Priority = "P0"
    },
    @{
        Name = "Orders - By Status (needs auth)";
        Url = "$baseUrl/api/orders?status=pending";
        Method = "GET";
        NeedsAuth = $true;
        ExpectedStatus = 200;
        MissingIndex = "orders: userId + status + createdAt";
        Priority = "P1"
    },
    @{
        Name = "Banners - All";
        Url = "$baseUrl/api/banners";
        Method = "GET";
        NeedsAuth = $false;
        ExpectedStatus = 200;
        MissingIndex = "banners: status + order";
        Priority = "P2"
    },
    @{
        Name = "Banners - By Placement";
        Url = "$baseUrl/api/banners?placement=home";
        Method = "GET";
        NeedsAuth = $false;
        ExpectedStatus = 200;
        MissingIndex = "banners: status + placement + order";
        Priority = "P2"
    },
    @{
        Name = "Settings - All";
        Url = "$baseUrl/api/settings";
        Method = "GET";
        NeedsAuth = $false;
        ExpectedStatus = 200;
        MissingIndex = "None (no complex queries)";
        Priority = "N/A"
    },
    
    # Phase 1 - User Management (need admin token)
    @{
        Name = "Admin - All Users";
        Url = "$baseUrl/api/admin/users?limit=10";
        Method = "GET";
        NeedsAuth = $true;
        ExpectedStatus = 200;
        MissingIndex = "users: status + createdAt (if filtering)";
        Priority = "P1"
    },
    @{
        Name = "Admin - Users By Status";
        Url = "$baseUrl/api/admin/users?status=active`&limit=10";
        Method = "GET";
        NeedsAuth = $true;
        ExpectedStatus = 200;
        MissingIndex = "users: status + createdAt";
        Priority = "P1"
    },
    @{
        Name = "Admin - Users By Role";
        Url = "$baseUrl/api/admin/users?role=seller`&limit=10";
        Method = "GET";
        NeedsAuth = $true;
        ExpectedStatus = 200;
        MissingIndex = "users: role + createdAt";
        Priority = "P1"
    },
    @{
        Name = "Admin - Seller Applications";
        Url = "$baseUrl/api/admin/seller-applications?status=pending";
        Method = "GET";
        NeedsAuth = $true;
        ExpectedStatus = 200;
        MissingIndex = "sellerApplications: status + createdAt";
        Priority = "P1"
    },
    @{
        Name = "Admin - Strikes";
        Url = "$baseUrl/api/admin/strikes?isActive=true";
        Method = "GET";
        NeedsAuth = $true;
        ExpectedStatus = 200;
        MissingIndex = "strikes: isActive + createdAt";
        Priority = "P2"
    },
    
    # Health check
    @{
        Name = "Health Check";
        Url = "$baseUrl/health";
        Method = "GET";
        NeedsAuth = $false;
        ExpectedStatus = 200;
        MissingIndex = "N/A";
        Priority = "N/A"
    }
)

# Results tracking
$results = @{
    Pass = @()
    Fail = @()
    NeedsIndex = @()
    NeedsAuth = @()
}

foreach ($test in $tests) {
    Write-Host "`n[$($test.Priority)] Testing: $($test.Name)" -ForegroundColor Yellow
    Write-Host "   URL: $($test.Url)" -ForegroundColor Gray
    
    try {
        $headers = @{}
        if ($test.NeedsAuth -and $adminToken) {
            $headers["Authorization"] = "Bearer $adminToken"
        }
        
        if ($test.NeedsAuth -and -not $adminToken) {
            Write-Host "   ⚠️  Skipped - Needs Authentication Token" -ForegroundColor Yellow
            $results.NeedsAuth += $test
            continue
        }
        
        $response = Invoke-WebRequest -Uri $test.Url -Method $test.Method -Headers $headers -UseBasicParsing -ErrorAction Stop
        $status = $response.StatusCode
        
        if ($status -eq $test.ExpectedStatus) {
            Write-Host "   ✅ PASS - Status: $status" -ForegroundColor Green
            $results.Pass += $test
            
            # Show data count if available
            $content = $response.Content | ConvertFrom-Json
            if ($content.data) {
                $dataKeys = $content.data | Get-Member -MemberType Properties | Select-Object -ExpandProperty Name
                foreach ($key in $dataKeys) {
                    if ($content.data.$key -is [Array]) {
                        Write-Host "   📊 $key count: $($content.data.$key.Count)" -ForegroundColor Gray
                    }
                }
            }
        }
        else {
            Write-Host "   ⚠️  Unexpected Status: $status (expected $($test.ExpectedStatus))" -ForegroundColor Yellow
            $results.Fail += $test
        }
    }
    catch {
        $status = $_.Exception.Response.StatusCode.value__
        $errorMsg = $_.Exception.Message
        
        if ($status -eq 500) {
            Write-Host "   ❌ FAIL - Status: 500 (Likely Missing Index)" -ForegroundColor Red
            Write-Host "   📌 Index Needed: $($test.MissingIndex)" -ForegroundColor Magenta
            $results.NeedsIndex += $test
        }
        elseif ($status -eq 401) {
            Write-Host "   ⚠️  Auth Required - Status: 401" -ForegroundColor Yellow
            $results.NeedsAuth += $test
        }
        elseif ($status -eq 503) {
            Write-Host "   ⏭️  Feature Not Migrated - Status: 503 (Fallback Mode)" -ForegroundColor Cyan
        }
        else {
            Write-Host "   ❌ FAIL - Status: $status" -ForegroundColor Red
            Write-Host "   Error: $errorMsg" -ForegroundColor Red
            $results.Fail += $test
        }
    }
}

# Summary
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "✅ Passed: $($results.Pass.Count)" -ForegroundColor Green
foreach ($test in $results.Pass) {
    Write-Host "   • $($test.Name)" -ForegroundColor Gray
}

Write-Host "`n❌ Failed (Needs Index): $($results.NeedsIndex.Count)" -ForegroundColor Red
foreach ($test in $results.NeedsIndex | Sort-Object Priority) {
    Write-Host "   • [$($test.Priority)] $($test.Name)" -ForegroundColor Red
    Write-Host "     Index: $($test.MissingIndex)" -ForegroundColor Magenta
}

Write-Host "`n⚠️  Needs Authentication: $($results.NeedsAuth.Count)" -ForegroundColor Yellow
foreach ($test in $results.NeedsAuth) {
    Write-Host "   • $($test.Name)" -ForegroundColor Gray
}

Write-Host "`n⚠️  Other Failures: $($results.Fail.Count)" -ForegroundColor Yellow
foreach ($test in $results.Fail) {
    Write-Host "   • $($test.Name)" -ForegroundColor Gray
}

# Next steps
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if ($results.NeedsIndex.Count -gt 0) {
    Write-Host "🔧 Create Missing Indexes:" -ForegroundColor Yellow
    Write-Host "   1. Check Cloud Run logs for exact index URLs:" -ForegroundColor Gray
    Write-Host "      gcloud run services logs read mixillo-backend --limit=50 --region=europe-west1 | Select-String 'create_composite'" -ForegroundColor Cyan
    Write-Host "   2. Click the URLs to create indexes automatically" -ForegroundColor Gray
    Write-Host "   3. Wait 3-5 minutes for indexes to build" -ForegroundColor Gray
    Write-Host "   4. Re-run this test script`n" -ForegroundColor Gray
}

if ($results.NeedsAuth.Count -gt 0) {
    Write-Host "🔑 To Test Authenticated Endpoints:" -ForegroundColor Yellow
    Write-Host "   1. Login to get admin token:" -ForegroundColor Gray
    Write-Host "      `$body = @{ email='admin@mixillo.com'; password='Admin123!' } | ConvertTo-Json" -ForegroundColor Cyan
    Write-Host "      `$response = Invoke-RestMethod -Uri '$baseUrl/api/auth/login' -Method POST -Body `$body -ContentType 'application/json'" -ForegroundColor Cyan
    Write-Host "      `$adminToken = `$response.data.token" -ForegroundColor Cyan
    Write-Host "   2. Update the `$adminToken variable at the top of this script" -ForegroundColor Gray
    Write-Host "   3. Re-run this script`n" -ForegroundColor Gray
}

Write-Host "📚 Full Documentation: FIRESTORE_INDEXES_REQUIRED.md`n" -ForegroundColor Cyan
Write-Host "🌐 Firebase Console: https://console.firebase.google.com/project/mixillo/firestore/indexes" -ForegroundColor Cyan
Write-Host "📊 Admin Dashboard: https://mixillo.web.app`n" -ForegroundColor Cyan
