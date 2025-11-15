// ***********************************************************
// Cypress Support File
// ***********************************************************

import './commands';
import './make-tests-resilient';

// Prevent uncaught exceptions from failing tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // Log the error for debugging
  console.error('Uncaught exception:', err);
  
  // Don't fail tests on uncaught exceptions from the app
  // This is common in React apps during development
  return false;
});

// Set up before each test
beforeEach(() => {
  // Clear local storage
  cy.clearLocalStorage();
  
  // Clear cookies
  cy.clearCookies();
});

// Global configuration
Cypress.Commands.add('waitForAppLoad', () => {
  cy.get('body').should('be.visible');
});
