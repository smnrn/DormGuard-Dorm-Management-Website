const db = require('../config/db');

// Get all visitor logs
const getAllVisitorLogs = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        vl.*,
        v.full_name as visitor_name,
        v.purpose,
        v.expected_date as visit_date,
        v.approval_status,
        t.full_name as tenant_name,
        r.room_number,
        a.full_name as processed_by_name
      FROM "Visitor_Log" vl
      LEFT JOIN "Visitor" v ON vl.visitor_id = v.visitor_id
      LEFT JOIN "Tenant" t ON v.tenant_id = t.tenant_id
      LEFT JOIN "Rooms" r ON t.room_id = r.room_id
      LEFT JOIN "Admin" a ON vl.processed_by = a.admin_id
      ORDER BY vl.check_in_time DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get visitor logs error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve visitor logs',
      message: error.message 
    });
  }
};

// Get active visitors (checked in but not checked out)
const getActiveVisitors = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        vl.*,
        v.full_name as visitor_name,
        v.purpose,
        v.expected_date as visit_date,
        v.approval_status,
        t.full_name as tenant_name,
        r.room_number,
        a.full_name as processed_by_name
      FROM "Visitor_Log" vl
      LEFT JOIN "Visitor" v ON vl.visitor_id = v.visitor_id
      LEFT JOIN "Tenant" t ON v.tenant_id = t.tenant_id
      LEFT JOIN "Rooms" r ON t.room_id = r.room_id
      LEFT JOIN "Admin" a ON vl.processed_by = a.admin_id
      WHERE vl.check_in_time IS NOT NULL AND vl.check_out_time IS NULL
      ORDER BY vl.check_in_time DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get active visitors error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve active visitors',
      message: error.message 
    });
  }
};

// Check in visitor
const checkInVisitor = async (req, res) => {
  try {
    const { visitor_id, processed_by } = req.body;

    if (!visitor_id || !processed_by) {
      return res.status(400).json({ 
        error: 'Visitor ID and processor ID are required' 
      });
    }

    // Check if visitor is approved
    const visitorResult = await db.query(
      'SELECT * FROM "Visitor" WHERE visitor_id = $1 AND approval_status = $2',
      [visitor_id, 'Approved']
    );

    if (visitorResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Visitor not found or not approved' 
      });
    }

    // Check if already checked in
    const existingLogResult = await db.query(
      'SELECT * FROM "Visitor_Log" WHERE visitor_id = $1 AND check_out_time IS NULL',
      [visitor_id]
    );

    if (existingLogResult.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Visitor is already checked in' 
      });
    }

    // Create check-in log
    const result = await db.query(
      `INSERT INTO "Visitor_Log" (visitor_id, check_in_time, processed_by) 
       VALUES ($1, NOW(), $2) RETURNING log_id`,
      [visitor_id, processed_by]
    );

    res.status(201).json({
      success: true,
      message: 'Visitor checked in successfully',
      logId: result.rows[0].log_id
    });
  } catch (error) {
    console.error('Check in visitor error:', error);
    res.status(500).json({ 
      error: 'Failed to check in visitor',
      message: error.message 
    });
  }
};

// Check out visitor
const checkOutVisitor = async (req, res) => {
  try {
    const { visitor_id } = req.body;

    if (!visitor_id) {
      return res.status(400).json({ 
        error: 'Visitor ID is required' 
      });
    }

    // Find active check-in log
    const logResult = await db.query(
      'SELECT * FROM "Visitor_Log" WHERE visitor_id = $1 AND check_out_time IS NULL',
      [visitor_id]
    );

    if (logResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'No active check-in found for this visitor' 
      });
    }

    // Update log with check-out time
    await db.query(
      'UPDATE "Visitor_Log" SET check_out_time = NOW() WHERE log_id = $1',
      [logResult.rows[0].log_id]
    );

    res.json({
      success: true,
      message: 'Visitor checked out successfully'
    });
  } catch (error) {
    console.error('Check out visitor error:', error);
    res.status(500).json({ 
      error: 'Failed to check out visitor',
      message: error.message 
    });
  }
};

// Get visitor log by ID
const getVisitorLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT 
        vl.*,
        v.full_name as visitor_name,
        v.purpose,
        v.expected_date as visit_date,
        v.approval_status,
        t.full_name as tenant_name,
        r.room_number,
        a.full_name as processed_by_name
      FROM "Visitor_Log" vl
      LEFT JOIN "Visitor" v ON vl.visitor_id = v.visitor_id
      LEFT JOIN "Tenant" t ON v.tenant_id = t.tenant_id
      LEFT JOIN "Rooms" r ON t.room_id = r.room_id
      LEFT JOIN "Admin" a ON vl.processed_by = a.admin_id
      WHERE vl.log_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Visitor log not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get visitor log error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve visitor log',
      message: error.message 
    });
  }
};

module.exports = {
  getAllVisitorLogs,
  getActiveVisitors,
  checkInVisitor,
  checkOutVisitor,
  getVisitorLogById
};