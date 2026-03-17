const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Login page
router.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', {
    title: 'Đăng nhập',
    error: req.query.error,
    success: req.query.success
  });
});

// Login process
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const [user] = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (user.rows.length === 0) {
      return res.redirect('/?error=Tên đăng nhập không tồn tại');
    }

    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isValidPassword) {
      return res.redirect('/?error=Mật khẩu không chính xác');
    }

    if (user.rows[0].status !== 'active') {
      return res.redirect('/?error=Tài khoản đã bị khóa');
    }

    // Store user in session
    req.session.user = {
      user_id: user.rows[0].user_id,
      username: user.rows[0].username,
      full_name: user.rows[0].full_name,
      role: user.rows[0].role
    };

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.redirect('/?error=Đã xảy ra lỗi, vui lòng thử lại');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

module.exports = router;
