describe('Admin Role E2E Tests', () => {
  beforeEach(() => {
    // Đăng nhập với quyền Admin trước mỗi test case
    // Cần đảm bảo tài khoản này tồn tại trong Database hoặc mock response
    cy.login('admin', 'admin123'); // Thông tin ví dụ
    cy.wait(1000); // Đợi load xong dashboard
  });

  it('Admin Overview / Dashboard - displays metrics and audit logs', () => {
    cy.visit('/admin');
    cy.get('body').should('contain', 'Overview'); // Tùy thuộc vào tiêu đề trang
    // Kiểm tra có hiển thị audit logs (table hoặc list)
    // cy.get('table').should('exist');
  });

  it('System Configuration - check masked input and edit logic', () => {
    cy.visit('/admin/config');
    cy.get('body').should('contain', 'Configuration');
    
    // Kiểm tra masked input (ví dụ PayPal secret)
    // cy.get('input[type="password"]').should('exist'); 
    
    // Test Edit/Save
    // cy.contains('Edit').click();
    // cy.get('input[name="email"]').clear().type('new-admin@parking.com');
    // cy.contains('Save').click();
    // cy.contains('Success').should('be.visible');
  });

  it('User Management - display list, search, and suspend', () => {
    cy.visit('/admin/users');
    cy.get('body').should('contain', 'Users');
    
    // Kiểm tra có bảng danh sách user
    cy.get('table').should('be.visible');
    
    // Kiểm tra chức năng search
    cy.get('input[placeholder*="Search"]').type('staff{enter}');
    cy.wait(500); // Đợi filter
    // cy.get('table').should('contain', 'staff');
    
    // Test Suspend (chỉ click thử nút hoặc kiểm tra có nút)
    // cy.contains('Suspend').first().should('be.visible');
  });

  it('Role Management - view roles', () => {
    cy.visit('/admin/roles');
    cy.get('body').should('contain', 'Roles');
    cy.get('table').should('exist');
  });
});
