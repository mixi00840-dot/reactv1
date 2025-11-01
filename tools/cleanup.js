#!/usr/bin/env node
/*
  Repo cleanup utility
  - Removes legacy test scripts and generated test reports
  - Optionally removes nested duplicate project (backend/backend)
  - Optionally removes built artifacts (admin-dashboard/build)

  Usage:
    node tools/cleanup.js --apply            # actually delete
    node tools/cleanup.js                    # dry run, just list

  Safe defaults:
    - Deletes small files by default (test reports, legacy test scripts)
    - Also deletes duplicate nested backend/backend and admin-dashboard/build
*/

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const apply = process.argv.includes('--apply');

const filesToDelete = [
  'TEST_REPORT.json',
  path.join('backend', 'TEST_REPORT.json'),
  path.join('backend', 'test-report.json'),
  path.join('backend', 'test-report-all-sections.json'),
  // Legacy test harnesses (not referenced by npm scripts)
  path.join('backend', 'test-integration.js'),
  path.join('backend', 'test-api-comprehensive.js'),
  path.join('backend', 'test-api-complete-all-sections.js'),
  path.join('backend', 'test-admin.js'),
  // Redundant root-level auth/API tests (prefer live smoke tests retained)
  'test-auth-live.js',
  'test-live-api.js',
  'test-user-login.js'
];

const dirsToDelete = [
  path.join('backend', 'backend'), // duplicate nested project
  path.join('admin-dashboard', 'build') // build artifact
];

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function rmFile(p) {
  try { fs.rmSync(p, { force: true }); return true; } catch { return false; }
}

function rmDir(p) {
  try { fs.rmSync(p, { recursive: true, force: true }); return true; } catch { return false; }
}

function pretty(p) { return p.replace(repoRoot + path.sep, ''); }

function main() {
  const toDeleteFiles = filesToDelete
    .map(rel => path.join(repoRoot, rel))
    .filter(p => exists(p));

  const toDeleteDirs = dirsToDelete
    .map(rel => path.join(repoRoot, rel))
    .filter(p => exists(p));

  if (!toDeleteFiles.length && !toDeleteDirs.length) {
    console.log('Nothing to delete. Repository already clean.');
    return;
  }

  console.log('Cleanup plan:');
  toDeleteFiles.forEach(p => console.log('  FILE  -', pretty(p)));
  toDeleteDirs.forEach(p => console.log('  DIR   -', pretty(p)));

  if (!apply) {
    console.log('\nDry run only. Re-run with --apply to perform deletion.');
    process.exit(0);
  }

  let deleted = 0;
  for (const p of toDeleteFiles) {
    if (rmFile(p)) { console.log('Deleted file   ', pretty(p)); deleted++; }
  }
  for (const p of toDeleteDirs) {
    if (rmDir(p)) { console.log('Deleted dir    ', pretty(p)); deleted++; }
  }

  console.log(`\nCleanup complete. Items removed: ${deleted}`);
}

main();
