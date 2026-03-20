describe('Homepage Functionality', () => {
  it('loads the homepage and displays key sections', () => {
    cy.visit('/')
    cy.get('#root h1._heroTitle_tpezi_89').should('have.text', 'Your AI-PoweredFinancial Advisor');
    cy.get('#root h5._heroSubtitle_tpezi_115').should('have.text', 'Smart insights for Mutual Funds & ETFs. Make data-driven investment decisions with AI that understands the Canadian market.');
    cy.get('#root button._heroBtn_tpezi_149').should('be.visible');
    cy.get('#root a[href="#product"]').click();
    
    cy.url()
      .should('eq', 'http://localhost:5173/#product')
    
    cy.get('#product h2').should('have.text', 'Our Product');
    cy.get('#product div._sectionHeader_1ya25_123 h6').should('have.text', 'Harness the power of AI to navigate Canada\'s mutual fund and ETF landscape with confidence.');
    
    cy.get('#root a[href="#our-goal"]').click();
    // Page URL changed.
    cy.url()
      .should('eq', 'http://localhost:5173/#our-goal')
    
    cy.get('#our-goal h2').should('have.text', 'Our Goal');
    cy.get('#our-goal div._sectionHeader_1f2aa_125 h6').should('have.text', 'Empowering Canadians to build wealth through intelligent, accessible investing.');
    cy.get('#root a[href="#about-us"]').click();
    // Page URL changed.
    cy.url()
      .should('eq', 'http://localhost:5173/#about-us')
    
    cy.get('#about-us h3').should('have.text', 'About Us');
    cy.get('#about-us p').should('have.text', 'We\'re a Canadian fintech team passionate about making smart investing accessible to everyone. Built with Canadian regulations in mind, our AI understands the nuances of TFSA and other registered accounts.');
    
    cy.get('#root section._sectionAlt_shhdf_39 h2').should('have.text', 'Ready to Invest Smarter?');
    cy.get('#root section._sectionAlt_shhdf_39 h6').should('have.text', 'Join our Canadian investor community and use AI to optimize your mutual fund and ETF portfolios.');
    cy.get('#root button._heroBtn_shhdf_15').should('be.visible');
  });

  it('opens login modal from navbar', () => {
    cy.visit('/')
    cy.get('#root div._navActions_5dmee_85 button:nth-child(1)').click();
    // The login modal appeared
    cy.get('div[role="presentation"]')
      .should('be.visible')
    // The login modal title is 'Welcome to FinWise'
    cy.get('div._header_1jpfo_33 h3')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('Welcome to FinWise')
      })
    // The 'Log In' tab is selected
    cy.get('button._tabSelected_1jpfo_83')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.have.attr('aria-selected', 'true')
        expect($el).to.contain.text('Log In')
      })
    // The email input field is visible
    cy.get('input[type="email"]')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.have.attr('required')
        expect($el).to.have.value('')
      })
    // The password input field is visible
    cy.get('input[type="password"]')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.have.attr('required')
      })
    
    cy.get('button[tabindex="-1"]').click();
    // The 'Log In' tab is deselected.
    cy.get('button[tabindex="-1"]')
      .should(($el) => {
        expect($el).to.not.have.class('Mui-selected')
        expect($el).to.not.have.class('_tabSelected_1jpfo_83')
        expect($el).to.have.attr('aria-selected', 'false')
      })
    // The 'Create Account' tab is selected.
    cy.get('button[tabindex="0"][role="tab"]')
      .should(($el) => {
        expect($el).to.have.class('Mui-selected')
        expect($el).to.have.class('_tabSelected_1jpfo_83')
        expect($el).to.have.attr('aria-selected', 'true')
      })

    // The submit button text changed to 'Create Account'.
    cy.get('button._submitBtn_1jpfo_155')
      .should('contain.text', 'Create Account')
    // The prompt text changed to 'Already have an account?'.
    cy.get('p._switchText_1jpfo_205')
      .should(($el) => {
        expect($el).to.not.be.visible
        expect($el).to.contain.text('Already have an account?')
      })
    // The link text changed to 'Log in'.
    cy.get('span._switchLink_1jpfo_215')
      .should(($el) => {
        expect($el).to.not.be.visible
        expect($el).to.contain.text('Log in')
      })
    
  });

  it('navigates to chat page', () => {
    cy.visit('/')
    cy.get('#root button._heroBtn_5dmee_99').click();
    // Page URL changed.
    cy.url()
      .should('eq', 'http://localhost:5173/chat')
    cy.get('#root h3._header_1385y_19').should('have.text', 'How can I help you today?');
    
    cy.get('#root div._quickActions_1385y_27 h6').should('have.text', 'Quick Actions');
    
  });

  it('open login modal from buttons', () => {
    cy.visit('/')
    cy.get('#root button._heroBtn_tpezi_149').click();
    // The login modal is visible.
    cy.get('div[role="presentation"]')
      .should('be.visible')
    // The login modal title is 'Welcome to FinWise'.
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
    
    cy.get('[data-testid="CloseIcon"] path').click();
    // The main content of the page is now accessible.
    cy.get('#root')
      .should('not.have.attr', 'aria-hidden')
    
    cy.get('#root button._heroBtn_shhdf_15').click();
    // The main content of the page is hidden.
    cy.get('#root')
      .should('have.attr', 'aria-hidden', 'true')
    // The login modal is visible.
    cy.get('div[role="presentation"]')
      .should('be.visible')
    // The login modal title is 'Welcome to FinWise'.
    cy.get('div._header_1jpfo_33 h3')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('Welcome to FinWise')
      })
  });
});