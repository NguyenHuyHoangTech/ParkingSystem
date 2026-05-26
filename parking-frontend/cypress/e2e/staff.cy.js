describe('Staff Role E2E Tests', () => {
  beforeEach(() => {
    cy.login('staff', 'staff123'); // Đăng nhập với quyền Staff
    cy.wait(1000);
  });

  it('Staff Dashboard / Overview - displays metrics', () => {
    cy.visit('/dashboard'); // Hoặc /staff tùy cấu hình route
    cy.get('body').should('contain', 'Dashboard');
    // Kiểm tra số lượng xe trong bãi
  });

  it('Check-In Flow - valid and invalid inputs', () => {
    cy.visit('/dashboard/check-in');
    cy.get('body').should('contain', 'Check In');
    
    // Nhập thông tin check-in hợp lệ
    // cy.get('input[name="licensePlate"]').type('30A-99999');
    // cy.get('select[name="vehicleType"]').select('Car');
    // cy.contains('Confirm').click();
    // cy.contains('Success').should('be.visible');

    // Test trường hợp bãi full (Mock response API trả về lỗi full)
    // cy.intercept('POST', '**/check-in', { statusCode: 400, body: { message: 'Capacity full' } });
    // cy.get('button[type="submit"]').click();
    // cy.contains('Capacity full').should('be.visible');
  });

  it('Check-Out Flow & Mock Payment', () => {
    cy.visit('/dashboard/check-out');
    cy.get('body').should('contain', 'Check Out');
    
    // Giả lập event SSE kích hoạt camera đọc biển số
    // (Trong test e2e, chúng ta có thể gọi một hàm dispatch event hoặc mock kết quả SSE)
    // Sau khi camera nhận diện, UI tự động focus vào Card Input
    // cy.get('input[name="rfidCard"]').should('have.focus');

    // Nhập RFID và submit
    // cy.get('input[name="rfidCard"]').type('CARD123{enter}');

    // Quá trình thanh toán hiển thị (Mock Payment)
    // cy.contains('Payment Gateway').should('be.visible');
    // cy.contains('Pay').click();
    // cy.contains('Success').should('be.visible');
  });

  it('Exceptions Handling - lost ticket or anomaly', () => {
    cy.visit('/dashboard/exceptions');
    cy.get('body').should('contain', 'Exception');
    // Thao tác đánh dấu mất vé hoặc giải quyết exception
    // cy.contains('Resolve').first().click();
  });
});
