const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Registration page
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/register', {
    title: 'Đăng ký',
    error: req.query.error
  });
});

// Registration process
router.post('/register', async (req, res) => {
  try {
    const { username, password, full_name, email, phone } = req.body;

    // Check if user already exists
    const [existingUser] = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.redirect('/auth/register?error=Tên đăng nhập đã tồn tại');
    }

    // Generate user ID
    const [lastUser] = await pool.query(
      'SELECT user_id FROM users WHERE user_id LIKE $1 ORDER BY user_id DESC LIMIT 1',
      ['US%']
    );

    let newId = 'US001';
    if (lastUser.rows.length > 0) {
      const lastNum = parseInt(lastUser.rows[0].user_id.substring(2)) + 1;
      newId = 'US' + String(lastNum).padStart(3, '0');
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user (default role: librarian)
    await pool.query(
      'INSERT INTO users (user_id, username, password_hash, full_name, email, phone, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [newId, username, hashedPassword, full_name, email, phone, 'librarian']
    );

    res.redirect('/?success=Đăng ký thành công! Vui lòng đăng nhập.');
  } catch (error) {
    console.error('Registration error:', error);
    res.redirect('/auth/register?error=Đã xảy ra lỗi, vui lòng thử lại');
  }
});

module.exports = router;
