const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    // Kiểm tra token từ header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Kiểm tra token từ query parameter
    else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện chức năng này' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'Người dùng không tồn tại' });
      }

      // Add user to request
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Lỗi xác thực, vui lòng thử lại' });
  }
};

// Middleware phân quyền theo role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện chức năng này' });
    }

    // Kiểm tra role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Bạn không có quyền thực hiện chức năng này',
        currentRole: req.user.role,
        requiredRoles: roles
      });
    }

    // Thêm logic kiểm tra phòng ban cho trưởng phòng ban
    if (req.user.role === 'department_head' && req.user.department !== 'hr') {
      // Lưu thông tin phòng ban vào request để các controller có thể sử dụng
      req.userDepartment = req.user.department;
    }

    next();
  };
};

// Middleware phân quyền chi tiết cho Admin và HR
const authorizeAdminHR = (action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện chức năng này' });
    }

    // CEO có đầy đủ quyền
    if (req.user.role === 'ceo') {
      return next();
    }

    // Admin chỉ có quyền xem
    if (req.user.role === 'admin') {
      if (action !== 'view') {
        return res.status(403).json({ 
          message: 'Bạn chỉ có quyền xem thông tin',
          currentRole: req.user.role,
          requiredAction: action
        });
      }
    }

    // HR có đầy đủ quyền trừ quản lý tài khoản
    if (req.user.role === 'hr') {
      if (action === 'manage_accounts') {
        return res.status(403).json({ 
          message: 'HR không có quyền quản lý tài khoản',
          currentRole: req.user.role,
          requiredAction: action
        });
      }
      return next();
    }

    // Trưởng phòng ban (không phải HR) chỉ có quyền xem và chỉ xem được dữ liệu của phòng mình
    if (req.user.role === 'department_head') {
      // Nếu là trưởng phòng HR thì có đầy đủ quyền
      if (req.user.department === 'hr') {
        return next();
      }

      // Các trưởng phòng khác chỉ có quyền xem
      if (action !== 'view') {
        return res.status(403).json({
          message: 'Trưởng phòng ban chỉ có quyền xem thông tin',
          currentRole: req.user.role,
          requiredAction: action
        });
      }

      // Lưu department vào request để controller có thể sử dụng
      req.userDepartment = req.user.department;
      return next();
    }

    // Kiểm tra role
    if (!['admin', 'hr', 'department_head', 'ceo'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Bạn không có quyền thực hiện chức năng này',
        currentRole: req.user.role,
        requiredRoles: ['admin', 'hr', 'department_head', 'ceo']
      });
    }

    next();
  };
};

module.exports = { protect, authorize, authorizeAdminHR };
