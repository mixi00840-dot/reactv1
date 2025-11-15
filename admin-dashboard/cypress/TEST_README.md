# Mixillo Admin Dashboard - Automated Testing Guide

## Overview

This document describes the automated testing infrastructure for the Mixillo Admin Dashboard, including E2E tests (Cypress) and backend API integration tests (Jest).

## Testing Stack

### Frontend E2E Testing
- **Framework**: Cypress 13.6.0
- **Test Runner**: Cypress GUI (development) / CLI (CI/CD)
- **Coverage**: All 41 admin pages
- **Custom Commands**: 28 reusable utilities

### Backend Integration Testing
- **Framework**: Jest + Axios
- **API URL**: https://mixillo-backend-52242135857.europe-west1.run.app
- **Coverage**: All major admin API endpoints

## Quick Start

### Install Dependencies

```bash
# Frontend (Cypress)
cd admin-dashboard
npm install

# Backend (Jest already installed)
cd ../backend
npm install
```

### Running E2E Tests

```bash
cd admin-dashboard

# Open Cypress GUI (interactive testing)
npm run cypress:open

# Run all E2E tests headlessly
npm run cypress:run

# Run specific test files
npm run test:e2e:dashboard      # Dashboard tests only
npm run test:e2e:users          # Users tests only
npm run test:e2e:critical       # Critical pages tests

# Run with specific browser
npm run cypress:run:chrome      # Chrome browser
npm run cypress:run:firefox     # Firefox browser

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run for CI/CD
npm run test:e2e:ci
```

### Running Backend Integration Tests

```bash
cd backend

# Run all integration tests
npm run test:integration

# Run admin API tests only
npm run test:integration:admin

# Run with coverage
npm test -- --coverage

# Watch mode (re-run on changes)
npm run test:watch
```

## Test Structure

### Frontend E2E Tests (Cypress)

```
admin-dashboard/
  cypress/
    e2e/
      01-dashboard.cy.js          # Dashboard page (11 tests)
      02-users.cy.js              # Users management (15 tests)
      03-critical-pages.cy.js     # Critical pages (31 tests)
      [MORE TEST FILES COMING]
    support/
      commands.js                  # Custom commands (28 commands)
      e2e.js                       # Global setup
  cypress.config.js               # Cypress configuration
```

### Backend Integration Tests (Jest)

```
backend/
  tests/
    integration/
      admin-api.test.js           # Admin API endpoints
    unit/
      [UNIT TESTS]
  jest.config.js                  # Jest configuration
```

## Cypress Custom Commands

### Authentication
- `cy.login(email, password)` - Login with credentials
- `cy.loginAsAdmin()` - Quick admin login using env credentials

### API Interaction
- `cy.apiRequest(method, endpoint, body)` - Make authenticated API calls
- `cy.waitForApi(method, url)` - Wait for specific API call to complete
- `cy.checkApiHealth()` - Verify API health endpoint

### Navigation
- `cy.navigateToAdmin(page)` - Navigate to `/admin/{page}` and wait for load
- `cy.goToNextPage()` - Click pagination next button

### Assertions
- `cy.shouldHaveRows()` - Assert table/DataGrid has data rows
- `cy.shouldShowToast(type, message)` - Assert toast notification appears
- `cy.containsText(text)` - Case-insensitive text matching
- `cy.shouldHavePagination()` - Assert pagination component exists
- `cy.shouldHaveModal(title)` - Assert modal/dialog opened with title

### Interactions
- `cy.clickButton(text)` - Click button by text content
- `cy.fillField(name, value)` - Fill form field by name/placeholder
- `cy.selectOption(name, value)` - Select dropdown option
- `cy.searchTable(term)` - Type in search input with debounce
- `cy.waitForLoader()` - Wait for loading spinner to disappear
- `cy.closeModal()` - Close modal/dialog

### Test Data Management
- `cy.createTestUser(data)` - Create test user via API
- `cy.deleteTestUser(id)` - Delete test user via API

