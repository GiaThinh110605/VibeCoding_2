const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Borrowing management page
router.get('/', requireAuth, async (req, res) => {
  try {
    const .rows = await pool.query(`
      SELECT bt.*, r.full_name as reader_name, b.title_name, bc.copy_id, u.full_name as librarian_name
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
      borrowings: borrowings
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
    const .rows = await pool.query(
      'SELECT * FROM book_copies WHERE copy_id = ? AND status = ?',
      .rows
    );
    
    if (copy.length === 0) {
      return res.status(400).render('error', { message: 'Sách không có sẵn để mượn' });
    }
    
    // Calculate due date (14 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    
    // Create borrowing transaction
    await pool.query(
      'INSERT INTO borrowing_transactions (reader_id, copy_id, librarian_id, borrow_date, due_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      .rows
    );
    
    // Update copy status
    await pool.query(
      'UPDATE book_copies SET status = ? WHERE copy_id = ?',
      .rows
    );
    
    res.redirect('/borrowing?success=Mượn sách thành công');
  } catch (error) {
    console.error('Error processing borrow:', error);
    res.status(500).render('error', { message: 'Lỗi khi xử lý mượn sách' });
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
    const .rows = await pool.query(
      'SELECT * FROM borrowing_transactions WHERE copy_id = ? AND status = ?',
      .rows
    );
    
    if (borrowing.length === 0) {
      return res.status(400).render('error', { message: 'Không tìm thấy giao dịch mượn sách đang hoạt động' });
    }
    
    // Update transaction
    await pool.query(
      'UPDATE borrowing_transactions SET return_date = ?, status = ? WHERE copy_id = ? AND status = ?',
      .rows
    );
    
    // Update copy status
    await pool.query(
      'UPDATE book_copies SET status = ? WHERE copy_id = ?',
      .rows
    );
    
    res.redirect('/borrowing?success=Trả sách thành công');
  } catch (error) {
    console.error('Error processing return:', error);
    res.status(500).render('error', { message: 'Lỗi khi xử lý trả sách' });
  }
});

module.exports = router;
