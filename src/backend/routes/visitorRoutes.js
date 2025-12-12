const express = require('express');
const router = express.Router();
const {
  getAllVisitors,
  getVisitorById,
  getVisitorsByTenant,
  createVisitor,
  updateVisitorStatus,
  deleteVisitor
} = require('../controllers/visitorController');
const { authenticate, isAdmin, isTenant, isHelpDesk } = require('../middleware/auth');

// GET /api/visitors - Get all visitors (admin and helpdesk)
router.get('/', authenticate, isHelpDesk, getAllVisitors);

// GET /api/visitors/:id - Get visitor by ID
router.get('/:id', authenticate, getVisitorById);

// GET /api/visitors/tenant/:tenantId - Get visitors by tenant ID
router.get('/tenant/:tenantId', authenticate, getVisitorsByTenant);

// POST /api/visitors - Create new visitor request (tenant only)
router.post('/', authenticate, isTenant, createVisitor);

// PUT /api/visitors/:id/status - Update visitor approval status (admin and helpdesk)
router.put('/:id/status', authenticate, isHelpDesk, updateVisitorStatus);

// DELETE /api/visitors/:id - Delete visitor (admin only)
router.delete('/:id', authenticate, isAdmin, deleteVisitor);

module.exports = router;