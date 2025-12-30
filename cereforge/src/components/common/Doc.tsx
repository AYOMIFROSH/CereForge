import { useState } from 'react';
import { Database, GitBranch, Table, Key, Link, Search, ChevronDown, ChevronRight } from 'lucide-react';

const CereforgeDatabaseDocs = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  const databaseOverview = {
    name: 'Cereforge Database',
    type: 'PostgreSQL (Supabase)',
    version: 'PostgreSQL 15',
    schema: 'public',
    totalTables: 12,
    features: [
      'Row Level Security (RLS)',
      'JSONB Support',
      'Timezone Aware (timestamptz)',
      'UUID Primary Keys',
      'Foreign Key Constraints',
      'Audit Trail',
    ],
  };

  const tables = [
    {
      name: 'user_profiles',
      description: 'Central user table for all system users (core, admin, partner)',
      category: 'Core',
      rowCount: '~1000',
      columns: [
        { name: 'id', type: 'uuid', pk: true, nullable: false, description: 'Primary key (matches Supabase auth.users.id)' },
        { name: 'full_name', type: 'varchar', pk: false, nullable: false, description: 'User full name' },
        { name: 'email', type: 'varchar', pk: false, nullable: false, unique: true, description: 'Login email (unique)' },
        { name: 'phone', type: 'varchar', pk: false, nullable: true, description: 'Contact phone number' },
        { name: 'role', type: 'varchar', pk: false, nullable: false, description: 'User role: core | admin | partner' },
        { name: 'status', type: 'varchar', pk: false, nullable: false, description: 'Account status: active | suspended | pending | deactivated' },
        { name: 'created_at', type: 'timestamptz', pk: false, nullable: true, default: 'now()', description: 'Account creation timestamp' },
        { name: 'updated_at', type: 'timestamptz', pk: false, nullable: true, default: 'now()', description: 'Last update timestamp' },
        { name: 'last_login', type: 'timestamptz', pk: false, nullable: true, description: 'Last successful login' },
        { name: 'metadata', type: 'jsonb', pk: false, nullable: true, description: 'Additional user metadata' },
        { name: 'system_type', type: 'system_type_enum', pk: false, nullable: false, description: 'SYSTEM_USERS | COMMERCIAL_USERS' },
      ],
      foreignKeys: [],
      referencedBy: [
        { table: 'user_sessions', column: 'user_id' },
        { table: 'admin_staff', column: 'user_id' },
        { table: 'core_staff', column: 'user_id' },
        { table: 'partners', column: 'user_id' },
        { table: 'calendar_events', column: 'user_id' },
        { table: 'event_reminders', column: 'user_id' },
        { table: 'password_reset_tokens', column: 'user_id' },
        { table: 'audit_logs', column: 'user_id' },
        { table: 'public_holidays', column: 'created_by' },
      ],
      indexes: [
        { name: 'idx_user_email', columns: ['email'], type: 'UNIQUE' },
        { name: 'idx_user_role', columns: ['role'], type: 'INDEX' },
        { name: 'idx_user_status', columns: ['status'], type: 'INDEX' },
      ],
    },
    {
      name: 'user_sessions',
      description: 'Active user sessions for JWT-based authentication',
      category: 'Authentication',
      rowCount: '~5000',
      columns: [
        { name: 'id', type: 'uuid', pk: true, nullable: false, description: 'Session ID (used in JWT payload)' },
        { name: 'user_id', type: 'uuid', pk: false, nullable: false, fk: 'user_profiles(id)', description: 'FK to user_profiles' },
        { name: 'token_hash', type: 'varchar', pk: false, nullable: false, description: 'Hashed access token (first 50 chars)' },
        { name: 'refresh_token_hash', type: 'varchar', pk: false, nullable: true, description: 'Hashed refresh token (first 50 chars)' },
        { name: 'ip_address', type: 'inet', pk: false, nullable: true, description: 'Client IP address' },
        { name: 'user_agent', type: 'text', pk: false, nullable: true, description: 'Client user agent string' },
        { name: 'device_type', type: 'varchar', pk: false, nullable: true, description: 'Device type (mobile, desktop, tablet)' },
        { name: 'browser', type: 'varchar', pk: false, nullable: true, description: 'Browser name and version' },
        { name: 'os', type: 'varchar', pk: false, nullable: true, description: 'Operating system' },
        { name: 'expires_at', type: 'timestamptz', pk: false, nullable: false, description: 'Session expiration (7 days from creation)' },
        { name: 'last_activity', type: 'timestamptz', pk: false, nullable: true, description: 'Last activity timestamp (updated on each request)' },
        { name: 'is_active', type: 'bool', pk: false, nullable: true, default: 'true', description: 'Session active status (false on logout)' },
        { name: 'created_at', type: 'timestamptz', pk: false, nullable: true, default: 'now()', description: 'Session creation timestamp' },
      ],
      foreignKeys: [
        { column: 'user_id', references: 'user_profiles(id)', onDelete: 'CASCADE' },
      ],
      referencedBy: [],
      indexes: [
        { name: 'idx_session_user', columns: ['user_id'], type: 'INDEX' },
        { name: 'idx_session_active', columns: ['is_active', 'expires_at'], type: 'INDEX' },
      ],
    },
    {
      name: 'admin_staff',
      description: 'Admin staff members with elevated permissions',
      category: 'Core',
      rowCount: '~50',
      columns: [
        { name: 'id', type: 'uuid', pk: true, nullable: false, description: 'Primary key' },
        { name: 'user_id', type: 'uuid', pk: false, nullable: false, fk: 'user_profiles(id)', description: 'FK to user_profiles (must have role=admin)' },
        { name: 'admin_id', type: 'varchar', pk: false, nullable: false, unique: true, description: 'Unique admin identifier (e.g., ADMIN-001)' },
        { name: 'category', type: 'varchar', pk: false, nullable: false, description: 'Admin category (Operations, HR, Finance, etc.)' },
        { name: 'permissions', type: 'jsonb', pk: false, nullable: true, description: 'Permission object: { approve_partners: true, ... }' },
        { name: 'supervisor_id', type: 'uuid', pk: false, nullable: true, fk: 'admin_staff(id)', description: 'Self-referencing FK to supervising admin' },
        { name: 'created_at', type: 'timestamptz', pk: false, nullable: true, default: 'now()', description: 'Record creation timestamp' },
        { name: 'updated_at', type: 'timestamptz', pk: false, nullable: true, default: 'now()', description: 'Last update timestamp' },
      ],
      foreignKeys: [
        { column: 'user_id', references: 'user_profiles(id)', onDelete: 'CASCADE' },
        { column: 'supervisor_id', references: 'admin_staff(id)', onDelete: 'SET NULL' },
      ],
      referencedBy: [
        { table: 'admin_staff', column: 'supervisor_id' },
      ],
      indexes: [
        { name: 'idx_admin_user', columns: ['user_id'], type: 'UNIQUE' },
        { name: 'idx_admin_category', columns: ['category'], type: 'INDEX' },
      ],
    },
    {
      name: 'core_staff',
      description: 'Core team members with highest permission level',
      category: 'Core',
      rowCount: '~20',
      columns: [
        { name: 'id', type: 'uuid', pk: true, nullable: false, description: 'Primary key' },
        { name: 'user_id', type: 'uuid', pk: false, nullable: false, fk: 'user_profiles(id)', description: 'FK to user_profiles (must have role=core)' },
        { name: 'employee_id', type: 'varchar', pk: false, nullable: false, unique: true, description: 'Unique employee ID (e.g., CORE-001)' },
        { name: 'department', type: 'varchar', pk: false, nullable: true, description: 'Department name (Engineering, Product, etc.)' },
        { name: 'position', type: 'varchar', pk: false, nullable: true, description: 'Job position/title' },
        { name: 'permissions', type: 'jsonb', pk: false, nullable: true, description: 'Core staff permissions (usually full access)' },
        { name: 'created_at', type: 'timestamptz', pk: false, nullable: true, default: 'now()', description: 'Record creation timestamp' },
        { name: 'updated_at', type: 'timestamptz', pk: false, nullable: true, default: 'now()', description: 'Last update timestamp' },
      ],
      foreignKeys: [
        { column: 'user_id', references: 'user_profiles(id)', onDelete: 'CASCADE' },
      ],
      referencedBy: [],
      indexes: [
        { name: 'idx_core_user', columns: ['user_id'], type: 'UNIQUE' },
      ],
    },
    {
      name: 'partners',
      description: 'Approved partner accounts with project information',
      category: 'Business',
      rowCount: '~200',
      columns: [
        { name: 'id', type: 'uuid', pk: true, nullable: false, description: 'Primary key' },
        { name: 'user_id', type: 'uuid', pk: false, nullable: false, fk: 'user_profiles(id)', description: 'FK to user_profiles (must have role=partner)' },
        { name: 'partner_id', type: 'varchar', pk: false, nullable: false, unique: true, description: 'Unique partner identifier (e.g., PARTNER-001)' },
        { name: 'partner_name', type: 'varchar', pk: false, nullable: false, description: 'Partner/Company name' },
        { name: 'company_website', type: 'varchar', pk: false, nullable: true, description: 'Company website URL' },
        { name: 'linkedin_profile', type: 'varchar', pk: false, nullable: true, description: 'LinkedIn profile URL' },
        { name: 'industry', type: 'varchar', pk: false, nullable: true, description: 'Business industry' },
        { name: 'company_size', type: 'varchar', pk: false, nullable: true, description: 'Company size (1-10, 10-50, 50-200, 200+)' },
        { name: 'project_title', type: 'varchar', pk: false, nullable: true, description: 'Current project title' },
        { name: 'project_description', type: 'text', pk: false, nullable: true, description: 'Detailed project description' },
        { name: 'project_stage', type: 'varchar', pk: false, nullable: true, description: 'Project stage: idea | prototype | mvp | scaling' },
        { name: 'solution_type', type: 'varchar', pk: false, nullable: true, description: 'Solution type: software | hardware | ai | fullstack | web' },
        { name: 'ideal_start_date', type: 'date', pk: false, nullable: true, description: 'Preferred project start date' },
        { name: 'budget_range', type: 'varchar', pk: false, nullable: true, description: 'Budget range (e.g., 1M-5M)' },
        { name: 'currency', type: 'varchar', pk: false, nullable: true, description: 'Currency code ($, ₦, £, €)' },
        { name: 'has_internal_team', type: 'bool', pk: false, nullable: true, description: 'Has internal technical team' },
        { name: 'schedule_call', type: 'bool', pk: false, nullable: true, description: 'Requested discovery call' },
        { name: 'onboarding_status', type: 'varchar', pk: false, nullable: true, description: 'Onboarding status: pending | active | completed' },
        { name: 'approved_by', type: 'uuid', pk: false, nullable: true, fk: 'user_profiles(id)', description: 'Admin who approved the partner' },
        { name: 'approved_at', type: 'timestamptz', pk: false, nullable: true, description: 'Approval timestamp' },
        { name: 'project_brief_url', type: 'text', pk: false, nullable: true, description: 'Supabase storage URL for project brief' },
        { name: 'reference_images_url', type: 'text', pk: false, nullable: true, description: 'Supabase storage URL for reference images' },
        { name: 'profile_photo_url', type: 'text', pk: false, nullable: true, description: 'Supabase storage URL for profile photo' },
        { name: 'metadata', type: 'jsonb', pk: false, nullable: true, description: 'Additional partner metadata' },
        { name: 'created_at', type: 'timestamptz', pk: false, nullable: true, default: 'now()', description: 'Record creation timestamp' },
        { name: 'updated_at', type: 'timestamptz', pk: false, nullable: true, default: 'now()', description: 'Last update timestamp' },
      ],
      foreignKeys: [
        { column: 'user_id', references: 'user_profiles(id)', onDelete: 'CASCADE' },
        { column: 'approved_by', references: 'user_profiles(id)', onDelete: 'SET NULL' },
      ],
      referencedBy: [],
      indexes: [
        { name: 'idx_partner_user', columns: ['user_id'], type: 'UNIQUE' },
        { name: 'idx_partner_status', columns: ['onboarding_status'], type: 'INDEX' },
      ],
    },
    {
      name: 'pending_partners',
      description: 'Partner applications awaiting admin review',
      category: 'Business',
      rowCount: '~500',
      columns: [
        { name: 'id', type: 'uuid', pk: true, nullable: false, description: 'Application ID (used in email notifications)' },
        { name: 'full_name', type: 'varchar', pk: false, nullable: false, description: 'Applicant full name' },
        { name: 'email', type: 'varchar', pk: false, nullable: false, description: 'Applicant email' },
        { name: 'phone', type: 'varchar', pk: false, nullable: false, description: 'Contact phone number' },
        { name: 'company_name', type: 'varchar', pk: false, nullable: false, description: 'Company name' },
        { name: 'company_website', type: 'varchar', pk: false, nullable: true, description: 'Company website URL' },
        { name: 'linkedin_profile', type: 'varchar', pk: false, nullable: true, description: 'LinkedIn profile URL' },
        { name: 'project_title', type: 'varchar', pk: false, nullable: false, description: 'Project title' },
        { name: 'project_description', type: 'text', pk: false, nullable: false, description: 'Project description (min 50 chars)' },
        { name: 'project_stage', type: 'varchar', pk: false, nullable: false, description: 'idea | prototype | mvp | scaling' },
        { name: 'solution_type', type: 'varchar', pk: false, nullable: false, description: 'software | hardware | ai | fullstack | web' },
        { name: 'ideal_start_date', type: 'date', pk: false, nullable: true, description: 'Desired project start date' },
        { name: 'budget_range', type: 'varchar', pk: false, nullable: false, description: 'Budget range' },
        { name: 'currency', type: 'varchar', pk: false, nullable: true, description: 'Currency ($, ₦, £, €)' },
        { name: 'has_internal_team', type: 'bool', pk: false, nullable: false, description: 'Has technical team' },
        { name: 'schedule_call', type: 'bool', pk: false, nullable: false, description: 'Wants discovery call' },
        { name: 'project_brief_url', type: 'text', pk: false, nullable: true, description: 'Uploaded project brief (optional)' },
        { name: 'reference_images_url', type: 'text', pk: false, nullable: true, description: 'Reference images (optional)' },
        { name: 'profile_photo_url', type: 'text', pk: false, nullable: true, description: 'Profile photo (optional)' },
        { name: 'status', type: 'varchar', pk: false, nullable: true, default: 'pending', description: 'pending | reviewing | approved | rejected' },
        { name: 'reviewed_by', type: 'uuid', pk: false, nullable: true, fk: 'user_profiles(id)', description: 'Admin who reviewed' },
        { name: 'reviewed_at', type: 'timestamptz', pk: false, nullable: true, description: 'Review timestamp' },
        { name: 'rejection_reason', type: 'text', pk: false, nullable: true, description: 'Reason for rejection (if rejected)' },
        { name: 'converted_to_partner_id', type: 'uuid', pk: false, nullable: true, fk: 'partners(id)', description: 'Partner ID after approval' },
        { name: 'created_at', type: 'timestamptz', pk: false, nullable: true, default: 'now()', description: 'Application submission timestamp' },
        { name: 'updated_at', type: 'timestamptz', pk: false, nullable: true, default: 'now()', description: 'Last update timestamp' },
      ],
      foreignKeys: [
        { column: 'reviewed_by', references: 'user_profiles(id)', onDelete: 'SET NULL' },
        { column: 'converted_to_partner_id', references: 'partners(id)', onDelete: 'SET NULL' },
      ],
      referencedBy: [],
      indexes: [
        { name: 'idx_pending_status', columns: ['status'], type: 'INDEX' },
        { name: 'idx_pending_email', columns: ['email'], type: 'INDEX' },
      ],
    },
    {
      name: 'calendar_events',
      description: 'User calendar events with recurring event support',
      category: 'Features',
      rowCount: '~10000',
      columns: [
        { name: 'id', type: 'uuid', pk: true, nullable: false, description: 'Event ID' },
        { name: 'user_id', type: 'uuid', pk: false, nullable: false, fk: 'user_profiles(id)', description: 'Event owner' },
        { name: 'title', type: 'varchar', pk: false, nullable: false, description: 'Event title' },
        { name: 'description', type: 'text', pk: false, nullable: true, description: 'Event description' },
        { name: 'location', type: 'varchar', pk: false, nullable: true, description: 'Event location' },
        { name: 'start_time', type: 'timestamptz', pk: false, nullable: false, description: 'Event start time (UTC)' },
        { name: 'end_time', type: 'timestamptz', pk: false, nullable: false, description: 'Event end time (UTC)' },
        { name: 'all_day', type: 'bool', pk: false, nullable: false, default: 'false', description: 'All-day event flag' },
        { name: 'timezone', type: 'varchar', pk: false, nullable: false, description: 'User timezone (e.g., Africa/Lagos)' },
        { name: 'recurrence_type', type: 'varchar', pk: false, nullable: false, default: 'none', description: 'none | daily | weekly | monthly | annually | weekdays | custom' },
        { name: 'recurrence_config', type: 'jsonb', pk: false, nullable: true, description: 'Recurrence configuration object' },
        { name: 'parent_event_id', type: 'uuid', pk: false, nullable: true, fk: 'calendar_events(id)', description: 'Parent event for recurring instances' },
        { name: 'is_recurring_parent', type: 'bool', pk: false, nullable: true, default: 'false', description: 'Is this a recurring parent event' },
        { name: 'label', type: 'varchar', pk: false, nullable: false, default: 'blue', description: 'Color label: indigo | grey | green | blue | red | purple' },
        { name: 'notification_settings', type: 'jsonb', pk: false, nullable: true, description: 'Notification settings object' },
        { name: 'status', type: 'varchar', pk: false, nullable: false, default: 'active', description: 'active | cancelled | completed' },
        { name: 'created_at', type: 'timestamptz', pk: false, nullable: false, default: 'now()', description: 'Event creation timestamp' },
        { name: 'updated_at', type: 'timestamptz', pk: false, nullable: false, default: 'now()', description: 'Last update timestamp' },
        { name: 'deleted_at', type: 'timestamptz', pk: false, nullable: true, description: 'Soft delete timestamp' },
      ],
      foreignKeys: [
        { column: 'user_id', references: 'user_profiles(id)', onDelete: 'CASCADE' },
        { column: 'parent_event_id', references: 'calendar_events(id)', onDelete: 'CASCADE' },
      ],
      referencedBy: [
        { table: 'event_guests', column: 'event_id' },
        { table: 'event_reminders', column: 'event_id' },
        { table: 'calendar_events', column: 'parent_event_id' },
      ],
      indexes: [
        { name: 'idx_event_user', columns: ['user_id'], type: 'INDEX' },
        { name: 'idx_event_time', columns: ['start_time', 'end_time'], type: 'INDEX' },
        { name: 'idx_event_recurring', columns: ['is_recurring_parent'], type: 'INDEX' },
      ],
    },
    {
      name: 'event_guests',
      description: 'Event guest list with RSVP tracking',
      category: 'Features',
      rowCount: '~20000',
      columns: [
        { name: 'id', type: 'uuid', pk: true, nullable: false, description: 'Guest record ID' },
        { name: 'event_id', type: 'uuid', pk: false, nullable: false, fk: 'calendar_events(id)', description: 'FK to calendar_events' },
        { name: 'email', type: 'varchar', pk: false, nullable: false, description: 'Guest email address' },
        { name: 'name', type: 'varchar', pk: false, nullable: false, description: 'Guest name' },
        { name: 'invitation_sent', type: 'bool', pk: false, nullable: true, default: 'false', description: 'Invitation sent flag' },
        { name: 'invitation_sent_at', type: 'timestamptz', pk: false, nullable: true, description: 'When invitation was sent' },
        { name: 'response_status', type: 'varchar', pk: false, nullable: false, default: 'pending', description: 'pending | accepted | declined | maybe' },
        { name: 'responded_at', type: 'timestamptz', pk: false, nullable: true, description: 'When guest responded' },
        { name: 'created_at', type: 'timestamptz', pk: false, nullable: false, default: 'now()', description: 'Record creation timestamp' },
      ],
      foreignKeys: [
        { column: 'event_id', references: 'calendar_events(id)', onDelete: 'CASCADE' },
      ],
      referencedBy: [],
      indexes: [
        { name: 'idx_guest_event', columns: ['event_id'], type: 'INDEX' },
        { name: 'idx_guest_email', columns: ['email'], type: 'INDEX' },
      ],
    },
    {
      name: 'event_reminders',
      description: 'Scheduled event reminders (processed by queue)',
      category: 'Features',
      rowCount: '~15000',
      columns: [
        { name: 'id', type: 'uuid', pk: true, nullable: false, description: 'Reminder ID' },
        { name: 'event_id', type: 'uuid', pk: false, nullable: false, fk: 'calendar_events(id)', description: 'FK to calendar_events' },
        { name: 'user_id', type: 'uuid', pk: false, nullable: false, fk: 'user_profiles(id)', description: 'FK to user_profiles' },
        { name: 'remind_at', type: 'timestamptz', pk: false, nullable: false, description: 'When to send reminder' },
        { name: 'sent', type: 'bool', pk: false, nullable: true, default: 'false', description: 'Reminder sent flag' },
        { name: 'sent_at', type: 'timestamptz', pk: false, nullable: true, description: 'When reminder was sent' },
        { name: 'delivery_status', type: 'varchar', pk: false, nullable: true, description: 'Delivery status (pending, sent, failed)' },
        { name: 'reminder_type', type: 'varchar', pk: false, nullable: false, description: 'email | push | sms' },
        { name: 'retry_count', type: 'int4', pk: false, nullable: true, default: '0', description: 'Number of retry attempts' },
        { name: 'last_retry_at', type: 'timestamptz', pk: false, nullable: true, description: 'Last retry timestamp' },
        { name: 'created_at', type: 'timestamptz', pk: false, nullable: false, default: 'now()', description: 'Record creation timestamp' },
      ],
      foreignKeys: [
        { column: 'event_id', references: 'calendar_events(id)', onDelete: 'CASCADE' },
        { column: 'user_id', references: 'user_profiles(id)', onDelete: 'CASCADE' },
      ],
      referencedBy: [],
      indexes: [
        { name: 'idx_reminder_event', columns: ['event_id'], type: 'INDEX' },
        { name: 'idx_reminder_time', columns: ['remind_at', 'sent'], type: 'INDEX' },
      ],
    },
    {
      name: 'public_holidays',
      description: 'Public holidays calendar (admin managed, visible to all users)',
      category: 'Features',
      rowCount: '~100',
      columns: [
        { name: 'id', type: 'uuid', pk: true, nullable: false, description: 'Holiday ID' },
        { name: 'title', type: 'varchar', pk: false, nullable: false, description: 'Holiday name' },
        { name: 'description', type: 'text', pk: false, nullable: true, description: 'Holiday description' },
        { name: 'holiday_date', type: 'date', pk: false, nullable: false, description: 'Holiday date (MM-DD format for recurring)' },
        { name: 'is_recurring', type: 'bool', pk: false, nullable: true, default: 'true', description: 'Recurring annually' },
        { name: 'countries', type: '_text', pk: false, nullable: true, description: 'Array of country codes (null = global holiday)' },
        { name: 'is_global', type: 'bool', pk: false, nullable: true, default: 'false', description: 'Global holiday flag' },
        { name: 'created_by', type: 'uuid', pk: false, nullable: true, fk: 'user_profiles(id)', description: 'Admin who created this holiday' },
        { name: 'is_active', type: 'bool', pk: false, nullable: true, default: 'true', description: 'Active status (soft delete)' },
        { name: 'created_at', type: 'timestamptz', pk: false, nullable: false, default: 'now()', description: 'Creation timestamp' },
        { name: 'updated_at', type: 'timestamptz', pk: false, nullable: false, default: 'now()', description: 'Last update timestamp' },
      ],
      foreignKeys: [
        { column: 'created_by', references: 'user_profiles(id)', onDelete: 'SET NULL' },
      ],
      referencedBy: [],
      indexes: [
        { name: 'idx_holiday_date', columns: ['holiday_date'], type: 'INDEX' },
        { name: 'idx_holiday_active', columns: ['is_active'], type: 'INDEX' },
      ],
    },
    {
      name: 'password_reset_tokens',
      description: 'Password reset tokens (one-time use, 1-hour expiry)',
      category: 'Authentication',
      rowCount: '~1000',
      columns: [
        { name: 'id', type: 'uuid', pk: true, nullable: false, description: 'Token ID' },
        { name: 'user_id', type: 'uuid', pk: false, nullable: false, fk: 'user_profiles(id)', description: 'FK to user_profiles' },
        { name: 'token', type: 'varchar', pk: false, nullable: false, description: 'Reset token (hashed)' },
        { name: 'expires_at', type: 'timestamptz', pk: false, nullable: false, description: 'Token expiration (1 hour from creation)' },
        { name: 'used_at', type: 'timestamptz', pk: false, nullable: true, description: 'When token was used (null if unused)' },
        { name: 'created_at', type: 'timestamptz', pk: false, nullable: true, default: 'now()', description: 'Token creation timestamp' },
      ],
      foreignKeys: [
        { column: 'user_id', references: 'user_profiles(id)', onDelete: 'CASCADE' },
      ],
      referencedBy: [],
      indexes: [
        { name: 'idx_reset_token', columns: ['token'], type: 'INDEX' },
        { name: 'idx_reset_user', columns: ['user_id'], type: 'INDEX' },
      ],
    },
    {
      name: 'audit_logs',
      description: 'System-wide audit trail for all actions',
      category: 'System',
      rowCount: '~100000',
      columns: [
        { name: 'id', type: 'uuid', pk: true, nullable: false, description: 'Log entry ID' },
        { name: 'user_id', type: 'uuid', pk: false, nullable: true, fk: 'user_profiles(id)', description: 'User who performed action (null for system events)' },
        { name: 'action', type: 'varchar', pk: false, nullable: false, description: 'Action name (login, event_created, partner_approved, etc.)' },
        { name: 'entity_type', type: 'varchar', pk: false, nullable: true, description: 'Entity type affected (user, event, partner, etc.)' },
        { name: 'entity_id', type: 'uuid', pk: false, nullable: true, description: 'Entity ID affected' },
        { name: 'ip_address', type: 'inet', pk: false, nullable: true, description: 'Client IP address' },
        { name: 'user_agent', type: 'text', pk: false, nullable: true, description: 'Client user agent string' },
        { name: 'request_method', type: 'varchar', pk: false, nullable: true, description: 'HTTP method (GET, POST, etc.)' },
        { name: 'request_path', type: 'text', pk: false, nullable: true, description: 'Request path' },
        { name: 'details', type: 'jsonb', pk: false, nullable: true, description: 'Additional details as JSON' },
        { name: 'risk_level', type: 'varchar', pk: false, nullable: false, description: 'low | medium | high | critical' },
        { name: 'created_at', type: 'timestamptz', pk: false, nullable: true, default: 'now()', description: 'Log timestamp' },
      ],
      foreignKeys: [
        { column: 'user_id', references: 'user_profiles(id)', onDelete: 'SET NULL' },
      ],
      referencedBy: [],
      indexes: [
        { name: 'idx_audit_user', columns: ['user_id'], type: 'INDEX' },
        { name: 'idx_audit_action', columns: ['action'], type: 'INDEX' },
        { name: 'idx_audit_time', columns: ['created_at'], type: 'INDEX' },
        { name: 'idx_audit_risk', columns: ['risk_level'], type: 'INDEX' },
      ],
    },
  ];

  const relationships = [
    {
      from: 'user_profiles',
      to: 'user_sessions',
      type: 'ONE_TO_MANY',
      description: 'One user can have multiple active sessions',
      onDelete: 'CASCADE',
    },
    {
      from: 'user_profiles',
      to: 'admin_staff',
      type: 'ONE_TO_ONE',
      description: 'Admin users have one admin_staff record',
      onDelete: 'CASCADE',
    },
    {
      from: 'user_profiles',
      to: 'core_staff',
      type: 'ONE_TO_ONE',
      description: 'Core users have one core_staff record',
      onDelete: 'CASCADE',
    },
    {
      from: 'user_profiles',
      to: 'partners',
      type: 'ONE_TO_ONE',
      description: 'Partner users have one partners record',
      onDelete: 'CASCADE',
    },
    {
      from: 'user_profiles',
      to: 'calendar_events',
      type: 'ONE_TO_MANY',
      description: 'Users can create multiple calendar events',
      onDelete: 'CASCADE',
    },
    {
      from: 'user_profiles',
      to: 'audit_logs',
      type: 'ONE_TO_MANY',
      description: 'User actions are logged in audit_logs',
      onDelete: 'SET NULL',
    },
    {
      from: 'admin_staff',
      to: 'admin_staff',
      type: 'SELF_REFERENCING',
      description: 'Admin can have supervisor (another admin)',
      onDelete: 'SET NULL',
    },
    {
      from: 'calendar_events',
      to: 'calendar_events',
      type: 'SELF_REFERENCING',
      description: 'Recurring events reference parent event',
      onDelete: 'CASCADE',
    },
    {
      from: 'calendar_events',
      to: 'event_guests',
      type: 'ONE_TO_MANY',
      description: 'Events can have multiple guests',
      onDelete: 'CASCADE',
    },
    {
      from: 'calendar_events',
      to: 'event_reminders',
      type: 'ONE_TO_MANY',
      description: 'Events can have multiple reminders',
      onDelete: 'CASCADE',
    },
    {
      from: 'pending_partners',
      to: 'partners',
      type: 'ONE_TO_ONE',
      description: 'Approved applications create partner records',
      onDelete: 'SET NULL',
    },
  ];

  const erd = `
┌─────────────────┐
│  user_profiles  │ (Central hub)
├─────────────────┤
│ • id (PK)       │
│ • email (UQ)    │
│ • role          │
│ • system_type   │
└────────┬────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         │              │              │              │
   ┌─────▼─────┐  ┌────▼────┐   ┌────▼────┐   ┌────▼─────┐
   │admin_staff│  │core_staff│  │partners │   │sessions  │
   └───────────┘  └──────────┘   └─────────┘   └──────────┘
         │
   ┌─────▼──────────────────┬───────────────────┐
   │                        │                   │
┌──▼───────────┐  ┌────────▼──────┐  ┌────────▼─────┐
│pending_partners│ │calendar_events│  │audit_logs    │
└────────────────┘ └───────┬───────┘  └──────────────┘
                           │
                    ┌──────┴──────┐
              ┌─────▼────┐  ┌─────▼────────┐
              │event_guests│ │event_reminders│
              └──────────┘  └──────────────┘
  `;

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Cereforge Database</h1>
                <p className="text-sm text-slate-500">Complete Schema Documentation</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                {databaseOverview.totalTables} Tables
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                PostgreSQL 15
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: Database },
              { id: 'tables', label: 'Tables', icon: Table },
              { id: 'relationships', label: 'Relationships', icon: GitBranch },
              { id: 'erd', label: 'ERD', icon: Link },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Database className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{databaseOverview.totalTables}</p>
                    <p className="text-sm text-slate-600">Total Tables</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Key className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-slate-900">15+</p>
                    <p className="text-sm text-slate-600">Foreign Keys</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <GitBranch className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-slate-900">11+</p>
                    <p className="text-sm text-slate-600">Relationships</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Database Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {databaseOverview.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Table Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-slate-600">Core</p>
                  <p className="text-2xl font-bold text-blue-600">4</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-slate-600">Authentication</p>
                  <p className="text-2xl font-bold text-purple-600">2</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-slate-600">Business</p>
                  <p className="text-2xl font-bold text-green-600">2</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-slate-600">Features</p>
                  <p className="text-2xl font-bold text-orange-600">4</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tables..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {filteredTables.map((table) => (
              <div key={table.name} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleTable(table.name)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      table.category === 'Core' ? 'bg-blue-100 text-blue-700' :
                      table.category === 'Authentication' ? 'bg-purple-100 text-purple-700' :
                      table.category === 'Business' ? 'bg-green-100 text-green-700' :
                      table.category === 'Features' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {table.category}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-slate-900 text-lg">{table.name}</h3>
                      <p className="text-sm text-slate-600">{table.description}</p>
                      <p className="text-xs text-slate-400 mt-1">~{table.rowCount} rows • {table.columns.length} columns</p>
                    </div>
                  </div>
                  {expandedTables[table.name] ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {expandedTables[table.name] && (
                  <div className="border-t border-slate-200 bg-slate-50">
                    <div className="p-6 space-y-6">
                      {/* Columns */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <Table className="w-4 h-4 text-blue-600" />
                          Columns ({table.columns.length})
                        </h4>
                        <div className="space-y-2">
                          {table.columns.map((col) => (
                            <div key={col.name} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200">
                              <div className="min-w-[180px]">
                                <code className="text-sm font-mono text-blue-600 font-semibold">{col.name}</code>
                                <div className="flex gap-1 mt-1">
                                  {col.pk && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">PK</span>}
                                  {col.fk && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">FK</span>}
                                  {col.unique && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">UNIQUE</span>}
                                  {!col.nullable && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">NOT NULL</span>}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <code className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{col.type}</code>
                                  {col.default && <span className="text-xs text-slate-500">default: {col.default}</span>}
                                </div>
                                <p className="text-xs text-slate-600">{col.description}</p>
                                {col.fk && <p className="text-xs text-purple-600 mt-1">→ {col.fk}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Foreign Keys */}
                      {table.foreignKeys.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <Key className="w-4 h-4 text-purple-600" />
                            Foreign Keys ({table.foreignKeys.length})
                          </h4>
                          <div className="space-y-2">
                            {table.foreignKeys.map((fk, idx) => (
                              <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <code className="text-sm text-purple-700 font-mono">
                                  {fk.column} → {fk.references}
                                </code>
                                <p className="text-xs text-slate-600 mt-1">ON DELETE: {fk.onDelete}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Referenced By */}
                      {table.referencedBy.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <GitBranch className="w-4 h-4 text-green-600" />
                            Referenced By ({table.referencedBy.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {table.referencedBy.map((ref, idx) => (
                              <div key={idx} className="px-3 py-1 bg-green-50 text-green-700 text-xs font-mono rounded border border-green-200">
                                {ref.table}.{ref.column}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Indexes */}
                      {table.indexes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-3">Indexes ({table.indexes.length})</h4>
                          <div className="space-y-2">
                            {table.indexes.map((idx, i) => (
                              <div key={i} className="p-2 bg-slate-100 rounded text-xs font-mono">
                                <span className="text-blue-600">{idx.name}</span>
                                <span className="text-slate-600"> ON ({idx.columns.join(', ')})</span>
                                <span className="ml-2 px-2 py-0.5 bg-white rounded">{idx.type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Relationships Tab */}
        {activeTab === 'relationships' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Database Relationships</h2>
              <p className="text-sm text-slate-600">Visual representation of table relationships and foreign key constraints</p>
            </div>

            {relationships.map((rel, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex-1 text-right">
                    <code className="text-lg font-mono text-blue-600 font-semibold">{rel.from}</code>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      rel.type === 'ONE_TO_ONE' ? 'bg-blue-100 text-blue-700' :
                      rel.type === 'ONE_TO_MANY' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {rel.type.replace('_', '_TO_')}
                    </div>
                    <GitBranch className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <code className="text-lg font-mono text-green-600 font-semibold">{rel.to}</code>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-3 text-center">{rel.description}</p>
                <p className="text-xs text-slate-500 mt-1 text-center">ON DELETE: {rel.onDelete}</p>
              </div>
            ))}
          </div>
        )}

        {/* ERD Tab */}
        {activeTab === 'erd' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Entity Relationship Diagram</h2>
              <p className="text-sm text-slate-600">Simplified ASCII representation of database structure</p>
            </div>

            <div className="bg-slate-900 rounded-xl p-8 shadow-xl overflow-x-auto">
              <pre className="text-green-400 font-mono text-sm leading-relaxed">{erd}</pre>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Key Insights</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-slate-900">user_profiles is the central hub</p>
                    <p className="text-sm text-slate-600">All role-specific tables (admin_staff, core_staff, partners) reference user_profiles</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-slate-900">CASCADE delete pattern</p>
                    <p className="text-sm text-slate-600">When a user is deleted, all related records (sessions, events, etc.) are automatically removed</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-slate-900">Self-referencing tables</p>
                    <p className="text-sm text-slate-600">admin_staff (supervisor_id) and calendar_events (parent_event_id) reference themselves</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-slate-900">Audit trail</p>
                    <p className="text-sm text-slate-600">audit_logs captures all system actions with user_id SET NULL on user deletion to maintain history</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Cereforge Database Documentation • Version 1.0 • December 2024
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-600">Database Online</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CereforgeDatabaseDocs;