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
      borrowings: borrowings.rows,
      query: req.query
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
    user: req.session.user,
    query: req.query
  });
});

// Process borrowing
router.post('/borrow', requireAuth, async (req, res) => {
  try {
    let { reader_id, copy_id } = req.body;

    if (!reader_id || !copy_id) {
      return res.redirect('/borrowing/borrow?error=Vui lòng điền đầy đủ thông tin mã độc giả và mã bản sao');
    }

    // Normalize inputs
    reader_id = reader_id.trim().toUpperCase();
    copy_id = copy_id.trim().toUpperCase();

    // Check if copy is available
    const copy = await pool.query(
      'SELECT * FROM book_copies WHERE UPPER(copy_id) = $1',
      [copy_id]
    );

    if (copy.rows.length === 0) {
      return res.redirect(`/borrowing/borrow?error=Mã bản sao "${copy_id}" không tồn tại trong hệ thống`);
    }

    if (copy.rows[0].status !== 'available') {
      return res.redirect(`/borrowing/borrow?error=Sách "${copy_id}" hiện đang ở trạng thái "${copy.rows[0].status}", không thể mượn`);
    }

    // Check if reader exists
    const reader = await pool.query('SELECT reader_id, full_name FROM readers WHERE UPPER(reader_id) = $1', [reader_id]);
    if (reader.rows.length === 0) {
      return res.redirect(`/borrowing/borrow?error=Không tìm thấy độc giả với mã "${reader_id}"`);
    }

    // Optional: Check if reader already has too many books (e.g., max 5)
    const activeBorrowings = await pool.query(
      'SELECT COUNT(*) FROM borrowing_transactions WHERE reader_id = $1 AND status = $2',
      [reader_id, 'borrowed']
    );
    if (parseInt(activeBorrowings.rows[0].count) >= 5) {
      return res.redirect(`/borrowing/borrow?error=Độc giả ${reader.rows[0].full_name} đã mượn tối đa 5 cuốn sách`);
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
      'UPDATE book_copies SET status = $1 WHERE UPPER(copy_id) = $2',
      ['borrowed', copy_id]
    );

    res.redirect('/borrowing?success=Mượn sách thành công');
  } catch (error) {
    console.error('Error processing borrow:', error);
    res.redirect(`/borrowing/borrow?error=Lỗi hệ thống: ${error.message}`);
  }
});

// Return book page
router.get('/return', requireAuth, (req, res) => {
  res.render('borrowing/return', {
    title: 'Trả sách',
    active: 'borrowing',
    user: req.session.user,
    query: req.query
  });
});

// Process return
router.post('/return', requireAuth, async (req, res) => {
  try {
    let { copy_id } = req.body;

    if (!copy_id) {
      return res.redirect('/borrowing/return?error=Vui lòng nhập mã bản sao sách');
    }

    // Normalize copy_id: trim and uppercase
    copy_id = copy_id.trim().toUpperCase();
    console.log(`Attempting to return copy_id: ${copy_id}`);

    // Find active borrowing transaction
    const borrowing = await pool.query(
      'SELECT * FROM borrowing_transactions WHERE UPPER(copy_id) = $1 AND status = $2',
      [copy_id, 'borrowed']
    );

    if (borrowing.rows.length === 0) {
      console.log(`No active borrowing found for: ${copy_id}`);
      // Check if the book exists at all to give a better error message
      const bookExists = await pool.query('SELECT status FROM book_copies WHERE UPPER(copy_id) = $1', [copy_id]);

      if (bookExists.rows.length === 0) {
        return res.redirect(`/borrowing/return?error=Mã bản sao sách "${copy_id}" không tồn tại trong hệ thống`);
      } else if (bookExists.rows[0].status === 'available') {
        return res.redirect(`/borrowing/return?error=Sách "${copy_id}" hiện không trong trạng thái được mượn (đang ở trạng thái: ${bookExists.rows[0].status})`);
      } else {
        return res.redirect(`/borrowing/return?error=Không tìm thấy giao dịch mượn sách đang hoạt động cho mã "${copy_id}"`);
      }
    }

    const transactionId = borrowing.rows[0].transaction_id;
    console.log(`Found active transaction ID: ${transactionId} for copy: ${copy_id}`);

    // Update transaction - use transaction_id for safety
    await pool.query(
      'UPDATE borrowing_transactions SET return_date = $1, status = $2 WHERE transaction_id = $3',
      [new Date().toISOString().split('T')[0], 'returned', transactionId]
    );

    // Update copy status - use normalized copy_id
    await pool.query(
      'UPDATE book_copies SET status = $1 WHERE UPPER(copy_id) = $2',
      ['available', copy_id]
    );

    console.log(`Successfully returned copy_id: ${copy_id}`);
    res.redirect('/borrowing?success=Trả sách thành công');
  } catch (error) {
    console.error('Error processing return:', error);
    res.redirect(`/borrowing/return?error=Lỗi hệ thống: ${error.message}`);
  }
});

module.exports = router;
