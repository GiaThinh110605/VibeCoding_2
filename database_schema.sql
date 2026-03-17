-- Library Management System Database Schema

-- Users table for authentication and role management
CREATE TABLE users (
    user_id VARCHAR(20) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    role ENUM('admin', 'librarian') NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Majors/Categories table
CREATE TABLE majors (
    major_id VARCHAR(10) PRIMARY KEY,
    major_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Readers table
CREATE TABLE readers (
    reader_id VARCHAR(20) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    class VARCHAR(50),
    birth_date DATE,
    gender ENUM('male', 'female', 'other'),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    card_expiry_date DATE,
    status ENUM('active', 'locked', 'expired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Book titles table
CREATE TABLE book_titles (
    title_id VARCHAR(20) PRIMARY KEY,
    title_name VARCHAR(200) NOT NULL,
    publisher VARCHAR(100),
    page_count INT,
    size VARCHAR(50),
    author VARCHAR(100),
    major_id VARCHAR(10),
    isbn VARCHAR(20),
    total_copies INT DEFAULT 0,
    available_copies INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (major_id) REFERENCES majors(major_id)
);

-- Book copies table
CREATE TABLE book_copies (
    copy_id VARCHAR(20) PRIMARY KEY,
    title_id VARCHAR(20) NOT NULL,
    status ENUM('available', 'borrowed', 'damaged', 'lost') DEFAULT 'available',
    location VARCHAR(50),
    entry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (title_id) REFERENCES book_titles(title_id)
);

-- Borrowing transactions table
CREATE TABLE borrowing_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    reader_id VARCHAR(20) NOT NULL,
    copy_id VARCHAR(20) NOT NULL,
    librarian_id VARCHAR(20) NOT NULL,
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
    fine_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reader_id) REFERENCES readers(reader_id),
    FOREIGN KEY (copy_id) REFERENCES book_copies(copy_id),
    FOREIGN KEY (librarian_id) REFERENCES users(user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_readers_status ON readers(status);
CREATE INDEX idx_book_titles_major ON book_titles(major_id);
CREATE INDEX idx_book_copies_status ON book_copies(status);
CREATE INDEX idx_borrowing_reader ON borrowing_transactions(reader_id);
CREATE INDEX idx_borrowing_copy ON borrowing_transactions(copy_id);
CREATE INDEX idx_borrowing_status ON borrowing_transactions(status);

-- Insert default admin user (password: admin123)
INSERT INTO users (user_id, username, password_hash, full_name, role) 
VALUES ('ADMIN001', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe', 'System Administrator', 'admin');

-- Insert sample majors
INSERT INTO majors (major_id, major_name, description) VALUES
('CNTT', 'Công nghệ thông tin', 'Khoa học máy tính và công nghệ thông tin'),
('KT', 'Kinh tế', 'Kinh tế học và quản trị kinh doanh'),
('NN', 'Ngoại ngữ', 'Các ngôn ngữ nước ngoài'),
('KH', 'Khoa học cơ bản', 'Toán, lý, hóa, sinh học');
