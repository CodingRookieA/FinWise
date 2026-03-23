describe('Chat page', () => {
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

    cy.visit('/chat')
  });

  it('should be able to select some quick actions', () => {
    cy.get('#root div._quickActions_1385y_27 h6').should('have.text', 'Quick Actions');
    cy.get('#root div.css-6lseaf div:nth-child(1)').should('have.text', 'What should I invest in?');
    cy.get('#root div:nth-child(2) > span:nth-child(1)').should('have.text', 'What are some financial advices for beginners?');
    cy.get('#root div:nth-child(3) span:nth-child(1)').should('have.text', 'Canadian ETF funds market today?');
    cy.get('#root div:nth-child(1) > span:nth-child(1)').click();
    cy.get('#root textarea[aria-invalid="false"]').should('have.value', 'What should I invest in?');
    cy.get('#root div:nth-child(2) > span:nth-child(1)').click();
    cy.get('#root textarea[aria-invalid="false"]').should('have.value', 'What are some financial advices for beginners?');
    cy.get('#root div:nth-child(3) span:nth-child(1)').click();
    cy.get('#root textarea[aria-invalid="false"]').should('have.value', 'Canadian ETF funds market today?');
  })

  it('should be able to view previous chat history', () => {
    cy.get('#root div._quickActions_1385y_27 h6').should('have.text', 'Quick Actions');
    cy.get('#root li p').click();
    cy.get('#root div.css-5orz0k div:nth-child(2)')
      .should('contain.text', 'What should I invest in?')
    cy.get('#root div._quickActions_1385y_27 h6').should('not.exist');
    
    cy.get('#root div.css-5orz0k p').should('have.text', 'What should I invest in?');
  });

  it('should be able to create new chat', () => {
    cy.get('#root div._quickActions_1385y_27 h6').should('have.text', 'Quick Actions');
    cy.get('#root li p').click();
    cy.contains('How can I help you today?').should('not.exist');
    cy.get('#root div.css-5orz0k p').should('have.text', 'What should I invest in?');
    cy.get('#root button:nth-child(3)').click();
    cy.get('#root h3._header_1385y_19').should('have.text', 'How can I help you today?');
    cy.get('#root div._quickActions_1385y_27 h6').should('have.text', 'Quick Actions');
  });

  it('should be able to open and close sidebar', () => {
    cy.get('#root div.css-5vk6fy > p:nth-child(1)').should('have.text', 'Chat history');
    cy.get('div:nth-child(1) div.css-1sm2s1z div.css-1xcn3f8 button [data-testid="CloseIcon"]').click();
    // The menu icon container is now visible.
    cy.get('#root main.css-1yh0x47 > div:nth-child(1)')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.have.class('css-1qdx46r')
        expect($el).to.not.have.class('css-arn8q2')
      })
    
    cy.contains('Chat history').should('not.be.visible')
    
    cy.get('[data-testid="MenuIcon"] path').click();
    cy.get('#root div.css-5vk6fy > p:nth-child(1)').should('have.text', 'Chat history');
    cy.get('#root button:nth-child(3)').should('be.visible');
  });

  it('should be able to go to profile', () => {
    cy.get('#root div.css-1g68m89 p').click();
    cy.url()
      .should('eq', 'http://localhost:5173/profile')
  });
})