# Running Tests for Mixillo Platform

This guide covers how to run all automated tests for the Mixillo backend and admin dashboard.

## Prerequisites

- Node.js 16+ installed
- Firebase Emulator Suite installed
- MongoDB (for legacy tests, if any)
- All dependencies installed (`npm install`)

## Backend Tests

### Setup

1. **Install Dependencies**
```powershell
cd backend
npm install
```

2. **Start Firebase Emulators** (in a separate terminal)
```powershell
firebase emulators:start --only firestore,auth
```

### Run Tests

**Run All Tests:**
```powershell
npm test
```

**Run Specific Test Suite:**
```powershell
# Integration tests
npm test -- tests/integration

# Unit tests
npm test -- tests/unit

# Specific test file
npm test -- tests/integration/admin.users.test.js
```

**Run with Coverage:**
```powershell
npm test -- --coverage
```

**Watch Mode (auto-rerun on changes):**
```powershell
npm test -- --watch
```

### Test Suites Overview

#### Integration Tests (`tests/integration/`)
- ✅ `admin.users.test.js` - User management API endpoints
- ✅ `admin.sellers.test.js` - Seller application endpoints
- ✅ `admin.products.test.js` - Product management endpoints
- ✅ `admin.orders.test.js` - Order processing endpoints
- ✅ `admin.uploads.test.js` - Upload management endpoints
- ✅ `e2e.workflows.test.js` - End-to-end workflow tests

#### Unit Tests (`tests/unit/`)
- ✅ `user.model.test.js` - User model CRUD and validation
- ✅ `product.model.test.js` - Product model operations
- ✅ `order.model.test.js` - Order model logic

### Test Helpers

**Location:** `tests/helpers/testHelpers.js`

**Available Utilities:**
- `createTestUser()` - Create test user
- `createTestAdmin()` - Create admin user
- `createTestSeller()` - Create seller user
- `createTestProduct()` - Create test product
- `createTestOrder()` - Create test order
- `createTestUpload()` - Create upload record
- `generateTestToken()` - Generate JWT token
- `clearTestData()` - Clean up test data

**Mock Data:** `tests/fixtures/mockData.js`

## Frontend Tests (Admin Dashboard)

### Setup

```powershell
cd admin-dashboard
npm install
```

### Run Tests

**Run All Tests:**
```powershell
npm test
```

**Run with Coverage:**
```powershell
npm test -- --coverage
```

**Watch Mode:**
```powershell
npm test -- --watchAll
```

**Run Specific Test:**
```powershell
npm test -- Users.test.js
```

### Test Suites Overview

#### Page Tests (`src/__tests__/pages/`)
- ✅ `Dashboard.test.js` - Dashboard page rendering and stats
- ✅ `Users.test.js` - User management page with filters
- ✅ `UploadManager.test.js` - Upload management functionality

### Frontend Testing Libraries

- **React Testing Library** - Component testing
- **Jest** - Test runner and assertions
- **@testing-library/user-event** - User interaction simulation

## Continuous Integration

### GitHub Actions Workflow

A complete CI/CD pipeline is configured in `.github/workflows/test.yml`:

```yaml
name: Run Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
      - name: Install dependencies
        run: cd backend && npm install
      - name: Run tests
        run: cd backend && npm test -- --coverage
      
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
      - name: Install dependencies
        run: cd admin-dashboard && npm install
      - name: Run tests
        run: cd admin-dashboard && npm test -- --coverage --watchAll=false
```

## Test Coverage Goals

### Backend
- **Target:** 80% coverage
- **Critical paths:** 90%+ coverage
  - Authentication & authorization
  - User management
  - Payment processing
  - Order workflows

### Frontend
- **Target:** 70% coverage
- **Critical components:** 80%+ coverage
  - User management pages
  - Authentication flows
  - Data tables and forms

## Running Tests Locally Before Deployment

**Complete Pre-Deploy Test Script:**

```powershell
# Backend tests
cd backend
firebase emulators:start --only firestore,auth &
npm test -- --coverage

# Frontend tests
cd ../admin-dashboard
npm test -- --coverage --watchAll=false

# Stop emulators
# Ctrl+C in emulator terminal
```

## Common Issues & Solutions

### Issue: Tests timeout
**Solution:** Increase timeout in jest.config.js or specific test:
```javascript
jest.setTimeout(30000); // 30 seconds
```

### Issue: Firestore emulator not running
**Solution:** Start emulators first:
```powershell
firebase emulators:start
```

### Issue: Port already in use
**Solution:** Kill existing process:
```powershell
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

### Issue: Mock data persists between tests
**Solution:** Use `clearTestData()` in `afterAll()` hooks

## Test Data Management

### Creating Test Data

Use helper functions from `testHelpers.js`:

```javascript
const { createTestUser, createTestProduct } = require('../helpers/testHelpers');

const user = await createTestUser({
  email: 'custom@example.com',
  role: 'seller'
});

const product = await createTestProduct({
  sellerId: user.id,
  price: 99.99
});
```

### Cleaning Up Test Data

```javascript
const { clearTestData } = require('../helpers/testHelpers');

afterAll(async () => {
  await clearTestData();
});
```

## Performance Testing

### Load Testing (Optional)

Use Artillery or k6 for load testing:

```powershell
# Install Artillery
npm install -g artillery

# Run load test
artillery quick --count 100 --num 10 https://your-api.com/api/admin/users
```

## Debugging Tests

### Debug Single Test

```javascript
describe.only('Specific test', () => {
  it('should do something', () => {
    // Only this test runs
  });
});
```

### Skip Test Temporarily

```javascript
describe.skip('Tests to skip', () => {
  // These tests won't run
});
```

### View Detailed Errors

```powershell
npm test -- --verbose
```

## Best Practices

1. **Isolate Tests** - Each test should be independent
2. **Clean Up** - Always clean up test data
3. **Mock External Services** - Don't call real APIs
4. **Descriptive Names** - Test names should explain what they verify
5. **Fast Tests** - Keep tests under 5 seconds each
6. **Coverage** - Aim for meaningful coverage, not 100%

## Next Steps

- [ ] Add tests for remaining pages (Products, Orders, Stories)
- [ ] Implement visual regression testing
- [ ] Add performance benchmarks
- [ ] Create E2E tests with Playwright/Cypress
- [ ] Automate security testing (OWASP checks)

---

**Questions or Issues?**
Check the test output for detailed error messages or open an issue on GitHub.
