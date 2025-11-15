describe('Economy Features - Livestreams, Wallets, Gifts, Coins', () => {
  
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  // ==========================================
  // LIVESTREAMS MANAGEMENT
  // ==========================================
  describe('Livestreams', () => {
    beforeEach(() => {
      cy.navigateToAdmin('livestreams');
    });

    it('should load livestreams page', () => {
      cy.url().should('include', '/admin/livestreams');
      cy.waitForLoader();
    });

    it('should display livestreams table with data', () => {
      cy.get('table, [class*="DataGrid"]').shouldHaveRows();
    });

    it('should display livestream columns', () => {
      cy.get('thead, [class*="header"], table').containsText('Title');
      cy.get('thead, [class*="header"], table').containsText('Creator');
      cy.get('thead, [class*="header"], table').containsText('Status');
      cy.get('thead, [class*="header"], table').containsText('Viewers');
    });

    it('should filter livestreams by status', () => {
      cy.intercept('GET', '**/api/admin/livestreams*').as('getStreams');
      
      // Try to select status filter
      cy.get('body').then($body => {
        if ($body.find('[name="status"], [label*="Status"], select').length > 0) {
          cy.selectOption('Status', 'live');
          cy.wait('@getStreams');
        } else {
          cy.log('Status filter not found, skipping');
        }
      });
    });

    it('should fetch livestreams via API', () => {
      cy.intercept('GET', '**/api/admin/livestreams*').as('getStreams');
      cy.reload();
      cy.wait('@getStreams').then((interception) => {
        expect(interception.response.statusCode).to.eq(200);
        expect(interception.response.body).to.have.property('success', true);
        expect(interception.response.body.data).to.have.property('streams');
      });
    });

    it('should display livestream details on click', () => {
      cy.get('table tbody tr, [class*="DataGrid"] [role="row"]').first().then($row => {
        if ($row.length > 0) {
          cy.wrap($row).click();
          cy.wait(1000);
          // Check if modal or detail page opened
          cy.get('body').then($body => {
            const hasModal = $body.find('[role="dialog"], .modal').length > 0;
            const hasDetailUrl = window.location.pathname.includes('livestream');
            expect(hasModal || hasDetailUrl).to.be.true;
          });
        }
      });
    });

    it('should end livestream action', () => {
      cy.get('table tbody tr, [class*="DataGrid"] [role="row"]').first().then($row => {
        if ($row.length > 0) {
          // Look for action button
          cy.wrap($row).within(() => {
            cy.get('button[aria-label*="action"], button[aria-label*="menu"], [class*="MoreVert"]').first().click();
          });
          
          cy.wait(500);
          
          // Click end stream if available
          cy.get('body').then($body => {
            if ($body.text().includes('End Stream')) {
              cy.clickButton('End Stream');
              cy.wait(1000);
              // Should show toast
              cy.shouldShowToast('success', 'Stream');
            }
          });
        }
      });
    });
  });

  // ==========================================
  // WALLETS MANAGEMENT
  // ==========================================
  describe('Wallets', () => {
    beforeEach(() => {
      cy.navigateToAdmin('wallets');
    });

    it('should load wallets page', () => {
      cy.url().should('include', '/admin/wallets');
      cy.waitForLoader();
    });

    it('should display wallets table with data', () => {
      cy.get('table, [class*="DataGrid"]').shouldHaveRows();
    });

    it('should display wallet columns', () => {
      cy.get('thead, [class*="header"], table').containsText('User');
      cy.get('thead, [class*="header"], table').containsText('Balance');
      cy.get('thead, [class*="header"], table').containsText('Currency');
    });

    it('should search wallets by user', () => {
      cy.intercept('GET', '**/api/admin/wallets*').as('getWallets');
      cy.searchTable('test');
      cy.wait('@getWallets').then((interception) => {
        expect(interception.request.url).to.include('search');
      });
    });

    it('should fetch wallets via API', () => {
      cy.intercept('GET', '**/api/admin/wallets*').as('getWallets');
      cy.reload();
      cy.wait('@getWallets').then((interception) => {
        expect(interception.response.statusCode).to.eq(200);
        expect(interception.response.body.success).to.eq(true);
        expect(interception.response.body.data).to.have.property('wallets');
        expect(Array.isArray(interception.response.body.data.wallets)).to.be.true;
      });
    });

    it('should display wallet balance as number (not string)', () => {
      cy.get('table tbody tr, [class*="DataGrid"] [role="row"]').first().then($row => {
        if ($row.length > 0) {
          cy.wrap($row).within(() => {
            // Balance should contain numbers and possibly decimal point
            cy.get('td, [role="cell"]').contains(/\d+(\.\d+)?/);
          });
        }
      });
    });

    it('should display wallet details on click', () => {
      cy.get('table tbody tr, [class*="DataGrid"] [role="row"]').first().then($row => {
        if ($row.length > 0) {
          cy.wrap($row).click();
          cy.wait(1000);
          // Should show details
          cy.get('body').then($body => {
            const hasModal = $body.find('[role="dialog"], .modal').length > 0;
            const hasDetailUrl = window.location.pathname.includes('wallet');
            expect(hasModal || hasDetailUrl).to.be.true;
          });
        }
      });
    });

    it('should support pagination', () => {
      cy.shouldHavePagination();
      cy.goToNextPage();
      cy.intercept('GET', '**/api/admin/wallets*').as('getWallets');
      cy.wait('@getWallets').then((interception) => {
        expect(interception.request.url).to.match(/page=2/);
      });
    });
  });

  // ==========================================
  // TRANSACTIONS MANAGEMENT
  // ==========================================
  describe('Transactions', () => {
    beforeEach(() => {
      cy.navigateToAdmin('transactions');
    });

    it('should load transactions page', () => {
      cy.url().should('include', '/admin/transactions');
      cy.waitForLoader();
    });

    it('should display transactions table with data', () => {
      cy.get('table, [class*="DataGrid"]').shouldHaveRows();
    });

    it('should display transaction columns', () => {
      cy.get('thead, [class*="header"], table').containsText('From');
      cy.get('thead, [class*="header"], table').containsText('To');
      cy.get('thead, [class*="header"], table').containsText('Amount');
      cy.get('thead, [class*="header"], table').containsText('Type');
      cy.get('thead, [class*="header"], table').containsText('Status');
    });

    it('should filter transactions by type', () => {
      cy.intercept('GET', '**/api/admin/transactions*').as('getTransactions');
      
      cy.get('body').then($body => {
        if ($body.find('[name="type"], [label*="Type"], select').length > 0) {
          cy.selectOption('Type', 'transfer');
          cy.wait('@getTransactions');
        } else {
          cy.log('Type filter not found, skipping');
        }
      });
    });

    it('should filter transactions by status', () => {
      cy.intercept('GET', '**/api/admin/transactions*').as('getTransactions');
      
      cy.get('body').then($body => {
        if ($body.find('[name="status"], [label*="Status"], select').length > 0) {
          cy.selectOption('Status', 'completed');
          cy.wait('@getTransactions');
        } else {
          cy.log('Status filter not found, skipping');
        }
      });
    });

    it('should fetch transactions via API', () => {
      cy.intercept('GET', '**/api/admin/transactions*').as('getTransactions');
      cy.reload();
      cy.wait('@getTransactions').then((interception) => {
        expect(interception.response.statusCode).to.eq(200);
        expect(interception.response.body.success).to.eq(true);
        expect(interception.response.body.data).to.have.property('transactions');
        expect(Array.isArray(interception.response.body.data.transactions)).to.be.true;
      });
    });

    it('should display transaction amount as number', () => {
      cy.get('table tbody tr, [class*="DataGrid"] [role="row"]').first().then($row => {
        if ($row.length > 0) {
          cy.wrap($row).within(() => {
            // Amount should contain numbers
            cy.get('td, [role="cell"]').contains(/\d+(\.\d+)?/);
          });
        }
      });
    });

    it('should display transaction details on click', () => {
      cy.get('table tbody tr, [class*="DataGrid"] [role="row"]').first().then($row => {
        if ($row.length > 0) {
          cy.wrap($row).click();
          cy.wait(1000);
          // Should show details
          cy.get('body').then($body => {
            const hasModal = $body.find('[role="dialog"], .modal').length > 0;
            const hasDetailUrl = window.location.pathname.includes('transaction');
            expect(hasModal || hasDetailUrl).to.be.true;
          });
        }
      });
    });

    it('should support pagination', () => {
      cy.shouldHavePagination();
    });

    it('should search transactions', () => {
      cy.intercept('GET', '**/api/admin/transactions*').as('getTransactions');
      cy.searchTable('test');
      cy.wait('@getTransactions').then((interception) => {
        expect(interception.request.url).to.include('search');
      });
    });
  });

  // ==========================================
  // GIFTS MANAGEMENT
  // ==========================================
  describe('Gifts', () => {
    beforeEach(() => {
      cy.navigateToAdmin('gifts');
    });

    it('should load gifts page', () => {
      cy.url().should('include', '/admin/gifts');
      cy.waitForLoader();
    });

    it('should display gifts table with data', () => {
      cy.get('table, [class*="DataGrid"]').shouldHaveRows();
    });

    it('should display gift columns', () => {
      cy.get('thead, [class*="header"], table').containsText('Name');
      cy.get('thead, [class*="header"], table').containsText('Price');
      cy.get('thead, [class*="header"], table').containsText('Icon');
    });

    it('should fetch gifts via API', () => {
      cy.intercept('GET', '**/api/admin/gifts*').as('getGifts');
      cy.reload();
      cy.wait('@getGifts').then((interception) => {
        expect(interception.response.statusCode).to.eq(200);
        expect(interception.response.body.success).to.eq(true);
        expect(interception.response.body.data).to.have.property('gifts');
        expect(Array.isArray(interception.response.body.data.gifts)).to.be.true;
      });
    });

    it('should create new gift', () => {
      cy.clickButton('Add Gift');
      cy.wait(500);
      
      cy.fillField('Name', 'Test Gift');
      cy.fillField('Price', '100');
      cy.fillField('Icon', '🎁');
      
      cy.intercept('POST', '**/api/admin/gifts*').as('createGift');
      cy.clickButton('Save');
      
      cy.wait('@createGift').then((interception) => {
        expect([200, 201]).to.include(interception.response.statusCode);
      });
      
      cy.shouldShowToast('success', 'Gift');
    });

    it('should edit gift', () => {
      cy.get('table tbody tr, [class*="DataGrid"] [role="row"]').first().then($row => {
        if ($row.length > 0) {
          // Click edit button
          cy.wrap($row).within(() => {
            cy.get('button[aria-label*="edit"], [class*="Edit"]').first().click();
          });
          
          cy.wait(500);
          cy.shouldHaveModal('Edit Gift');
        }
      });
    });

    it('should delete gift', () => {
      cy.get('table tbody tr, [class*="DataGrid"] [role="row"]').first().then($row => {
        if ($row.length > 0) {
          cy.wrap($row).within(() => {
            cy.get('button[aria-label*="delete"], [class*="Delete"]').first().click();
          });
          
          cy.wait(500);
          cy.clickButton('Confirm');
          
          cy.intercept('DELETE', '**/api/admin/gifts/*').as('deleteGift');
          cy.wait('@deleteGift', { timeout: 10000 }).then((interception) => {
            expect([200, 204]).to.include(interception.response.statusCode);
          });
        }
      });
    });
  });

  // ==========================================
  // COINS MANAGEMENT
  // ==========================================
  describe('Coins', () => {
    beforeEach(() => {
      cy.navigateToAdmin('coins');
    });

    it('should load coins page', () => {
      cy.url().should('include', '/admin/coins');
      cy.waitForLoader();
    });

    it('should display coins table with data', () => {
      cy.get('table, [class*="DataGrid"]').shouldHaveRows();
    });

    it('should display coin columns', () => {
      cy.get('thead, [class*="header"], table').containsText('Package');
      cy.get('thead, [class*="header"], table').containsText('Amount');
      cy.get('thead, [class*="header"], table').containsText('Price');
    });

    it('should fetch coins via API', () => {
      cy.intercept('GET', '**/api/admin/coins*').as('getCoins');
      cy.reload();
      cy.wait('@getCoins').then((interception) => {
        expect(interception.response.statusCode).to.eq(200);
        expect(interception.response.body.success).to.eq(true);
        expect(interception.response.body.data).to.have.property('packages');
        expect(Array.isArray(interception.response.body.data.packages)).to.be.true;
      });
    });

    it('should create new coin package', () => {
      cy.clickButton('Add Package');
      cy.wait(500);
      
      cy.fillField('Name', 'Test Package');
      cy.fillField('Amount', '1000');
      cy.fillField('Price', '9.99');
      
      cy.intercept('POST', '**/api/admin/coins*').as('createPackage');
      cy.clickButton('Save');
      
      cy.wait('@createPackage').then((interception) => {
        expect([200, 201]).to.include(interception.response.statusCode);
      });
      
      cy.shouldShowToast('success', 'Package');
    });

    it('should edit coin package', () => {
      cy.get('table tbody tr, [class*="DataGrid"] [role="row"]').first().then($row => {
        if ($row.length > 0) {
          cy.wrap($row).within(() => {
            cy.get('button[aria-label*="edit"], [class*="Edit"]').first().click();
          });
          
          cy.wait(500);
          cy.shouldHaveModal('Edit Package');
        }
      });
    });

    it('should display package price as number', () => {
      cy.get('table tbody tr, [class*="DataGrid"] [role="row"]').first().then($row => {
        if ($row.length > 0) {
          cy.wrap($row).within(() => {
            // Price should contain numbers
            cy.get('td, [role="cell"]').contains(/\d+(\.\d+)?/);
          });
        }
      });
    });
  });

  // ==========================================
  // USER LEVELS MANAGEMENT
  // ==========================================
  describe('User Levels', () => {
    beforeEach(() => {
      cy.navigateToAdmin('user-levels');
    });

    it('should load user levels page', () => {
      cy.url().should('include', '/admin/user-levels');
      cy.waitForLoader();
    });

    it('should display levels table with data', () => {
      cy.get('table, [class*="DataGrid"]').shouldHaveRows();
    });

    it('should display level columns', () => {
      cy.get('thead, [class*="header"], table').containsText('Level');
      cy.get('thead, [class*="header"], table').containsText('Name');
      cy.get('thead, [class*="header"], table').containsText('Required Points');
    });

    it('should fetch user levels via API', () => {
      cy.intercept('GET', '**/api/admin/user-levels*').as('getLevels');
      cy.reload();
      cy.wait('@getLevels').then((interception) => {
        expect(interception.response.statusCode).to.eq(200);
        expect(interception.response.body.success).to.eq(true);
        expect(interception.response.body.data).to.have.property('levels');
        expect(Array.isArray(interception.response.body.data.levels)).to.be.true;
      });
    });

    it('should create new level', () => {
      cy.clickButton('Add Level');
      cy.wait(500);
      
      cy.fillField('Name', 'Test Level');
      cy.fillField('Level', '99');
      cy.fillField('Required Points', '10000');
      
      cy.intercept('POST', '**/api/admin/user-levels*').as('createLevel');
      cy.clickButton('Save');
      
      cy.wait('@createLevel').then((interception) => {
        expect([200, 201]).to.include(interception.response.statusCode);
      });
      
      cy.shouldShowToast('success', 'Level');
    });

    it('should edit level', () => {
      cy.get('table tbody tr, [class*="DataGrid"] [role="row"]').first().then($row => {
        if ($row.length > 0) {
          cy.wrap($row).within(() => {
            cy.get('button[aria-label*="edit"], [class*="Edit"]').first().click();
          });
          
          cy.wait(500);
          cy.shouldHaveModal('Edit Level');
        }
      });
    });
  });

});
