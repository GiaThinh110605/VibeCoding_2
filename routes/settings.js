const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Settings page
router.get('/', requireAuth, async (req, res) => {
  try {
    let settings = { total_users: 0, admin_count: 0, librarian_count: 0, active_users: 0, new_users: 0 };
    let libraryStats = { total_majors: 0, total_titles: 0, total_copies: 0, total_readers: 0 };
    let borrowingStats = { total_transactions: 0, current_borrows: 0, returned_books: 0, overdue_books: 0 };

    try {
      const settingsResult = await pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COALESCE(COUNT(CASE WHEN role = 'admin' THEN 1 END), 0) as admin_count,
          COALESCE(COUNT(CASE WHEN role = 'librarian' THEN 1 END), 0) as librarian_count,
          COALESCE(COUNT(CASE WHEN status = 'active' THEN 1 END), 0) as active_users,
          COALESCE(COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END), 0) as new_users
        FROM users
      `);
      if (settingsResult.rows.length > 0) {
        settings = settingsResult.rows[0];
      }
    } catch (err) {
      console.error('Error fetching user settings:', err);
    }

    try {
      const libraryResult = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM majors) as total_majors,
          (SELECT COUNT(*) FROM book_titles) as total_titles,
          COALESCE((SELECT SUM(total_copies) FROM book_titles), 0) as total_copies,
          (SELECT COUNT(*) FROM readers) as total_readers
      `);
      if (libraryResult.rows.length > 0) {
        libraryStats = libraryResult.rows[0];
      }
    } catch (err) {
      console.error('Error fetching library stats:', err);
    }

    try {
      const borrowingResult = await pool.query(`
        SELECT 
          COUNT(*) as total_transactions,
          COALESCE(COUNT(CASE WHEN status = 'borrowed' THEN 1 END), 0) as current_borrows,
          COALESCE(COUNT(CASE WHEN status = 'returned' THEN 1 END), 0) as returned_books,
          COALESCE(COUNT(CASE WHEN due_date < CURRENT_DATE AND status = 'borrowed' THEN 1 END), 0) as overdue_books
        FROM borrowing_transactions
      `);
      if (borrowingResult.rows.length > 0) {
        borrowingStats = borrowingResult.rows[0];
      }
    } catch (err) {
      console.error('Error fetching borrowing stats:', err);
    }

    res.render('settings/index', {
      title: 'Cài đặt hệ thống',
      active: 'settings',
      user: req.session.user,
      settings: settings,
      libraryStats: libraryStats,
      borrowingStats: borrowingStats
    });
  } catch (error) {
    console.error('Error loading settings:', error);
    // Render with empty data instead of error page
    res.render('settings/index', {
      title: 'Cài đặt hệ thống',
      active: 'settings',
      user: req.session.user,
      settings: { total_users: 0, admin_count: 0, librarian_count: 0, active_users: 0, new_users: 0 },
      libraryStats: { total_majors: 0, total_titles: 0, total_copies: 0, total_readers: 0 },
      borrowingStats: { total_transactions: 0, current_borrows: 0, returned_books: 0, overdue_books: 0 }
    });
  }
});

// User profile page
router.get('/profile', requireAuth, async (req, res) => {
  try {
    let profile = null;
    try {
      const userResult = await pool.query(
        'SELECT * FROM users WHERE user_id = $1',
        [req.session.user.user_id]
      );
      if (userResult.rows.length > 0) {
        profile = userResult.rows[0];
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }

    res.render('settings/profile', {
      title: 'Thông tin cá nhân',
      active: 'settings',
      user: req.session.user,
      profile: profile || req.session.user
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.redirect('/settings?error=Không thể tải thông tin cá nhân');
  }
});

// Update profile
router.post('/profile', requireAuth, async (req, res) => {
  try {
    const { full_name, email, phone } = req.body;

    try {
      await pool.query(
        'UPDATE users SET full_name = $1, email = $2, phone = $3 WHERE user_id = $4',
        [full_name, email, phone, req.session.user.user_id]
      );

      // Update session
      req.session.user.full_name = full_name;
      req.session.user.email = email;
      req.session.user.phone = phone;

      res.redirect('/settings/profile?success=Cập nhật thông tin thành công');
    } catch (err) {
      console.error('Error updating profile:', err);
      res.redirect('/settings/profile?error=Không thể cập nhật thông tin');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.redirect('/settings/profile?error=Đã xảy ra lỗi, vui lòng thử lại');
  }
});

// Change password page
router.get('/password', requireAuth, (req, res) => {
  res.render('settings/password', {
    title: 'Đổi mật khẩu',
    active: 'settings',
    user: req.session.user
  });
});

// Change password process
router.post('/password', requireAuth, async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;

    if (new_password !== confirm_password) {
      return res.redirect('/settings/password?error=Mật khẩu xác nhận không khớp');
    }

    try {
      // Get current user
      const userResult = await pool.query(
        'SELECT password_hash FROM users WHERE user_id = $1',
        [req.session.user.user_id]
      );

      if (userResult.rows.length === 0) {
        return res.redirect('/settings/password?error=Không tìm thấy người dùng');
      }

      // Verify current password
      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(current_password, userResult.rows[0].password_hash);

      if (!isValidPassword) {
        return res.redirect('/settings/password?error=Mật khẩu hiện tại không chính xác');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 12);

      // Update password
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE user_id = $2',
        [hashedPassword, req.session.user.user_id]
      );

      res.redirect('/settings/password?success=Đổi mật khẩu thành công');
    } catch (err) {
      console.error('Error changing password:', err);
      res.redirect('/settings/password?error=Không thể đổi mật khẩu, vui lòng thử lại');
    }
  } catch (error) {
    console.error('Error changing password:', error);
    res.redirect('/settings/password?error=Đã xảy ra lỗi, vui lòng thử lại');
  }
});

module.exports = router;
