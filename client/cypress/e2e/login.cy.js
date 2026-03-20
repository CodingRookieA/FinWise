describe('Login Flow', () => {
  it('login to existing account', function() {
      cy.visit('/')
      
      cy.get('#root div._navActions_5dmee_85 button:nth-child(1)').click();
      // A login modal dialog has appeared.
      cy.get('div[role="presentation"]')
        .should('be.visible')
      // The modal title is 'Welcome to FinWise'.
      cy.get('div._header_1jpfo_33 h3')
        .should(($el) => {
          expect($el).to.be.visible
          expect($el).to.contain.text('Welcome to FinWise')
        })
      // The 'Log In' tab is selected.
      cy.get('button._tabSelected_1jpfo_83')
        .should(($el) => {
          expect($el).to.be.visible
          expect($el).to.have.attr('aria-selected', 'true')
          expect($el).to.contain.text('Log In')
        })
      // The email input field is visible.
      cy.get('input[type="email"]')
        .should(($el) => {
          expect($el).to.be.visible
          expect($el).to.have.attr('required')
          expect($el).to.have.value('')
        })
      // The password input field is visible.
      cy.get('input[type="password"]')
        .should(($el) => {
          expect($el).to.be.visible
          expect($el).to.have.attr('required')
        })
      // The 'Log in' button is visible.
      cy.get('button._submitBtn_1jpfo_155')
        .should(($el) => {
          expect($el).to.be.visible
          expect($el).to.contain.text('Log in')
        })
      
      cy.get('input[type="email"]').click();
      cy.get('input[type="email"]').type('a@a.com');
      // The email input field displays 'a@a.com'.
      cy.get('input[type="email"]')
        .should('have.value', 'a@a.com')
      
      cy.get('input[type="password"]').type('a');
      cy.get('button._submitBtn_1jpfo_155').click();
      // Page URL changed.
      cy.url()
        .should('eq', 'http://localhost:5173/questionnaire')
      
  });

  it('should not be able to create an account with used email', function() {
    cy.visit('/')
    
    cy.get('#root div._navActions_5dmee_85 button:nth-child(1)').click();
    cy.get('button[tabindex="-1"]').click();
    cy.get('input[type="text"]').click();
    cy.get('input[type="text"]').type('a');
    cy.get('input[type="email"]').click();
    cy.get('input[type="email"]').type('a@a.com');
    cy.get('button._submitBtn_1jpfo_155').click();
    
    cy.get('input[type="password"]').click();
    cy.get('input[type="password"]').type('aa');
    cy.get('button._submitBtn_1jpfo_155').click();
    cy.get('#root div.go2072408551').should('have.text', 'The email is already registered.');
    cy.get('#root div.go3958317564').should('be.visible');
  });

  it('should not be able to login with incorrect password', function() {
    cy.visit('/')
    
    cy.get('#root div._navActions_5dmee_85 button:nth-child(1)').click();
    cy.get('input[type="email"]').click();
    cy.get('input[type="email"]').type('a@a.com');
    cy.get('input[type="password"]').click();
    cy.get('input[type="password"]').type('test');
    cy.get('button._submitBtn_1jpfo_155').click();
    cy.get('#root div.go3958317564').should('be.visible');
    cy.get('#root div.go3958317564').should('have.text', 'The password is incorrect');
  });

  it('should not be able to log into an account that doesnt exist', function() {
    cy.visit('/')
    cy.get('#root div._navActions_5dmee_85 button:nth-child(1)').click();
    cy.get('input[type="email"]').click();
    cy.get('input[type="email"]').type('b@b.com');
    cy.get('input[type="password"]').type('b');
    cy.get('button._submitBtn_1jpfo_155').click();
    cy.get('#root div.go3958317564').should('have.text', 'This account does not exist');
    cy.get('#root div.go3958317564').should('be.visible');
  });

  it('should get message when trying to log into an account registered with google', function() {
    cy.visit('/')
    
    cy.get('#root div._navActions_5dmee_85 button:nth-child(1)').click();
    cy.get('input[type="email"]').click();
    cy.get('input[type="email"]').type('vmkcreeper@gmail.com');
    cy.get('input[type="password"]').type('test');
    cy.get('button._submitBtn_1jpfo_155').click();
    cy.get('#root div.go3958317564').should('be.visible');
    cy.get('#root div.go3958317564').should('have.text', 'This account was created using google. Please use google to log in');
  });

  it('should be redirected to email verification page if account not verified', function() {
    cy.visit('/')
    
    cy.get('#root div._navActions_5dmee_85 button:nth-child(1)').click();
    cy.get('input[type="email"]').click();
    cy.get('input[type="email"]').type('c@c.com');
    cy.get('input[type="password"]').type('c');
    cy.get('button._submitBtn_1jpfo_155').click();
    // Page URL changed.
    cy.url()
      .should('eq', 'http://localhost:5173/questionnaire')
    
    cy.get('#root button').should('have.text', 'Resend verification email');
    cy.get('#root button').should('be.visible');
    cy.get('#root h5').should('have.text', 'Check your email');
    cy.get('#root p:nth-child(4)').should('have.text', 'We\'ve sent a verification link to your email address. Please click the link to verify your account.');
    cy.get('#root p:nth-child(5)').should('have.text', 'Didn\'t receive the email? Check your spam folder or request a new one.');
  });

  it('should be able to logout', function() {
    cy.visit('/')
    
    cy.get('#root div._navActions_5dmee_85 button:nth-child(1)').click();
    cy.get('input[type="email"]').click();
    cy.get('input[type="email"]').type('c@c.com');
    cy.get('input[type="password"]').type('c');
    cy.get('button._submitBtn_1jpfo_155').click();
    cy.get('#root a._link_bqtek_187').click();
    cy.get('#root div._navActions_5dmee_85 button:nth-child(1)').should('have.text', 'Log out');
    cy.get('#root div._navActions_5dmee_85 button:nth-child(1)').click();
    cy.get('#root div._navActions_5dmee_85 button:nth-child(1)').should('have.text', 'Log in');
    cy.get('#root div._navActions_5dmee_85 button:nth-child(1)').click();
    // A login modal dialog has appeared.
    cy.get('div[role="presentation"]')
      .should('be.visible')
  });
});
