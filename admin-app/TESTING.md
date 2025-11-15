# E2E Testing Setup

## Overview

Cypress e2e tests with `data-cy` selectors for the Mixillo admin dashboard.

## Setup

1. Install dependencies (already in package.json):
```bash
cd admin-app
npm install
```

2. Configure backend:
   - Ensure backend is running and seeded with test data
   - Admin credentials: `admin@mixillo.com` / `Test@123`

## Run Tests

### Interactive Mode (Cypress GUI)
```bash
npm run cypress:open
```

### Headless Mode
```bash
npm run cypress:run
```

### With Dev Server
```bash
npm run test:e2e
```

## Test Suites

### `login.cy.ts`
- Login form display
- Valid credential authentication
- Invalid credential error handling
- Empty field validation

### `dashboard.cy.ts`
- Dashboard metrics display
- Loading states
- Navigation from dashboard

### `users.cy.ts`
- Users table rendering
- Search functionality
- Page size changes
- Pagination navigation
- Role filtering

### `moderation.cy.ts`
- **Content Moderation:**
  - Content list display
  - Status filtering
  - Activate/Deactivate/Ban action buttons
  
- **Comment Moderation:**
  - Comments list display
  - Text search
  - Status filtering
  - Approve/Reject/Spam action buttons

## Data-Cy Selectors Reference

### Authentication
- `login-email` - Email input field
- `login-password` - Password input field
- `login-submit` - Login button
- `login-error` - Error message display

### Navigation
- `header` - Main header element
- `nav-dashboard`, `nav-users`, `nav-stores`, etc. - Navigation links

### Dashboard
- `dashboard-title` - Page title
- `dashboard-loading` - Loading state
- `metric-card` - Stat cards

### Data Tables
- `data-table` - Table wrapper
- `search-input` - Search input
- `search-button` - Search trigger
- `table-row` - Data rows
- `page-size-select` - Rows per page dropdown
- `prev-page-button` - Previous page
- `next-page-button` - Next page

### Page Specific
- `page-title` - H1 title on each page
- `filter-status` - Status filter dropdown
- `filter-role` - Role filter dropdown

### Action Buttons (Content)
- `action-activate` - Activate content
- `action-deactivate` - Deactivate content
- `action-ban` - Ban content

### Action Buttons (Comments)
- `action-approve` - Approve comment
- `action-reject` - Reject comment
- `action-spam` - Mark as spam

## Custom Commands

### `cy.login(email?, password?)`
Logs in with credentials (defaults to admin account) and navigates to dashboard.

**Example:**
```typescript
cy.login() // Uses admin@mixillo.com / Test@123
cy.login('custom@email.com', 'CustomPass')
```

### `cy.logout()`
Clears cookies and returns to login page.

## Best Practices

1. **Always use data-cy selectors** - Never rely on classes, IDs, or text content for test selectors
2. **Keep tests isolated** - Each test should be independent
3. **Use custom commands** - Leverage `cy.login()` for authenticated tests
4. **Wait for API calls** - Use `cy.wait()` after actions that trigger backend requests
5. **Clean state** - Each test suite uses `beforeEach` to reset state

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Install dependencies
  run: cd admin-app && npm ci

- name: Run E2E tests
  run: cd admin-app && npm run test:e2e
  env:
    NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
    NEXT_PUBLIC_SOCKET_URL: ${{ secrets.SOCKET_URL }}
```

## Troubleshooting

**Tests timing out:**
- Increase `defaultCommandTimeout` in `cypress.config.ts`
- Check backend is running and accessible

**Login failures:**
- Verify admin credentials exist in seeded database
- Check NEXT_PUBLIC_API_URL is correct

**Action buttons not found:**
- Ensure data is loaded (table has rows)
- Check data-cy attributes match test selectors

**Flaky tests:**
- Add explicit waits: `cy.wait(500)`
- Use `cy.intercept()` to stub API calls
- Increase viewport size in config
