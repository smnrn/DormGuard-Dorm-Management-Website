-- ============================================================================
-- DormGuard Complete Database Setup
-- Version: 2.2
-- Date: November 29, 2024
-- 
-- This is the ONLY database file you need to run.
-- Includes: Base schema, migrations, sample data, and all features
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 1: CLEAN EXISTING DATA
-- ============================================================================

DROP TABLE IF EXISTS "Password_Change_Log" CASCADE;
DROP TABLE IF EXISTS "Visitor_Log" CASCADE;
DROP TABLE IF EXISTS "VisitorLog" CASCADE;
DROP TABLE IF EXISTS "Visitor" CASCADE;
DROP TABLE IF EXISTS "Tenant" CASCADE;
DROP TABLE IF EXISTS "Help_Desk" CASCADE;
DROP TABLE IF EXISTS "Admin" CASCADE;
DROP TABLE IF EXISTS "Rooms" CASCADE;

-- ============================================================================
-- SECTION 2: CREATE TABLES
-- ============================================================================

-- ----------------------------------------
-- Table: Rooms
-- Purpose: Store dormitory room information
-- ----------------------------------------
CREATE TABLE "Rooms" (
    room_id SERIAL PRIMARY KEY,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    building VARCHAR(20) NOT NULL,
    capacity INT NOT NULL DEFAULT 2,
    current_occupants INT NOT NULL DEFAULT 0,
    floor_number INT,
    room_type VARCHAR(50),
    monthly_rate DECIMAL(10, 2),
    amenities TEXT,
    status VARCHAR(20) DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_capacity CHECK (capacity > 0),
    CONSTRAINT check_occupants CHECK (current_occupants >= 0 AND current_occupants <= capacity),
    CONSTRAINT check_room_status CHECK (status IN ('Available', 'Full', 'Under Maintenance'))
);

-- ----------------------------------------
-- Table: Admin
-- Purpose: Store administrator and help desk staff information
-- Note: Includes both Admin and HelpDesk roles in one table
-- ----------------------------------------
CREATE TABLE "Admin" (
    admin_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contact_number VARCHAR(20),
    employed_date DATE DEFAULT CURRENT_DATE,
    role VARCHAR(20) NOT NULL DEFAULT 'Admin',
    department VARCHAR(50),
    position VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Active',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_role CHECK (role IN ('Admin', 'HelpDesk')),
    CONSTRAINT check_admin_status CHECK (status IN ('Active', 'Inactive', 'On Leave'))
);

-- ----------------------------------------
-- Table: Tenant
-- Purpose: Store tenant/resident information with comprehensive fields
-- ----------------------------------------
CREATE TABLE "Tenant" (
    tenant_id SERIAL PRIMARY KEY,
    room_id INT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    
    -- Basic Personal Information
    full_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    nationality VARCHAR(50) DEFAULT 'Filipino',
    
    -- Identification
    id_type VARCHAR(50),
    id_number VARCHAR(50),
    
    -- Academic/Professional Information
    occupation VARCHAR(100),
    institution_name VARCHAR(200),
    student_id VARCHAR(50),
    year_level VARCHAR(50),
    course_program VARCHAR(200),
    
    -- Address Information
    permanent_address TEXT,
    city VARCHAR(100),
    province_state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Philippines',
    
    -- Emergency Contact Information
    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_address TEXT,
    
    -- Guardian Information (for students/minors)
    guardian_name VARCHAR(100),
    guardian_contact VARCHAR(20),
    guardian_relationship VARCHAR(50),
    guardian_address TEXT,
    
    -- Profile & Image (Updated for Google Drive)
    profile_image TEXT, -- Now stores Google Drive URL instead of base64
    
    -- Dormitory-Specific Information
    move_in_date DATE DEFAULT CURRENT_DATE,
    expected_move_out_date DATE,
    lease_duration_months INT,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    
    -- Health & Special Needs
    allergies TEXT,
    medical_conditions TEXT,
    special_requirements TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_room FOREIGN KEY (room_id) REFERENCES "Rooms"(room_id) ON DELETE SET NULL,
    CONSTRAINT check_status CHECK (status IN ('Active', 'Moved Out', 'Suspended')),
    CONSTRAINT check_gender CHECK (gender IN ('Male', 'Female', 'Other'))
);

