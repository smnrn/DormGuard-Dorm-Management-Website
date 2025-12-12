# DormGuard API Documentation

**Base URL:** `http://localhost:5000/api`

**Version:** 1.0.0

**Authentication:** JWT Bearer Token (stored in localStorage as 'authToken')

---

## Table of Contents

1. [Authentication](#authentication)
2. [Tenant Endpoints](#tenant-endpoints)
3. [Visitor Endpoints](#visitor-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [Visitor Log Endpoints](#visitor-log-endpoints)
6. [Error Responses](#error-responses)
7. [Authentication Flow](#authentication-flow)

---

## Authentication

### 1. Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user and receive JWT token

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "username": "admin",
    "role": "admin",
    "full_name": "Admin User"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid credentials"
}
```

---

### 2. Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Logout current user session

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 3. Register Admin (Admin Only)

**Endpoint:** `POST /api/auth/register-admin`

**Description:** Register a new admin user

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "username": "newadmin",
  "password": "SecurePass123!",
  "full_name": "New Admin User",
  "email": "admin@dormguard.com"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "admin": {
    "admin_id": 2,
    "username": "newadmin",
    "full_name": "New Admin User"
  }
}
```

---

## Tenant Endpoints

### 1. Get All Tenants (Admin Only)

**Endpoint:** `GET /api/tenants`

**Description:** Retrieve all tenants with room information

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "tenant_id": 1,
      "username": "john.doe",
      "full_name": "John Doe",
      "email": "john.doe@university.edu",
      "contact_number": "+1234567890",
      "date_of_birth": "2000-05-15",
      "gender": "Male",
      "nationality": "American",
      "address": "123 Main St, City",
      "room_id": 1,
      "room_number": "A101",
      "building": "Building A",
      "status": "Active",
      "move_in_date": "2024-09-01",
      "profile_image": "https://drive.google.com/...",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 2. Get Tenant by ID

**Endpoint:** `GET /api/tenants/:id`

**Description:** Get specific tenant details

**Headers:**
```
Authorization: Bearer {token}
```

**URL Parameters:**
- `id` (integer): Tenant ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tenant_id": 1,
    "username": "john.doe",
    "full_name": "John Doe",
    "email": "john.doe@university.edu",
    "contact_number": "+1234567890",
    "room_number": "A101",
    "building": "Building A"
  }
}
```

---

### 3. Create Tenant (Admin Only)

**Endpoint:** `POST /api/tenants` or `POST /api/admin/create-tenant`

**Description:** Register a new tenant with comprehensive information

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "username": "jane.smith",
  "password": "TempPass123!",
  "full_name": "Jane Smith",
  "email": "jane.smith@university.edu",
  "contact_number": "+1234567891",
  "date_of_birth": "2001-03-20",
  "gender": "Female",
  "nationality": "American",
  "address": "456 Oak Ave, City",
  "emergency_contact_name": "Mary Smith",
  "emergency_contact_relationship": "Mother",
  "emergency_contact_number": "+1234567892",
  "room_id": 2,
  "move_in_date": "2024-09-01",
  "lease_start_date": "2024-09-01",
  "lease_end_date": "2025-05-31",
  "student_id": "STU2024001",
  "year_level": "2",
  "course": "Computer Science",
  "department": "Engineering",
  "profile_image": "https://drive.google.com/...",
  "status": "Active"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Tenant created successfully",
  "tenant": {
    "tenant_id": 2,
    "username": "jane.smith",
    "full_name": "Jane Smith",
    "email": "jane.smith@university.edu"
  }
}
```

---

### 4. Update Tenant (Admin Only)

**Endpoint:** `PUT /api/tenants/:id`

**Description:** Update tenant information

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "full_name": "Jane Smith Updated",
  "contact_number": "+1234567899",
  "room_id": 3,
  "status": "Active"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Tenant updated successfully"
}
```

---

### 5. Delete Tenant (Admin Only)

**Endpoint:** `DELETE /api/tenants/:id`

**Description:** Delete a tenant (sets status to Inactive)

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Tenant deleted successfully"
}
```

---

### 6. Change Password

**Endpoint:** `PUT /api/tenants/:id/change-password`

**Description:** Change tenant password

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### 7. Update Profile Image

**Endpoint:** `PUT /api/tenants/:id/profile-image`

**Description:** Update tenant profile image (Google Drive link)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "profile_image": "https://drive.google.com/file/d/..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile image updated successfully"
}
```

---

### 8. Get Current Tenant Profile

**Endpoint:** `GET /api/tenant/profile`

**Description:** Get logged-in tenant's profile information

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tenant_id": 1,
    "username": "john.doe",
    "full_name": "John Doe",
    "email": "john.doe@university.edu",
    "contact_number": "+1234567890",
    "room_number": "A101",
    "room_building": "Building A",
    "room_capacity": 2,
    "room_current_occupants": 1,
    "profile_image": "https://drive.google.com/...",
    "status": "Active"
  }
}
```

---

