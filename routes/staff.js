const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

// Staff management page
router.get('/', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const staffData = await pool.query(`
      SELECT user_id, username, full_name, email, phone, role, status, created_at
      FROM users 
      ORDER BY created_at DESC
    `);

    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_staff,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_staff,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_accounts
      FROM users
    `);

    res.render('staff/index', {
      title: 'Quản lý nhân viên',
      active: 'staff',
      user: req.session.user,
      staff: staffData.rows,
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('Error loading staff data:', error);
    res.status(500).render('error', { message: 'Lỗi khi tải dữ liệu nhân viên' });
  }
});

// Add new staff form
router.get('/add', requireAuth, requireRole(['admin']), (req, res) => {
  res.render('staff/add', {
    title: 'Thêm nhân viên mới',
    active: 'staff',
    user: req.session.user
  });
});

// Add new staff process
router.post('/add', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { username, password, full_name, email, phone, role } = req.body;

    // Generate staff ID
    const [lastStaff] = await pool.execute(
      'SELECT user_id FROM users WHERE user_id LIKE "NV%" ORDER BY user_id DESC LIMIT 1'
    );

    let newId = 'NV001';
    if (lastStaff.length > 0) {
      const lastNum = parseInt(lastStaff[0].user_id.substring(2)) + 1;
      newId = 'NV' + String(lastNum).padStart(3, '0');
    }

    await pool.execute(
      'INSERT INTO users (user_id, username, password_hash, full_name, email, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newId, username, password, full_name, email, phone, role]
    );

    res.redirect('/staff?success=Thêm nhân viên thành công');
  } catch (error) {
    console.error('Error adding staff:', error);
    res.status(500).render('error', { message: 'Lỗi khi thêm nhân viên mới' });
  }
});

// Edit staff form
router.get('/edit/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const [staff] = await pool.execute(
      'SELECT user_id, username, full_name, email, phone, role, status FROM users WHERE user_id = ?',
      [req.params.id]
    );

    if (staff.length === 0) {
      return res.status(404).render('error', { message: 'Không tìm thấy nhân viên' });
    }

    res.render('staff/edit', {
      title: 'Chỉnh sửa thông tin nhân viên',
      active: 'staff',
      user: req.session.user,
      staff: staff[0]
    });
  } catch (error) {
    console.error('Error loading staff for edit:', error);
    res.status(500).render('error', { message: 'Lỗi khi tải thông tin nhân viên' });
  }
});

// Update staff
router.post('/edit/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { full_name, email, phone, role, status } = req.body;

    await pool.execute(
      'UPDATE users SET full_name = ?, email = ?, phone = ?, role = ?, status = ? WHERE user_id = ?',
      [full_name, email, phone, role, status, req.params.id]
    );

    res.redirect('/staff?success=Cập nhật thông tin thành công');
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).render('error', { message: 'Lỗi khi cập nhật thông tin nhân viên' });
  }
});

// Delete staff
router.post('/delete/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    await pool.execute('DELETE FROM users WHERE user_id = ?', [req.params.id]);
    res.redirect('/staff?success=Xóa nhân viên thành công');
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).render('error', { message: 'Lỗi khi xóa nhân viên' });
  }
});

module.exports = router;