-- ----------------------------------------
-- Table: Visitor
-- Purpose: Store visitor registration and approval information
-- Enhanced with email notification fields
-- ----------------------------------------
CREATE TABLE "Visitor" (
    visitor_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20),
    id_number VARCHAR(50),
    purpose VARCHAR(150) NOT NULL,
    expected_date DATE NOT NULL,
    expected_time VARCHAR(10),
    approval_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    
    -- Email Notification Fields (Added in v2.1)
    approved_by INT,
    approval_date TIMESTAMP,
    denial_reason TEXT,
    
    -- Additional Fields
    vehicle_plate_number VARCHAR(20),
    number_of_visitors INT DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES "Tenant"(tenant_id) ON DELETE CASCADE,
    CONSTRAINT fk_approved_by FOREIGN KEY (approved_by) REFERENCES "Admin"(admin_id) ON DELETE SET NULL,
    CONSTRAINT check_approval CHECK (approval_status IN ('Pending', 'Approved', 'Denied'))
);

-- ----------------------------------------
-- Table: Visitor_Log
-- Purpose: Track visitor check-in and check-out
-- ----------------------------------------
CREATE TABLE "Visitor_Log" (
    log_id SERIAL PRIMARY KEY,
    visitor_id INT NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    id_left VARCHAR(50),
    id_number_verified VARCHAR(50),
    temperature DECIMAL(4, 2),
    health_declaration_status VARCHAR(20),
    processed_by INT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_visitor FOREIGN KEY (visitor_id) REFERENCES "Visitor"(visitor_id) ON DELETE CASCADE,
    CONSTRAINT fk_processed_by FOREIGN KEY (processed_by) REFERENCES "Admin"(admin_id) ON DELETE SET NULL
);

-- ----------------------------------------
-- Table: Password_Change_Log (Added in v2.1)
-- Purpose: Audit log for tracking tenant password changes
-- ----------------------------------------
CREATE TABLE "Password_Change_Log" (
    log_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by_ip VARCHAR(45),
    success BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT fk_tenant_log FOREIGN KEY (tenant_id) REFERENCES "Tenant"(tenant_id) ON DELETE CASCADE
);

-- ============================================================================
-- SECTION 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Room Indexes
CREATE INDEX idx_rooms_building ON "Rooms"(building);
CREATE INDEX idx_rooms_status ON "Rooms"(status);
CREATE INDEX idx_room_number ON "Rooms"(room_number);

-- Admin Indexes
CREATE INDEX idx_admin_username ON "Admin"(username);
CREATE INDEX idx_admin_role ON "Admin"(role);
CREATE INDEX idx_admin_status ON "Admin"(status);

-- Tenant Indexes
CREATE INDEX idx_tenant_username ON "Tenant"(username);
CREATE INDEX idx_tenant_room ON "Tenant"(room_id);
CREATE INDEX idx_tenant_status ON "Tenant"(status);
CREATE INDEX idx_tenant_email ON "Tenant"(email);
CREATE INDEX idx_tenant_institution ON "Tenant"(institution_name);
CREATE INDEX idx_tenant_move_in ON "Tenant"(move_in_date);

-- Visitor Indexes
CREATE INDEX idx_visitor_tenant ON "Visitor"(tenant_id);
CREATE INDEX idx_visitor_date ON "Visitor"(expected_date);
CREATE INDEX idx_visitor_status ON "Visitor"(approval_status);
CREATE INDEX idx_visitor_approval_date ON "Visitor"(approval_date);
CREATE INDEX idx_visitor_created ON "Visitor"(created_at);

-- Visitor Log Indexes
CREATE INDEX idx_log_visitor ON "Visitor_Log"(visitor_id);
CREATE INDEX idx_log_checkin ON "Visitor_Log"(check_in_time);
CREATE INDEX idx_log_checkout ON "Visitor_Log"(check_out_time);

