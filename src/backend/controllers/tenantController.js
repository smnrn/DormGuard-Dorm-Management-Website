const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Get all tenants
const getAllTenants = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        t.*,
        r.room_number,
        r.capacity as room_capacity,
        r.current_occupants as room_current_occupants
      FROM "Tenant" t
      LEFT JOIN "Rooms" r ON t.room_id = r.room_id
      ORDER BY t.full_name ASC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve tenants',
      message: error.message 
    });
  }
};

// Get tenant by ID
const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT 
        t.*,
        r.room_number,
        r.capacity as room_capacity,
        r.current_occupants as room_current_occupants
      FROM "Tenant" t
      LEFT JOIN "Rooms" r ON t.room_id = r.room_id
      WHERE t.tenant_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Tenant not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve tenant',
      message: error.message 
    });
  }
};

// Create new tenant
const createTenant = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const {
      // Required fields
      username,
      password,
      full_name,
      email,
      contact_number,
      room_id,
      move_in_date,
      
      // Personal Information
      date_of_birth,
      gender,
      nationality,
      id_type,
      id_number,
      
      // Academic/Professional Information
      occupation,
      institution_name,
      student_id,
      year_level,
      course_program,
      
      // Address Information
      permanent_address,
      city,
      province_state,
      postal_code,
      country,
      
      // Emergency Contact
      emergency_contact_name,
      emergency_contact_number,
      emergency_contact_relationship,
      emergency_contact_address,
      
      // Guardian Information
      guardian_name,
      guardian_contact,
      guardian_relationship,
      guardian_address,
      
      // Dormitory Information
      expected_move_out_date,
      lease_duration_months,
      
      // Profile Image
      profile_image
    } = req.body;

    // Validate required fields
    if (!username || !password || !full_name || !email || !contact_number || !room_id) {
      return res.status(400).json({ 
        error: 'All required fields must be provided (username, password, full_name, email, contact_number, room_id)' 
      });
    }

    // Check if username or email already exists
    const existingResult = await client.query(
      'SELECT * FROM "Tenant" WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Username or email already exists' 
      });
    }

    // Check room availability
    const roomResult = await client.query(
      'SELECT * FROM "Rooms" WHERE room_id = $1',
      [room_id]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Room not found' 
      });
    }

    const room = roomResult.rows[0];
    if (room.current_occupants >= room.capacity) {
      return res.status(400).json({ 
        error: 'Room is at full capacity' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Start transaction
    await client.query('BEGIN');

    try {
      // Log registration attempt
      console.log(`📝 Registering new tenant: ${full_name} (${username}) - Room: ${room_id}${profile_image ? ' [WITH PROFILE IMAGE]' : ''}`);
      
      // Insert tenant with all fields
      const result = await client.query(
        `INSERT INTO "Tenant" 
         (username, password, full_name, email, contact_number, room_id, 
          date_of_birth, gender, nationality, id_type, id_number,
          occupation, institution_name, student_id, year_level, course_program,
          permanent_address, city, province_state, postal_code, country,
          emergency_contact_name, emergency_contact_number, emergency_contact_relationship, emergency_contact_address,
          guardian_name, guardian_contact, guardian_relationship, guardian_address,
          move_in_date, expected_move_out_date, lease_duration_months,
          status, profile_image) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34) 
         RETURNING tenant_id, full_name, profile_image`,
        [username, hashedPassword, full_name, email, contact_number, room_id,
         date_of_birth, gender, nationality, id_type, id_number,
         occupation, institution_name, student_id, year_level, course_program,
         permanent_address, city, province_state, postal_code, country,
         emergency_contact_name, emergency_contact_number, emergency_contact_relationship, emergency_contact_address,
         guardian_name, guardian_contact, guardian_relationship, guardian_address,
         move_in_date || new Date(), expected_move_out_date, lease_duration_months,
         'Active', profile_image]
      );

      const newTenantId = result.rows[0].tenant_id;
      const savedProfileImage = result.rows[0].profile_image;

      // Update room occupancy
      await client.query(
        'UPDATE "Rooms" SET current_occupants = current_occupants + 1 WHERE room_id = $1',
        [room_id]
      );

      await client.query('COMMIT');

      // Log successful registration with confirmation
      console.log(`✅ Tenant registered successfully!`);
      console.log(`   ├─ Tenant ID: ${newTenantId}`);
      console.log(`   ├─ Name: ${result.rows[0].full_name}`);
      console.log(`   ├─ Username: ${username}`);
      console.log(`   ├─ Room ID: ${room_id}`);
      console.log(`   └─ Profile Image: ${savedProfileImage ? 'YES ✓' : 'NO (will be added later)'}`);

      res.status(201).json({
        success: true,
        message: 'Tenant registered successfully',
        tenantId: newTenantId,
        tenantName: result.rows[0].full_name,
        hasProfileImage: !!savedProfileImage
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ 
      error: 'Failed to create tenant',
      message: error.message 
    });
  } finally {
    client.release();
  }
};

// Update tenant
const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.tenant_id;
    delete updates.password; // Password updates should use separate endpoint
    delete updates.username; // Username shouldn't be changed

    // If updating status, handle room occupancy changes
    if (updates.status) {
      const client = await db.pool.connect();
      
      try {
        await client.query('BEGIN');

        // Get tenant's current status and room
        const tenantResult = await client.query(
          'SELECT status, room_id FROM "Tenant" WHERE tenant_id = $1',
          [id]
        );

        if (tenantResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Tenant not found' });
        }

        const currentStatus = tenantResult.rows[0].status;
        const roomId = tenantResult.rows[0].room_id;
        const newStatus = updates.status;

        // Handle room occupancy changes based on status transitions
        if (roomId) {
          // Moving Out: Active → Moved Out (decrement occupancy)
          if (currentStatus === 'Active' && newStatus === 'Moved Out') {
            await client.query(
              'UPDATE "Rooms" SET current_occupants = current_occupants - 1 WHERE room_id = $1',
              [roomId]
            );
            console.log(`Room ${roomId} occupancy decreased (tenant moved out)`);
          }
          // Returning: Moved Out → Active (increment occupancy)
          else if (currentStatus === 'Moved Out' && newStatus === 'Active') {
            await client.query(
              'UPDATE "Rooms" SET current_occupants = current_occupants + 1 WHERE room_id = $1',
              [roomId]
            );
            console.log(`Room ${roomId} occupancy increased (tenant returned)`);
          }
        }

        // Update tenant status
        const fields = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = fields.map((field, idx) => `${field} = $${idx + 1}`).join(', ');

        await client.query(
          `UPDATE "Tenant" SET ${setClause} WHERE tenant_id = $${fields.length + 1}`,
          [...values, id]
        );

        await client.query('COMMIT');

        res.json({
          success: true,
          message: 'Tenant updated successfully'
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // Regular update without status/room occupancy changes
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      
      if (fields.length === 0) {
        return res.status(400).json({ 
          error: 'No fields to update' 
        });
      }

      const setClause = fields.map((field, idx) => `${field} = $${idx + 1}`).join(', ');

      const result = await db.query(
        `UPDATE "Tenant" SET ${setClause} WHERE tenant_id = $${fields.length + 1}`,
        [...values, id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ 
          error: 'Tenant not found' 
        });
      }

      res.json({
        success: true,
        message: 'Tenant updated successfully'
      });
    }
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ 
      error: 'Failed to update tenant',
      message: error.message 
    });
  }
};

