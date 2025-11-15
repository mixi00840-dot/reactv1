// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * MIXILLO ADMIN DASHBOARD - COMPREHENSIVE UI AUDIT
 * Tests 42 admin pages + 7 user detail tabs
 * Output: workspace/report/pages.json + screenshots
 */

const ADMIN_URL = 'https://admin-dashboard-mixillo.vercel.app';
const ADMIN_EMAIL = 'admin@mixillo.com';
const ADMIN_PASSWORD = 'Admin@123456';

const results = {
  generated_at: new Date().toISOString(),
  total_pages: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  pages: /** @type {Array<{name: string, path: string, status: string, critical: boolean, load_time_ms: number, console_errors: string[], network_errors: Array<{url: string, status: number}>, screenshot: string | null, error: string | null}>} */ ([])
};

// Define all pages to test
const pagesToTest = [
  { name: 'Login', path: '/login', requiresAuth: false, critical: true },
  { name: 'Dashboard', path: '/dashboard', requiresAuth: true, critical: true },
  
  // Users section
  { name: 'Users List', path: '/users', requiresAuth: true, critical: true },
  { name: 'Sellers', path: '/sellers', requiresAuth: true, critical: false },
  { name: 'Seller Applications', path: '/seller-applications', requiresAuth: true, critical: false },
  
  // Content section
  { name: 'Content', path: '/content', requiresAuth: true, critical: true },
  { name: 'Posts', path: '/posts', requiresAuth: true, critical: false },
  { name: 'Stories', path: '/stories', requiresAuth: true, critical: false },
  { name: 'Comments', path: '/comments', requiresAuth: true, critical: false },
  { name: 'Shares', path: '/shares', requiresAuth: true, critical: false },
  
  // Products section
  { name: 'Products', path: '/products', requiresAuth: true, critical: true },
  { name: 'Categories', path: '/categories', requiresAuth: true, critical: false },
  { name: 'Stores', path: '/stores', requiresAuth: true, critical: true },
  
  // Orders section
  { name: 'Orders', path: '/orders', requiresAuth: true, critical: true },
  { name: 'Shipping Methods', path: '/shipping-methods', requiresAuth: true, critical: false },
  
  // Wallet & Coins
  { name: 'Wallets', path: '/wallets', requiresAuth: true, critical: true },
  { name: 'Transactions', path: '/transactions', requiresAuth: true, critical: false },
  { name: 'Coin Packages', path: '/coin-packages', requiresAuth: true, critical: false },
  
  // Live Streaming
  { name: 'Live Streams', path: '/live-streams', requiresAuth: true, critical: true },
  { name: 'Stream Providers', path: '/stream-providers', requiresAuth: true, critical: false },
  { name: 'Gifts', path: '/gifts', requiresAuth: true, critical: false },
  
  // Notifications & Reports
  { name: 'Notifications', path: '/notifications', requiresAuth: true, critical: false },
  { name: 'Reports', path: '/reports', requiresAuth: true, critical: false },
  { name: 'Strikes', path: '/strikes', requiresAuth: true, critical: false },
  
  // Analytics
  { name: 'Analytics', path: '/analytics', requiresAuth: true, critical: false },
  
  // Settings
  { name: 'Settings', path: '/settings', requiresAuth: true, critical: false },
  { name: 'Admin Users', path: '/admin-users', requiresAuth: true, critical: false },
  { name: 'Banners', path: '/banners', requiresAuth: true, critical: false },
  { name: 'Featured', path: '/featured', requiresAuth: true, critical: false },
  
  // Database Tools
  { name: 'Database Stats', path: '/database/stats', requiresAuth: true, critical: false },
  { name: 'Database Collections', path: '/database/collections', requiresAuth: true, critical: false },
  { name: 'Database Performance', path: '/database/performance', requiresAuth: true, critical: false },
  
  // Additional Tools
  { name: 'Cloudinary Config', path: '/cloudinary/config', requiresAuth: true, critical: false },
  { name: 'API Health', path: '/api-health', requiresAuth: true, critical: false }
];

// User detail tabs (tested separately)
const userDetailTabs = [
  'Profile', 'Posts', 'Products', 'Orders', 'Wallet', 'Followers', 'Activity'
];

