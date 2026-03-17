const User = require('../models/User');

const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  next();
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/');
    }
    
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).render('error', { 
        message: 'Bạn không có quyền truy cập trang này' 
      });
    }
    
    next();
  };
};

module.exports = { requireAuth, requireRole };
