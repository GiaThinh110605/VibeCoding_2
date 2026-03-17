const User = require('../../models/User');

describe('User Model', () => {
  let mockPool;

  beforeEach(() => {
    mockPool = require('../../config/database');
  });

  describe('findByUsername', () => {
    it('should return user when username exists', async () => {
      const mockUser = {
        user_id: 'ADMIN001',
        username: 'admin',
        password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe',
        full_name: 'System Administrator',
        role: 'admin'
      };

      mockPool.execute.mockResolvedValue([[mockUser]]);

      const result = await User.findByUsername('admin');

      expect(mockPool.execute).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE username = ?',
        ['admin']
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when username does not exist', async () => {
      mockPool.execute.mockResolvedValue([[]]);

      const result = await User.findByUsername('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockPool.execute.mockRejectedValue(new Error('Database error'));

      await expect(User.findByUsername('admin')).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should return user without password when user exists', async () => {
      const mockUser = {
        user_id: 'ADMIN001',
        username: 'admin',
        full_name: 'System Administrator',
        email: 'admin@library.com',
        phone: '123456789',
        role: 'admin'
      };

      mockPool.execute.mockResolvedValue([[mockUser]]);

      const result = await User.findById('ADMIN001');

      expect(mockPool.execute).toHaveBeenCalledWith(
        'SELECT user_id, username, full_name, email, phone, role, status FROM users WHERE user_id = ?',
        ['ADMIN001']
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should create new user with hashed password', async () => {
      const userData = {
        user_id: 'NV001',
        username: 'newuser',
        password: 'password123',
        full_name: 'New User',
        email: 'newuser@library.com',
        phone: '987654321',
        role: 'librarian'
      };

      mockPool.execute.mockResolvedValue([{ insertId: 1 }]);

      const result = await User.create(userData);

      expect(mockPool.execute).toHaveBeenCalledWith(
        'INSERT INTO users (user_id, username, password_hash, full_name, email, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userData.user_id, userData.user_id, userData.user_id, userData.full_name, userData.email, userData.phone, userData.role]
      );
      expect(result).toBe(1);
    });
  });

  describe('validatePassword', () => {
    it('should validate correct password', async () => {
      const plainPassword = 'admin123';
      const hashedPassword = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe';

      const result = await User.validatePassword(plainPassword, hashedPassword);

      expect(result).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const plainPassword = 'wrongpassword';
      const hashedPassword = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe';

      const result = await User.validatePassword(plainPassword, hashedPassword);

      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token for user', () => {
      const user = {
        user_id: 'ADMIN001',
        username: 'admin',
        role: 'admin'
      };

      const token = User.generateToken(user);

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });
});