## Test Coverage

### Current Coverage (57 test cases)

✅ **Dashboard** (11 tests)
- Page load
- Stat cards display
- Real data verification (not zeros)
- Charts rendering
- Recent users list
- API calls
- Real-time updates

✅ **Users** (15 tests)
- List display with pagination
- Search functionality
- Status filter (active/banned/suspended)
- Role filter (user/seller/admin)
- User details modal
- Ban/suspend/activate actions
- API verification
- Empty state handling

✅ **Products** (5 tests)
- Product list display
- Search products
- Category filter
- API calls

✅ **Orders** (5 tests)
- Order list display
- Status filter
- Update order status
- API verification

✅ **Seller Applications** (5 tests)
- Applications list
- Status filter
- Approve application
- Reject application with reason

✅ **Settings** (5 tests)
- Settings page load
- Display all sections
- Load current settings
- Display API keys
- Save settings

✅ **Database Monitoring** (6 tests)
- Database stats display
- 64 collections verification
- Fetch database stats API
- Collections list API
- Performance metrics

✅ **System Health** (5 tests)
- System health page load
- CPU/memory metrics display
- TypeError verification (fixed bug)
- System health API
- Percentage display

### Remaining Pages to Test (33 pages)

- Livestreams
- Wallets
- Transactions
- Gifts
- Coins
- User Levels
- Tags
- Explorer
- Featured
- Banners
- Moderation
- Monetization
- Analytics
- Platform Analytics
- Customer Support
- Comments
- Sounds
- Trending
- Processing Queue
- Storage Stats
- API Settings
- Notifications
- Translations
- Currencies
- Shipping
- Coupons
- Payments
- Streaming Providers
- Create User
- Profile
- Login
- And 2 more...

## Configuration

### Cypress Configuration (`cypress.config.js`)

```javascript
{
  e2e: {
    baseUrl: 'https://admin-dashboard-mixillo.vercel.app',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    viewportWidth: 1920,
    viewportHeight: 1080,
    env: {
      apiUrl: 'https://mixillo-backend-52242135857.europe-west1.run.app',
      adminEmail: 'admin@mixillo.com',
      adminPassword: 'Admin123!',
    }
  }
}
```

### Backend Test Configuration

```javascript
// Environment variables for tests
API_URL=https://mixillo-backend-52242135857.europe-west1.run.app
ADMIN_EMAIL=admin@mixillo.com
ADMIN_PASSWORD=Admin123!
```

## Writing New Tests

### Cypress E2E Test Template

```javascript
describe('Page Name', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.navigateToAdmin('page-route');
  });

  it('should load page successfully', () => {
    cy.url().should('include', '/admin/page-route');
    cy.waitForLoader();
  });

  it('should display data table', () => {
    cy.get('table, [class*="DataGrid"]').shouldHaveRows();
  });

  it('should make API calls correctly', () => {
    cy.intercept('GET', '**/api/endpoint*').as('getData');
    cy.reload();
    cy.wait('@getData').its('response.statusCode').should('eq', 200);
  });

  it('should search items', () => {
    cy.searchTable('test query');
    cy.waitForApi('GET', '**/api/endpoint?search=*');
    cy.shouldHaveRows();
  });

  it('should filter items', () => {
    cy.selectOption('Status', 'active');
    cy.waitForApi('GET', '**/api/endpoint?status=active');
    cy.shouldHaveRows();
  });
});
```

### Backend Integration Test Template

```javascript
describe('API Endpoint', () => {
  it('GET /api/endpoint - should return data', async () => {
    const response = await apiRequest('GET', '/api/endpoint');

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('items');
    expect(Array.isArray(response.data.data.items)).toBe(true);
  });

  it('should support pagination', async () => {
    const response = await apiRequest('GET', '/api/endpoint?page=1&limit=10');

    expect(response.data.data.pagination).toHaveProperty('page', 1);
    expect(response.data.data.pagination).toHaveProperty('limit', 10);
    expect(response.data.data.pagination).toHaveProperty('total');
  });

  it('should support search', async () => {
    const response = await apiRequest('GET', '/api/endpoint?search=test');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data.data.items)).toBe(true);
  });
});
```

