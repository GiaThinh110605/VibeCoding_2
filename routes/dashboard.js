const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Dashboard page
router.get('/', requireAuth, async (req, res) => {
  try {
    // Get dashboard statistics
    const bookStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT title_id) as total_titles,
        SUM(total_copies) as total_copies,
        SUM(available_copies) as available_copies,
        COUNT(CASE WHEN status = 'borrowed' THEN 1 END) as borrowed_copies
      FROM book_titles bt
      LEFT JOIN book_copies bc ON bt.title_id = bc.title_id
    `);

    const readerStats = await pool.query(`
      SELECT 
        COUNT(*) as total_readers,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_readers,
        COUNT(CASE WHEN card_expiry_date < CURRENT_DATE THEN 1 END) as expired_readers
      FROM readers
    `);

    const borrowingStats = await pool.query(`
      SELECT 
        COUNT(*) as total_borrowed,
        COUNT(CASE WHEN status = 'borrowed' THEN 1 END) as currently_borrowed,
        COUNT(CASE WHEN due_date < CURRENT_DATE AND status = 'borrowed' THEN 1 END) as overdue_books
      FROM borrowing_transactions
    `);

    const recentBorrowings = await pool.query(`
      SELECT 
        bt.reader_id,
        r.full_name,
        b.title_name,
        bt.borrow_date,
        bt.status
      FROM borrowing_transactions bt
      JOIN readers r ON bt.reader_id = r.reader_id
      JOIN book_copies bc ON bt.copy_id = bc.copy_id
      JOIN book_titles b ON bc.title_id = b.title_id
      ORDER BY bt.borrow_date DESC
      LIMIT 5
    `);

    res.render('dashboard', {
      title: 'Dashboard',
      active: 'dashboard',
      user: req.session.user,
      bookStats: bookStats.rows[0],
      readerStats: readerStats.rows[0],
      borrowingStats: borrowingStats.rows[0],
      recentBorrowings: recentBorrowings.rows
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).render('error', { message: 'Lỗi khi tải dashboard' });
  }
});

module.exports = router;
