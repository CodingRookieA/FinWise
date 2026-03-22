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

  it('should be able to go to chat from profile', () => {
    cy.get('#root div:nth-child(3) > div:nth-child(2) > span').click();
    // Page URL changed.
    cy.url()
      .should('eq', 'http://localhost:5173/chat')
    // The chat page heading 'How can I help you today?' is displayed.
    cy.get('#root h3._header_1385y_19')
      .should('contain.text', 'How can I help you')
    
  });

  it('should be able to logout from profile', () => {
    cy.get('#root div.css-1vg1991 button').click();
    // Page URL changed.
    cy.url()
      .should('eq', 'http://localhost:5173/')
    
    cy.get('#root div._navActions_5dmee_85 button:nth-child(1)').should('have.text', 'Log in');
  });

  //profile
  it('should be able to edit profile', () => {
    cy.get('#root input[placeholder="e.g., 3000"]').clear();
    cy.get('#root input[placeholder="e.g., 3000"]').type('3000');
    cy.get('#root input[placeholder="e.g., 5000"]').clear();
    cy.get('#root input[placeholder="e.g., 5000"]').type('5000');+
    cy.get('#root input[placeholder="e.g., 10000"]').clear();
    cy.get('#root input[placeholder="e.g., 10000"]').type('10000');
    cy.get('#root div.css-1bvc4cc button').click();
    cy.get('#root input[placeholder="e.g., 3000"]').should('have.value', '3000');
    cy.get('#root input[placeholder="e.g., 5000"]').should('have.value', '5000');
    cy.get('#root input[placeholder="e.g., 10000"]').should('have.value', '10000');
    cy.get('#root div[role="alert"] div:nth-child(2)').should('have.text', 'Saved!');
    cy.get('#root div[role="alert"]').should('be.visible');
  })

  // profolio
  it('should not be able to add invalid ETF', () => {
    cy.get('#root div:nth-child(2) > div:nth-child(2) > span').click();
    cy.get('#root button._actionBtn_1vrjf_223').click();
    cy.get('[name="symbol"]').click();
    cy.get('[name="symbol"]').type('1234');
    cy.get('[name="quantity"]').click();
    cy.get('[name="quantity"]').type('33');
    cy.get('div:nth-child(3) > button:nth-child(2)').click();
    cy.get('#root div.go3958317564').should('have.text', 'This ETF is invalid, or not part of the Canadian market');
    cy.get('#root div.go2072408551').should('be.visible');
  });

  it('should be able to add valid ETF', () => {
    cy.get('#root div:nth-child(2) > div:nth-child(2) > span').click();
    cy.get('#root button._actionBtn_1vrjf_223').click();
    cy.get('[name="symbol"]').click();
    cy.get('[name="symbol"]').type('APLE');
    cy.get('[name="quantity"]').click();
    cy.get('[name="quantity"]').type('20');
    cy.get('div:nth-child(3) > button:nth-child(2)').click();
    cy.get('#root td:nth-child(1)').should('have.text', 'APLE');
    cy.get('#root td:nth-child(2)').should('have.text', '20');
    cy.get('#root div:nth-child(1) > div._statValue_1vrjf_131').should('have.text', '1');
  });

  it('should be able to add more of the same ETF', () => {
    cy.get('#root div:nth-child(2) > div:nth-child(2) > span').click();
    cy.get('#root button._actionBtn_1vrjf_223').click();
    cy.get('[name="symbol"]').click();
    cy.get('[name="symbol"]').type('APLE');
    cy.get('[name="quantity"]').click();
    cy.get('[name="quantity"]').type('10');
    cy.get('div:nth-child(3) > button:nth-child(2)').click();
    cy.get('#root td:nth-child(1)').should('have.text', 'APLE');
    cy.get('#root td:nth-child(2)').should('have.text', '30');
    cy.get('#root div:nth-child(1) > div._statValue_1vrjf_131').should('have.text', '1');
  });

  it('should be able to edit etf', () => {
    cy.get('#root div:nth-child(2) > div:nth-child(2) > span').click();
    cy.get('[data-testid="EditIcon"]').click();
    cy.get('[name="quantity"]').click();
    cy.get('[name="quantity"]').clear();
    cy.get('[name="quantity"]').type('5');
    cy.get('div:nth-child(3) > button:nth-child(2)').click();
    cy.get('#root td:nth-child(2)').should('have.text', '5');
    cy.get('#root div:nth-child(2) > div._statValue_1vrjf_131').should('have.text', '5');
  });

  it('should be able to delete ETF', () => {
    cy.get('#root div:nth-child(2) > div:nth-child(2) > span').click();
    cy.get('[data-testid="DeleteOutlineIcon"]').click();
    cy.get('h5').should('have.text', 'Delete Asset?');
    cy.get('div:nth-child(3) p').should('have.text', 'Are you sure you want to remove this position? This action cannot be undone.');
    cy.get('div:nth-child(2) > button:nth-child(2)').click();
    cy.get('#root div:nth-child(1) > div._statValue_1vrjf_131').should('have.text', '0');
    cy.get('#root td').should('have.text', 'No assets found. Add one to get started.');
  });
})