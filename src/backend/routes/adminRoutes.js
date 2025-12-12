const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, isAdmin, isHelpDesk } = require('../middleware/auth');
const { updateVisitorStatus } = require('../controllers/visitorController');
const { createTenant } = require('../controllers/tenantController');

// GET /api/admin/dashboard-stats - Get dashboard statistics
router.get('/dashboard-stats', authenticate, isAdmin, async (req, res) => {
  try {
    // Get total tenants
    const tenantResult = await db.query('SELECT COUNT(*) as count FROM "Tenant" WHERE status = $1', ['Active']);
    
    // Get pending visitor requests
    const pendingResult = await db.query('SELECT COUNT(*) as count FROM "Visitor" WHERE approval_status = $1', ['Pending']);
    
    // Get active visitors (checked in, not checked out)
    const activeResult = await db.query(`
      SELECT COUNT(*) as count 
      FROM "Visitor_Log" 
      WHERE check_in_time IS NOT NULL AND check_out_time IS NULL
    `);
    
    // Get total visitors today
    const todayResult = await db.query(`
      SELECT COUNT(*) as count 
      FROM "Visitor_Log" 
      WHERE DATE(check_in_time) = CURRENT_DATE
    `);

    res.json({
      success: true,
      data: {
        activeTenants: parseInt(tenantResult.rows[0].count),
        pendingApprovals: parseInt(pendingResult.rows[0].count),
        activeVisitors: parseInt(activeResult.rows[0].count),
        todayVisitors: parseInt(todayResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve dashboard statistics',
      message: error.message 
    });
  }
});

// GET /api/admin/rooms - Get all rooms with occupancy (admin and helpdesk)
router.get('/rooms', authenticate, isHelpDesk, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM "Rooms" ORDER BY room_number');
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve rooms',
      message: error.message 
    });
  }
});

// PUT /api/admin/approve-visitor/:id - Approve visitor (admin and helpdesk)
router.put('/approve-visitor/:id', authenticate, isHelpDesk, async (req, res) => {
  req.body = { approval_status: 'Approved' };
  return updateVisitorStatus(req, res);
});

// PUT /api/admin/reject-visitor/:id - Reject visitor (admin and helpdesk)
router.put('/reject-visitor/:id', authenticate, isHelpDesk, async (req, res) => {
  req.body = { approval_status: 'Denied' };
  return updateVisitorStatus(req, res);
});

// POST /api/admin/create-tenant - Create a new tenant
router.post('/create-tenant', authenticate, isAdmin, async (req, res) => {
  return createTenant(req, res);
});

module.exports = router;