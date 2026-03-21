const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Books management page
router.get('/', requireAuth, async (req, res) => {
  try {
    let books = [];
    let stats = { total_titles: 0, total_copies: 0, available_copies: 0, borrowed_copies: 0 };
    let majors = [];

    try {
      const booksResult = await pool.query(`
        SELECT bt.*, m.major_name, 
               (SELECT COUNT(*) FROM book_copies bc WHERE bc.title_id = bt.title_id) as copy_count,
               (SELECT COUNT(*) FROM book_copies bc WHERE bc.title_id = bt.title_id AND bc.status = 'available') as available_count
        FROM book_titles bt
        LEFT JOIN majors m ON bt.major_id = m.major_id
        ORDER BY bt.created_at DESC
      `);
      if (booksResult.rows.length > 0) {
        books = booksResult.rows;
      }
    } catch (err) {
      console.error('Error fetching books:', err);
    }

    try {
      const statsResult = await pool.query(`
        SELECT 
          COUNT(DISTINCT bt.title_id) as total_titles,
          COALESCE(SUM(bt.total_copies), 0) as total_copies,
          COALESCE(SUM(bt.available_copies), 0) as available_copies,
          COALESCE(COUNT(CASE WHEN bc.status = 'borrowed' THEN 1 END), 0) as borrowed_copies
        FROM book_titles bt
        LEFT JOIN book_copies bc ON bt.title_id = bc.title_id
      `);
      if (statsResult.rows.length > 0) {
        stats = statsResult.rows[0];
      }
    } catch (err) {
      console.error('Error fetching book stats:', err);
    }

    try {
      const majorsResult = await pool.query('SELECT * FROM majors ORDER BY major_name');
      if (majorsResult.rows.length > 0) {
        majors = majorsResult.rows;
      }
    } catch (err) {
      console.error('Error fetching majors:', err);
    }

    res.render('books/index', {
      title: 'Quản lý sách',
      active: 'books',
      user: req.session.user,
      books: books,
      stats: stats,
      majors: majors
    });
  } catch (error) {
    console.error('Error loading books:', error);
    // Render with empty data instead of error page
    res.render('books/index', {
      title: 'Quản lý sách',
      active: 'books',
      user: req.session.user,
      books: [],
      stats: { total_titles: 0, total_copies: 0, available_copies: 0, borrowed_copies: 0 },
      majors: []
    });
  }
});

// Add new book form
router.get('/add', requireAuth, async (req, res) => {
  try {
    let majors = [];
    try {
      const majorsResult = await pool.query('SELECT * FROM majors ORDER BY major_name');
      if (majorsResult.rows.length > 0) {
        majors = majorsResult.rows;
      }
    } catch (err) {
      console.error('Error fetching majors:', err);
    }

    res.render('books/add', {
      title: 'Thêm sách mới',
      active: 'books',
      user: req.session.user,
      majors: majors
    });
  } catch (error) {
    console.error('Error loading add book form:', error);
    res.render('books/add', {
      title: 'Thêm sách mới',
      active: 'books',
      user: req.session.user,
      majors: []
    });
  }
});

// Add new book process
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { title_id, title_name, publisher, author, major_id, total_copies } = req.body;
    const copyCount = parseInt(total_copies) || 1;

    try {
      // Check if title_id already exists
      const existingBook = await pool.query('SELECT title_id FROM book_titles WHERE title_id = $1', [title_id]);
      if (existingBook.rows.length > 0) {
        return res.redirect('/books/add?error=Mã sách đã tồn tại. Vui lòng chọn mã khác.');
      }

      // Insert book title with all required fields
      await pool.query(
        'INSERT INTO book_titles (title_id, title_name, publisher, author, major_id, total_copies, available_copies) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [title_id, title_name, publisher, author, major_id, copyCount, copyCount]
      );

      // Insert book copies
      for (let i = 1; i <= copyCount; i++) {
        const copyId = `${title_id}${String(i).padStart(2, '0')}`;
        await pool.query(
          'INSERT INTO book_copies (copy_id, title_id, status, entry_date) VALUES ($1, $2, $3, $4)',
          [copyId, title_id, 'available', new Date().toISOString().split('T')[0]]
        );
      }

      res.redirect('/books?success=Đã thêm sách mới thành công!');
    } catch (err) {
      console.error('Error adding book:', err);
      res.redirect('/books/add?error=Không thể thêm sách. Vui lòng thử lại.');
    }
  } catch (error) {
    console.error('Error in add book route:', error);
    res.redirect('/books/add?error=Lỗi hệ thống. Vui lòng thử lại.');
  }
});

// Edit book form
router.get('/edit/:id', requireAuth, async (req, res) => {
  try {
    let book = null;
    let majors = [];
    let copies = [];

    try {
      const bookResult = await pool.query(`
        SELECT bt.*, m.major_name 
        FROM book_titles bt
        LEFT JOIN majors m ON bt.major_id = m.major_id
        WHERE bt.title_id = $1
      `, [req.params.id]);
      if (bookResult.rows.length > 0) {
        book = bookResult.rows[0];
      }
    } catch (err) {
      console.error('Error fetching book:', err);
    }

    try {
      const majorsResult = await pool.query('SELECT * FROM majors ORDER BY major_name');
      if (majorsResult.rows.length > 0) {
        majors = majorsResult.rows;
      }
    } catch (err) {
      console.error('Error fetching majors:', err);
    }

    try {
      const copiesResult = await pool.query(
        'SELECT * FROM book_copies WHERE title_id = $1 ORDER BY copy_id',
        [req.params.id]
      );
      if (copiesResult.rows.length > 0) {
        copies = copiesResult.rows;
      }
    } catch (err) {
      console.error('Error fetching copies:', err);
    }

    if (!book) {
      return res.redirect('/books?error=Không tìm thấy sách');
    }

    res.render('books/edit', {
      title: 'Chỉnh sửa thông tin sách',
      active: 'books',
      user: req.session.user,
      book: book,
      majors: majors,
      copies: copies
    });
  } catch (error) {
    console.error('Error loading book for edit:', error);
    res.redirect('/books?error=Không thể tải thông tin sách');
  }
});

// Update book
router.post('/edit/:id', requireAuth, async (req, res) => {
  try {
    const { title_name, publisher, author, major_id, description } = req.body;
    const title_id = req.params.id;

    try {
      await pool.query(
        'UPDATE book_titles SET title_name = $1, publisher = $2, author = $3, major_id = $4, description = $5 WHERE title_id = $6',
        [title_name, publisher, author, major_id, description, title_id]
      );

      res.redirect('/books?success=Cập nhật thông tin sách thành công!');
    } catch (err) {
      console.error('Error updating book:', err);
      res.redirect(`/books/edit/${title_id}?error=Không thể cập nhật sách. Vui lòng thử lại.`);
    }
  } catch (error) {
    console.error('Error in update book route:', error);
    res.redirect(`/books/edit/${req.params.id}?error=Lỗi hệ thống. Vui lòng thử lại.`);
  }
});

// Delete book
router.post('/delete/:id', requireAuth, async (req, res) => {
  try {
    try {
      await pool.query('DELETE FROM book_copies WHERE title_id = $1', [req.params.id]);
      await pool.query('DELETE FROM book_titles WHERE title_id = $1', [req.params.id]);
      res.redirect('/books?success=Xóa sách thành công');
    } catch (err) {
      console.error('Error deleting book:', err);
      res.redirect('/books?error=Không thể xóa sách');
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    res.redirect('/books?error=Đã xảy ra lỗi, vui lòng thử lại');
  }
});

module.exports = router;
