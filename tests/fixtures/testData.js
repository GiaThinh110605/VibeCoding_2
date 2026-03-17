// Test fixtures for library management system

module.exports = {
  // Sample users
  users: {
    admin: {
      user_id: 'ADMIN001',
      username: 'admin',
      password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe',
      full_name: 'System Administrator',
      email: 'admin@library.com',
      phone: '0912345678',
      role: 'admin',
      status: 'active'
    },
    librarian: {
      user_id: 'NV001',
      username: 'librarian1',
      password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe',
      full_name: 'Librarian One',
      email: 'librarian1@library.com',
      phone: '0987654321',
      role: 'librarian',
      status: 'active'
    }
  },

  // Sample readers
  readers: {
    student: {
      reader_id: 'SV2023001',
      full_name: 'Nguyễn Văn A',
      class: 'CNTT-K61',
      birth_date: '2003-05-15',
      gender: 'male',
      phone: '0912345678',
      email: 'student@university.edu.vn',
      card_expiry_date: '2025-12-31',
      status: 'active'
    },
    lecturer: {
      reader_id: 'GV2023001',
      full_name: 'Trần Thị B',
      class: 'Khoa Công nghệ thông tin',
      birth_date: '1985-08-20',
      gender: 'female',
      phone: '0987654321',
      email: 'lecturer@university.edu.vn',
      card_expiry_date: '2026-06-30',
      status: 'active'
    }
  },

  // Sample books
  books: {
    title: {
      title_id: 'BOOK001',
      title_name: 'Cấu trúc dữ liệu và giải thuật',
      publisher: 'Nhà xuất bản Khoa học kỹ thuật',
      page_count: 450,
      size: '17x24',
      author: 'Nguyễn Văn C',
      major_id: 'CNTT',
      isbn: '978-604-2-12345-0',
      total_copies: 10,
      available_copies: 8
    },
    copy: {
      copy_id: 'COPY001',
      title_id: 'BOOK001',
      status: 'available',
      location: 'Kệ A-02-12',
      entry_date: '2023-01-15'
    }
  },

  // Sample majors
  majors: [
    {
      major_id: 'CNTT',
      major_name: 'Công nghệ thông tin',
      description: 'Khoa học máy tính và công nghệ thông tin'
    },
    {
      major_id: 'KT',
      major_name: 'Kinh tế',
      description: 'Kinh tế học và quản trị kinh doanh'
    }
  ],

  // Sample borrowing transactions
  borrowing: {
    active: {
      transaction_id: 1,
      reader_id: 'SV2023001',
      copy_id: 'COPY001',
      librarian_id: 'NV001',
      borrow_date: '2023-11-01',
      due_date: '2023-11-15',
      return_date: null,
      status: 'borrowed',
      fine_amount: 0
    },
    returned: {
      transaction_id: 2,
      reader_id: 'SV2023002',
      copy_id: 'COPY002',
      librarian_id: 'NV001',
      borrow_date: '2023-10-15',
      due_date: '2023-10-29',
      return_date: '2023-10-28',
      status: 'returned',
      fine_amount: 0
    }
  }
};
