const express = require('express');
const session = require('express-session');
const path = require('path');
const { create } = require('express-handlebars');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Handlebars setup
const hbs = create({
  extname: '.hbs',
  helpers: {
    eq: (a, b) => a === b,
    formatDate: (date) => {
      return new Date(date).toLocaleDateString('vi-VN');
    }
  }
});

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', require('./routes/auth'));
app.use('/auth', require('./routes/register'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/readers', require('./routes/readers'));
app.use('/books', require('./routes/books'));
app.use('/borrowing', require('./routes/borrowing'));
app.use('/reports', require('./routes/reports'));
app.use('/staff', require('./routes/staff'));

// Home route
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', { title: 'Login' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
