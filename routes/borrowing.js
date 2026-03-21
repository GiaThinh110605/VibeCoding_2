const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Borrowing management page
router.get('/', requireAuth, async (req, res) => {
  try {
    const borrowings = await pool.query(`
      SELECT bt.transaction_id, bt.reader_id, bt.copy_id, bt.librarian_id, bt.borrow_date, bt.due_date, bt.return_date, bt.status, 
             r.full_name as reader_name, b.title_name, bc.copy_id, u.full_name as librarian_name
      FROM borrowing_transactions bt
      JOIN readers r ON bt.reader_id = r.reader_id
      JOIN book_copies bc ON bt.copy_id = bc.copy_id
      JOIN book_titles b ON bc.title_id = b.title_id
      JOIN users u ON bt.librarian_id = u.user_id
      ORDER BY bt.borrow_date DESC
    `);

    res.render('borrowing/index', {
      title: 'Quản lý mượn trả sách',
      active: 'borrowing',
      user: req.session.user,
      borrowings: borrowings.rows
    });
  } catch (error) {
    console.error('Error loading borrowings:', error);
    res.status(500).render('error', { message: 'Lỗi khi tải dữ liệu mượn trả' });
  }
});

// Borrow book page
router.get('/borrow', requireAuth, (req, res) => {
  res.render('borrowing/borrow', {
    title: 'Mượn sách',
    active: 'borrowing',
    user: req.session.user
  });
});

// Process borrowing
router.post('/borrow', requireAuth, async (req, res) => {
  try {
    const { reader_id, copy_id } = req.body;

    // Check if copy is available
    const copy = await pool.query(
      'SELECT * FROM book_copies WHERE copy_id = $1 AND status = $2',
      [copy_id, 'available']
    );

    if (copy.rows.length === 0) {
      return res.redirect('/borrowing/borrow?error=Sách không có sẵn để mượn hoặc mã bản sao không đúng');
    }

    // Check if reader exists
    const reader = await pool.query('SELECT reader_id FROM readers WHERE reader_id = $1', [reader_id]);
    if (reader.rows.length === 0) {
      return res.redirect('/borrowing/borrow?error=Không tìm thấy độc giả với mã này');
    }

    // Calculate due date (14 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // Create borrowing transaction
    await pool.query(
      'INSERT INTO borrowing_transactions (reader_id, copy_id, librarian_id, borrow_date, due_date, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [reader_id, copy_id, req.session.user.user_id, new Date().toISOString().split('T')[0], dueDate.toISOString().split('T')[0], 'borrowed']
    );

    // Update copy status
    await pool.query(
      'UPDATE book_copies SET status = $1 WHERE copy_id = $2',
      ['borrowed', copy_id]
    );

    res.redirect('/borrowing?success=Mượn sách thành công');
  } catch (error) {
    console.error('Error processing borrow:', error);
    res.redirect('/borrowing/borrow?error=Lỗi khi xử lý mượn sách. Vui lòng thử lại.');
  }
});

// Return book page
router.get('/return', requireAuth, (req, res) => {
  res.render('borrowing/return', {
    title: 'Trả sách',
    active: 'borrowing',
    user: req.session.user
  });
});

// Process return
router.post('/return', requireAuth, async (req, res) => {
  try {
    const { copy_id } = req.body;

    // Find active borrowing transaction
    const borrowing = await pool.query(
      'SELECT * FROM borrowing_transactions WHERE copy_id = $1 AND status = $2',
      [copy_id, 'borrowed']
    );

    if (borrowing.rows.length === 0) {
      return res.redirect('/borrowing/return?error=Không tìm thấy giao dịch mượn sách đang hoạt động cho mã bản sao này');
    }

    // Update transaction
    await pool.query(
      'UPDATE borrowing_transactions SET return_date = $1, status = $2 WHERE copy_id = $3 AND status = $4',
      [new Date().toISOString().split('T')[0], 'returned', copy_id, 'borrowed']
    );

    // Update copy status
    await pool.query(
      'UPDATE book_copies SET status = $1 WHERE copy_id = $2',
      ['available', copy_id]
    );

    res.redirect('/borrowing?success=Trả sách thành công');
  } catch (error) {
    console.error('Error processing return:', error);
    res.redirect('/borrowing/return?error=Lỗi khi xử lý trả sách. Vui lòng thử lại.');
  }
});

module.exports = router;
