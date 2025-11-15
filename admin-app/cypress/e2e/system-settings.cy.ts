describe('System Settings E2E Tests', () => {
  beforeEach(() => {
    // Login first
    cy.visit('/login')
    cy.get('input[type="email"]').type('admin@mixillo.com')
    cy.get('input[type="password"]').type('admin123')
    cy.get('button[type="submit"]').click()
    
    // Wait for redirect and navigate to system settings
    cy.url().should('include', '/dashboard')
    cy.visit('/system')
  })

  it('should load system settings page successfully', () => {
    cy.contains('System Settings').should('be.visible')
  })

  it('should display system status cards', () => {
    cy.contains('Database').should('be.visible')
    cy.contains('Redis Cache').should('be.visible')
    cy.contains('CDN Storage').should('be.visible')
    cy.contains('API Server').should('be.visible')
  })

  it('should show connection status indicators', () => {
    // Check for "Connected" status
    cy.contains('Connected').should('have.length.greaterThan', 0)
  })

  it('should display all configuration tabs', () => {
    cy.contains('General').should('be.visible')
    cy.contains('Payment').should('be.visible')
    cy.contains('Content').should('be.visible')
    cy.contains('Notifications').should('be.visible')
    cy.contains('Storage').should('be.visible')
    cy.contains('Security').should('be.visible')
  })

  it('should switch to Payment tab', () => {
    cy.contains('Payment').click()
    cy.wait(500)
    cy.contains('Stripe Configuration').should('be.visible')
    cy.contains('Currency').should('be.visible')
  })

  it('should switch to Content tab', () => {
    cy.contains('Content').click()
    cy.wait(500)
    cy.contains('Max Video Size').should('be.visible')
    cy.contains('Max Video Duration').should('be.visible')
  })

  it('should switch to Notifications tab', () => {
    cy.contains('Notifications').click()
    cy.wait(500)
    cy.contains('Email Notifications').should('be.visible')
    cy.contains('Push Notifications').should('be.visible')
  })

  it('should switch to Storage tab', () => {
    cy.contains('Storage').click()
    cy.wait(500)
    cy.contains('Storage Provider').should('be.visible')
  })

  it('should switch to Security tab', () => {
    cy.contains('Security').click()
    cy.wait(500)
    cy.contains('JWT Token Expiration').should('be.visible')
    cy.contains('Max Login Attempts').should('be.visible')
  })

  it('should display save buttons', () => {
    // Check for save button in General tab
    cy.contains('Save').should('be.visible')
  })

  it('should have form inputs in General tab', () => {
    // Check for input fields
    cy.get('input[name="siteName"]').should('exist')
    cy.get('input[name="supportEmail"]').should('exist')
  })

  it('should allow editing site name', () => {
    const newSiteName = 'Test Site Name'
    
    cy.get('input[name="siteName"]').clear().type(newSiteName)
    cy.get('input[name="siteName"]').should('have.value', newSiteName)
  })

  it('should show maintenance mode toggle', () => {
    cy.contains('Maintenance Mode').should('be.visible')
  })

  it('should display responsive layout on mobile', () => {
    cy.viewport('iphone-x')
    cy.contains('System Settings').should('be.visible')
  })

  it('should display responsive layout on tablet', () => {
    cy.viewport('ipad-2')
    cy.contains('System Settings').should('be.visible')
  })
})
