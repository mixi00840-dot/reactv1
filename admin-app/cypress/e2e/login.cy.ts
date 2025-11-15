describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('should display login form', () => {
    cy.get('[data-cy="login-email"]').should('be.visible')
    cy.get('[data-cy="login-password"]').should('be.visible')
    cy.get('[data-cy="login-submit"]').should('be.visible')
  })

  it('should login with valid credentials', () => {
    cy.get('[data-cy="login-email"]').type('admin@mixillo.com')
    cy.get('[data-cy="login-password"]').type('Test@123')
    cy.get('[data-cy="login-submit"]').click()
    
    cy.url().should('include', '/dashboard')
    cy.get('[data-cy="header"]').should('be.visible')
  })

  it('should show error with invalid credentials', () => {
    cy.get('[data-cy="login-email"]').type('invalid@test.com')
    cy.get('[data-cy="login-password"]').type('wrongpass')
    cy.get('[data-cy="login-submit"]').click()
    
    cy.get('[data-cy="login-error"]').should('be.visible')
  })

  it('should validate empty fields', () => {
    cy.get('[data-cy="login-submit"]').click()
    cy.url().should('include', '/login')
  })
})