-- Password Change Log Indexes
CREATE INDEX idx_password_log_tenant ON "Password_Change_Log"(tenant_id);
CREATE INDEX idx_password_log_date ON "Password_Change_Log"(changed_at DESC);

-- ============================================================================
-- SECTION 4: CREATE TRIGGERS
-- ============================================================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for each table
CREATE TRIGGER update_rooms_timestamp 
    BEFORE UPDATE ON "Rooms" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_timestamp 
    BEFORE UPDATE ON "Admin" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_timestamp 
    BEFORE UPDATE ON "Tenant" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visitor_timestamp 
    BEFORE UPDATE ON "Visitor" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visitorlog_timestamp 
    BEFORE UPDATE ON "Visitor_Log" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 5: CREATE VIEWS
-- ============================================================================

-- View: Active tenants with room details
CREATE OR REPLACE VIEW active_tenants_view AS
SELECT 
    t.tenant_id,
    t.full_name,
    t.email,
    t.contact_number,
    t.institution_name,
    t.course_program,
    r.room_number,
    r.building,
    r.floor_number,
    t.move_in_date,
    t.emergency_contact_name,
    t.emergency_contact_number
FROM "Tenant" t
LEFT JOIN "Rooms" r ON t.room_id = r.room_id
WHERE t.status = 'Active'
ORDER BY r.building, r.room_number;

-- View: Pending visitor approvals
CREATE OR REPLACE VIEW pending_visitors_view AS
SELECT 
    v.visitor_id,
    v.full_name AS visitor_name,
    v.contact_number,
    v.purpose,
    v.expected_date,
    v.expected_time,
    t.full_name AS tenant_name,
    r.room_number,
    v.created_at
FROM "Visitor" v
JOIN "Tenant" t ON v.tenant_id = t.tenant_id
LEFT JOIN "Rooms" r ON t.room_id = r.room_id
WHERE v.approval_status = 'Pending'
ORDER BY v.expected_date, v.expected_time;

-- View: Today's expected visitors
CREATE OR REPLACE VIEW todays_visitors_view AS
SELECT 
    v.visitor_id,
    v.full_name AS visitor_name,
    v.contact_number,
    v.purpose,
    v.expected_time,
    v.approval_status,
    t.full_name AS tenant_name,
    r.room_number,
    r.building,
    vl.check_in_time,
    vl.check_out_time
FROM "Visitor" v
JOIN "Tenant" t ON v.tenant_id = t.tenant_id
LEFT JOIN "Rooms" r ON t.room_id = r.room_id
LEFT JOIN "Visitor_Log" vl ON v.visitor_id = vl.visitor_id
WHERE v.expected_date = CURRENT_DATE
ORDER BY v.expected_time;

-- View: Database statistics
CREATE OR REPLACE VIEW database_stats AS
SELECT 
    (SELECT COUNT(*) FROM "Rooms") AS total_rooms,
    (SELECT COUNT(*) FROM "Rooms" WHERE status = 'Available') AS available_rooms,
    (SELECT COUNT(*) FROM "Tenant" WHERE status = 'Active') AS active_tenants,
    (SELECT COUNT(*) FROM "Admin") AS total_staff,
    (SELECT COUNT(*) FROM "Visitor" WHERE approval_status = 'Pending') AS pending_approvals,
    (SELECT COUNT(*) FROM "Visitor" WHERE expected_date = CURRENT_DATE) AS todays_visitors,
    (SELECT COUNT(*) FROM "Visitor_Log" WHERE check_in_time IS NOT NULL AND check_out_time IS NULL) AS current_visitors;

-- ============================================================================
-- SECTION 6: ADD COLUMN COMMENTS (Documentation)
-- ============================================================================

COMMENT ON COLUMN "Tenant".profile_image IS 
    'Google Drive share URL for profile image. Format: https://drive.google.com/uc?id=FILE_ID';

COMMENT ON COLUMN "Visitor".denial_reason IS 
    'Admin-provided reason when visitor request is denied. Used in email notification.';

