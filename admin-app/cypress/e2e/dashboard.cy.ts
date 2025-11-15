describe('Dashboard Page', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should display dashboard metrics', () => {
    cy.visit('/dashboard')
    cy.get('[data-cy="dashboard-title"]').should('contain', 'Dashboard')
    cy.get('[data-cy="metric-card"]').should('have.length.at.least', 3)
  })

  it('should show loading state initially', () => {
    cy.visit('/dashboard')
    cy.get('[data-cy="dashboard-loading"]').should('exist')
  })

  it('should navigate to users from nav', () => {
    cy.visit('/dashboard')
    cy.get('[data-cy="nav-users"]').click()
    cy.url().should('include', '/users')
  })
})
