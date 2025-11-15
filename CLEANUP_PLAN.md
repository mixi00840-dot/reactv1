# Legacy Admin Dashboard Cleanup Plan

## Current State

**Legacy Admin:** `admin-dashboard/` (React CRA, 133K+ files, 1.14 GB)
- Status: Deprecated, replaced by `admin-app/` (Next.js 14)
- Issues: Broken tests, outdated deps, Vercel deployment issues
- Contains: Old CRA setup, Cypress tests (failing), build artifacts

**New Admin:** `admin-app/` (Next.js 14)
- Status: Active, production-ready
- Features: 20+ pages, DataTables, moderation actions, analytics, e2e tests
- Clean structure with proper TypeScript and modern stack

## Cleanup Strategy

### Phase 1: Backup (Safety First)
```powershell
# Create backup before deletion
Copy-Item -Recurse "admin-dashboard" "backups/admin-dashboard-legacy-$(Get-Date -Format 'yyyy-MM-dd')"
```

### Phase 2: Remove Legacy Dashboard
```powershell
# Remove the entire legacy admin-dashboard folder
Remove-Item -Recurse -Force "admin-dashboard"
```

### Phase 3: Clean Root-Level Legacy Files
```powershell
# Remove old audit/testing reports for legacy dashboard
Remove-Item -Force "ADMIN_DASHBOARD_AUDIT_REPORT.md"
Remove-Item -Force "ADMIN_DASHBOARD_FIXES_SUMMARY.md"
Remove-Item -Force "ADMIN_DASHBOARD_TESTING_PLAN.md"
Remove-Item -Force "ADMIN_PAGES_VERIFICATION_STATUS.md"
Remove-Item -Force "AUDIT_FIXES_COMPLETE.md"
Remove-Item -Force "CLEANUP_COMPLETE_REPORT.md"
Remove-Item -Force "DEPLOYMENT_SUMMARY_UI_FIXES.md"
Remove-Item -Force "FRONTEND_FIX_COMPLETE.md"
Remove-Item -Force "FULL_QA_AUDIT_FINAL_REPORT.md"
Remove-Item -Force "FULL_QA_AUDIT_REPORT.md"
Remove-Item -Force "PRE_DEPLOYMENT_COMPREHENSIVE_AUDIT.md"
Remove-Item -Force "PRODUCTION_AUDIT_FINAL_REPORT.md"
Remove-Item -Force "TESTING_INFRASTRUCTURE_COMPLETE.md"
```

### Phase 4: Update Root README
Update `README.md` to reference only `admin-app/` as the admin dashboard.

### Phase 5: Update GitHub/Vercel Configs
- Remove any `admin-dashboard` references from `.github/` workflows
- Update deployment configs to use `admin-app/`

## What to Keep

**Keep these directories:**
- `admin-app/` - New Next.js admin dashboard ✅
- `backend/` - API server ✅
- `docs/` - Documentation ✅
- `backups/` - Backups and archives ✅
- `scripts/` - Utility scripts ✅
- `tools/` - Helper tools ✅

**Keep these files:**
- `README.md` - Main project docs ✅
- `QUICK_START.md` - Setup guide ✅
- `package.json` - Root workspace config ✅
- `.gitignore`, `.env.example` - Config files ✅

## Disk Space Savings

Removing `admin-dashboard/` will free up **~1.14 GB** of disk space.

## Execution

Run from project root:

```powershell
# Step 1: Backup
New-Item -ItemType Directory -Force -Path "backups"
Copy-Item -Recurse "admin-dashboard" "backups/admin-dashboard-legacy-$(Get-Date -Format 'yyyyMMdd')"

# Step 2: Remove legacy dashboard
Remove-Item -Recurse -Force "admin-dashboard"

# Step 3: Clean old reports
$legacyFiles = @(
  "ADMIN_DASHBOARD_AUDIT_REPORT.md",
  "ADMIN_DASHBOARD_FIXES_SUMMARY.md",
  "ADMIN_DASHBOARD_TESTING_PLAN.md",
  "ADMIN_PAGES_VERIFICATION_STATUS.md",
  "AUDIT_FIXES_COMPLETE.md",
  "CLEANUP_COMPLETE_REPORT.md",
  "DEPLOYMENT_SUMMARY_UI_FIXES.md",
  "FRONTEND_FIX_COMPLETE.md",
  "FULL_QA_AUDIT_FINAL_REPORT.md",
  "FULL_QA_AUDIT_REPORT.md",
  "PRE_DEPLOYMENT_COMPREHENSIVE_AUDIT.md",
  "PRODUCTION_AUDIT_FINAL_REPORT.md",
  "TESTING_INFRASTRUCTURE_COMPLETE.md"
)

foreach ($file in $legacyFiles) {
  if (Test-Path $file) {
    Remove-Item -Force $file
    Write-Host "Removed: $file"
  }
}

Write-Host "Cleanup complete! Freed ~1.14 GB"
```

## Verification

After cleanup, verify:
```powershell
# Check admin-dashboard is gone
Test-Path "admin-dashboard" # Should return False

# Verify admin-app exists
Test-Path "admin-app" # Should return True

# Check backup was created
Get-ChildItem "backups" | Where-Object { $_.Name -like "admin-dashboard-legacy-*" }
```

## Rollback Plan

If needed, restore from backup:
```powershell
Copy-Item -Recurse "backups/admin-dashboard-legacy-YYYYMMDD" "admin-dashboard"
```

## Post-Cleanup Tasks

1. Update root `README.md` to reference `admin-app/`
2. Update deployment workflows in `.github/`
3. Remove any Vercel configs for old dashboard
4. Update QUICK_START.md with new admin setup
5. Git commit the cleanup
