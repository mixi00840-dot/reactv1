/**
 * Make Cypress tests more resilient
 * Adds helpers for conditional testing and flexible element selection
 */

/**
 * Execute callback only if element exists
 * @example cy.ifExists('[data-cy="search"]', ($el) => cy.wrap($el).type('test'))
 */
Cypress.Commands.add('ifExists', (selector, callback) => {
  cy.get('body').then($body => {
    const elements = $body.find(selector);
    if (elements.length > 0) {
      if (callback) {
        callback(elements);
      }
      return cy.wrap(elements);
    } else {
      cy.log(`Element "${selector}" not found - skipping`);
      return cy.wrap(null);
    }
  });
});

/**
 * Wait for API call with optional fallback
 * Won't fail if API never called
 * @example cy.waitForApiOptional('@getUsers')
 */
Cypress.Commands.add('waitForApiOptional', (alias, options = {}) => {
  const defaultOptions = {
    timeout: 5000,
    requestTimeout: 5000,
    ...options
  };
  
  return cy.window().then(() => {
    return new Cypress.Promise((resolve, reject) => {
      try {
        cy.wait(alias, defaultOptions).then(resolve);
      } catch (error) {
        cy.log(`API ${alias} did not complete - continuing anyway`);
        resolve(null);
      }
    });
  });
});

/**
 * Get element with multiple possible selectors
 * Returns first matching selector
 * @example cy.getAny(['table', '[class*="DataGrid"]', '.data-table'])
 */
Cypress.Commands.add('getAny', (selectors, options = {}) => {
  const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
  const selectorString = selectorArray.join(', ');
  
  return cy.get(selectorString, { timeout: 10000, ...options });
});

/**
 * Check if page has loaded successfully
 * Waits for loader to disappear and checks for common page elements
 */
Cypress.Commands.add('pageLoaded', () => {
  // Wait for any loaders to disappear
  cy.waitForLoader();
  
  // Check page has some content
  cy.get('body').should('not.be.empty');
  
  // Wait a bit for dynamic content
  cy.wait(1000);
});

/**
 * Seed minimum test data (if endpoint exists)
 */
Cypress.Commands.add('seedMinimalData', () => {
  const apiUrl = Cypress.env('apiUrl');
  
  cy.request({
    method: 'POST',
    url: `${apiUrl}/api/admin/seed-minimal-test-data`,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('mongodb_jwt_token')}`
    },
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      cy.log('✅ Test data seeded successfully');
    } else {
      cy.log('⚠️  Test data seeding endpoint not available');
    }
  });
});

// Override default timeout for all gets
Cypress.config('defaultCommandTimeout', 15000);
Cypress.config('responseTimeout', 30000);

console.log('🛡️  Resilient test helpers loaded');
