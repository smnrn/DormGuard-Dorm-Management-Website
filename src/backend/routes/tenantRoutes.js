const express = require('express');
const router = express.Router();
const {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  changePassword,
  updateProfileImage
} = require('../controllers/tenantController');
const { authenticate, isAdmin, isHelpDesk } = require('../middleware/auth');

// GET /api/tenants - Get all tenants (admin and helpdesk)
router.get('/', authenticate, isHelpDesk, getAllTenants);

// GET /api/tenants/:id - Get tenant by ID
router.get('/:id', authenticate, getTenantById);

// POST /api/tenants - Create new tenant (admin only)
router.post('/', authenticate, isAdmin, createTenant);

// PUT /api/tenants/:id - Update tenant (admin only)
router.put('/:id', authenticate, isAdmin, updateTenant);

// PUT /api/tenants/:id/change-password - Change password (tenant themselves)
router.put('/:id/change-password', authenticate, changePassword);

// PUT /api/tenants/:id/profile-image - Update profile image (tenant themselves)
router.put('/:id/profile-image', authenticate, updateProfileImage);

// DELETE /api/tenants/:id - Delete tenant (admin only)
router.delete('/:id', authenticate, isAdmin, deleteTenant);

module.exports = router;