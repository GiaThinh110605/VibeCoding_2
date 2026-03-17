const request = require('supertest');
const express = require('express');
const session = require('express-session');
const staffRoutes = require('../../routes/staff');

// Mock dependencies
jest.mock('../../config/database');

const mockPool = require('../../config/database');

describe('Staff Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Mock session middleware
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }));
    
    // Mock authenticated user
    app.use((req, res, next) => {
      req.session = {
        user: {
          user_id: 'ADMIN001',
          username: 'admin',
          full_name: 'Admin User',
          role: 'admin'
        }
      };
      next();
    });
    
    app.use('/staff', staffRoutes);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /staff', () => {
    it('should render staff management page', async () => {
      const mockStaff = [
        {
          user_id: 'NV001',
          username: 'staff1',
          full_name: 'Staff One',
          email: 'staff1@library.com',
          phone: '123456789',
          role: 'librarian',
          status: 'active'
        }
      ];

      const mockStats = {
        total_staff: 1,
        active_staff: 1,
        new_accounts: 0
      };

      mockPool.execute
        .mockResolvedValueOnce([mockStaff])
        .mockResolvedValueOnce([[mockStats]]);

      const response = await request(app).get('/staff');

      expect(response.status).toBe(200);
      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT user_id, username, full_name, email, phone, role, status, created_at FROM users')
      );
    });
  });

  describe('GET /staff/add', () => {
    it('should render add staff form', async () => {
      const response = await request(app).get('/staff/add');
      
      expect(response.status).toBe(200);
    });
  });

  describe('POST /staff/add', () => {
    it('should add new staff successfully', async () => {
      const staffData = {
        username: 'newstaff',
        password: 'password123',
        full_name: 'New Staff',
        email: 'newstaff@library.com',
        phone: '987654321',
        role: 'librarian'
      };

      mockPool.execute
        .mockResolvedValueOnce([[]]) // Check last staff
        .mockResolvedValueOnce([{ insertId: 1 }]); // Insert new staff

      const response = await request(app)
        .post('/staff/add')
        .send(staffData);

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/staff?success=Th%C3%AAm%20nh%C3%A2n%20vi%C3%AAn%20th%C3%A0nh%20c%C3%B4ng');
    });
  });

  describe('GET /staff/edit/:id', () => {
    it('should render edit staff form', async () => {
      const mockStaff = {
        user_id: 'NV001',
        username: 'staff1',
        full_name: 'Staff One',
        email: 'staff1@library.com',
        phone: '123456789',
        role: 'librarian',
        status: 'active'
      };

      mockPool.execute.mockResolvedValue([[mockStaff]]);

      const response = await request(app).get('/staff/edit/NV001');

      expect(response.status).toBe(200);
      expect(mockPool.execute).toHaveBeenCalledWith(
        'SELECT user_id, username, full_name, email, phone, role, status FROM users WHERE user_id = ?',
        ['NV001']
      );
    });

    it('should return 404 for non-existent staff', async () => {
      mockPool.execute.mockResolvedValue([[]]);

      const response = await request(app).get('/staff/edit/NONEXISTENT');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /staff/edit/:id', () => {
    it('should update staff information', async () => {
      const updateData = {
        full_name: 'Updated Name',
        email: 'updated@library.com',
        phone: '555555555',
        role: 'admin',
        status: 'active'
      };

      mockPool.execute.mockResolvedValue([{ affectedRows: 1 }]);

      const response = await request(app)
        .post('/staff/edit/NV001')
        .send(updateData);

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/staff?success=C%E1%BA%ADp%20nh%E1%BA%ADt%20th%C3%B4ng%20tin%20th%C3%A0nh%20c%C3%B4ng');
      expect(mockPool.execute).toHaveBeenCalledWith(
        'UPDATE users SET full_name = ?, email = ?, phone = ?, role = ?, status = ? WHERE user_id = ?',
        [updateData.full_name, updateData.email, updateData.phone, updateData.role, updateData.status, 'NV001']
      );
    });
  });

  describe('POST /staff/delete/:id', () => {
    it('should delete staff successfully', async () => {
      mockPool.execute.mockResolvedValue([{ affectedRows: 1 }]);

      const response = await request(app).post('/staff/delete/NV001');

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/staff?success=X%C3%B3a%20nh%C3%A2n%20vi%C3%AAn%20th%C3%A0nh%20c%C3%B4ng');
      expect(mockPool.execute).toHaveBeenCalledWith(
        'DELETE FROM users WHERE user_id = ?',
        ['NV001']
      );
    });
  });
});
