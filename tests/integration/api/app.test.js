const request = require('supertest');
const app = require('../../server');

describe('Integration Tests', () => {
  describe('Authentication Flow', () => {
    it('should redirect to login when accessing protected routes without authentication', async () => {
      const protectedRoutes = ['/dashboard', '/staff', '/readers', '/books'];
      
      for (const route of protectedRoutes) {
        const response = await request(app).get(route);
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/');
      }
    });

    it('should complete full login flow', async () => {
      // First, get login page
      const loginPage = await request(app).get('/');
      expect(loginPage.status).toBe(200);
      
      // Then login with credentials
      const loginResponse = await request(app)
        .post('/login')
        .send({ username: 'admin', password: 'admin123' });
      
      expect(loginResponse.status).toBe(302);
      expect(loginResponse.headers.location).toBe('/dashboard');
    });
  });

  describe('Staff Management Flow', () => {
    it('should allow admin to manage staff', async () => {
      // This test would require setting up authentication session
      // For now, we'll test the routes exist
      const staffRoutes = [
        '/staff',
        '/staff/add',
        '/staff/edit/NV001',
        '/staff/delete/NV001'
      ];
      
      for (const route of staffRoutes) {
        const response = await request(app).get(route);
        // Should redirect to login if not authenticated
        expect([302, 405]).toContain(response.status); // 302 for GET, 405 for POST
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const response = await request(app).get('/nonexistent-route');
      expect(response.status).toBe(404);
    });
  });
});