## Visitor Endpoints

### 1. Get All Visitors (Admin Only)

**Endpoint:** `GET /api/visitors`

**Description:** Retrieve all visitor requests

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "visitor_id": 1,
      "tenant_id": 1,
      "full_name": "Alice Johnson",
      "contact_number": "+1987654321",
      "purpose": "Family visit",
      "expected_date": "2024-12-10",
      "expected_time": "14:00",
      "approval_status": "Pending",
      "tenant_name": "John Doe",
      "tenant_room_number": "A101",
      "created_at": "2024-12-04T10:00:00Z"
    }
  ]
}
```

---

### 2. Get Visitor by ID

**Endpoint:** `GET /api/visitors/:id`

**Description:** Get specific visitor details

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "visitor_id": 1,
    "full_name": "Alice Johnson",
    "contact_number": "+1987654321",
    "purpose": "Family visit",
    "expected_date": "2024-12-10",
    "approval_status": "Approved"
  }
}
```

---

### 3. Get Visitors by Tenant

**Endpoint:** `GET /api/visitors/tenant/:tenantId`

**Description:** Get all visitors for a specific tenant

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "visitor_id": 1,
      "full_name": "Alice Johnson",
      "approval_status": "Approved",
      "expected_date": "2024-12-10"
    }
  ]
}
```

---

### 4. Register Visitor (Tenant Only)

**Endpoint:** `POST /api/visitors` or `POST /api/tenant/register-visitor`

**Description:** Register a new visitor (must be at least 12 hours in advance)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "full_name": "Bob Wilson",
  "contact_number": "+1555123456",
  "purpose": "Birthday celebration",
  "expected_date": "2024-12-15",
  "expected_time": "18:00"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Visitor registration submitted successfully",
  "visitor": {
    "visitor_id": 2,
    "full_name": "Bob Wilson",
    "approval_status": "Pending",
    "expected_date": "2024-12-15"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Visitor registration must be submitted at least 12 hours before the visit date"
}
```

---

### 5. Update Visitor Status (Admin Only)

**Endpoint:** `PUT /api/visitors/:id/status`

**Description:** Approve or deny visitor request

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "approval_status": "Approved",
  "admin_remarks": "Approved for family visit"
}
```

**Approval Status Options:**
- `Approved`
- `Denied`
- `Pending`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Visitor status updated successfully"
}
```

---

### 6. Approve Visitor (Admin Only)

**Endpoint:** `PUT /api/admin/approve-visitor/:id`

**Description:** Quick approve visitor

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Visitor approved successfully"
}
```

---

### 7. Reject Visitor (Admin Only)

**Endpoint:** `PUT /api/admin/reject-visitor/:id`

**Description:** Quick reject visitor

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body (optional):**
```json
{
  "rejection_reason": "Security concerns"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Visitor rejected successfully"
}
```

---

### 8. Delete Visitor (Admin Only)

**Endpoint:** `DELETE /api/visitors/:id`

**Description:** Delete a visitor request

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Visitor deleted successfully"
}
```

---

### 9. Get Current Tenant's Visitors

**Endpoint:** `GET /api/tenant/visitors`

**Description:** Get all visitors registered by logged-in tenant

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "visitor_id": 1,
      "full_name": "Alice Johnson",
      "contact_number": "+1987654321",
      "purpose": "Family visit",
      "expected_date": "2024-12-10",
      "expected_time": "14:00",
      "approval_status": "Approved",
      "check_in_time": null,
      "check_out_time": null
    }
  ]
}
```

---

### 10. Update Visitor (Tenant - Pending Only)

**Endpoint:** `PUT /api/tenant/visitors/:id`

**Description:** Update visitor details (only if status is Pending)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "visitor_name": "Alice Johnson Updated",
  "purpose": "Updated purpose",
  "visit_date": "2024-12-11"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Visitor updated successfully"
}
```

---

### 11. Delete Visitor (Tenant - Pending Only)

**Endpoint:** `DELETE /api/tenant/visitors/:id`

**Description:** Delete visitor (only if status is Pending)

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Visitor deleted successfully"
}
```

---

## Admin Endpoints

### 1. Get Dashboard Statistics

**Endpoint:** `GET /api/admin/dashboard-stats`

**Description:** Get dashboard overview statistics

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "activeTenants": 45,
    "pendingApprovals": 8,
    "activeVisitors": 12,
    "todayVisitors": 23
  }
}
```

---

### 2. Get All Rooms

**Endpoint:** `GET /api/admin/rooms`

**Description:** Get all rooms with occupancy information

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "room_id": 1,
      "room_number": "A101",
      "building": "Building A",
      "capacity": 2,
      "current_occupants": 1,
      "room_type": "Double",
      "floor": 1,
      "status": "Available"
    }
  ]
}
```

---

## Visitor Log Endpoints

### 1. Get All Visitor Logs (Admin Only)

**Endpoint:** `GET /api/visitor-logs`

**Description:** Get all visitor check-in/check-out logs

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "log_id": 1,
      "visitor_id": 1,
      "visitor_name": "Alice Johnson",
      "tenant_name": "John Doe",
      "room_number": "A101",
      "check_in_time": "2024-12-04T14:30:00Z",
      "check_out_time": "2024-12-04T18:45:00Z",
      "verified_by": "helpdesk1"
    }
  ]
}
```

