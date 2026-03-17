const request = require('supertest');
const express = require('express');
const session = require('express-session');
const authRoutes = require('../../routes/auth');

// Mock dependencies
jest.mock('../../models/User');
jest.mock('../../config/database');

const User = require('../../models/User');

describe('Auth Routes', () => {
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
    
    app.use('/', authRoutes);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should render login page when not logged in', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
    });
  });

  describe('POST /login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        user_id: 'ADMIN001',
        username: 'admin',
        password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe',
        full_name: 'System Administrator',
        role: 'admin',
        status: 'active'
      };

      User.findByUsername.mockResolvedValue(mockUser);
      User.validatePassword.mockResolvedValue(true);

      const response = await request(app)
        .post('/login')
        .send({ username: 'admin', password: 'admin123' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/dashboard');
    });

    it('should reject login with invalid username', async () => {
      User.findByUsername.mockResolvedValue(null);

      const response = await request(app)
        .post('/login')
        .send({ username: 'invalid', password: 'password' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/?error=T%C3%AAn%20%C4%91%C4%83ng%20nh%E1%BA%ADp%20kh%C3%B4ng%20t%E1%BB%93n%20t%E1%BA%A1i');
    });

    it('should reject login with invalid password', async () => {
      const mockUser = {
        user_id: 'ADMIN001',
        username: 'admin',
        password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe',
        status: 'active'
      };

      User.findByUsername.mockResolvedValue(mockUser);
      User.validatePassword.mockResolvedValue(false);

      const response = await request(app)
        .post('/login')
        .send({ username: 'admin', password: 'wrongpassword' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/?error=M%E1%BA%ADt%20kh%E1%BA%A9u%20kh%C3%B4ng%20ch%C3%ADnh%20x%C3%A1c');
    });

    it('should reject login with inactive account', async () => {
      const mockUser = {
        user_id: 'ADMIN001',
        username: 'admin',
        password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe',
        status: 'inactive'
      };

      User.findByUsername.mockResolvedValue(mockUser);
      User.validatePassword.mockResolvedValue(true);

      const response = await request(app)
        .post('/login')
        .send({ username: 'admin', password: 'admin123' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/?error=T%C3%A0i%20kho%E1%BA%A3n%20%C4%91%C3%A3%20b%E1%BB%8B%20kh%C3%B3a');
    });
  });

  describe('GET /logout', () => {
    it('should logout and redirect to login', async () => {
      const response = await request(app).get('/logout');
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/');
    });
  });
});
