const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

class User {
  static async findByUsername(username) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findById(userId) {
    try {
      const [rows] = await pool.execute(
        'SELECT user_id, username, full_name, email, phone, role, status FROM users WHERE user_id = ?',
        [userId]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async create(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const [result] = await pool.execute(
        'INSERT INTO users (user_id, username, password_hash, full_name, email, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userData.user_id, userData.username, hashedPassword, userData.full_name, userData.email, userData.phone, userData.role]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static generateToken(user) {
    return jwt.sign(
      { userId: user.user_id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
}

module.exports = User;
