const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user info to request
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid or expired token' 
    });
  }
};

// Middleware to check if user is Admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

// Middleware to check if user is Help Desk
const isHelpDesk = (req, res, next) => {
  if (req.user.role !== 'helpdesk' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied. Help desk privileges required.' 
    });
  }
  next();
};

// Middleware to check if user is Tenant
const isTenant = (req, res, next) => {
  if (req.user.role !== 'tenant') {
    return res.status(403).json({ 
      error: 'Access denied. Tenant privileges required.' 
    });
  }
  next();
};

module.exports = { 
  authenticate, 
  isAdmin, 
  isHelpDesk, 
  isTenant 
};