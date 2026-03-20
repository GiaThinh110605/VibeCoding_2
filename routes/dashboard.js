const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Dashboard page
router.get('/', requireAuth, async (req, res) => {
  try {
    // Get dashboard statistics with fallback
    let bookStats = { total_titles: 0, total_copies: 0, available_copies: 0, borrowed_copies: 0 };
    let readerStats = { total_readers: 0, active_readers: 0, expired_readers: 0 };
    let borrowingStats = { total_borrowed: 0, currently_borrowed: 0, overdue_books: 0 };
    let recentBorrowings = [];

    try {
      const bookResult = await pool.query(`
        SELECT 
          COUNT(DISTINCT title_id) as total_titles,
          COALESCE(SUM(total_copies), 0) as total_copies,
          COALESCE(SUM(available_copies), 0) as available_copies,
          COALESCE(COUNT(CASE WHEN status = 'borrowed' THEN 1 END), 0) as borrowed_copies
        FROM book_titles bt
        LEFT JOIN book_copies bc ON bt.title_id = bc.title_id
      `);
      if (bookResult.rows.length > 0) {
        bookStats = bookResult.rows[0];
      }
    } catch (err) {
      console.error('Error fetching book stats:', err);
    }

    try {
      const readerResult = await pool.query(`
        SELECT 
          COUNT(*) as total_readers,
          COALESCE(COUNT(CASE WHEN status = 'active' THEN 1 END), 0) as active_readers,
          COALESCE(COUNT(CASE WHEN card_expiry_date < CURRENT_DATE THEN 1 END), 0) as expired_readers
        FROM readers
      `);
      if (readerResult.rows.length > 0) {
        readerStats = readerResult.rows[0];
      }
    } catch (err) {
      console.error('Error fetching reader stats:', err);
    }

    try {
      const borrowingResult = await pool.query(`
        SELECT 
          COUNT(*) as total_borrowed,
          COALESCE(COUNT(CASE WHEN status = 'borrowed' THEN 1 END), 0) as currently_borrowed,
          COALESCE(COUNT(CASE WHEN due_date < CURRENT_DATE AND status = 'borrowed' THEN 1 END), 0) as overdue_books
        FROM borrowing_transactions
      `);
      if (borrowingResult.rows.length > 0) {
        borrowingStats = borrowingResult.rows[0];
      }
    } catch (err) {
      console.error('Error fetching borrowing stats:', err);
    }

    try {
      const recentResult = await pool.query(`
        SELECT 
          bt.reader_id,
          r.full_name,
          b.title_name,
          bt.borrow_date,
          bt.status
        FROM borrowing_transactions bt
        LEFT JOIN readers r ON bt.reader_id = r.reader_id
        LEFT JOIN book_copies bc ON bt.copy_id = bc.copy_id
        LEFT JOIN book_titles b ON bc.title_id = b.title_id
        ORDER BY bt.borrow_date DESC
        LIMIT 5
      `);
      if (recentResult.rows.length > 0) {
        recentBorrowings = recentResult.rows;
      }
    } catch (err) {
      console.error('Error fetching recent borrowings:', err);
    }

    res.render('dashboard', {
      title: 'Dashboard',
      active: 'dashboard',
      user: req.session.user,
      bookStats: bookStats,
      readerStats: readerStats,
      borrowingStats: borrowingStats,
      recentBorrowings: recentBorrowings
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    // Render dashboard with default data instead of error page
    res.render('dashboard', {
      title: 'Dashboard',
      active: 'dashboard',
      user: req.session.user,
      bookStats: { total_titles: 0, total_copies: 0, available_copies: 0, borrowed_copies: 0 },
      readerStats: { total_readers: 0, active_readers: 0, expired_readers: 0 },
      borrowingStats: { total_borrowed: 0, currently_borrowed: 0, overdue_books: 0 },
      recentBorrowings: []
    });
  }
});

module.exports = router;
