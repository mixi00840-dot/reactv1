#!/usr/bin/env node
/**
 * FINAL AUDIT REPORT GENERATOR
 * Aggregates all test results into comprehensive report.json
 * Output: workspace/report/report.json
 */

const fs = require('fs');
const path = require('path');

console.log('📋 GENERATING FINAL AUDIT REPORT');
console.log('=====================================\n');

const reportDir = path.join(__dirname, '..', 'workspace', 'report');

// Load all test results
const endpoints = JSON.parse(fs.readFileSync(path.join(reportDir, 'endpoints.json'), 'utf8'));
const dbChecks = JSON.parse(fs.readFileSync(path.join(reportDir, 'db_checks.json'), 'utf8'));
const thirdParty = JSON.parse(fs.readFileSync(path.join(reportDir, 'third_party.json'), 'utf8'));
const realtime = JSON.parse(fs.readFileSync(path.join(reportDir, 'realtime.json'), 'utf8'));
const pages = JSON.parse(fs.readFileSync(path.join(reportDir, 'pages.json'), 'utf8'));
const priorityFixes = JSON.parse(fs.readFileSync(path.join(reportDir, 'priority_fixes.json'), 'utf8'));

console.log('✅ Loaded all test results');
console.log('');

// Generate comprehensive report
const report = {
  meta: {
    generated_at: new Date().toISOString(),
    audit_id: 'AUDIT-20251114-001',
    audit_type: 'full_production_audit',
    duration_minutes: Math.floor((new Date() - new Date('2025-11-14T13:10:00Z')) / 60000),
    auditor: 'GitHub Copilot Automated Audit System',
    environment: 'production'
  },
  
  overall_health: {
    status: 'WARN', // OK, WARN, or FAIL
    pass_rate: 0,
    critical_failures: priorityFixes.summary.p0_count,
    high_priority_issues: priorityFixes.summary.p1_count,
    medium_priority_issues: priorityFixes.summary.p2_count,
    summary: 'System partially functional with 3 critical issues requiring immediate attention'
  },
  
  infrastructure: {
    api_base: 'https://mixillo-backend-52242135857.europe-west1.run.app/api',
    admin_dashboard: 'https://admin-dashboard-mixillo.vercel.app',
    database: 'mongodb+srv://mixillo.tt9e6by.mongodb.net/mixillo',
    deployment: 'Google Cloud Run (europe-west1)',
    cdn: 'Cloudinary (dlg6dnlj4)'
  },
  
  test_results: {
    api_endpoints: {
      total_tested: endpoints.total_endpoints,
      passed: endpoints.passed,
      warnings: endpoints.warnings,
      failed: endpoints.failed,
      pass_rate: ((endpoints.passed / endpoints.total_endpoints) * 100).toFixed(1) + '%',
      avg_latency_ms: Math.round(
        endpoints.endpoints.reduce((sum, e) => sum + (e.latency_ms || 0), 0) / endpoints.endpoints.length
      ),
      details: endpoints.endpoints,
      critical_failures: endpoints.endpoints.filter(e => e.critical && e.status_code >= 500)
    },
    
    admin_pages: {
      total_tested: pages.total_pages,
      passed: pages.passed,
      warnings: pages.warnings,
      failed: pages.failed,
      pass_rate: ((pages.passed / pages.total_pages) * 100).toFixed(1) + '%',
      overall_status: pages.overall_status,
      details: pages.pages
    },
    
    database: {
      total_collections_expected: dbChecks.summary.total_collections_expected,
      total_collections_found: dbChecks.summary.total_collections_found,
      total_documents: dbChecks.summary.total_documents,
      missing_collections: dbChecks.summary.missing_collections,
      collections_needing_indexes: dbChecks.collections.filter(c => c.missing_indexes && c.missing_indexes.length > 0).length,
      integrity_issues: dbChecks.summary.collections_with_issues.length,
      details: dbChecks.collections
    },
    
    third_party_integrations: {
      cloudinary: thirdParty.cloudinary,
      agora: thirdParty.agora,
      zegocloud: thirdParty.zegocloud,
      socket_io: realtime.socket_io
    }
  },
  
  priority_fixes: priorityFixes,
  
  recommendations: {
    immediate_actions: [
      {
        priority: 'P0',
        action: 'Fix Admin Users Stats 500 Error',
        reason: 'Blocks dashboard functionality',
        estimated_time: '30 minutes'
      },
      {
        priority: 'P0',
        action: 'Register Database Monitoring Routes',
        reason: 'Cannot monitor production database health',
        estimated_time: '15 minutes'
      },
      {
        priority: 'P0',
        action: 'Create Missing Database Collections',
        reason: 'Prevents feature failures when accessing non-existent collections',
        estimated_time: '45 minutes'
      }
    ],
    
    short_term: [
      {
        priority: 'P1',
        action: 'Add Admin Stats Route Alias',
        estimated_time: '10 minutes'
      },
      {
        priority: 'P1',
        action: 'Register Missing Admin Management Endpoints',
        estimated_time: '60 minutes'
      },
      {
        priority: 'P1',
        action: 'Add Performance Indexes to 6 Collections',
        estimated_time: '20 minutes'
      }
    ],
    
    long_term: [
      {
        priority: 'P2',
        action: 'Configure Agora/ZegoCloud Credentials',
        estimated_time: '15 minutes'
      },
      {
        priority: 'P2',
        action: 'Fix Auth Refresh Token Endpoint',
        estimated_time: '20 minutes'
      },
      {
        priority: 'P2',
        action: 'Populate Production Data',
        estimated_time: '30 minutes'
      }
    ]
  },
  
  artifacts: {
    reports: [
      'workspace/report/endpoints.json',
      'workspace/report/db_checks.json',
      'workspace/report/third_party.json',
      'workspace/report/realtime.json',
      'workspace/report/pages.json',
      'workspace/report/priority_fixes.json'
    ],
    screenshots: 'workspace/report/artifacts/screenshots/',
    backup_reference: 'workspace/report/artifacts/backup_reference_*.json',
    fixes: 'workspace/P0_FIXES/',
    logs: 'workspace/report/progress.log'
  },
  
  next_steps: [
    '1. Review P0 critical issues and assign to developers',
    '2. Apply P0 fixes using patches in workspace/P0_FIXES/',
    '3. Test fixes in staging environment before production deployment',
    '4. Deploy fixes to production with rollback plan ready',
    '5. Monitor logs after deployment for any regressions',
    '6. Schedule P1/P2 fixes for next sprint',
    '7. Re-run audit after fixes to validate improvements'
  ]
};

