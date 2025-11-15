describe('Analytics Dashboard E2E Tests', () => {
  beforeEach(() => {
    // Login first
    cy.visit('/login')
    cy.get('input[type="email"]').type('admin@mixillo.com')
    cy.get('input[type="password"]').type('admin123')
    cy.get('button[type="submit"]').click()
    
    // Wait for redirect to dashboard
    cy.url().should('include', '/dashboard')
    
    // Navigate to analytics
    cy.visit('/analytics')
  })

  it('should load analytics dashboard successfully', () => {
    cy.contains('Analytics Dashboard').should('be.visible')
  })

  it('should display key metric cards', () => {
    cy.contains('Total Revenue').should('be.visible')
    cy.contains('Total Users').should('be.visible')
    cy.contains('Total Orders').should('be.visible')
    cy.contains('Total Products').should('be.visible')
  })

  it('should show growth percentages', () => {
    // Check for percentage indicators (e.g., +12.5%)
    cy.get('[class*="text-green"]').should('contain', '%')
  })

  it('should display chart tabs', () => {
    cy.contains('Overview').should('be.visible')
    cy.contains('Users').should('be.visible')
    cy.contains('Revenue').should('be.visible')
    cy.contains('Content').should('be.visible')
  })

  it('should switch between chart tabs', () => {
    // Click Users tab
    cy.contains('Users').click()
    cy.wait(500)
    
    // Click Revenue tab
    cy.contains('Revenue').click()
    cy.wait(500)
    
    // Click Content tab
    cy.contains('Content').click()
    cy.wait(500)
    
    // Back to Overview
    cy.contains('Overview').click()
    cy.wait(500)
  })

  it('should display date range selector', () => {
    cy.contains('Last 7 Days').should('be.visible')
    cy.contains('Last 30 Days').should('be.visible')
    cy.contains('Last 90 Days').should('be.visible')
    cy.contains('Last Year').should('be.visible')
  })

  it('should change date range filter', () => {
    cy.contains('Last 30 Days').click()
    cy.wait(500)
    
    cy.contains('Last 90 Days').click()
    cy.wait(500)
    
    cy.contains('Last Year').click()
    cy.wait(500)
  })

  it('should render charts without errors', () => {
    // Check for recharts SVG elements
    cy.get('svg').should('have.length.greaterThan', 0)
  })

  it('should display responsive layout on mobile', () => {
    cy.viewport('iphone-x')
    cy.contains('Analytics Dashboard').should('be.visible')
    cy.get('[class*="grid"]').should('exist')
  })

  it('should display responsive layout on tablet', () => {
    cy.viewport('ipad-2')
    cy.contains('Analytics Dashboard').should('be.visible')
    cy.get('[class*="grid"]').should('exist')
  })
})