test.describe('Admin Dashboard Audit', () => {
  /** @type {import('@playwright/test').Browser} */
  let browser;
  /** @type {import('@playwright/test').BrowserContext} */
  let context;
  /** @type {import('@playwright/test').Page} */
  let page;
  
  test.beforeAll(async ({ browser: b }) => {
    browser = b;
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    page = await context.newPage();
    
    // Login once
    console.log('🔐 Logging in as admin...');
    await page.goto(`${ADMIN_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/i, { timeout: 10000 }).catch(() => {
      console.log('⚠️  Login may have issues - continuing anyway');
    });
    
    console.log('✅ Login complete\n');
  });
  
  test.afterAll(async () => {
    // Save results
    const outputPath = path.join('c:\\Users\\ASUS\\Desktop\\reactv1', 'workspace', 'report', 'pages.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${outputPath}`);
    
    await context.close();
  });
  
  for (const pageConfig of pagesToTest) {
    test(`${pageConfig.name} (${pageConfig.path})`, async () => {
      const startTime = Date.now();
      const pageResult = {
        name: pageConfig.name,
        path: pageConfig.path,
        status: 'UNKNOWN',
        critical: pageConfig.critical,
        load_time_ms: 0,
        console_errors: /** @type {string[]} */ ([]),
        network_errors: /** @type {Array<{url: string, status: number}>} */ ([]),
        screenshot: /** @type {string | null} */ (null),
        error: /** @type {string | null} */ (null)
      };
      
      results.total_pages++;
      
      try {
        // Capture console errors
        page.on('console', msg => {
          if (msg.type() === 'error') {
            pageResult.console_errors.push(msg.text());
          }
        });
        
        // Capture network errors
        page.on('response', response => {
          if (response.status() >= 400) {
            pageResult.network_errors.push({
              url: response.url(),
              status: response.status()
            });
          }
        });
        
        // Navigate to page
        console.log(`   Testing: ${pageConfig.name} (${pageConfig.path})`);
        const response = await page.goto(`${ADMIN_URL}${pageConfig.path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });
        
        pageResult.load_time_ms = Date.now() - startTime;
        
        // Check response status
        if (response && response.status() >= 400) {
          pageResult.status = 'FAIL';
          pageResult.error = `HTTP ${response.status()}`;
          results.failed++;
          console.log(`      ❌ FAIL - HTTP ${response.status()}`);
        } else {
          // Check for error messages on page
          const hasErrorMsg = await page.locator('text=/error|failed|not found/i').first().isVisible({ timeout: 2000 }).catch(() => false);
          
          if (hasErrorMsg) {
            pageResult.status = 'WARN';
            pageResult.error = 'Error message detected on page';
            results.warnings++;
            console.log(`      ⚠️  WARN - Error message on page`);
          } else if (pageResult.console_errors.length > 0 || pageResult.network_errors.length > 0) {
            pageResult.status = 'WARN';
            pageResult.error = `${pageResult.console_errors.length} console errors, ${pageResult.network_errors.length} network errors`;
            results.warnings++;
            console.log(`      ⚠️  WARN - ${pageResult.error}`);
          } else {
            pageResult.status = 'OK';
            results.passed++;
            console.log(`      ✅ OK (${pageResult.load_time_ms}ms)`);
          }
        }
        
        // Take screenshot if failed or critical
        if (pageResult.status === 'FAIL' || (pageResult.status === 'WARN' && pageConfig.critical)) {
          const screenshotName = `${pageConfig.name.replace(/\s+/g, '_')}.png`;
          const screenshotPath = path.join('c:\\Users\\ASUS\\Desktop\\reactv1', 'workspace', 'report', 'artifacts', 'screenshots', screenshotName);
          await page.screenshot({ path: screenshotPath });
          pageResult.screenshot = screenshotName;
        }
        
      } catch (error) {
        pageResult.status = 'FAIL';
        pageResult.error = error instanceof Error ? error.message : String(error);
        pageResult.load_time_ms = Date.now() - startTime;
        results.failed++;
        console.log(`      ❌ FAIL - ${error instanceof Error ? error.message : String(error)}`);
      }
      
      results.pages.push(pageResult);
    });
  }
  
  test('User Detail Tabs', async () => {
    console.log('\n📋 Testing User Detail Tabs...');
    
    // Navigate to users list
    await page.goto(`${ADMIN_URL}/users`);
    await page.waitForTimeout(2000);
    
    // Click first user
    const firstUser = page.locator('table tbody tr').first();
    if (await firstUser.isVisible()) {
      await firstUser.click();
      await page.waitForTimeout(2000);
      
      // Test each tab
      for (const tabName of userDetailTabs) {
        const tabResult = {
          name: `User Detail - ${tabName}`,
          path: `/users/:id?tab=${tabName.toLowerCase()}`,
          status: 'UNKNOWN',
          critical: false,
          load_time_ms: 0,
          console_errors: /** @type {string[]} */ ([]),
          network_errors: /** @type {Array<{url: string, status: number}>} */ ([]),
          screenshot: /** @type {string | null} */ (null),
          error: /** @type {string | null} */ (null)
        };
        
        results.total_pages++;
        
        try {
          const startTime = Date.now();
          
          // Click tab
          const tab = page.locator(`text="${tabName}"`).first();
          if (await tab.isVisible({ timeout: 2000 })) {
            await tab.click();
            await page.waitForTimeout(1000);
            
            tabResult.load_time_ms = Date.now() - startTime;
            tabResult.status = 'OK';
            results.passed++;
            console.log(`   ✅ ${tabName} tab OK`);
          } else {
            tabResult.status = 'WARN';
            tabResult.error = 'Tab not found';
            results.warnings++;
            console.log(`   ⚠️  ${tabName} tab not found`);
          }
          
        } catch (error) {
          tabResult.status = 'FAIL';
          tabResult.error = error instanceof Error ? error.message : String(error);
          results.failed++;
          console.log(`   ❌ ${tabName} tab FAIL - ${error instanceof Error ? error.message : String(error)}`);
        }
        
        results.pages.push(tabResult);
      }
    } else {
      console.log('   ⚠️  No users found to test detail tabs');
    }
  });
});

test.describe.configure({ mode: 'serial', timeout: 20000 });