// Calculate overall pass rate
const totalTests = endpoints.total_endpoints + pages.total_pages;
const totalPassed = endpoints.passed + pages.passed;
report.overall_health.pass_rate = ((totalPassed / totalTests) * 100).toFixed(1) + '%';

// Determine overall status
if (report.overall_health.critical_failures > 0 || parseFloat(report.overall_health.pass_rate) < 50) {
  report.overall_health.status = 'FAIL';
} else if (parseFloat(report.overall_health.pass_rate) < 90) {
  report.overall_health.status = 'WARN';
} else {
  report.overall_health.status = 'OK';
}

// Save report
const outputPath = path.join(reportDir, 'report.json');
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

console.log('=====================================');
console.log('📊 AUDIT REPORT SUMMARY');
console.log('=====================================');
console.log(`Overall Status: ${report.overall_health.status}`);
console.log(`Pass Rate: ${report.overall_health.pass_rate}`);
console.log(`Critical Issues: ${report.overall_health.critical_failures}`);
console.log(`High Priority: ${report.overall_health.high_priority_issues}`);
console.log(`Medium Priority: ${report.overall_health.medium_priority_issues}`);
console.log('');
console.log('API Endpoints:');
console.log(`  ✅ Passed: ${endpoints.passed}/${endpoints.total_endpoints}`);
console.log(`  ⚠️  Warnings: ${endpoints.warnings}`);
console.log(`  ❌ Failed: ${endpoints.failed}`);
console.log('');
console.log('Admin Pages:');
console.log(`  ✅ Passed: ${pages.passed}/${pages.total_pages}`);
console.log(`  ⚠️  Warnings: ${pages.warnings}`);
console.log(`  ❌ Failed: ${pages.failed}`);
console.log('');
console.log('Database:');
console.log(`  Collections: ${dbChecks.summary.total_collections_found}/${dbChecks.summary.total_collections_expected}`);
console.log(`  Documents: ${dbChecks.summary.total_documents}`);
console.log(`  Missing: ${dbChecks.summary.missing_collections.length} collections`);
console.log('');
console.log('Third-Party:');
console.log(`  Cloudinary: ${thirdParty.cloudinary.status}`);
console.log(`  Socket.IO: ${realtime.socket_io.status}`);
console.log(`  Agora: ${thirdParty.agora.status}`);
console.log(`  ZegoCloud: ${thirdParty.zegocloud.status}`);
console.log('');
console.log(`💾 Report saved to: ${outputPath}`);
console.log('=====================================\n');