COMMENT ON COLUMN "Visitor".approved_by IS 
    'Admin ID who approved or denied the visitor request. NULL if still pending.';

COMMENT ON COLUMN "Visitor".approval_date IS 
    'Timestamp when visitor was approved or denied. NULL if still pending.';

COMMENT ON TABLE "Password_Change_Log" IS 
    'Audit log for tracking tenant password changes for security purposes.';

-- ============================================================================
-- SECTION 7: INSERT PRODUCTION DATA
-- ============================================================================

-- Default password for all users: "admin123"
-- Bcrypt hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

-- ----------------------------------------
-- Insert Rooms (30 rooms across 3 buildings)
-- ----------------------------------------
INSERT INTO "Rooms" (room_number, building, capacity, current_occupants, floor_number, room_type, monthly_rate, status) VALUES
-- Building A (10 rooms)
('A-101', 'Building A', 2, 0, 1, 'Double', 3500.00, 'Available'),
('A-102', 'Building A', 2, 0, 1, 'Double', 3500.00, 'Available'),
('A-103', 'Building A', 2, 0, 1, 'Double', 3500.00, 'Available'),
('A-104', 'Building A', 2, 0, 1, 'Double', 3500.00, 'Available'),
('A-105', 'Building A', 2, 0, 1, 'Double', 3500.00, 'Available'),
('A-201', 'Building A', 2, 0, 2, 'Double', 3500.00, 'Available'),
('A-202', 'Building A', 2, 0, 2, 'Double', 3500.00, 'Available'),
('A-203', 'Building A', 2, 0, 2, 'Double', 3500.00, 'Available'),
('A-204', 'Building A', 2, 0, 2, 'Double', 3500.00, 'Available'),
('A-205', 'Building A', 2, 0, 2, 'Double', 3500.00, 'Available'),
-- Building B (10 rooms)
('B-101', 'Building B', 2, 0, 1, 'Double', 3500.00, 'Available'),
('B-102', 'Building B', 2, 0, 1, 'Double', 3500.00, 'Available'),
('B-103', 'Building B', 2, 0, 1, 'Double', 3500.00, 'Available'),
('B-104', 'Building B', 2, 0, 1, 'Double', 3500.00, 'Available'),
('B-105', 'Building B', 2, 0, 1, 'Double', 3500.00, 'Available'),
('B-201', 'Building B', 2, 0, 2, 'Double', 3500.00, 'Available'),
('B-202', 'Building B', 2, 0, 2, 'Double', 3500.00, 'Available'),
('B-203', 'Building B', 2, 0, 2, 'Double', 3500.00, 'Available'),
('B-204', 'Building B', 2, 0, 2, 'Double', 3500.00, 'Available'),
('B-205', 'Building B', 2, 0, 2, 'Double', 3500.00, 'Available'),
-- Building C (10 rooms)
('C-101', 'Building C', 2, 0, 1, 'Double', 3500.00, 'Available'),
('C-102', 'Building C', 2, 0, 1, 'Double', 3500.00, 'Available'),
('C-103', 'Building C', 2, 0, 1, 'Double', 3500.00, 'Available'),
('C-104', 'Building C', 2, 0, 1, 'Double', 3500.00, 'Available'),
('C-105', 'Building C', 2, 0, 1, 'Double', 3500.00, 'Available'),
('C-201', 'Building C', 2, 0, 2, 'Double', 3500.00, 'Available'),
('C-202', 'Building C', 2, 0, 2, 'Double', 3500.00, 'Available'),
('C-203', 'Building C', 2, 0, 2, 'Double', 3500.00, 'Available'),
('C-204', 'Building C', 2, 0, 2, 'Double', 3500.00, 'Available'),
('C-205', 'Building C', 2, 0, 2, 'Double', 3500.00, 'Available');

