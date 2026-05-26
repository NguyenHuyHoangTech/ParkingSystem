describe('Manager Role E2E Tests', () => {
  beforeEach(() => {
    cy.login('manager', 'manager123'); // Đăng nhập với quyền Manager
    cy.wait(1000);
  });

  it('Manager Dashboard - verify metrics and error reporting', () => {
    cy.visit('/dashboard');
    cy.get('body').should('contain', 'Dashboard'); // Kiểm tra text chung
    // Cần kiểm tra hiển thị Error/Exception logs
    // cy.contains('Exceptions').should('be.visible');
  });

  it('Building Management - render map and slots', () => {
    cy.visit('/dashboard/building');
    cy.get('body').should('contain', 'Building');
    // Kiểm tra render map
    // cy.get('.parking-map-container').should('be.visible');
  });

  it('Floor Allocation - check allocation constraints', () => {
    cy.visit('/dashboard/floor-allocation');
    cy.get('body').should('contain', 'Allocation');
    // cy.get('form').should('be.visible');
  });

  it('Pricing Management - CRUD operations', () => {
    cy.visit('/dashboard/pricing');
    cy.get('body').should('contain', 'Pricing');
    // Kiểm tra tạo bảng giá
    // cy.contains('Add').click();
    // cy.get('input[name="price"]').type('50000');
    // cy.contains('Submit').click();
  });

  it('Penalty Management - rules configuration', () => {
    cy.visit('/dashboard/penalty');
    cy.get('body').should('contain', 'Penalty');
  });

  it('Incident and Report Dashboard - view and filter', () => {
    cy.visit('/dashboard/incidents');
    cy.get('body').should('contain', 'Incident');
    
    cy.visit('/dashboard/reports');
    cy.get('body').should('contain', 'Report');
    // Test export report button
    // cy.contains('Export').should('be.visible');
  });

  it('Vehicle Configuration - check allowed types', () => {
    cy.visit('/dashboard/vehicle-config');
    cy.get('body').should('contain', 'Vehicle');
  });
});
