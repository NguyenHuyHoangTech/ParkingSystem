// ***********************************************
// Custom Cypress Commands
// ***********************************************

Cypress.Commands.add('login', (username, password) => {
  cy.visit('/login');
  cy.get('input[placeholder="Username"]').type(username);
  cy.get('input[placeholder="Password"]').type(password);
  cy.get('button[type="submit"]').click();
  // Wait for the login request to complete (can be adjusted based on actual API)
  cy.wait(500); 
});