const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Reports page
router.get('/', requireAuth, async (req, res) => {
  try {
    // Get most borrowed books
    const .rows = await pool.query(`
      SELECT b.title_name, b.author, m.major_name, COUNT(*) as borrow_count
      FROM borrowing_transactions bt
      JOIN book_copies bc ON bt.copy_id = bc.copy_id
      JOIN book_titles b ON bc.title_id = b.title_id
      LEFT JOIN majors m ON b.major_id = m.major_id
      WHERE bt.status = 'returned'
      GROUP BY b.title_id
      ORDER BY borrow_count DESC
      LIMIT 10
    `);

    // Get most active readers
    const .rows = await pool.query(`
      SELECT r.reader_id, r.full_name, r.class, COUNT(*) as borrow_count
      FROM borrowing_transactions bt
      JOIN readers r ON bt.reader_id = r.reader_id
      GROUP BY r.reader_id
      ORDER BY borrow_count DESC
      LIMIT 10
    `);

    // Get overdue books
    const .rows = await pool.query(`
      SELECT bt.*, r.full_name as reader_name, r.phone, b.title_name, bc.copy_id
      FROM borrowing_transactions bt
      JOIN readers r ON bt.reader_id = r.reader_id
      JOIN book_copies bc ON bt.copy_id = bc.copy_id
      JOIN book_titles b ON bc.title_id = b.title_id
      WHERE bt.due_date < CURDATE() AND bt.status = 'borrowed'
      ORDER BY bt.due_date ASC
    `);

    // Get monthly borrowing trends
    const .rows = await pool.query(`
      SELECT 
        DATE_FORMAT(borrow_date, '%Y-%m') as month,
        COUNT(*) as borrow_count
      FROM borrowing_transactions
      WHERE borrow_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(borrow_date, '%Y-%m')
      ORDER BY month ASC
    `);

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
    res.status(500).render('error', { message: 'Lỗi khi tải báo cáo' });
  }
});

module.exports = router;
