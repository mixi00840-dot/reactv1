#!/usr/bin/env node
/**
 * ISSUE ANALYSIS & P0 PRIORITIZATION
 * Aggregates all test results and classifies issues by severity
 * Output: workspace/report/priority_fixes.json
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 ANALYZING TEST RESULTS & PRIORITIZING FIXES');
console.log('=====================================\n');

// Load all test results
const reportDir = path.join(__dirname, '..', 'workspace', 'report');

const endpoints = JSON.parse(fs.readFileSync(path.join(reportDir, 'endpoints.json'), 'utf8'));
const dbChecks = JSON.parse(fs.readFileSync(path.join(reportDir, 'db_checks.json'), 'utf8'));
const thirdParty = JSON.parse(fs.readFileSync(path.join(reportDir, 'third_party.json'), 'utf8'));
const realtime = JSON.parse(fs.readFileSync(path.join(reportDir, 'realtime.json'), 'utf8'));
const pages = JSON.parse(fs.readFileSync(path.join(reportDir, 'pages.json'), 'utf8'));

const issues = {
  generated_at: new Date().toISOString(),
  p0_critical: [],
  p1_high: [],
  p2_medium: [],
  summary: {
    total_issues: 0,
    p0_count: 0,
    p1_count: 0,
    p2_count: 0
  }
};

console.log('📊 Loading test results...');
console.log(`   API Endpoints: ${endpoints.endpoints.length} tested`);
console.log(`   Database: ${dbChecks.summary.total_collections_found} collections analyzed`);
console.log(`   Pages: ${pages.total_pages} pages checked\n`);

// P0 CRITICAL ISSUES (Blocks admin functionality, 5xx errors on critical endpoints)
console.log('🚨 P0 CRITICAL ISSUES:');
console.log('=====================================');

// P0-1: Admin Users Stats 500 Error
if (endpoints.endpoints.some(r => r.path === '/admin/users/stats' && r.status_code === 500)) {
  const issue = {
    id: 'P0-1',
    title: 'Admin Users Stats API Returns 500 Error',
    severity: 'P0',
    category: 'API',
    status: 'open',
    description: 'GET /admin/users/stats returns 500 Internal Server Error after multiple retries',
    impact: 'Blocks admin dashboard user statistics display',
    reproduction_steps: [
      'Navigate to admin dashboard',
      'View user statistics section',
      'API call fails with 500 error'
    ],
    suggested_fix: {
      approach: 'Debug aggregation pipeline in getUsersStats controller',
      files_to_modify: ['backend/src/controllers/adminController.js'],
      estimated_time: '30 minutes',
      risk_level: 'low'
    },
    rollback_plan: 'Revert controller changes, fallback to basic user count'
  };
  issues.p0_critical.push(issue);
  console.log(`✓ ${issue.id}: ${issue.title}`);
}

// P0-2: Database Monitoring Endpoints Missing
const dbEndpointsMissing = endpoints.endpoints.filter(r => 
  r.path.includes('/admin/database/') && r.status_code === 404
);
if (dbEndpointsMissing.length > 0) {
  const issue = {
    id: 'P0-2',
    title: 'Database Monitoring Endpoints Not Registered',
    severity: 'P0',
    category: 'API',
    status: 'open',
    description: `${dbEndpointsMissing.length} database admin endpoints return 404`,
    impact: 'Cannot monitor production database health from admin panel',
    affected_endpoints: dbEndpointsMissing.map(r => r.path),
    reproduction_steps: [
      'Access /admin/database/stats, /admin/database/collections, /admin/database/performance',
      'All return 404 Not Found'
    ],
    suggested_fix: {
      approach: 'Register database routes in app.js: app.use(\'/api/admin/database\', databaseRoutes)',
      files_to_modify: ['backend/src/app.js', 'backend/src/routes/database.js'],
      estimated_time: '15 minutes',
      risk_level: 'low',
      code_patch: 'workspace/P0_FIXES/P0-2-register-database-routes.patch'
    },
    rollback_plan: 'Comment out route registration line in app.js'
  };
  issues.p0_critical.push(issue);
  console.log(`✓ ${issue.id}: ${issue.title}`);
}

// P0-3: Missing Collections in Database
if (dbChecks.summary.missing_collections.length > 0) {
  const issue = {
    id: 'P0-3',
    title: `${dbChecks.summary.missing_collections.length} Expected Database Collections Missing`,
    severity: 'P0',
    category: 'Database',
    status: 'open',
    description: '31 collections expected by models but not found in database',
    impact: 'Features may fail when trying to access non-existent collections',
    missing_collections: dbChecks.summary.missing_collections.slice(0, 10), // First 10
    reproduction_steps: [
      'Check database for expected collections',
      'Compare against model definitions'
    ],
    suggested_fix: {
      approach: 'Run database migration script to create missing collections with default indexes',
      files_to_modify: ['backend/src/scripts/create-missing-collections.js'],
      estimated_time: '45 minutes',
      risk_level: 'medium'
    },
    rollback_plan: 'Drop newly created collections if issues occur'
  };
  issues.p0_critical.push(issue);
  console.log(`✓ ${issue.id}: ${issue.title}`);
}

issues.summary.p0_count = issues.p0_critical.length;
console.log(`\nTotal P0 Issues: ${issues.summary.p0_count}\n`);

// P1 HIGH PRIORITY ISSUES (Degrades UX, 4xx on important endpoints)
console.log('⚠️  P1 HIGH PRIORITY ISSUES:');
console.log('=====================================');

// P1-1: Admin Stats Endpoint Missing (but dashboard works)
if (endpoints.endpoints.some(r => r.path === '/admin/stats' && r.status_code === 404)) {
  const issue = {
    id: 'P1-1',
    title: 'Admin Stats Endpoint Returns 404',
    severity: 'P1',
    category: 'API',
    status: 'open',
    description: '/admin/stats returns 404 but /admin/dashboard works',
    impact: 'Some UI components may fail if using /admin/stats instead of /admin/dashboard',
    reproduction_steps: ['GET /api/admin/stats', 'Receives 404'],
    suggested_fix: {
      approach: 'Add route alias: router.get(\'/stats\', getDashboard) in admin routes',
      files_to_modify: ['backend/src/routes/admin.js'],
      estimated_time: '10 minutes',
      risk_level: 'low',
      code_patch: 'workspace/P0_FIXES/P1-1-admin-stats-alias.patch'
    },
    rollback_plan: 'Remove alias line'
  };
  issues.p1_high.push(issue);
  console.log(`✓ ${issue.id}: ${issue.title}`);
}

// P1-2: Stream Providers Endpoint Missing
if (endpoints.endpoints.some(r => r.path === '/admin/stream-providers' && r.status_code === 404)) {
  const issue = {
    id: 'P1-2',
    title: 'Stream Providers Admin Endpoint Missing',
    severity: 'P1',
    category: 'API',
    status: 'open',
    description: '/admin/stream-providers returns 404',
    impact: 'Cannot manage Agora/ZegoCloud configuration from admin panel',
    reproduction_steps: ['Navigate to stream providers page', 'API call fails'],
    suggested_fix: {
      approach: 'Create stream providers admin route and controller',
      files_to_modify: ['backend/src/routes/admin.js', 'backend/src/controllers/streamProviderController.js'],
      estimated_time: '30 minutes',
      risk_level: 'low'
    },
    rollback_plan: 'Remove route from admin.js'
  };
  issues.p1_high.push(issue);
  console.log(`✓ ${issue.id}: ${issue.title}`);
}

// P1-3: Missing Index Performance Optimization
const collectionsNeedingIndexes = dbChecks.collections.filter(c => c.missing_indexes && c.missing_indexes.length > 0);
if (collectionsNeedingIndexes.length > 0) {
  const issue = {
    id: 'P1-3',
    title: `${collectionsNeedingIndexes.length} Collections Need Performance Indexes`,
    severity: 'P1',
    category: 'Database',
    status: 'open',
    description: 'Collections missing createdAt/updatedAt indexes for sorting',
    impact: 'Slow query performance on date-sorted lists',
    affected_collections: collectionsNeedingIndexes.map(c => c.name),
    reproduction_steps: ['Query large datasets sorted by date', 'Performance degrades'],
    suggested_fix: {
      approach: 'Run db.collection.createIndex({ createdAt: -1, updatedAt: -1 }) for each collection',
      files_to_modify: ['backend/src/scripts/add-performance-indexes.js'],
      estimated_time: '20 minutes',
      risk_level: 'low'
    },
    rollback_plan: 'Drop indexes: db.collection.dropIndex()'
  };
  issues.p1_high.push(issue);
  console.log(`✓ ${issue.id}: ${issue.title}`);
}

// P1-4: Multiple Admin Endpoints Missing (Content, Products, Orders, etc.)
const adminEndpointsMissing = endpoints.endpoints.filter(r => 
  r.path.startsWith('/admin/') && 
  r.status_code === 404 &&
  !r.path.includes('/database/') && // Already counted in P0-2
  r.path !== '/admin/stats' && // Already counted in P1-1
  r.path !== '/admin/stream-providers' // Already counted in P1-2
);
if (adminEndpointsMissing.length > 0) {
  const issue = {
    id: 'P1-4',
    title: `${adminEndpointsMissing.length} Admin Management Endpoints Missing`,
    severity: 'P1',
    category: 'API',
    status: 'open',
    description: 'Admin routes for content, products, stores, orders return 404',
    impact: 'Admin cannot manage resources from centralized /admin/* routes',
    affected_endpoints: adminEndpointsMissing.map(r => r.path),
    reproduction_steps: ['Access /admin/content, /admin/products, etc.', 'All return 404'],
    suggested_fix: {
      approach: 'Register admin sub-routes OR update frontend to use correct paths',
      files_to_modify: ['backend/src/routes/admin.js OR admin-dashboard/src/*'],
      estimated_time: '60 minutes',
      risk_level: 'medium'
    },
    rollback_plan: 'Revert route changes'
  };
  issues.p1_high.push(issue);
  console.log(`✓ ${issue.id}: ${issue.title}`);
}

issues.summary.p1_count = issues.p1_high.length;
console.log(`\nTotal P1 Issues: ${issues.summary.p1_count}\n`);

// P2 MEDIUM PRIORITY ISSUES (Minor issues, non-critical endpoints)
console.log('ℹ️  P2 MEDIUM PRIORITY ISSUES:');
console.log('=====================================');

// P2-1: Agora/ZegoCloud Credentials Missing
if (thirdParty.agora.status === 'WARN' || thirdParty.zegocloud.status === 'WARN') {
  const issue = {
    id: 'P2-1',
    title: 'Streaming Provider Credentials Not Configured',
    severity: 'P2',
    category: 'Configuration',
    status: 'open',
    description: 'Agora and ZegoCloud endpoints return 404 or credentials missing',
    impact: 'Live streaming features may be unavailable',
    reproduction_steps: ['Start live stream', 'Token generation may fail'],
    suggested_fix: {
      approach: 'Add AGORA_APP_ID, AGORA_APP_CERTIFICATE, ZEGO_APP_ID to .env',
      files_to_modify: ['backend/.env'],
      estimated_time: '15 minutes',
      risk_level: 'low'
    },
    rollback_plan: 'Remove credentials from .env'
  };
  issues.p2_medium.push(issue);
  console.log(`✓ ${issue.id}: ${issue.title}`);
}

// P2-2: Auth Refresh Token Endpoint Broken
if (endpoints.endpoints.some(r => r.path === '/auth/refresh' && r.status_code === 401)) {
  const issue = {
    id: 'P2-2',
    title: 'Auth Refresh Token Endpoint Returns 401',
    severity: 'P2',
    category: 'API',
    status: 'open',
    description: '/auth/refresh returns 401 (may need refresh token in body)',
    impact: 'Token refresh may not work, users forced to re-login',
    reproduction_steps: ['POST /api/auth/refresh', 'Returns 401 without refresh token'],
    suggested_fix: {
      approach: 'Update auth controller to accept refresh token in body OR document required format',
      files_to_modify: ['backend/src/controllers/authController.js', 'docs/API.md'],
      estimated_time: '20 minutes',
      risk_level: 'low'
    },
    rollback_plan: 'Revert controller changes'
  };
  issues.p2_medium.push(issue);
  console.log(`✓ ${issue.id}: ${issue.title}`);
}

// P2-3: Low Production Data Volume
if (dbChecks.summary.total_documents < 100) {
  const issue = {
    id: 'P2-3',
    title: 'Very Low Production Data Volume',
    severity: 'P2',
    category: 'Data',
    status: 'open',
    description: `Only ${dbChecks.summary.total_documents} documents in production database`,
    impact: 'May indicate new environment or minimal usage; tests may be incomplete',
    reproduction_steps: ['Check database document counts', 'Only 60 total documents'],
    suggested_fix: {
      approach: 'Run seed script to populate test data OR verify this is expected for new production',
      files_to_modify: ['backend/seed-database.js'],
      estimated_time: '30 minutes',
      risk_level: 'low'
    },
    rollback_plan: 'Clean up test data: db.collection.deleteMany({ __test: true })'
  };
  issues.p2_medium.push(issue);
  console.log(`✓ ${issue.id}: ${issue.title}`);
}

issues.summary.p2_count = issues.p2_medium.length;
console.log(`\nTotal P2 Issues: ${issues.summary.p2_count}\n`);

// Calculate totals
issues.summary.total_issues = issues.p0_critical.length + issues.p1_high.length + issues.p2_medium.length;

console.log('=====================================');
console.log('📊 ISSUE PRIORITIZATION SUMMARY');
console.log('=====================================');
console.log(`🚨 P0 Critical: ${issues.summary.p0_count}`);
console.log(`⚠️  P1 High: ${issues.summary.p1_count}`);
console.log(`ℹ️  P2 Medium: ${issues.summary.p2_count}`);
console.log(`Total Issues: ${issues.summary.total_issues}\n`);

// Save results
const outputPath = path.join(reportDir, 'priority_fixes.json');
fs.writeFileSync(outputPath, JSON.stringify(issues, null, 2));

console.log(`💾 Priority fixes saved to: ${outputPath}`);
console.log('=====================================\n');