// Delete tenant
const deleteTenant = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    try {
      // Get tenant's room
      const tenantResult = await client.query(
        'SELECT room_id FROM "Tenant" WHERE tenant_id = $1',
        [id]
      );

      if (tenantResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ 
          error: 'Tenant not found' 
        });
      }

      // Decrease room occupancy
      if (tenantResult.rows[0].room_id) {
        await client.query(
          'UPDATE "Rooms" SET current_occupants = current_occupants - 1 WHERE room_id = $1',
          [tenantResult.rows[0].room_id]
        );
      }

      // Delete tenant
      await client.query('DELETE FROM "Tenant" WHERE tenant_id = $1', [id]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Tenant deleted successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ 
      error: 'Failed to delete tenant',
      message: error.message 
    });
  } finally {
    client.release();
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Verify the user is changing their own password
    // req.user.userId comes from JWT token (mapped in authController)
    if (req.user.userId !== parseInt(id) && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'You can only change your own password' 
      });
    }

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters long' 
      });
    }

    // Get tenant's current password
    const result = await db.query(
      'SELECT password FROM "Tenant" WHERE tenant_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Tenant not found' 
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'Current password is incorrect' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await db.query(
      'UPDATE "Tenant" SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = $2',
      [hashedPassword, id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Failed to change password',
      message: error.message 
    });
  }
};

// Update profile image
const updateProfileImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { profile_image, profile_image_url, storage_type } = req.body;

    // STRICT VALIDATION: Verify the user is updating their own profile
    // req.user.userId comes from JWT token (mapped in authController)
    const requestedTenantId = parseInt(id);
    const authenticatedUserId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    // Critical security check
    if (!isAdmin && authenticatedUserId !== requestedTenantId) {
      console.error(`⛔ SECURITY VIOLATION: User ${authenticatedUserId} attempted to update tenant ${requestedTenantId}'s profile image`);
      return res.status(403).json({ 
        error: 'You can only update your own profile image' 
      });
    }

    // Validate input
    const imageData = profile_image_url || profile_image;
    if (!imageData) {
      return res.status(400).json({ 
        error: 'Profile image data is required' 
      });
    }

    // Validate format based on storage type
    if (storage_type === 'google_drive') {
      // Google Drive URL validation
      if (!imageData.includes('drive.google.com') && !imageData.includes('googleusercontent.com')) {
        return res.status(400).json({ 
          error: 'Invalid Google Drive URL format' 
        });
      }
    } else {
      // Base64 validation
      if (!imageData.startsWith('data:image/')) {
        return res.status(400).json({ 
          error: 'Invalid image format. Must be a base64 encoded image or Google Drive URL.' 
        });
      }
    }

    // Log the update for audit trail
    console.log(`📸 Updating profile image for tenant ${requestedTenantId} (Requested by: ${authenticatedUserId}, Admin: ${isAdmin}, Storage: ${storage_type})`);

    // Update profile image in database
    const result = await db.query(
      'UPDATE "Tenant" SET profile_image = $1, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = $2 RETURNING tenant_id, full_name',
      [imageData, requestedTenantId]
    );

    if (result.rowCount === 0) {
      console.error(`❌ Tenant ${requestedTenantId} not found in database`);
      return res.status(404).json({ 
        error: 'Tenant not found' 
      });
    }

    console.log(`✅ Profile image updated successfully for tenant ${result.rows[0].tenant_id} (${result.rows[0].full_name})`);

    res.json({
      success: true,
      message: 'Profile image updated successfully',
      tenantId: result.rows[0].tenant_id,
      tenantName: result.rows[0].full_name
    });
  } catch (error) {
    console.error('Update profile image error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile image',
      message: error.message 
    });
  }
};

module.exports = {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  changePassword,
  updateProfileImage
};