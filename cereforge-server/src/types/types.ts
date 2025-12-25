// =====================================================
// CEREFORGE TYPE DEFINITIONS
// Updated with SystemType support
// =====================================================

/**
 * System Type Enum
 * Determines which authentication system the user belongs to
 */
export enum SystemType {
  SYSTEM_USERS = 'SYSTEM_USERS',      // Internal users (core, admin, partner)
  COMMERCIAL_USERS = 'COMMERCIAL_USERS' // Public product users (future)
}

/**
 * User Role Enum
 * Roles within SYSTEM_USERS
 */
export enum UserRole {
  CORE = 'core',
  ADMIN = 'admin',
  PARTNER = 'partner'
}

/**
 * User Status Enum
 */
export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  DEACTIVATED = 'deactivated'
}

/**
 * User Profile Interface (Database Model)
 */
export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  system_type: SystemType; // ✅ NEW
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_login?: string;
  metadata?: Record<string, any>;
}

/**
 * JWT Payload Interface
 * What gets encoded in the JWT token
 */
export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  systemType: SystemType; // ✅ NEW
  sessionId: string;
  permissions?: Record<string, boolean>;
}

/**
 * Email Verification Result (Step 1 of Smart Login)
 */
export interface EmailVerificationResult {
  exists: boolean;
  role?: UserRole;
  systemType?: SystemType; // ✅ NEW
  displayInfo?: {
    partnerName?: string;
    category?: string;
    employeeId?: string;
  };
  accountStatus?: UserStatus;
  userId?: string;
}

/**
 * Login Request Body
 */
export interface LoginRequest {
  email: string;
  password: string;
  role: UserRole;
}

/**
 * Login Response
 */
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    systemType: SystemType; // ✅ NEW
    permissions?: Record<string, boolean>;
  };
  // Tokens are in httpOnly cookies, not returned in body
}

/**
 * Session Data (Database Model)
 */
export interface UserSession {
  id: string;
  user_id: string;
  token_hash: string;
  refresh_token_hash?: string;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  expires_at: string;
  last_activity: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Partner Profile Interface
 */
export interface Partner {
  id: string;
  user_id: string;
  partner_id: string;
  partner_name: string;
  company_website?: string;
  linkedin_profile?: string;
  industry?: string;
  company_size?: string;
  project_title?: string;
  project_description?: string;
  project_stage?: string;
  solution_type?: string;
  ideal_start_date?: string;
  budget_range?: string;
  currency: string;
  has_internal_team: boolean;
  schedule_call: boolean;
  onboarding_status: string;
  approved_by?: string;
  approved_at?: string;
  project_brief_url?: string;
  reference_images_url?: string;
  profile_photo_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Pending Partner Application
 */
export interface PendingPartner {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  company_website?: string;
  linkedin_profile?: string;
  project_title: string;
  project_description: string;
  project_stage: string;
  solution_type: string;
  ideal_start_date?: string;
  budget_range: string;
  currency: string;
  has_internal_team: boolean;
  schedule_call: boolean;
  project_brief_url?: string;
  reference_images_url?: string;
  profile_photo_url?: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  converted_to_partner_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Audit Log Entry
 */
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
  request_method?: string;
  request_path?: string;
  details?: Record<string, any>;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

/**
 * API Response Wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * Pagination Params
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Type Guards for Runtime Checks
 */
export function isSystemUser(systemType: SystemType): boolean {
  return systemType === SystemType.SYSTEM_USERS;
}

export function isCommercialUser(systemType: SystemType): boolean {
  return systemType === SystemType.COMMERCIAL_USERS;
}

export function hasRole(user: UserProfile, role: UserRole): boolean {
  return user.role === role && user.system_type === SystemType.SYSTEM_USERS;
}

/**
 * Permission Checking Utilities
 */
export function canAccessSystemFeatures(systemType: SystemType): boolean {
  return systemType === SystemType.SYSTEM_USERS;
}

export function canAccessCommercialFeatures(systemType: SystemType): boolean {
  return systemType === SystemType.COMMERCIAL_USERS;
}