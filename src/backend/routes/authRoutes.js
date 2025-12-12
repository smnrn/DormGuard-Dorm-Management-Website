const express = require('express');
const router = express.Router();
const { login, registerAdmin, logout } = require('../controllers/authController');
const { authenticate, isAdmin } = require('../middleware/auth');

// POST /api/auth/login - Login endpoint (public)
router.post('/login', login);

// POST /api/auth/logout - Logout endpoint (public)
router.post('/logout', logout);

// POST /api/auth/register-admin - Register new admin (protected, admin only)
router.post('/register-admin', authenticate, isAdmin, registerAdmin);

module.exports = router;