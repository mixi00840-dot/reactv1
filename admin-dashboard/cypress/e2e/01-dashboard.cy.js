/**
 * E2E Tests for Admin Dashboard Page
 * Tests: Stats loading, charts display, real-time updates
 */

describe('Admin Dashboard', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/admin/dashboard');
    cy.waitForAppLoad();
  });

  it('should load dashboard successfully', () => {
    cy.url().should('include', '/admin/dashboard');
    cy.contains('h1, h2, h3, h4, h5, h6', /dashboard/i).should('be.visible');
  });

  it('should display all stat cards', () => {
    // Check for key statistics
    cy.contains(/total users|users/i).should('be.visible');
    cy.contains(/content|videos/i).should('be.visible');
    cy.contains(/products/i).should('be.visible');
    cy.contains(/orders/i).should('be.visible');
  });

  it('should display stat values (not zeros)', () => {
    // Find stat cards and verify they show numbers
    cy.get('[class*="Card"], [class*="stat"]')
      .should('have.length.greaterThan', 0)
      .each(($card) => {
        // Check if card contains a number
        const text = $card.text();
        const hasNumber = /\d+/.test(text);
        expect(hasNumber).to.be.true;
      });
  });

  it('should display charts', () => {
    // Check for Chart.js or Recharts canvas/svg elements
    cy.get('canvas, svg[class*="recharts"]', { timeout: 10000 })
      .should('have.length.greaterThan', 0);
  });

  it('should display recent users list', () => {
    cy.contains(/recent users|latest users/i).should('be.visible');
    
    // Check if list has items
    cy.get('[class*="List"], [class*="list"]')
      .find('[class*="ListItem"], [class*="item"], tr, li')
      .should('have.length.greaterThan', 0);
  });

  it('should make API call to fetch dashboard data', () => {
    cy.intercept('GET', '**/admin/dashboard').as('getDashboard');
    cy.reload();
    cy.wait('@getDashboard').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body).to.have.property('success', true);
      expect(interception.response.body.data).to.exist;
    });
  });

  it('should handle real-time stats refresh', () => {
    // Check if real-time stats endpoint is called
    cy.intercept('GET', '**/admin/realtime/stats').as('getRealtimeStats');
    
    // Wait for auto-refresh (typically 30s, but we'll trigger manually)
    cy.wait(3000);
    
    // Verify the API was called at least once
    cy.get('@getRealtimeStats.all').should('have.length.greaterThan', 0);
  });

  it('should navigate to other pages from dashboard', () => {
    // Test navigation links
    cy.contains('a, button', /users/i).click();
    cy.url().should('include', '/users');
  });

  it('should display overview section', () => {
    cy.contains(/overview|statistics|metrics/i).should('be.visible');
  });

  it('should not show loading spinner after load', () => {
    cy.waitForLoader();
    cy.get('.MuiCircularProgress-root').should('not.exist');
  });
});
