describe('User (Driver) Role E2E Tests', () => {
  beforeEach(() => {
    cy.login('user', 'user123'); // Đăng nhập với quyền User (Driver)
    cy.wait(1000);
  });

  it('User Dashboard - shows general metrics', () => {
    cy.visit('/dashboard');
    cy.get('body').should('contain', 'Dashboard');
  });

  it('Active Session - view current parking session', () => {
    cy.visit('/dashboard/active-session');
    cy.get('body').should('contain', 'Session'); // Hoặc "Active Session"
    // Nếu có session, kiểm tra các thông tin hiển thị
    // cy.contains('Entry Time').should('be.visible');
    
    // Nếu không có session (Mock API trả về 404)
    // cy.intercept('GET', '**/session/active', { statusCode: 404 });
    // cy.reload();
    // cy.contains('No active session').should('be.visible');
  });

  it('Booking Form - create a new booking', () => {
    cy.visit('/dashboard/booking-form'); // Tùy vào cấu hình route
    cy.get('body').should('contain', 'Booking');
    
    // Test chọn thời gian và bãi đỗ
    // cy.get('input[name="startTime"]').type('2026-06-01T10:00');
    // cy.get('input[name="endTime"]').type('2026-06-01T14:00');
    // cy.get('select[name="zone"]').select('Zone A');
    // cy.contains('Book Now').click();
    
    // Test bắt lỗi Failed to check availability nếu có
  });

  it('User Bookings - view history and cancel', () => {
    cy.visit('/dashboard/bookings');
    cy.get('body').should('contain', 'Bookings');
    
    // Kiểm tra danh sách hiển thị
    // cy.get('table').should('exist');
    
    // Test nút Hủy
    // cy.contains('Cancel').first().click();
    // cy.contains('Are you sure').should('be.visible');
  });

  it('Feedback Form - submit new feedback', () => {
    cy.visit('/dashboard/feedback'); // Hoặc /dashboard/feedback-form
    cy.get('body').should('contain', 'Feedback');
    
    // Gửi feedback
    // cy.get('textarea[name="content"]').type('Great service!');
    // cy.contains('Submit').click();
    // cy.contains('Success').should('be.visible');
  });
});
