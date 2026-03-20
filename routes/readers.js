const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Readers management page
router.get('/', requireAuth, async (req, res) => {
  try {
    let readers = [];
    let stats = { total_readers: 0, active_readers: 0, locked_readers: 0, expiring_soon: 0 };

    try {
      const readerResult = await pool.query(`
        SELECT reader_id, full_name, class, birth_date, gender, phone, email, 
               card_expiry_date, status, created_at
        FROM readers 
        ORDER BY created_at DESC
      `);
      if (readerResult.rows.length > 0) {
        readers = readerResult.rows;
      }
    } catch (err) {
      console.error('Error fetching readers:', err);
    }

    try {
      const statsResult = await pool.query(`
        SELECT 
          COUNT(*) as total_readers,
          COALESCE(COUNT(CASE WHEN status = 'active' THEN 1 END), 0) as active_readers,
          COALESCE(COUNT(CASE WHEN status = 'locked' THEN 1 END), 0) as locked_readers,
          COALESCE(COUNT(CASE WHEN card_expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND card_expiry_date >= CURRENT_DATE THEN 1 END), 0) as expiring_soon
        FROM readers
      `);
      if (statsResult.rows.length > 0) {
        stats = statsResult.rows[0];
      }
    } catch (err) {
      console.error('Error fetching reader stats:', err);
    }

    res.render('readers/index', {
      title: 'Quản lý thẻ độc giả',
      active: 'readers',
      user: req.session.user,
      readers: readers,
      stats: stats
    });
  } catch (error) {
    console.error('Error loading readers:', error);
    // Render with empty data instead of error page
    res.render('readers/index', {
      title: 'Quản lý thẻ độc giả',
      active: 'readers',
      user: req.session.user,
      readers: [],
      stats: { total_readers: 0, active_readers: 0, locked_readers: 0, expiring_soon: 0 }
    });
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
    let newId = 'SV2024001';
    try {
      const lastUser = await pool.query(
        'SELECT reader_id FROM readers WHERE reader_id LIKE $1 ORDER BY reader_id DESC LIMIT 1',
        ['SV%']
      );

      if (lastUser.rows.length > 0) {
        const lastNum = parseInt(lastUser.rows[0].reader_id.substring(2)) + 1;
        newId = 'SV' + String(lastNum).padStart(7, '0');
      }
    } catch (err) {
      console.error('Error generating reader ID:', err);
    }

    // Set card expiry date to 2 years from now
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 2);

    try {
      await pool.query(
        'INSERT INTO readers (reader_id, full_name, class, birth_date, gender, phone, email, address, card_expiry_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [newId, full_name, readerClass, birth_date, gender, phone, email, address, expiryDate.toISOString().split('T')[0]]
      );
      res.redirect('/readers?success=Đăng ký thẻ độc giả thành công');
    } catch (err) {
      console.error('Error inserting reader:', err);
      res.redirect('/readers/add?error=Không thể đăng ký thẻ độc giả, vui lòng thử lại');
    }
  } catch (error) {
    console.error('Error adding reader:', error);
    res.redirect('/readers/add?error=Đã xảy ra lỗi, vui lòng thử lại');
  }
});

// Edit reader form
router.get('/edit/:id', requireAuth, async (req, res) => {
  try {
    let reader = null;
    try {
      const readerResult = await pool.query(
        'SELECT * FROM readers WHERE reader_id = $1',
        [req.params.id]
      );

      if (readerResult.rows.length > 0) {
        reader = readerResult.rows[0];
      }
    } catch (err) {
      console.error('Error fetching reader:', err);
    }

    if (!reader) {
      return res.status(404).render('error', { message: 'Không tìm thấy độc giả' });
    }

    res.render('readers/edit', {
      title: 'Chỉnh sửa thông tin độc giả',
      active: 'readers',
      user: req.session.user,
      reader: reader
    });
  } catch (error) {
    console.error('Error loading reader for edit:', error);
    res.redirect('/readers?error=Không thể tải thông tin độc giả');
  }
});

// Update reader
router.post('/edit/:id', requireAuth, async (req, res) => {
  try {
    const { full_name, class: readerClass, birth_date, gender, phone, email, address, card_expiry_date, status } = req.body;

    try {
      await pool.query(
        'UPDATE readers SET full_name = $1, class = $2, birth_date = $3, gender = $4, phone = $5, email = $6, address = $7, card_expiry_date = $8, status = $9 WHERE reader_id = $10',
        [full_name, readerClass, birth_date, gender, phone, email, address, card_expiry_date, status, req.params.id]
      );
      res.redirect('/readers?success=Cập nhật thông tin độc giả thành công');
    } catch (err) {
      console.error('Error updating reader:', err);
      res.redirect(`/readers/edit/${req.params.id}?error=Không thể cập nhật thông tin độc giả`);
    }
  } catch (error) {
    console.error('Error updating reader:', error);
    res.redirect(`/readers/edit/${req.params.id}?error=Đã xảy ra lỗi, vui lòng thử lại`);
  }
});

// Delete reader
router.post('/delete/:id', requireAuth, async (req, res) => {
  try {
    try {
      await pool.query('DELETE FROM readers WHERE reader_id = $1', [req.params.id]);
      res.redirect('/readers?success=Xóa thẻ độc giả thành công');
    } catch (err) {
      console.error('Error deleting reader:', err);
      res.redirect('/readers?error=Không thể xóa thẻ độc giả');
    }
  } catch (error) {
    console.error('Error deleting reader:', error);
    res.redirect('/readers?error=Đã xảy ra lỗi, vui lòng thử lại');
  }
});

module.exports = router;
