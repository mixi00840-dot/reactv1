const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    viewportWidth: 1920,
    viewportHeight: 1080,
    chromeWebSecurity: false,
    env: {
      apiUrl: 'https://mixillo-backend-52242135857.europe-west1.run.app',
      adminEmail: 'admin',
      adminPassword: 'Admin@123456',
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
      });
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.test.{js,jsx,ts,tsx}',
  },
});
