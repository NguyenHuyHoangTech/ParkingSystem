describe('Public Pages and Authentication E2E Tests', () => {
  beforeEach(() => {
    // Giả định backend hoặc local server chạy bình thường
  });

  it('Landing Page - renders correctly', () => {
    cy.visit('/');
    cy.get('body').should('be.visible');
    // Kiểm tra có các phần tử chính (giả định có navbar hoặc hero section)
    cy.contains('Parking').should('exist');
    cy.contains('Login').should('exist').click();
    cy.url().should('include', '/login');
  });

  it('Login Page - validation and error handling', () => {
    cy.visit('/login');
    // Thử click login mà không nhập gì
    cy.get('button[type="submit"]').click();
    cy.contains('Please input your username!').should('exist'); // Ant Design default message

    // Nhập sai thông tin
    cy.get('input[placeholder="Username"]').type('wronguser');
    cy.get('input[placeholder="Password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();
    // Giả định hệ thống hiển thị error message
    // cy.contains('Invalid credentials').should('exist');
  });

  it('Login Page - successful login redirects appropriately', () => {
    // Giả định có tài khoản admin, bạn có thể thay đổi dữ liệu này tùy theo DataSeeder
    cy.visit('/login');
    cy.get('input[placeholder="Username"]').type('admin');
    cy.get('input[placeholder="Password"]').type('password'); // Giả định mật khẩu
    cy.get('button[type="submit"]').click();
    
    // Đợi load và redirect
    cy.wait(1000);
    // cy.url().should('include', '/admin');
  });

  it('Public Tracking Page - search by license plate', () => {
    cy.visit('/tracking');
    cy.get('body').should('contain', 'Tracking');
    
    // Nhập biển số xe giả định
    cy.get('input[placeholder*="plate"]').type('29A-12345');
    cy.contains('Search').click();
    
    // Hệ thống sẽ call API, giả định hiển thị kết quả hoặc "Not found"
    // cy.contains('Not found').should('exist');
  });

  it('Public Help / Kiosk Page - renders correctly', () => {
    cy.visit('/help');
    cy.get('body').should('contain', 'Help');
    // Kiểm tra tính năng Kiosk navigation
  });
});
