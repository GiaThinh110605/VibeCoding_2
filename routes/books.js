const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Books management page
router.get('/', requireAuth, async (req, res) => {
  try {
    const .rows = await pool.query(`
      SELECT bt.*, m.major_name, 
             (SELECT COUNT(*) FROM book_copies bc WHERE bc.title_id = bt.title_id) as copy_count,
             (SELECT COUNT(*) FROM book_copies bc WHERE bc.title_id = bt.title_id AND bc.status = 'available') as available_count
      FROM book_titles bt
      LEFT JOIN majors m ON bt.major_id = m.major_id
      ORDER BY bt.created_at DESC
    `);

    const .rows = await pool.query(`
      SELECT 
        COUNT(DISTINCT title_id) as total_titles,
        SUM(total_copies) as total_copies,
        SUM(available_copies) as available_copies,
        COUNT(CASE WHEN status = 'borrowed' THEN 1 END) as borrowed_copies
      FROM book_titles bt
      LEFT JOIN book_copies bc ON bt.title_id = bc.title_id
    `);

    const .rows = await pool.query('SELECT * FROM majors ORDER BY major_name');

    res.render('books/index', {
      title: 'Quản lý sách',
      active: 'books',
      user: req.session.user,
      books: books,
      stats: stats.rows,
      majors: majors
    });
  } catch (error) {
    console.error('Error loading books:', error);
    res.status(500).render('error', { message: 'Lỗi khi tải dữ liệu sách' });
  }
});

// Add new book form
router.get('/add', requireAuth, async (req, res) => {
  try {
    const .rows = await pool.query('SELECT * FROM majors ORDER BY major_name');
    
    res.render('books/add', {
      title: 'Thêm sách mới',
      active: 'books',
      user: req.session.user,
      majors: majors
    });
  } catch (error) {
    console.error('Error loading add book form:', error);
    res.status(500).render('error', { message: 'Lỗi khi tải form thêm sách' });
  }
});

// Add new book process
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { title_name, publisher, page_count, size, author, major_id, isbn, copies } = req.body;
    
    // Generate title ID
    const .rows = await pool.query(
      'SELECT title_id FROM book_titles WHERE title_id LIKE "BOOK%" ORDER BY title_id DESC LIMIT 1'
    );
    
    let newId = 'BOOK001';
    if (lastBook.length > 0) {
      const lastNum = parseInt(lastBook.rows.title_id.substring(4)) + 1;
      newId = 'BOOK' + String(lastNum).padStart(3, '0');
    }
    
    // Insert book title
    await pool.query(
      'INSERT INTO book_titles (title_id, title_name, publisher, page_count, size, author, major_id, isbn, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      .rows
    );
    
    // Insert book copies
    for (let i = 1; i <= copies; i++) {
      const copyId = 'COPY' + String(newId.substring(4)) + String(i).padStart(2, '0');
      await pool.query(
        'INSERT INTO book_copies (copy_id, title_id, status, entry_date) VALUES (?, ?, ?, ?)',
        .rows
      );
    }
    
    res.redirect('/books?success=Thêm sách thành công');
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).render('error', { message: 'Lỗi khi thêm sách' });
  }
});

// Edit book form
router.get('/edit/:id', requireAuth, async (req, res) => {
  try {
    const .rows = await pool.query(`
      SELECT bt.*, m.major_name 
      FROM book_titles bt
      LEFT JOIN majors m ON bt.major_id = m.major_id
      WHERE bt.title_id = ?
    `, .rows);
    
    const .rows = await pool.query('SELECT * FROM majors ORDER BY major_name');
    
    if (book.length === 0) {
      return res.status(404).render('error', { message: 'Không tìm thấy sách' });
    }
    
    res.render('books/edit', {
      title: 'Chỉnh sửa thông tin sách',
      active: 'books',
      user: req.session.user,
      book: book.rows,
      majors: majors
    });
  } catch (error) {
    console.error('Error loading book for edit:', error);
    res.status(500).render('error', { message: 'Lỗi khi tải thông tin sách' });
  }
});

// Update book
router.post('/edit/:id', requireAuth, async (req, res) => {
  try {
    const { title_name, publisher, page_count, size, author, major_id, isbn } = req.body;
    
    await pool.query(
      'UPDATE book_titles SET title_name = ?, publisher = ?, page_count = ?, size = ?, author = ?, major_id = ?, isbn = ? WHERE title_id = ?',
      .rows
    );
    
    res.redirect('/books?success=Cập nhật thông tin sách thành công');
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).render('error', { message: 'Lỗi khi cập nhật thông tin sách' });
  }
});

// Delete book
router.post('/delete/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM book_copies WHERE title_id = ?', .rows);
    await pool.query('DELETE FROM book_titles WHERE title_id = ?', .rows);
    res.redirect('/books?success=Xóa sách thành công');
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).render('error', { message: 'Lỗi khi xóa sách' });
  }
});

module.exports = router;
