// cypress/support/commands.ts

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>
      logout(): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email = 'admin@mixillo.com', password = 'Test@123') => {
  cy.visit('/login')
  cy.get('[data-cy="login-email"]').clear().type(email)
  cy.get('[data-cy="login-password"]').clear().type(password)
  cy.get('[data-cy="login-submit"]').click()
  cy.url().should('include', '/dashboard')
  cy.get('[data-cy="header"]').should('be.visible')
})

Cypress.Commands.add('logout', () => {
  cy.clearCookies()
  cy.visit('/login')
})

export {}
