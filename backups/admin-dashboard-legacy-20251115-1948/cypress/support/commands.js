// ***********************************************
// Custom Cypress Commands for Mixillo Admin Dashboard
// ***********************************************

/**
 * Login command - Uses direct API call for reliability
 * @example cy.login('admin@mixillo.com', 'admin@123456')
 */
Cypress.Commands.add('login', (emailOrUsername, password) => {
  cy.session([emailOrUsername, password], () => {
    const apiUrl = Cypress.env('apiUrl');
    
    // Log what we're sending
    cy.log('Attempting login with:', emailOrUsername, password ? '***' : 'NO PASSWORD');
    cy.log('API URL:', apiUrl);
    
    // Use direct API call for login (more reliable than UI)
    cy.request({
      method: 'POST',
      url: `${apiUrl}/api/auth/login`,
      body: {
        identifier: emailOrUsername,
        password: password
      },
      failOnStatusCode: false
    }).then((response) => {
      cy.log('Login response status:', response.status);
      cy.log('Response body:', JSON.stringify(response.body));
      
      if (response.status !== 200 && response.body.message && response.body.message.includes('Validation failed')) {
        // Try alternate login format if validation failed
        cy.log('Trying alternate login format with email field...');
        cy.request({
          method: 'POST',
          url: `${apiUrl}/api/auth/login`,
          body: {
            email: emailOrUsername,
            password: password
          },
          failOnStatusCode: false
        }).then((altResponse) => {
          if (altResponse.status === 200 && altResponse.body.success) {
            const { token, refreshToken, user } = altResponse.body.data;
            
            // Visit base URL first to establish window.localStorage context
            cy.visit('/');
            
            // Now store tokens in localStorage
            cy.window().then((win) => {
              win.localStorage.setItem('mongodb_jwt_token', token);
              if (refreshToken) {
                win.localStorage.setItem('mongodb_refresh_token', refreshToken);
              }
              win.localStorage.setItem('mongodb_user', JSON.stringify(user));
            });
            
            // Verify tokens were stored
            cy.window().its('localStorage').invoke('getItem', 'mongodb_jwt_token').should('exist');
          } else {
            throw new Error(`Login failed with status ${altResponse.status}: ${JSON.stringify(altResponse.body)}`);
          }
        });
      } else if (response.status === 200 && response.body.success) {
        const { token, refreshToken, user } = response.body.data;
        
        // Visit base URL first to establish window.localStorage context
        cy.visit('/');
        
        // Now store tokens in localStorage
        cy.window().then((win) => {
          win.localStorage.setItem('mongodb_jwt_token', token);
          if (refreshToken) {
            win.localStorage.setItem('mongodb_refresh_token', refreshToken);
          }
          win.localStorage.setItem('mongodb_user', JSON.stringify(user));
        });
        
        // Verify tokens were stored
        cy.window().its('localStorage').invoke('getItem', 'mongodb_jwt_token').should('exist');
      } else {
        throw new Error(`Login failed with status ${response.status}: ${JSON.stringify(response.body)}`);
      }
    });
  });
});

/**
 * Login as admin with default credentials
 * @example cy.loginAsAdmin()
 */
Cypress.Commands.add('loginAsAdmin', () => {
  const email = Cypress.env('adminEmail');
  const password = Cypress.env('adminPassword');
  
  // Validate credentials exist
  if (!email || !password) {
    throw new Error(`Admin credentials not configured. Email: ${email}, Password: ${password ? 'SET' : 'MISSING'}`);
  }
  
  cy.log(`Logging in as admin: ${email}`);
  cy.login(email, password);
});

/**
 * API request with auth token
 * @example cy.apiRequest('GET', '/admin/users')
 */
