// DormGuard Type Definitions

export interface Room {
  room_id: number;
  room_number: string;
  building: string;
  capacity: number;
  current_occupants: number;
}

export interface Admin {
  admin_id: number;
  username: string;
  password: string;
  full_name: string;
  email: string;
  contact_number: string;
  employed_date: string;
  role: 'Admin' | 'HelpDesk'; // Role-based: Admin or HelpDesk
}

export interface Tenant {
  tenant_id: number;
  room_id: number;
  username: string;
  password: string;
  full_name: string;
  contact_number: string;
  email: string;
  
  // Personal Information
  date_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  nationality?: string;
  id_type?: 'National ID' | 'Passport' | 'Drivers License' | 'Student ID';
  id_number?: string;
  
  // Academic/Professional Information
  occupation?: string;
  institution_name?: string;
  student_id?: string;
  year_level?: string;
  course_program?: string;
  
  // Address Information
  permanent_address?: string;
  city?: string;
  province_state?: string;
  postal_code?: string;
  country?: string;
  
  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  emergency_contact_relationship?: string;
  emergency_contact_address?: string;
  
  // Guardian Information (for students)
  guardian_name?: string;
  guardian_contact?: string;
  guardian_relationship?: string;
  guardian_address?: string;
  
  // Profile Information
  profile_image?: string; // Base64 encoded image or URL
  
  // Dormitory Information
  move_in_date: string;
  expected_move_out_date?: string;
  lease_duration_months?: number;
  status: 'Active' | 'Moved Out' | 'Suspended';
  
  // Additional Information
  allergies?: string;
  medical_conditions?: string;
  special_requirements?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Visitor {
  visitor_id: number;
  tenant_id: number;
  full_name: string;
  contact_number: string;
  purpose: string;
  expected_date: string;
  expected_time?: string;
  approval_status: 'Pending' | 'Approved' | 'Denied';
  created_at: string;
}

export interface VisitorLog {
  log_id: number;
  visitor_id: number;
  check_in_time: string | null;
  check_out_time: string | null;
  id_left: string;
  processed_by: number; // References admin_id from Admin table
}

// Extended types with joined data
export interface VisitorWithDetails extends Visitor {
  tenant_name: string;
  tenant_room_number: string;
  tenant_contact: string;
  log?: VisitorLog;
  processed_by_name?: string;
}

export interface TenantWithRoom extends Tenant {
  room_number: string;
  room_capacity: number;
  room_current_occupants: number;
}
