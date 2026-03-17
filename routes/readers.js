const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Readers management page
router.get('/', requireAuth, async (req, res) => {
  try {
    const readers = await pool.query(`
      SELECT reader_id, full_name, class, birth_date, gender, phone, email, 
             card_expiry_date, status, created_at
      FROM readers 
      ORDER BY created_at DESC
    `);

    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_readers,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_readers,
        COUNT(CASE WHEN status = 'locked' THEN 1 END) as locked_readers,
        COUNT(CASE WHEN card_expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND card_expiry_date >= CURRENT_DATE THEN 1 END) as expiring_soon
      FROM readers
    `);

    res.render('readers/index', {
      title: 'Quản lý thẻ độc giả',
      active: 'readers',
      user: req.session.user,
      readers: readers.rows,
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('Error loading readers:', error);
    res.status(500).render('error', { message: 'Lỗi khi tải dữ liệu độc giả' });
  }
});

// Add new reader form
router.get('/add', requireAuth, (req, res) => {
  res.render('readers/add', {
    title: 'Đăng ký thẻ độc giả mới',
    active: 'readers',
    user: req.session.user
  });
});

// Add new reader process
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { full_name, class: readerClass, birth_date, gender, phone, email, address } = req.body;
    
    // Generate reader ID
    const lastUser = await pool.query(
      'SELECT reader_id FROM readers WHERE reader_id LIKE $1 ORDER BY reader_id DESC LIMIT 1',
      ['SV%']
    );
    
    let newId = 'SV2024001';
    if (lastUser.rows.length > 0) {
      const lastNum = parseInt(lastUser.rows[0].reader_id.substring(2)) + 1;
      newId = 'SV' + String(lastNum).padStart(7, '0');
    }

    // Set card expiry date to 2 years from now
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 2);

    await pool.query(
      'INSERT INTO readers (reader_id, full_name, class, birth_date, gender, phone, email, address, card_expiry_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [newId, full_name, readerClass, birth_date, gender, phone, email, address, expiryDate.toISOString().split('T')[0]]
    );

    res.redirect('/readers?success=Đăng ký thẻ độc giả thành công');
  } catch (error) {
    console.error('Error adding reader:', error);
    res.status(500).render('error', { message: 'Lỗi khi đăng ký thẻ độc giả' });
  }
});

// Edit reader form
router.get('/edit/:id', requireAuth, async (req, res) => {
  try {
    const reader = await pool.query(
      'SELECT * FROM readers WHERE reader_id = $1',
      [req.params.id]
    );
    
    if (reader.rows.length === 0) {
      return res.status(404).render('error', { message: 'Không tìm thấy độc giả' });
    }
    
    res.render('readers/edit', {
      title: 'Chỉnh sửa thông tin độc giả',
      active: 'readers',
      user: req.session.user,
      reader: reader.rows[0]
    });
  } catch (error) {
    console.error('Error loading reader for edit:', error);
    res.status(500).render('error', { message: 'Lỗi khi tải thông tin độc giả' });
  }
});

// Update reader
router.post('/edit/:id', requireAuth, async (req, res) => {
  try {
    const { full_name, class: readerClass, birth_date, gender, phone, email, address, card_expiry_date, status } = req.body;

    await pool.query(
      'UPDATE readers SET full_name = $1, class = $2, birth_date = $3, gender = $4, phone = $5, email = $6, address = $7, card_expiry_date = $8, status = $9 WHERE reader_id = $10',
      [full_name, readerClass, birth_date, gender, phone, email, address, card_expiry_date, status, req.params.id]
    );

    res.redirect('/readers?success=Cập nhật thông tin độc giả thành công');
  } catch (error) {
    console.error('Error updating reader:', error);
    res.status(500).render('error', { message: 'Lỗi khi cập nhật thông tin độc giả' });
  }
});

// Delete reader
router.post('/delete/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM readers WHERE reader_id = $1', [req.params.id]);
    res.redirect('/readers?success=Xóa thẻ độc giả thành công');
  } catch (error) {
    console.error('Error deleting reader:', error);
    res.status(500).render('error', { message: 'Lỗi khi xóa thẻ độc giả' });
  }
});

module.exports = router;