Cypress.Commands.add('apiRequest', (method, endpoint, body = null) => {
  const apiUrl = Cypress.env('apiUrl');
  
  cy.window().then((win) => {
    const token = win.localStorage.getItem('mongodb_jwt_token');
    
    return cy.request({
      method,
      url: `${apiUrl}/api${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
      failOnStatusCode: false,
    });
  });
});

/**
 * Check if element contains text (case insensitive)
 * @example cy.get('.title').containsText('dashboard')
 */
Cypress.Commands.add('containsText', { prevSubject: true }, (subject, text) => {
  cy.wrap(subject).should(($el) => {
    const elementText = $el.text().toLowerCase();
    const searchText = text.toLowerCase();
    expect(elementText).to.include(searchText);
  });
});

/**
 * Wait for API call to complete
 * @example cy.waitForApi('GET', '/admin/users')
 */
Cypress.Commands.add('waitForApi', (method, url) => {
  cy.intercept(method, `**${url}**`).as('apiCall');
  cy.wait('@apiCall');
});

/**
 * Navigate to admin page
 * @example cy.navigateToAdmin('users')
 */
Cypress.Commands.add('navigateToAdmin', (page) => {
  cy.visit(`/admin/${page}`);
  cy.waitForAppLoad();
});

/**
 * Check table has data
 * @example cy.get('table').shouldHaveRows()
 */
Cypress.Commands.add('shouldHaveRows', { prevSubject: true }, (subject) => {
  const rowSelectors = 'tbody tr, .MuiDataGrid-row, [role="row"]:not(:first), .table-row, [data-cy*="row"]';
  cy.wrap(subject, { timeout: 15000 })
    .find(rowSelectors, { timeout: 15000 })
    .should('have.length.greaterThan', 0);
});

/**
 * Check loading spinner is gone
 * @example cy.waitForLoader()
 */
Cypress.Commands.add('waitForLoader', () => {
  // Wait briefly for loaders to potentially appear
  cy.wait(300);
  
  // Check for various loading indicators
  const loaderSelectors = [
    '.MuiCircularProgress-root',
    '[role="progressbar"]',
    '.loading',
    '.loader',
    '[class*="Loading"]',
    '[class*="Spinner"]',
    '[data-testid="loading"]',
  ];
  
  loaderSelectors.forEach(selector => {
    cy.get('body').then($body => {
      if ($body.find(selector).length > 0) {
        cy.get(selector, { timeout: 20000 }).should('not.exist');
      }
    });
  });
});

/**
 * Check toast notification appears
 * @example cy.shouldShowToast('success', 'User created')
 */
Cypress.Commands.add('shouldShowToast', (type, message) => {
  cy.get('[data-hot-toast], .Toastify__toast', { timeout: 5000 })
    .should('be.visible')
    .and('contain', message);
});

/**
 * Click button by text
 * @example cy.clickButton('Create User')
 */
Cypress.Commands.add('clickButton', (text) => {
  cy.contains('button', text).click();
});

/**
 * Fill form field
 * @example cy.fillField('username', 'testuser')
 */
Cypress.Commands.add('fillField', (fieldName, value) => {
  cy.get(`input[name="${fieldName}"], textarea[name="${fieldName}"]`)
    .clear()
    .type(value);
});

/**
 * Select dropdown option
 * @example cy.selectOption('status', 'Active')
 */
Cypress.Commands.add('selectOption', (fieldName, value) => {
  cy.get(`select[name="${fieldName}"]`).select(value);
});

/**
 * Check modal is open
 * @example cy.shouldHaveModal('Edit User')
 */
Cypress.Commands.add('shouldHaveModal', (title) => {
  cy.get('[role="dialog"], .MuiDialog-root')
    .should('be.visible')
    .and('contain', title);
});

/**
 * Close modal
 * @example cy.closeModal()
 */
Cypress.Commands.add('closeModal', () => {
  cy.get('[role="dialog"] button[aria-label="close"], .MuiDialog-root button')
    .first()
    .click();
});

/**
 * Check API health
 * @example cy.checkApiHealth()
 */
Cypress.Commands.add('checkApiHealth', () => {
  const apiUrl = Cypress.env('apiUrl');
  cy.request(`${apiUrl}/api/health`).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('success', true);
  });
});

/**
 * Create test user via API
 * @example cy.createTestUser({ username: 'testuser', email: 'test@test.com' })
 */
Cypress.Commands.add('createTestUser', (userData) => {
  return cy.apiRequest('POST', '/admin/users', userData);
});

/**
 * Delete test user via API
 * @example cy.deleteTestUser(userId)
 */
Cypress.Commands.add('deleteTestUser', (userId) => {
  return cy.apiRequest('DELETE', `/admin/users/${userId}`);
});

/**
 * Search in table
 * @example cy.searchTable('john doe')
 */
Cypress.Commands.add('searchTable', (searchTerm) => {
  cy.get('input[placeholder*="Search"], input[type="search"]')
    .clear()
    .type(searchTerm);
  cy.wait(500); // Wait for debounce
});

/**
 * Check pagination exists
 * @example cy.shouldHavePagination()
 */
Cypress.Commands.add('shouldHavePagination', () => {
  cy.get('.MuiPagination-root, [aria-label="pagination"]')
    .should('be.visible');
});

/**
 * Go to next page
 * @example cy.goToNextPage()
 */
Cypress.Commands.add('goToNextPage', () => {
  cy.get('button[aria-label="Go to next page"], .MuiPagination-root button')
    .contains('Next')
    .click();
});
