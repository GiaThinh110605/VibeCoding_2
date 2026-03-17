# Hệ thống Quản lý Thư viện

University Library Management System built with Node.js, Express, and MySQL.

## Tính năng chính

- 🔐 **Xác thực người dùng**: Đăng nhập, phân quyền (Admin/Thủ thư)
- 👥 **Quản lý nhân viên**: Thêm, sửa, xóa thông tin nhân viên thư viện
- 📚 **Quản lý độc giả**: Đăng ký thẻ, quản lý thông tin độc giả
- 📖 **Quản lý sách**: Quản lý đầu sách, bản sao, chuyên ngành
- 🔄 **Mượn/Trả sách**: Xử lý giao dịch mượn trả
- 📊 **Báo cáo thống kê**: Thống kê hoạt động thư viện
- 🎨 **Giao diện responsive**: Thiết kế hiện đại, thân thiện

## Công nghệ sử dụng

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Frontend**: Handlebars, Bootstrap 5, Font Awesome
- **Authentication**: Express Session, bcryptjs
- **Testing**: Jest, Supertest

## Cài đặt và chạy

### Yêu cầu hệ thống

- Node.js 14+ 
- MySQL 5.7+ hoặc MariaDB 10.3+
- Git

### Bước 1: Clone repository

```bash
git clone <repository-url>
cd library-management-system
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Cấu hình database

1. Tạo database trong MySQL:
```sql
CREATE DATABASE library_management;
```

2. Import cấu trúc database:
```bash
mysql -u root -p library_management < database_schema.sql
```

### Bước 4: Cấu hình biến môi trường

1. Copy file môi trường:
```bash
cp .env.example .env
```

2. Chỉnh sửa file `.env` với thông tin của bạn:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=library_management
DB_PORT=3306

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Server Port
PORT=3000

# Session Secret
SESSION_SECRET=your_session_secret_here
```

### Bước 5: Khởi động ứng dụng

**Chạy ở chế độ development:**
```bash
npm run dev
```

**Chạy ở chế độ production:**
```bash
npm start
```

### Bước 6: Truy cập ứng dụng

Mở trình duyệt và truy cập: `http://localhost:3000`

## Tài khoản mặc định

- **Admin**: 
  - Username: `admin`
  - Password: `admin123`

## Cấu trúc project

```
library-management-system/
├── config/
│   └── database.js          # Kết nối database
├── controllers/             # Logic xử lý (chưa tạo)
├── middleware/
│   ├── auth.js              # Middleware xác thực
│   └── validation.js        # Middleware validation (chưa tạo)
├── models/
│   ├── User.js              # Model User
│   ├── Reader.js            # Model Reader (chưa tạo)
│   ├── Book.js              # Model Book (chưa tạo)
│   └── Borrowing.js         # Model Borrowing (chưa tạo)
├── public/
│   ├── css/                 # CSS files
│   ├── js/                  # JavaScript files
│   └── images/              # Hình ảnh
├── routes/
│   ├── auth.js              # Routes xác thực
│   ├── dashboard.js         # Routes dashboard
│   ├── readers.js           # Routes độc giả (chưa tạo)
│   ├── books.js             # Routes sách (chưa tạo)
│   ├── borrowing.js         # Routes mượn trả (chưa tạo)
│   ├── reports.js           # Routes báo cáo (chưa tạo)
│   └── staff.js             # Routes nhân viên
├── views/
│   ├── layouts/
│   │   └── main.hbs         # Layout chính
│   ├── auth/
│   │   └── login.hbs        # Trang đăng nhập
│   ├── staff/
│   │   ├── index.hbs        # Quản lý nhân viên
│   │   ├── add.hbs          # Thêm nhân viên
│   │   └── edit.hbs         # Sửa nhân viên
│   └── dashboard.hbs        # Trang dashboard
├── tests/                   # Thư mục test
├── .env                     # Biến môi trường
├── .env.example             # Mẫu biến môi trường
├── database_schema.sql      # Schema database
├── package.json             # Dependencies
├── README.md                # Documentation
└── server.js                # Server entry point
```

## Testing

### Chạy tests

```bash
# Chạy tất cả tests
npm test

# Chạy tests với coverage
npm run test:coverage

# Chạy tests ở chế độ watch
npm run test:watch
```

### Cấu trúc test

```
tests/
├── unit/                    # Unit tests
│   ├── models/
│   └── routes/
├── integration/             # Integration tests
│   └── api/
└── fixtures/                # Test data
```

## Development workflow

### 1. Tạo feature branch

```bash
git checkout -b feature/ten-feature
```

### 2. Develop và test

```bash
npm run dev
npm test
```

### 3. Commit code

```bash
git add .
git commit -m "feat: thêm tính năng mới"
```

### 4. Push và tạo Pull Request

```bash
git push origin feature/ten-feature
```

## Deployment

### Deploy lên Heroku

1. Cài đặt Heroku CLI
2. Login vào Heroku:
```bash
heroku login
```

3. Tạo app:
```bash
heroku create ten-app
```

4. Set environment variables:
```bash
heroku config:set NODE_ENV=production
heroku config:set DB_HOST=your-db-host
# ... các biến khác
```

5. Deploy:
```bash
git push heroku main
```

### Deploy lên VPS

1. Cài đặt PM2:
```bash
npm install -g pm2
```

2. Tạo file ecosystem.config.js:
```javascript
module.exports = {
  apps: [{
    name: 'library-management',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

3. Start ứng dụng:
```bash
pm2 start ecosystem.config.js
```

## Troubleshooting

### Lỗi kết nối database

Kiểm tra:
1. MySQL service đã chạy chưa
2. Thông tin kết nối trong `.env` đúng chưa
3. Database đã được tạo chưa

### Lỗi port đang sử dụng

Kill process đang sử dụng port 3000:
```bash
# macOS/Linux
sudo lsof -ti:3000 | xargs kill

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Lỗi session không hoạt động

Kiểm tra:
1. `SESSION_SECRET` trong `.env` đã được set chưa
2. Session middleware được đặt đúng thứ tự chưa

## Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push đến branch
5. Tạo Pull Request

## License

MIT License