---

### 2. Get Active Visitors (Help Desk)

**Endpoint:** `GET /api/visitor-logs/active`

**Description:** Get currently checked-in visitors (not checked out)

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "log_id": 2,
      "visitor_id": 2,
      "visitor_name": "Bob Wilson",
      "tenant_name": "Jane Smith",
      "room_number": "A102",
      "check_in_time": "2024-12-04T15:00:00Z",
      "check_out_time": null
    }
  ]
}
```

---

### 3. Get Visitor Log by ID

**Endpoint:** `GET /api/visitor-logs/:id`

**Description:** Get specific visitor log details

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "log_id": 1,
    "visitor_id": 1,
    "check_in_time": "2024-12-04T14:30:00Z",
    "check_out_time": "2024-12-04T18:45:00Z"
  }
}
```

---

### 4. Check In Visitor (Help Desk)

**Endpoint:** `POST /api/visitor-logs/check-in`

**Description:** Check in an approved visitor

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "visitor_id": 2
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Visitor checked in successfully",
  "log": {
    "log_id": 3,
    "visitor_id": 2,
    "check_in_time": "2024-12-04T16:00:00Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Visitor is not approved or already checked in"
}
```

---

### 5. Check Out Visitor (Help Desk)

**Endpoint:** `POST /api/visitor-logs/check-out`

**Description:** Check out a visitor

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "visitor_id": 2
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Visitor checked out successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Visitor is not currently checked in"
}
```

---

## Error Responses

### Standard Error Format

All error responses follow this structure:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

### Common HTTP Status Codes

- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Missing or invalid authentication token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

### Authentication Errors

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "No token provided"
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden",
  "message": "Admin access required"
}
```

---

## Authentication Flow

### Setting Up Authorization

1. **Login** to get JWT token:
   ```
   POST /api/auth/login
   ```

2. **Store the token** from the response:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

3. **Add token to headers** for all authenticated requests:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### POSTMAN Setup

1. **Create Environment Variable:**
   - Variable Name: `authToken`
   - Variable Value: (paste token here)

2. **Set Authorization Header:**
   - Type: Bearer Token
   - Token: `{{authToken}}`

3. **Auto-Update Token After Login:**
   - In Login request, add to "Tests" tab:
   ```javascript
   pm.environment.set("authToken", pm.response.json().token);
   ```

---

## Role-Based Access Control

### Admin Role
- Full access to all endpoints
- Can manage tenants, approve/reject visitors
- Can view all statistics and logs

### Tenant Role
- Can view own profile
- Can register visitors
- Can view own visitor history
- Can change own password

### Help Desk Role
- Can check in/check out visitors
- Can view active visitors
- Limited access to tenant information

---

## Testing Accounts

### Admin Account
```
Username: admin
Password: admin123
```

### Test Tenant Account
```
Username: john.doe
Password: password123
```

### Help Desk Account
```
Username: helpdesk
Password: helpdesk123
```

---

## Rate Limiting

Currently, there is no rate limiting implemented. In production, consider adding:
- 100 requests per minute per IP
- 1000 requests per hour per user

---

## Database Schema Reference

### Tenant Table Fields
- `tenant_id` (Primary Key)
- `username` (Unique)
- `password_hash`
- `full_name`
- `email`
- `contact_number`
- `date_of_birth`
- `gender`
- `nationality`
- `address`
- `emergency_contact_name`
- `emergency_contact_relationship`
- `emergency_contact_number`
- `room_id` (Foreign Key)
- `move_in_date`
- `move_out_date`
- `lease_start_date`
- `lease_end_date`
- `student_id`
- `year_level`
- `course`
- `department`
- `profile_image` (Google Drive link)
- `status` (Active/Inactive)
- `created_at`
- `updated_at`

### Visitor Table Fields
- `visitor_id` (Primary Key)
- `tenant_id` (Foreign Key)
- `full_name`
- `contact_number`
- `purpose`
- `expected_date`
- `expected_time`
- `approval_status` (Pending/Approved/Denied)
- `admin_remarks`
- `rejection_reason`
- `created_at`
- `updated_at`

### Visitor_Log Table Fields
- `log_id` (Primary Key)
- `visitor_id` (Foreign Key)
- `check_in_time`
- `check_out_time`
- `verified_by`

---

## Notes

- All dates are in ISO 8601 format
- Times are in UTC
- Google Drive links should be in viewable format
- Passwords must meet minimum security requirements (8+ characters)
- Visitor registration requires 12-hour advance notice

---

**Last Updated:** December 4, 2024
**API Version:** 1.0.0
**Support:** dormguard@support.com
