describe('Audit Logs E2E Tests', () => {
  beforeEach(() => {
    // Login first
    cy.visit('/login')
    cy.get('input[type="email"]').type('admin@mixillo.com')
    cy.get('input[type="password"]').type('admin123')
    cy.get('button[type="submit"]').click()
    
    // Wait for redirect and navigate to audit logs
    cy.url().should('include', '/dashboard')
    cy.visit('/audit-logs')
  })

  it('should load audit logs page successfully', () => {
    cy.contains('Audit Logs').should('be.visible')
  })

  it('should display statistics cards', () => {
    cy.contains('Total Events').should('be.visible')
    cy.contains('Success').should('be.visible')
    cy.contains('Failed').should('be.visible')
    cy.contains('Warnings').should('be.visible')
  })

  it('should show search input', () => {
    cy.get('input[placeholder*="Search"]').should('be.visible')
  })

  it('should display filter dropdowns', () => {
    cy.contains('All Categories').should('be.visible')
    cy.contains('All Status').should('be.visible')
    cy.contains('Last 7 Days').should('be.visible')
  })

  it('should display audit log entries', () => {
    // Check for log entry cards
    cy.get('[class*="border"]').should('have.length.greaterThan', 1)
  })

  it('should show user information in logs', () => {
    // Check for email format
    cy.get('[class*="text-sm"]').should('contain', '@')
  })

  it('should display IP addresses', () => {
    // Check for IP address format (xxx.xxx.xxx.xxx)
    cy.contains(/\d+\.\d+\.\d+\.\d+/).should('exist')
  })

  it('should show category badges', () => {
    // Categories: auth, user, content, product, order, system, security
    cy.get('[class*="badge"]').should('exist')
  })

  it('should display status badges', () => {
    // Status: success, failed, warning
    cy.contains('success').should('exist')
  })

  it('should filter logs by search query', () => {
    const searchTerm = 'banned'
    
    cy.get('input[placeholder*="Search"]').type(searchTerm)
    cy.wait(500)
    
    // Should show filtered results
    cy.contains(searchTerm, { matchCase: false }).should('be.visible')
  })

  it('should open category filter dropdown', () => {
    cy.contains('All Categories').click()
    cy.wait(300)
    
    // Should show category options
    cy.contains('Authentication').should('be.visible')
    cy.contains('User Management').should('be.visible')
  })

  it('should filter by category', () => {
    cy.contains('All Categories').click()
    cy.contains('Authentication').click()
    cy.wait(500)
    
    // Should show only auth-related logs
    cy.get('[class*="badge"]').should('contain', 'auth')
  })

  it('should open status filter dropdown', () => {
    cy.contains('All Status').click()
    cy.wait(300)
    
    // Should show status options
    cy.contains('Success').should('be.visible')
    cy.contains('Failed').should('be.visible')
  })

  it('should filter by status', () => {
    cy.contains('All Status').click()
    cy.contains('Success').click()
    cy.wait(500)
    
    // Should show only successful logs
    cy.get('[class*="badge"]').should('contain', 'success')
  })

  it('should show change tracking', () => {
    // Check for old → new value indicators
    cy.get('[class*="text-red"]').should('exist')
    cy.get('[class*="text-green"]').should('exist')
  })

  it('should open detail modal when clicking log entry', () => {
    // Click on first log entry
    cy.get('[class*="cursor-pointer"]').first().click()
    cy.wait(300)
    
    // Modal should open
    cy.contains('Event Details').should('be.visible')
  })

  it('should display detailed information in modal', () => {
    cy.get('[class*="cursor-pointer"]').first().click()
    cy.wait(300)
    
    // Check for detail fields
    cy.contains('Event ID').should('be.visible')
    cy.contains('Timestamp').should('be.visible')
    cy.contains('User').should('be.visible')
  })

  it('should close modal when clicking close button', () => {
    cy.get('[class*="cursor-pointer"]').first().click()
    cy.wait(300)
    
    // Close modal
    cy.contains('Close').click()
    cy.wait(300)
    
    // Modal should be closed
    cy.contains('Event Details').should('not.exist')
  })

  it('should display export logs button', () => {
    cy.contains('Export Logs').should('be.visible')
  })

  it('should show timestamps', () => {
    // Check for relative time (e.g., "2 hours ago")
    cy.contains(/ago/).should('exist')
  })

  it('should display responsive layout on mobile', () => {
    cy.viewport('iphone-x')
    cy.contains('Audit Logs').should('be.visible')
  })

  it('should display responsive layout on tablet', () => {
    cy.viewport('ipad-2')
    cy.contains('Audit Logs').should('be.visible')
  })

  it('should clear search filter', () => {
    // Type search query
    cy.get('input[placeholder*="Search"]').type('test')
    cy.wait(300)
    
    // Clear search
    cy.get('input[placeholder*="Search"]').clear()
    cy.wait(300)
    
    // Should show all logs again
    cy.get('[class*="border"]').should('have.length.greaterThan', 1)
  })
})
