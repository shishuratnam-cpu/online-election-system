const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

// Generic verify token middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info (id, username/email, role)
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// Check if user is Admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(430).json({ message: 'Access denied. Admin role required.' }); // 403 Forbidden (430 used for clear API distinction)
  }
};

// Check if user is Organizer
const isOrganizer = (req, res, next) => {
  if (req.user && req.user.role === 'organizer') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Organizer role required.' });
  }
};

// Check if user is Voter
const isVoter = (req, res, next) => {
  if (req.user && req.user.role === 'voter') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Voter role required.' });
  }
};

// Dynamic role authorization
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      return res.status(403).json({ message: `Access denied. Requires one of the following roles: ${roles.join(', ')}` });
    }
  };
};

module.exports = {
  verifyToken,
  isAdmin,
  isOrganizer,
  isVoter,
  authorizeRoles
};
