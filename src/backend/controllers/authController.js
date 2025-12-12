const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Login controller
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }

    let user = null;
    let role = null;
    let userId = null;
    let fullName = null;

    // Check Admin table first (includes both Admin and HelpDesk roles)
    const adminResult = await db.query(
      'SELECT * FROM "Admin" WHERE username = $1',
      [username]
    );

    if (adminResult.rows.length > 0) {
      user = adminResult.rows[0];
      // Map database role to frontend role
      // Database stores "Admin" or "HelpDesk", we need to normalize to lowercase
      console.log('[AUTH] Database role:', user.role); // Debug log
      if (user.role === 'HelpDesk') {
        role = 'helpdesk';
      } else if (user.role === 'Admin') {
        role = 'admin';
      } else {
        // Fallback: normalize any role to lowercase
        role = user.role.toLowerCase();
      }
      console.log('[AUTH] Mapped role:', role); // Debug log
      userId = user.admin_id;
      fullName = user.full_name;
    }

    // Check Tenant table if not found in Admin
    if (!user) {
      const tenantResult = await db.query(
        'SELECT * FROM "Tenant" WHERE username = $1',
        [username]
      );

      if (tenantResult.rows.length > 0) {
        user = tenantResult.rows[0];
        role = 'tenant';
        userId = user.tenant_id;
        fullName = user.full_name;
      }
    }

    // User not found
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid username or password' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid username or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId, 
        username: user.username, 
        role,
        fullName 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        userId,
        username: user.username,
        fullName,
        role,
        email: user.email,
        phone: user.contact_number || user.phone_number || user.contact || null
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'An error occurred during login',
      message: error.message 
    });
  }
};

// Register new admin (only accessible by existing admin)
const registerAdmin = async (req, res) => {
  try {
    const { username, password, full_name, email, contact_number, role } = req.body;

    // Validate input
    if (!username || !password || !full_name || !email) {
      return res.status(400).json({ 
        error: 'All required fields must be provided' 
      });
    }

    // Check if username already exists
    const existingResult = await db.query(
      'SELECT * FROM "Admin" WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Username or email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new admin
    const result = await db.query(
      `INSERT INTO "Admin" (username, password, full_name, email, contact_number, role) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING admin_id`,
      [username, hashedPassword, full_name, email, contact_number, role || 'Admin']
    );

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      adminId: result.rows[0].admin_id
    });

  } catch (error) {
    console.error('Register admin error:', error);
    res.status(500).json({ 
      error: 'An error occurred during registration',
      message: error.message 
    });
  }
};

// Logout controller
const logout = async (req, res) => {
  try {
    // Since we're using JWT, logout is handled client-side by removing the token
    // This endpoint exists for consistency and can be extended for token blacklisting
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'An error occurred during logout',
      message: error.message 
    });
  }
};

module.exports = {
  login,
  registerAdmin,
  logout
};