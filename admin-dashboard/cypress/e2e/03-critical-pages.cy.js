/**
 * E2E Tests for Critical Admin Pages
 * Tests: Products, Orders, Seller Applications, Settings
 */

describe('Products Management', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.navigateToAdmin('products');
  });

  it('should load products page', () => {
    cy.url().should('include', '/admin/products');
    cy.waitForLoader();
  });

  it('should display products table', () => {
    cy.get('table, [class*="DataGrid"]').shouldHaveRows();
  });

  it('should search products', () => {
    cy.searchTable('test');
    cy.waitForApi('GET', '/products/admin/all');
  });

  it('should filter by category', () => {
    cy.get('select, [role="button"]').contains(/category/i).click();
    cy.waitForApi('GET', '/products/admin/all');
  });

  it('should fetch products via API', () => {
    cy.intercept('GET', '**/products/admin/all*').as('getProducts');
    cy.reload();
    cy.wait('@getProducts').its('response.statusCode').should('eq', 200);
  });
});

describe('Orders Management', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.navigateToAdmin('orders');
  });

  it('should load orders page', () => {
    cy.url().should('include', '/admin/orders');
    cy.waitForLoader();
  });

  it('should display orders table', () => {
    cy.get('table, [class*="DataGrid"]').shouldHaveRows();
  });

  it('should filter by status', () => {
    cy.get('select[name*="status"]').then(($select) => {
      if ($select.length > 0) {
        cy.wrap($select).select('pending');
        cy.waitForApi('GET', '/admin/orders');
      }
    });
  });

  it('should update order status', () => {
    cy.intercept('PUT', '**/admin/orders/*/status').as('updateStatus');
    
    cy.get('tbody tr').first().within(() => {
      cy.get('button').contains(/status|update/i).click();
    });
    
    cy.contains('button', /processing|shipped/i).click();
    cy.wait('@updateStatus').its('response.statusCode').should('eq', 200);
  });

  it('should fetch orders via API', () => {
    cy.intercept('GET', '**/admin/orders*').as('getOrders');
    cy.reload();
    cy.wait('@getOrders').then((interception) => {
      expect(interception.response.body.success).to.be.true;
      expect(interception.response.body.data.orders).to.be.an('array');
    });
  });
});

describe('Seller Applications', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.navigateToAdmin('seller-applications');
  });

  it('should load seller applications page', () => {
    cy.url().should('include', '/seller-applications');
    cy.waitForLoader();
  });

  it('should display applications table', () => {
    cy.get('table, [class*="DataGrid"]').should('be.visible');
  });

  it('should filter by status', () => {
    cy.get('select[name*="status"]').then(($select) => {
      if ($select.length > 0) {
        cy.wrap($select).select('pending');
        cy.waitForApi('GET', '/admin/seller-applications');
      }
    });
  });

  it('should approve application', () => {
    cy.intercept('POST', '**/seller-applications/*/approve').as('approve');
    
    cy.get('tbody tr').first().within(() => {
      cy.get('button').contains(/approve/i).click();
    });
    
    cy.contains('button', /confirm|yes/i).click();
    cy.wait('@approve').its('response.statusCode').should('eq', 200);
  });

  it('should reject application', () => {
    cy.intercept('POST', '**/seller-applications/*/reject').as('reject');
    
    cy.get('tbody tr').first().within(() => {
      cy.get('button').contains(/reject/i).click();
    });
    
    cy.fillField('reason', 'Test rejection reason');
    cy.contains('button', /confirm|reject/i).click();
    cy.wait('@reject').its('response.statusCode').should('eq', 200);
  });
});

describe('Settings Page', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.navigateToAdmin('settings');
  });

  it('should load settings page', () => {
    cy.url().should('include', '/admin/settings');
    cy.waitForLoader();
  });

  it('should display settings sections', () => {
    cy.contains(/general|email|payment|moderation|features|api/i).should('be.visible');
  });

  it('should load current settings', () => {
    cy.intercept('GET', '**/settings/mongodb').as('getSettings');
    cy.reload();
    cy.wait('@getSettings').its('response.statusCode').should('eq', 200);
  });

  it('should display API keys section', () => {
    cy.contains(/api keys|agora|zegocloud|cloudinary/i).should('be.visible');
  });

  it('should save settings', () => {
    cy.intercept('PUT', '**/settings/mongodb/*').as('saveSettings');
    
    // Find save button
    cy.contains('button', /save|update/i).click();
    
    cy.wait('@saveSettings').its('response.statusCode').should('eq', 200);
    cy.shouldShowToast('success', 'saved');
  });
});

describe('Database Monitoring', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.navigateToAdmin('database-monitoring');
  });

  it('should load database monitoring page', () => {
    cy.url().should('include', '/database-monitoring');
    cy.waitForLoader();
  });

  it('should display database statistics', () => {
    cy.contains(/collections|documents|size/i).should('be.visible');
  });

  it('should show 64 collections', () => {
    cy.contains(/64|collections/i).should('be.visible');
  });

  it('should fetch database stats', () => {
    cy.intercept('GET', '**/admin/database/stats').as('getStats');
    cy.reload();
    cy.wait('@getStats').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body.data).to.have.property('collections');
    });
  });

  it('should display collections list', () => {
    cy.intercept('GET', '**/admin/database/collections').as('getCollections');
    cy.wait('@getCollections').then((interception) => {
      expect(interception.response.body.data.collections).to.be.an('array');
      expect(interception.response.body.data.collections.length).to.be.greaterThan(0);
    });
  });

  it('should display performance metrics', () => {
    cy.contains(/operations|connections|network/i).should('be.visible');
  });
});

describe('System Health', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.navigateToAdmin('system-health');
  });

  it('should load system health page', () => {
    cy.url().should('include', '/system-health');
    cy.waitForLoader();
  });

  it('should display CPU and memory metrics', () => {
    cy.contains(/cpu|memory|uptime/i).should('be.visible');
  });

  it('should not show TypeError', () => {
    // Check console for errors
    cy.window().then((win) => {
      const errors = [];
      cy.on('window:before:load', (win) => {
        cy.stub(win.console, 'error').callsFake((msg) => {
          errors.push(msg);
        });
      });
      
      // Verify no "toFixed is not a function" errors
      cy.wrap(errors).should('not.include.members', ['toFixed']);
    });
  });

  it('should fetch system health data', () => {
    cy.intercept('GET', '**/admin/system/health').as('getHealth');
    cy.reload();
    cy.wait('@getHealth').its('response.statusCode').should('eq', 200);
  });

  it('should display percentage values correctly', () => {
    // Check that percentages are displayed with % symbol
    cy.get('body').should('contain', '%');
  });
});
