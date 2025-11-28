import supabase from '../config/database';
import { getFreshSupabase } from '../config/database';
import { generateAccessToken, generateRefreshToken, generateSessionId, JWTPayload } from '../utils/jwt';
import { Errors } from '../utils/errors';
import logger from '../utils/logger';
import { SystemType, UserRole } from '../types/types';

interface EmailVerificationResult {
  exists: boolean;
  role?: UserRole;
  systemType?: SystemType; // ✅ NEW
  displayInfo?: {
    partnerName?: string;
    category?: string;
    employeeId?: string;
  };
  accountStatus?: string;
  userId?: string;
}

interface LoginResult {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    systemType: SystemType; // ✅ NEW
    permissions?: Record<string, boolean>;
  };
}

/**
 * ✅ UPDATED: Verify email and return user role + system_type
 * Step 1 of Smart Login
 */
export async function verifyEmail(email: string): Promise<EmailVerificationResult> {
  try {
    const supabase = getFreshSupabase();
    
    // ✅ NOW SELECTS system_type
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('id, email, role, system_type, status, full_name')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      logger.error('Error querying user_profiles:', error);
      return { exists: false };
    }

    if (!user) {
      logger.info(`Email verification: ${email} not found`);
      return { exists: false };
    }

    // ✅ VALIDATION: Ensure system_type exists (should always be set after migration)
    if (!user.system_type) {
      logger.error(`User ${user.id} missing system_type! Database migration incomplete.`);
      throw new Error('System configuration error. Please contact support.');
    }

    // Get role-specific display info
    let displayInfo: EmailVerificationResult['displayInfo'] = {};

    if (user.role === 'partner') {
      const { data: partner } = await supabase
        .from('partners')
        .select('partner_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (partner) {
        displayInfo.partnerName = partner.partner_name;
      }
    } else if (user.role === 'admin') {
      const { data: admin } = await supabase
        .from('admin_staff')
        .select('category')
        .eq('user_id', user.id)
        .maybeSingle();

      if (admin) {
        displayInfo.category = admin.category;
      }
    } else if (user.role === 'core') {
      const { data: core } = await supabase
        .from('core_staff')
        .select('position')
        .eq('user_id', user.id)
        .maybeSingle();

      if (core) {
        displayInfo.employeeId = core.position;
      }
    }

    logger.info(`Email verification: ${email} found with role ${user.role}, systemType ${user.system_type}`);

    return {
      exists: true,
      role: user.role as UserRole,
      systemType: user.system_type as SystemType, // ✅ NEW
      displayInfo,
      accountStatus: user.status,
      userId: user.id
    };
  } catch (error) {
    logger.error('Email verification failed:', error);
    return { exists: false };
  }
}

/**
 * ✅ UPDATED: Login user with system_type support
 * Step 2 of Smart Login
 */
