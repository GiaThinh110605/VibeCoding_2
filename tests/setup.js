// Test setup file
const { Pool } = require('mysql2/promise');

// Mock database for testing
const mockPool = {
  execute: jest.fn(),
  query: jest.fn(),
  end: jest.fn()
};

// Mock database module
jest.mock('../config/database', () => mockPool);

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});

// Mock session for testing
const mockSession = {
  user: {
    user_id: 'TEST001',
    username: 'testuser',
    full_name: 'Test User',
    role: 'admin'
  }
};

global.mockSession = mockSession;
