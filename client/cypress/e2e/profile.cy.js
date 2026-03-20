describe('Profile page', () => {
  beforeEach(() => {
    cy.visit('/')
    
    cy.get('#root div._navActions_5dmee_85 button:nth-child(1)').click();
    cy.get('input[type="email"]').click();
    cy.get('input[type="email"]').type('a@a.com');
    cy.get('input[type="password"]').click();
    cy.get('input[type="password"]').type('a');
    cy.get('button._submitBtn_1jpfo_155').click();

    cy.url()
      .should('eq', 'http://localhost:5173/questionnaire')

    cy.visit('/profile')
  });

  it('should be able to logout from profile', function() {
    cy.get('#root div.css-1vg1991 button').click();
    // Page URL changed.
    cy.url()
      .should('eq', 'http://localhost:5173/')
    
    cy.get('#root div._navActions_5dmee_85 button:nth-child(1)').should('have.text', 'Log in');
  });

  it('change profile', function() {});
})