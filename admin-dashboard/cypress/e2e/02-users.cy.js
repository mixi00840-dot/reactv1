/**
 * E2E Tests for Users Management Page
 * Tests: User list, search, filters, CRUD operations
 */

describe('Users Management', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.navigateToAdmin('users');
  });

  it('should load users page successfully', () => {
    cy.url().should('include', '/admin/users');
    cy.contains('h1, h2, h3, h4, h5, h6', /users/i).should('be.visible');
  });

  it('should display users table with data', () => {
    cy.waitForLoader();
    
    // Check for table or data grid
    cy.get('table, [class*="DataGrid"], [class*="table"]')
      .should('be.visible')
      .shouldHaveRows();
  });

  it('should display user columns', () => {
    // Common user table columns
    const expectedColumns = ['username', 'email', 'status', 'role'];
    
    expectedColumns.forEach((column) => {
      cy.get('thead, [class*="header"]')
        .containsText(column);
    });
  });

  it('should search users by username', () => {
    cy.intercept('GET', '**/admin/users*').as('getUsers');
    
    cy.searchTable('test');
    
    cy.wait('@getUsers').then((interception) => {
      expect(interception.request.url).to.include('search=test');
    });
  });

  it('should filter users by status', () => {
    // Look for status filter dropdown
    cy.get('select[name*="status"], [aria-label*="status"]').then(($filter) => {
      if ($filter.length > 0) {
        cy.wrap($filter).first().select('active');
        cy.waitForApi('GET', '/admin/users');
      }
    });
  });

  it('should filter users by role', () => {
    // Look for role filter dropdown
    cy.get('select[name*="role"], [aria-label*="role"]').then(($filter) => {
      if ($filter.length > 0) {
        cy.wrap($filter).first().select('user');
        cy.waitForApi('GET', '/admin/users');
      }
    });
  });

  it('should display pagination', () => {
    cy.shouldHavePagination();
  });

  it('should navigate to next page', () => {
    cy.intercept('GET', '**/admin/users*').as('getUsersPage2');
    
    cy.goToNextPage();
    
    cy.wait('@getUsersPage2').then((interception) => {
      expect(interception.request.url).to.match(/page=2/);
    });
  });

  it('should open user details modal/page', () => {
    cy.waitForLoader();
    
    // Click first user in table
    cy.get('tbody tr, [class*="DataGrid-row"]')
      .first()
      .click();
    
    // Check if modal opens or navigates to details page
    cy.url().should('match', /\/admin\/users\/[a-f0-9]+|\/admin\/user-details/);
  });

  it('should ban user action', () => {
    cy.waitForLoader();
    
    // Look for action menu or ban button
    cy.get('tbody tr, [class*="DataGrid-row"]').first().within(() => {
      cy.get('button[aria-label*="menu"], button[aria-label*="actions"]')
        .first()
        .click();
    });
    
    // Click ban option
    cy.contains('button, [role="menuitem"]', /ban/i).click();
    
    // Confirm action
    cy.contains('button', /confirm|yes|ban/i).click();
    
    // Check for success toast
    cy.shouldShowToast('success', 'banned');
  });

  it('should suspend user action', () => {
    cy.waitForLoader();
    
    // Look for action menu
    cy.get('tbody tr, [class*="DataGrid-row"]').first().within(() => {
      cy.get('button[aria-label*="menu"], button[aria-label*="actions"]')
        .first()
        .click();
    });
    
    // Click suspend option
    cy.contains('button, [role="menuitem"]', /suspend/i).click();
    
    // Confirm action
    cy.contains('button', /confirm|yes|suspend/i).click();
    
    // Check for success toast
    cy.shouldShowToast('success', 'suspended');
  });

  it('should activate user action', () => {
    cy.waitForLoader();
    
    // Look for action menu
    cy.get('tbody tr, [class*="DataGrid-row"]').first().within(() => {
      cy.get('button[aria-label*="menu"], button[aria-label*="actions"]')
        .first()
        .click();
    });
    
    // Click activate option
    cy.contains('button, [role="menuitem"]', /activate/i).click();
    
    // Confirm action
    cy.contains('button', /confirm|yes|activate/i).click();
    
    // Check for success toast
    cy.shouldShowToast('success', 'activated');
  });

  it('should make correct API calls', () => {
    cy.intercept('GET', '**/admin/users*').as('getUsers');
    cy.reload();
    
    cy.wait('@getUsers').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body.success).to.be.true;
      expect(interception.response.body.data).to.have.property('users');
      expect(interception.response.body.data.users).to.be.an('array');
    });
  });

  it('should handle empty search results', () => {
    cy.searchTable('zzzzzznonexistentuser9999');
    cy.waitForLoader();
    
    // Check for empty state message
    cy.contains(/no users found|no results/i).should('be.visible');
  });

  it('should display user statistics', () => {
    // Check for user stats (total, active, etc.)
    cy.contains(/total|active|banned|suspended/i).should('be.visible');
  });
});
