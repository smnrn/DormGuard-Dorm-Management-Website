const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, isTenant } = require('../middleware/auth');

// GET /api/tenant/profile - Get current tenant's profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const username = req.user.username;
    
    console.log('[TENANT PROFILE] Fetching profile for userId:', userId, 'username:', username);
    
    // Try to find by tenant_id first
    let result = await db.query(`
      SELECT 
        t.*,
        r.room_number,
        r.building as room_building,
        r.capacity as room_capacity,
        r.current_occupants as room_current_occupants
      FROM "Tenant" t
      LEFT JOIN "Rooms" r ON t.room_id = r.room_id
      WHERE t.tenant_id = $1
    `, [userId]);

    // If not found by ID, try by username (for backward compatibility)
    if (result.rows.length === 0 && username) {
      console.log('[TENANT PROFILE] Not found by ID, trying username:', username);
      result = await db.query(`
        SELECT 
          t.*,
          r.room_number,
          r.building as room_building,
          r.capacity as room_capacity,
          r.current_occupants as room_current_occupants
        FROM "Tenant" t
        LEFT JOIN "Rooms" r ON t.room_id = r.room_id
        WHERE t.username = $1
      `, [username]);
    }

    if (result.rows.length === 0) {
      console.log('[TENANT PROFILE] Tenant not found for userId:', userId, 'username:', username);
      return res.status(404).json({ 
        error: 'Tenant profile not found',
        details: `No tenant found with ID ${userId} or username ${username}` 
      });
    }

    console.log('[TENANT PROFILE] Found tenant:', result.rows[0].full_name);
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get tenant profile error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve profile',
      message: error.message 
    });
  }
});

// POST /api/tenant/register-visitor - Register a new visitor
router.post('/register-visitor', authenticate, async (req, res) => {
  try {
    const tenant_id = req.user.userId;
    const {
      full_name,
      contact_number,
      purpose,
      expected_date,
      expected_time
    } = req.body;

    console.log('[REGISTER VISITOR] Received data:', { full_name, contact_number, purpose, expected_date, expected_time });

    // Validate required fields
    if (!full_name || !purpose || !expected_date) {
      return res.status(400).json({ 
        error: 'All required fields must be provided (full_name, purpose, expected_date)' 
      });
    }

    // Combine date and time for validation
    const visitDateTimeString = expected_time 
      ? `${expected_date}T${expected_time}` 
      : expected_date;
    const visitDateTime = new Date(visitDateTimeString);
    const now = new Date();
    const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    console.log('[REGISTER VISITOR] Visit date/time:', visitDateTime);
    console.log('[REGISTER VISITOR] Twelve hours from now:', twelveHoursFromNow);

    if (visitDateTime < twelveHoursFromNow) {
      return res.status(400).json({ 
        error: 'Visitor registration must be submitted at least 12 hours before the visit date' 
      });
    }

    // Insert visitor with all fields
    const result = await db.query(
      `INSERT INTO "Visitor" 
       (tenant_id, full_name, contact_number, purpose, expected_date, expected_time, approval_status, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING visitor_id`,
      [tenant_id, full_name, contact_number || '', purpose, expected_date, expected_time || '', 'Pending']
    );

    console.log('[REGISTER VISITOR] Successfully created visitor:', result.rows[0].visitor_id);

    res.status(201).json({
      success: true,
      message: 'Visitor registration submitted successfully',
      visitor: {
        visitor_id: result.rows[0].visitor_id,
        full_name: full_name,
        contact_number: contact_number,
        purpose: purpose,
        expected_date: expected_date,
        expected_time: expected_time,
        approval_status: 'Pending'
      }
    });
  } catch (error) {
    console.error('Register visitor error:', error);
    res.status(500).json({ 
      error: 'Failed to register visitor',
      message: error.message 
    });
  }
});

// GET /api/tenant/visitors - Get current tenant's visitors
router.get('/visitors', authenticate, async (req, res) => {
  try {
    const tenant_id = req.user.userId;

    const result = await db.query(`
      SELECT 
        v.*,
        t.full_name as tenant_name,
        r.room_number as tenant_room_number,
        vl.log_id,
        vl.check_in_time,
        vl.check_out_time
      FROM "Visitor" v
      LEFT JOIN "Tenant" t ON v.tenant_id = t.tenant_id
      LEFT JOIN "Rooms" r ON t.room_id = r.room_id
      LEFT JOIN "Visitor_Log" vl ON v.visitor_id = vl.visitor_id
      WHERE v.tenant_id = $1
      ORDER BY v.created_at DESC
    `, [tenant_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get tenant visitors error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve visitors',
      message: error.message 
    });
  }
});

// PUT /api/tenant/visitors/:id - Update visitor (only if Pending)
router.put('/visitors/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const tenant_id = req.user.userId;
    const { visitor_name, purpose, visit_date } = req.body;

    // Check if visitor belongs to this tenant and is Pending
    const checkResult = await db.query(
      'SELECT * FROM "Visitor" WHERE visitor_id = $1 AND tenant_id = $2',
      [id, tenant_id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Visitor not found or access denied' 
      });
    }

    if (checkResult.rows[0].approval_status !== 'Pending') {
      return res.status(400).json({ 
        error: 'Cannot update visitor after approval/rejection' 
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (visitor_name) {
      updates.push(`visitor_name = $${paramCount++}`);
      values.push(visitor_name);
    }
    if (purpose) {
      updates.push(`purpose = $${paramCount++}`);
      values.push(purpose);
    }
    if (visit_date) {
      updates.push(`visit_date = $${paramCount++}`);
      values.push(visit_date);
    }

    if (updates.length === 0) {
      return res.status(400).json({ 
        error: 'No fields to update' 
      });
    }

    values.push(id);
    await db.query(
      `UPDATE "Visitor" SET ${updates.join(', ')} WHERE visitor_id = $${paramCount}`,
      values
    );

    res.json({
      success: true,
      message: 'Visitor updated successfully'
    });
  } catch (error) {
    console.error('Update visitor error:', error);
    res.status(500).json({ 
      error: 'Failed to update visitor',
      message: error.message 
    });
  }
});

// DELETE /api/tenant/visitors/:id - Delete visitor (only if Pending)
router.delete('/visitors/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const tenant_id = req.user.userId;

    // Check if visitor belongs to this tenant and is Pending
    const checkResult = await db.query(
      'SELECT * FROM "Visitor" WHERE visitor_id = $1 AND tenant_id = $2',
      [id, tenant_id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Visitor not found or access denied' 
      });
    }

    if (checkResult.rows[0].approval_status !== 'Pending') {
      return res.status(400).json({ 
        error: 'Cannot delete visitor after approval/rejection' 
      });
    }

    // Delete visitor
    await db.query('DELETE FROM "Visitor" WHERE visitor_id = $1', [id]);

    res.json({
      success: true,
      message: 'Visitor deleted successfully'
    });
  } catch (error) {
    console.error('Delete visitor error:', error);
    res.status(500).json({ 
      error: 'Failed to delete visitor',
      message: error.message 
    });
  }
});

module.exports = router;