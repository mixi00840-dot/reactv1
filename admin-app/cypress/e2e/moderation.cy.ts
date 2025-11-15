describe('Content Moderation', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/content')
  })

  it('should display content list', () => {
    cy.get('[data-cy="page-title"]').should('contain', 'Content')
    cy.get('[data-cy="data-table"]').should('be.visible')
  })

  it('should filter by status', () => {
    cy.get('[data-cy="filter-status"]').select('active')
    cy.wait(500)
    cy.get('[data-cy="table-row"]').should('exist')
  })

  it('should display action buttons', () => {
    cy.get('[data-cy="table-row"]').first().within(() => {
      cy.get('[data-cy="action-activate"], [data-cy="action-deactivate"], [data-cy="action-ban"]').should('exist')
    })
  })
})

describe('Comment Moderation', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/comments')
  })

  it('should display comments list', () => {
    cy.get('[data-cy="page-title"]').should('contain', 'Comments')
    cy.get('[data-cy="data-table"]').should('be.visible')
  })

  it('should allow text search', () => {
    cy.get('[data-cy="search-input"]').type('test')
    cy.get('[data-cy="search-button"]').click()
    cy.wait(500)
  })

  it('should filter by status', () => {
    cy.get('[data-cy="filter-status"]').select('pending')
    cy.wait(500)
  })

  it('should display moderation buttons', () => {
    cy.get('[data-cy="table-row"]').first().within(() => {
      cy.get('[data-cy="action-approve"], [data-cy="action-reject"], [data-cy="action-spam"]').should('exist')
    })
  })
})
