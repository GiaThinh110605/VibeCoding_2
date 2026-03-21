const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Majors management page
router.get('/', requireAuth, async (req, res) => {
  try {
    const majors = await pool.query(`
      SELECT m.*, 
             COUNT(DISTINCT bt.title_id) as book_count
      FROM majors m
      LEFT JOIN book_titles bt ON m.major_id = bt.major_id
      GROUP BY m.major_id
      ORDER BY m.major_name
    `);

    res.render('majors/index', {
      title: 'Quản lý ngành học',
      active: 'majors',
      user: req.session.user,
      majors: majors.rows
    });
  } catch (error) {
    console.error('Error loading majors:', error);
    res.status(500).render('error', { message: 'Lỗi khi tải dữ liệu ngành học' });
  }
});

// Add new major form
router.get('/add', requireAuth, (req, res) => {
  res.render('majors/add', {
    title: 'Thêm ngành học mới',
    active: 'majors',
    user: req.session.user
  });
});

// Add new major process
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { major_id, major_name, description } = req.body;

    // Check if major_id already exists
    const existingMajor = await pool.query('SELECT major_id FROM majors WHERE major_id = $1', [major_id]);
    if (existingMajor.rows.length > 0) {
      return res.redirect('/majors/add?error=Mã ngành đã tồn tại. Vui lòng chọn mã khác.');
    }

    await pool.query(
      'INSERT INTO majors (major_id, major_name, description) VALUES ($1, $2, $3)',
      [major_id, major_name, description]
    );

    res.redirect('/majors?success=Thêm ngành học thành công');
  } catch (error) {
    console.error('Error adding major:', error);
    res.redirect('/majors/add?error=Không thể thêm ngành học. Vui lòng thử lại.');
  }
});

// Edit major form
router.get('/edit/:id', requireAuth, async (req, res) => {
  try {
    const major = await pool.query(
      'SELECT * FROM majors WHERE major_id = $1',
      [req.params.id]
    );

    if (major.rows.length === 0) {
      return res.redirect('/majors?error=Không tìm thấy ngành học');
    }

    res.render('majors/edit', {
      title: 'Chỉnh sửa ngành học',
      active: 'majors',
      user: req.session.user,
      major: major.rows[0]
    });
  } catch (error) {
    console.error('Error loading major for edit:', error);
    res.redirect('/majors?error=Không thể tải thông tin ngành học');
  }
});

// Update major
router.post('/edit/:id', requireAuth, async (req, res) => {
  try {
    const { major_name, description } = req.body;

    await pool.query(
      'UPDATE majors SET major_name = $1, description = $2 WHERE major_id = $3',
      [major_name, description, req.params.id]
    );

    res.redirect('/majors?success=Cập nhật ngành học thành công');
  } catch (error) {
    console.error('Error updating major:', error);
    res.redirect(`/majors/edit/${req.params.id}?error=Không thể cập nhật ngành học`);
  }
});

// Delete major
router.post('/delete/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM majors WHERE major_id = $1', [req.params.id]);
    res.redirect('/majors?success=Xóa ngành học thành công');
  } catch (error) {
    console.error('Error deleting major:', error);
    res.redirect('/majors?error=Không thể xóa ngành học');
  }
});

module.exports = router;
