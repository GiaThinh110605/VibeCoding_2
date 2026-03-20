const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Reports page
router.get('/', requireAuth, async (req, res) => {
  try {
    let mostBorrowed = [];
    let mostActiveReaders = [];
    let overdueBooks = [];
    let monthlyTrends = [];

    try {
      const mostBorrowedResult = await pool.query(`
        SELECT b.title_name, b.author, m.major_name, COUNT(*) as borrow_count
        FROM borrowing_transactions bt
        LEFT JOIN book_copies bc ON bt.copy_id = bc.copy_id
        LEFT JOIN book_titles b ON bc.title_id = b.title_id
        LEFT JOIN majors m ON b.major_id = m.major_id
        WHERE bt.status = 'returned'
        GROUP BY b.title_id, b.title_name, b.author, m.major_name
        ORDER BY borrow_count DESC
        LIMIT 10
      `);
      if (mostBorrowedResult.rows.length > 0) {
        mostBorrowed = mostBorrowedResult.rows;
      }
    } catch (err) {
      console.error('Error fetching most borrowed:', err);
    }

    try {
      const mostActiveResult = await pool.query(`
        SELECT r.reader_id, r.full_name, r.class, COUNT(*) as borrow_count
        FROM borrowing_transactions bt
        LEFT JOIN readers r ON bt.reader_id = r.reader_id
        GROUP BY r.reader_id, r.full_name, r.class
        ORDER BY borrow_count DESC
        LIMIT 10
      `);
      if (mostActiveResult.rows.length > 0) {
        mostActiveReaders = mostActiveResult.rows;
      }
    } catch (err) {
      console.error('Error fetching most active readers:', err);
    }

    try {
      const overdueResult = await pool.query(`
        SELECT bt.*, r.full_name as reader_name, r.phone, b.title_name, bc.copy_id
        FROM borrowing_transactions bt
        LEFT JOIN readers r ON bt.reader_id = r.reader_id
        LEFT JOIN book_copies bc ON bt.copy_id = bc.copy_id
        LEFT JOIN book_titles b ON bc.title_id = b.title_id
        WHERE bt.due_date < CURRENT_DATE AND bt.status = 'borrowed'
        ORDER BY bt.due_date ASC
      `);
      if (overdueResult.rows.length > 0) {
        overdueBooks = overdueResult.rows;
      }
    } catch (err) {
      console.error('Error fetching overdue books:', err);
    }

    try {
      const monthlyResult = await pool.query(`
        SELECT 
          TO_CHAR(borrow_date, 'YYYY-MM') as month,
          COUNT(*) as borrow_count
        FROM borrowing_transactions
        WHERE borrow_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY TO_CHAR(borrow_date, 'YYYY-MM')
        ORDER BY month ASC
      `);
      if (monthlyResult.rows.length > 0) {
        monthlyTrends = monthlyResult.rows;
      }
    } catch (err) {
      console.error('Error fetching monthly trends:', err);
    }

    res.render('reports/index', {
      title: 'Báo cáo thống kê',
      active: 'reports',
      user: req.session.user,
      mostBorrowed: mostBorrowed,
      mostActiveReaders: mostActiveReaders,
      overdueBooks: overdueBooks,
      monthlyTrends: monthlyTrends
    });
  } catch (error) {
    console.error('Error loading reports:', error);
    // Render with empty data instead of error page
    res.render('reports/index', {
      title: 'Báo cáo thống kê',
      active: 'reports',
      user: req.session.user,
      mostBorrowed: [],
      mostActiveReaders: [],
      overdueBooks: [],
      monthlyTrends: []
    });
  }
});

module.exports = router;