export async function login(
  email: string,
  password: string,
  role: UserRole,
  ipAddress: string,
  userAgent: string
): Promise<LoginResult> {
  try {
    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      logger.warn(`Failed login attempt for ${email}`);
      throw Errors.invalidCredentials();
    }

    // ✅ NOW FETCHES system_type
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role, system_type, status')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !userProfile) {
      throw Errors.notFound('User profile');
    }

    // ✅ VALIDATION: Ensure system_type exists
    if (!userProfile.system_type) {
      logger.error(`User ${userProfile.id} missing system_type during login!`);
      throw Errors.internal('Account configuration error. Please contact support.');
    }

    // Verify role matches
    if (userProfile.role !== role) {
      logger.warn(`Role mismatch for ${email}: expected ${role}, got ${userProfile.role}`);
      throw Errors.invalidCredentials();
    }

    // ✅ SYSTEM_USERS validation (only SYSTEM_USERS can use this login endpoint)
    if (userProfile.system_type !== SystemType.SYSTEM_USERS) {
      logger.warn(`Non-system user attempted system login: ${email}`);
      throw Errors.forbidden('This login endpoint is for system users only');
    }

    // Check account status
    if (userProfile.status !== 'active') {
      if (userProfile.status === 'suspended') {
        throw Errors.accountSuspended();
      } else if (userProfile.status === 'pending') {
        throw Errors.accountPending();
      } else {
        throw Errors.unauthorized('Account is not active');
      }
    }

    // Get permissions based on role
    let permissions: Record<string, boolean> = {};

    if (role === UserRole.CORE) {
      const { data: coreStaff } = await supabase
        .from('core_staff')
        .select('permissions')
        .eq('user_id', userProfile.id)
        .single();

      if (coreStaff) {
        permissions = coreStaff.permissions;
      }
    } else if (role === UserRole.ADMIN) {
      const { data: adminStaff } = await supabase
        .from('admin_staff')
        .select('permissions')
        .eq('user_id', userProfile.id)
        .single();

      if (adminStaff) {
        permissions = adminStaff.permissions;
      }
    }

    // Generate session ID
    const sessionId = generateSessionId();

    // ✅ UPDATED: JWT payload now includes systemType
    const jwtPayload: JWTPayload = {
      userId: userProfile.id,
      email: userProfile.email,
      role: userProfile.role as UserRole,
      systemType: userProfile.system_type as SystemType, // ✅ NEW
      sessionId,
      permissions
    };

    // Generate tokens
    const token = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken({
      userId: userProfile.id,
      email: userProfile.email,
      role: userProfile.role as UserRole,
      systemType: userProfile.system_type as SystemType, // ✅ NEW
      sessionId
    });

    // Create session record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await supabase.from('user_sessions').insert({
      id: sessionId,
      user_id: userProfile.id,
      token_hash: token.substring(0, 50),
      refresh_token_hash: refreshToken.substring(0, 50),
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt.toISOString(),
      is_active: true
    });

    // Update last login
    await supabase
      .from('user_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userProfile.id);

    logger.info(`User ${email} logged in successfully (${userProfile.system_type})`);

    return {
      token,
      refreshToken,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.full_name,
        role: userProfile.role as UserRole,
        systemType: userProfile.system_type as SystemType, // ✅ NEW
        permissions
      }
    };
  } catch (error) {
    if (error instanceof Errors) {
      throw error;
    }
    logger.error('Login failed:', error);
    throw Errors.internal('Login failed');
  }
}

/**
 * Logout user (no changes needed)
 */
export async function logout(sessionId: string): Promise<void> {
  try {
    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    logger.info(`Session ${sessionId} logged out`);
  } catch (error) {
    logger.error('Logout failed:', error);
    throw Errors.internal('Logout failed');
  }
}

/**
 * ✅ UPDATED: Refresh access token with system_type
 */
export async function refreshAccessToken(
  userId: string,
  sessionId: string,
  role: UserRole,
  systemType: SystemType // ✅ NEW parameter
): Promise<string> {
  try {
    // Verify session is still active
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('is_active, expires_at')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !session) {
      throw Errors.unauthorized('Session not found or expired');
    }

    if (new Date(session.expires_at) < new Date()) {
      throw Errors.unauthorized('Session has expired');
    }

    // Get current permissions
    let permissions: Record<string, boolean> = {};

    if (role === UserRole.CORE) {
      const { data: coreStaff } = await supabase
        .from('core_staff')
        .select('permissions')
        .eq('user_id', userId)
        .single();

      if (coreStaff) {
        permissions = coreStaff.permissions;
      }
    } else if (role === UserRole.ADMIN) {
      const { data: adminStaff } = await supabase
        .from('admin_staff')
        .select('permissions')
        .eq('user_id', userId)
        .single();

      if (adminStaff) {
        permissions = adminStaff.permissions;
      }
    }

    // Get user email
    const { data: user } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user) {
      throw Errors.notFound('User');
    }

    // ✅ UPDATED: Generate new access token with systemType
    const token = generateAccessToken({
      userId,
      email: user.email,
      role,
      systemType, // ✅ NEW
      sessionId,
      permissions
    });

    // Update session activity
    await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', sessionId);

    return token;
  } catch (error) {
    if (error instanceof Errors) {
      throw error;
    }
    logger.error('Token refresh failed:', error);
    throw Errors.internal('Token refresh failed');
  }
}