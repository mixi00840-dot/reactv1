describe('Users Page', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/users')
  })

  it('should display users table', () => {
    cy.get('[data-cy="page-title"]').should('contain', 'Users')
    cy.get('[data-cy="data-table"]').should('be.visible')
    cy.get('[data-cy="table-row"]').should('have.length.at.least', 1)
  })

  it('should allow search', () => {
    cy.get('[data-cy="search-input"]').type('admin')
    cy.get('[data-cy="search-button"]').click()
    cy.get('[data-cy="table-row"]').should('exist')
  })

  it('should change page size', () => {
    cy.get('[data-cy="page-size-select"]').select('50')
    cy.get('[data-cy="table-row"]').should('have.length.at.least', 1)
  })

  it('should navigate pages', () => {
    cy.get('[data-cy="next-page-button"]').should('exist')
  })

  it('should filter by role', () => {
    cy.get('[data-cy="filter-role"]').select('admin')
    cy.wait(500)
    cy.get('[data-cy="table-row"]').should('exist')
  })
})
