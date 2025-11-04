# Cleanup duplicate route files
# This script removes -firestore.js and -mongodb-backup.js files
# The main route files (e.g., products.js) are already using Firestore controllers

Write-Host "`n🧹 Cleaning up duplicate route files..." -ForegroundColor Cyan

$filesToDelete = @(
    # -firestore.js duplicates (replaced by main files)
    "src/routes/products-firestore.js",
    "src/routes/stores-firestore.js",
    "src/routes/orders-firestore.js",
    "src/routes/cms-firestore.js",
    "src/routes/banners-firestore.js",
    "src/routes/settings-firestore.js",
    
    # -mongodb-backup.js files (old MongoDB versions, no longer needed)
    "src/routes/products-mongodb-backup.js",
    "src/routes/stores-mongodb-backup.js",
    "src/routes/orders-mongodb-backup.js",
    "src/routes/cms-mongodb-backup.js",
    "src/routes/banners-mongodb-backup.js",
    "src/routes/settings-mongodb-backup.js",
    "src/routes/users-mongodb-backup.js",
    "src/routes/sellers-mongodb-backup.js",
    "src/routes/admin-mongodb-backup.js"
)

$deleted = 0
$notFound = 0

foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "✅ Deleted: $file" -ForegroundColor Green
        $deleted++
    } else {
        Write-Host "⚠️  Not found: $file" -ForegroundColor Yellow
        $notFound++
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "   Deleted: $deleted files" -ForegroundColor Green
Write-Host "   Not found: $notFound files" -ForegroundColor Yellow

Write-Host "`n✅ Cleanup complete!" -ForegroundColor Green
Write-Host "`n📝 Active route files using Firestore:" -ForegroundColor Cyan
Write-Host "   - auth.js" -ForegroundColor White
Write-Host "   - users.js" -ForegroundColor White
Write-Host "   - sellers.js" -ForegroundColor White
Write-Host "   - admin.js" -ForegroundColor White
Write-Host "   - products.js ✨" -ForegroundColor White
Write-Host "   - stores.js ✨" -ForegroundColor White
Write-Host "   - orders.js ✨" -ForegroundColor White
Write-Host "   - cms.js ✨" -ForegroundColor White
Write-Host "   - banners.js ✨" -ForegroundColor White
Write-Host "   - settings.js ✨" -ForegroundColor White
Write-Host "`n   (✨ = Phase 2 migration)" -ForegroundColor Gray
