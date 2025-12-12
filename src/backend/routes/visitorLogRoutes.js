const express = require('express');
const router = express.Router();
const {
  getAllVisitorLogs,
  getActiveVisitors,
  checkInVisitor,
  checkOutVisitor,
  getVisitorLogById
} = require('../controllers/visitorLogController');
const { authenticate, isAdmin, isHelpDesk } = require('../middleware/auth');

// GET /api/visitor-logs - Get all visitor logs (admin and helpdesk)
router.get('/', authenticate, isHelpDesk, getAllVisitorLogs);

// GET /api/visitor-logs/active - Get currently active visitors (admin/help desk)
router.get('/active', authenticate, isHelpDesk, getActiveVisitors);

// GET /api/visitor-logs/:id - Get visitor log by ID
router.get('/:id', authenticate, getVisitorLogById);

// POST /api/visitor-logs/check-in - Check in visitor (help desk)
router.post('/check-in', authenticate, isHelpDesk, checkInVisitor);

// POST /api/visitor-logs/check-out - Check out visitor (help desk)
router.post('/check-out', authenticate, isHelpDesk, checkOutVisitor);

module.exports = router;