## CI/CD Integration

### GitHub Actions (Coming Soon)

```yaml
name: Cypress E2E Tests
on: [push, pull_request]
jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: cypress-io/github-action@v6
        with:
          working-directory: admin-dashboard
          start: npm start
          wait-on: 'http://localhost:3000'
          browser: chrome
          spec: cypress/e2e/**/*.cy.js
```

## Troubleshooting

### Cypress Issues

**Issue: Tests fail with "element not visible"**
- Solution: Use `cy.waitForLoader()` before interacting with elements
- Check if element is behind modal/overlay

**Issue: API calls not intercepted**
- Solution: Ensure intercept is called before action that triggers it
- Use `cy.wait('@aliasName')` to wait for intercepted call

**Issue: "Timed out retrying" errors**
- Solution: Increase timeout in command: `.should('exist', { timeout: 20000 })`
- Check if element selector is correct

**Issue: Authentication fails**
- Solution: Verify admin credentials in `cypress.config.js` env variables
- Check if login API endpoint is working

### Backend Integration Test Issues

**Issue: Tests fail with 401 Unauthorized**
- Solution: Ensure login in `beforeAll()` hook completes successfully
- Check if `authToken` is correctly set and used in headers

**Issue: Tests timeout**
- Solution: Increase Jest timeout: `jest.setTimeout(30000);`
- Check if backend is reachable from test environment

**Issue: "Cannot find module" errors**
- Solution: Install missing dependencies: `npm install --save-dev axios`
- Verify `jest.config.js` is correctly configured

## Best Practices

### E2E Testing
1. **Always login before tests** - Use `cy.loginAsAdmin()` in `beforeEach()`
2. **Wait for loaders** - Use `cy.waitForLoader()` after navigation
3. **Intercept API calls** - Use `cy.intercept()` to verify backend communication
4. **Use custom commands** - Leverage 28 custom commands for consistency
5. **Test real workflows** - Simulate actual user interactions
6. **Clean up test data** - Delete test users/items after tests complete

### Backend Integration Testing
1. **Authenticate once** - Login in `beforeAll()`, not in every test
2. **Test error cases** - Verify 401, 404, 400 responses
3. **Check response structure** - Verify `success`, `data`, `error` properties
4. **Test filters and pagination** - Ensure query params work correctly
5. **Clean up after tests** - Delete test data created during tests

## Reporting

### Generate Coverage Report (Coming Soon)

```bash
# Frontend E2E coverage
npm run test:e2e -- --coverage

# Backend integration coverage
npm run test:coverage
```

### View Coverage Report

```bash
# Open coverage report in browser
open coverage/lcov-report/index.html
```

## Maintenance

### Adding New Pages
1. Create new test file: `cypress/e2e/XX-page-name.cy.js`
2. Follow test template structure
3. Use existing custom commands
4. Add npm script in package.json: `"test:e2e:page-name": "cypress run --spec 'cypress/e2e/XX-page-name.cy.js'"`

### Adding New Custom Commands
1. Open `cypress/support/commands.js`
2. Add command using `Cypress.Commands.add('commandName', callback)`
3. Document command in this README
4. Use command in test files

### Adding New Backend Tests
1. Create test file in `backend/tests/integration/`
2. Import axios and configure API_URL
3. Follow integration test template
4. Run tests with `npm run test:integration`

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Mixillo Backend API Docs](../../docs/API.md)

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review existing test files for examples
3. Check Cypress/Jest documentation
4. Contact development team

---

**Last Updated**: January 2025  
**Test Coverage**: 8/41 pages (19.5%) - 57 test cases  
**Status**: 🔄 In Progress - Adding remaining page tests