-- ----------------------------------------
-- Insert Production Admin Users
-- ----------------------------------------
INSERT INTO "Admin" (username, password, full_name, email, contact_number, employed_date, role, department, position, status) VALUES
('simon.roaring', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Simon Roaring', 'simon.roaring@dormguard.edu', '(555) 100-0001', CURRENT_DATE, 'Admin', 'Management', 'System Administrator', 'Active'),
('kenrick.cham', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Kenrick Cham', 'kenrick.cham@dormguard.edu', '(555) 200-0001', CURRENT_DATE, 'HelpDesk', 'Operations', 'Front Desk Officer', 'Active');

-- ============================================================================
-- SECTION 8: VERIFICATION QUERIES
-- ============================================================================

SELECT 'Database Setup Complete!' as status;
SELECT '========================' as separator;

SELECT 'Table Counts:' as info;
SELECT 'Rooms' as table_name, COUNT(*) as count FROM "Rooms"
UNION ALL
SELECT 'Admin (Total)', COUNT(*) FROM "Admin"
UNION ALL
SELECT 'Admin (Admin Role)', COUNT(*) FROM "Admin" WHERE role = 'Admin'
UNION ALL
SELECT 'Admin (HelpDesk Role)', COUNT(*) FROM "Admin" WHERE role = 'HelpDesk'
UNION ALL
SELECT 'Tenant', COUNT(*) FROM "Tenant"
UNION ALL
SELECT 'Visitor', COUNT(*) FROM "Visitor"
UNION ALL
SELECT 'Visitor_Log', COUNT(*) FROM "Visitor_Log"
UNION ALL
SELECT 'Password_Change_Log', COUNT(*) FROM "Password_Change_Log";

SELECT '========================' as separator;
SELECT 'Production Users:' as info;
SELECT 
    admin_id,
    username, 
    full_name, 
    role,
    email,
    status
FROM "Admin" 
ORDER BY role, admin_id;

SELECT '========================' as separator;
SELECT 'Room Availability:' as info;
SELECT 
    building,
    COUNT(*) as total_rooms,
    SUM(capacity) as total_capacity,
    SUM(current_occupants) as occupied_beds,
    SUM(capacity - current_occupants) as available_beds
FROM "Rooms"
GROUP BY building
ORDER BY building;

SELECT '========================' as separator;
SELECT 'Features Enabled:' as info;
SELECT '✅ Role-based authentication' as feature
UNION ALL SELECT '✅ Email notifications (Gmail)'
UNION ALL SELECT '✅ Google Drive storage'
UNION ALL SELECT '✅ Password change tracking'
UNION ALL SELECT '✅ Visitor approvals'
UNION ALL SELECT '✅ Real-time notifications'
UNION ALL SELECT '✅ Digital pass generation'
UNION ALL SELECT '✅ Analytics dashboard';

-- ============================================================================
-- SECTION 9: LOGIN CREDENTIALS
-- ============================================================================

SELECT '========================' as separator;
SELECT 'LOGIN CREDENTIALS:' as info;
SELECT '========================' as separator;
SELECT 'Admin User:' as user_type, 'simon.roaring' as username, 'admin123' as password
UNION ALL
SELECT 'Help Desk User:', 'kenrick.cham', 'admin123'
UNION ALL
SELECT '', '', ''
UNION ALL
SELECT '⚠️ IMPORTANT:', 'Change these passwords after first login!', '';

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- 
-- What's included in this setup:
-- ✅ 5 core tables (Rooms, Admin, Tenant, Visitor, Visitor_Log)
-- ✅ 1 audit table (Password_Change_Log)
-- ✅ 30 empty rooms ready for tenant assignment
-- ✅ 2 production users (Admin and HelpDesk)
-- ✅ All indexes for performance
-- ✅ All triggers for auto-updates
-- ✅ 4 useful views for queries
-- ✅ Email notification support
-- ✅ Google Drive integration support
-- ✅ Password change tracking
-- 
-- Next Steps:
-- 1. Run this file in your PostgreSQL database
-- 2. Update your .env files with database credentials
-- 3. Follow SETUP_GUIDE.md for Gmail and Google Drive setup
-- 4. Login with admin credentials and change password
-- 5. Start registering tenants!
-- 
-- For help, see: START_HERE.md or README.md
-- ============================================================================
