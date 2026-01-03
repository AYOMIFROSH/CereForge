import supabase, { supabaseAdmin } from '../config/database';
import { generateAccessToken, generateRefreshToken, generateSessionId, JWTPayload } from '../utils/jwt';
import { Errors } from '../utils/errors';
import logger from '../utils/logger';
import { SystemType, UserRole } from '../types/types';

interface EmailVerificationResult {
  exists: boolean;
  role?: UserRole;
  systemType?: SystemType;
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
  sessionId: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    systemType: SystemType;
    permissions?: Record<string, boolean>;
  };
}

/**
 * Verify email (no changes needed - already optimized)
 */
export async function verifyEmail(email: string): Promise<EmailVerificationResult> {
  try {
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

    if (!user.system_type) {
      logger.error(`User ${user.id} missing system_type!`);
      throw new Error('System configuration error. Please contact support.');
    }

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

    logger.info(`Email verification: ${email} found with role ${user.role}`);

    return {
      exists: true,
      role: user.role as UserRole,
      systemType: user.system_type as SystemType,
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
 * ✅ OPTIMIZED: Login with single JOIN query for permissions
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

    // ✅ OPTIMIZED: Single query with LEFT JOIN to get user + permissions
    const query = role === 'core' 
      ? `id, email, full_name, role, system_type, status, core_staff!inner(permissions)`
      : role === 'admin'
      ? `id, email, full_name, role, system_type, status, admin_staff!inner(permissions)`
      : `id, email, full_name, role, system_type, status`;

    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select(query)
      .eq('id', authData.user.id)
      .single();

    if (profileError || !userProfile) {
      logger.error('Failed to fetch user profile:', profileError);
      throw Errors.notFound('User profile');
    }

    // Type assertion for the user profile
    const profile = userProfile as any;

    if (!profile.system_type) {
      logger.error(`User ${profile.id} missing system_type during login!`);
      throw Errors.internal('Account configuration error.');
    }

    if (profile.role !== role) {
      logger.warn(`Role mismatch for ${email}`);
      throw Errors.invalidCredentials();
    }

    if (profile.system_type !== SystemType.SYSTEM_USERS) {
      logger.warn(`Non-system user attempted system login: ${email}`);
      throw Errors.forbidden('This login endpoint is for system users only');
    }

    if (profile.status !== 'active') {
      if (profile.status === 'suspended') {
        throw Errors.accountSuspended();
      } else if (profile.status === 'pending') {
        throw Errors.accountPending();
      } else {
        throw Errors.unauthorized('Account is not active');
      }
    }

    // ✅ OPTIMIZED: Extract permissions from JOIN result
    let permissions: Record<string, boolean> = {};
    if (role === UserRole.CORE && profile.core_staff?.[0]?.permissions) {
      permissions = profile.core_staff[0].permissions;
    } else if (role === UserRole.ADMIN && profile.admin_staff?.[0]?.permissions) {
      permissions = profile.admin_staff[0].permissions;
    }

    // Generate session
    const sessionId = generateSessionId();
    const jwtPayload: JWTPayload = {
      userId: profile.id,
      email: profile.email,
      name: profile.full_name,
      role: profile.role as UserRole,
      systemType: profile.system_type as SystemType,
      sessionId,
      permissions
    };

    const token = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken({
      userId: profile.id,
      email: profile.email,
      name: profile.full_name,
      role: profile.role as UserRole,
      systemType: profile.system_type as SystemType,
      sessionId
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // ✅ Check for existing active session
    const { data: existingSession } = await supabaseAdmin
      .from('user_sessions')
      .select('id')
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .maybeSingle();

    if (existingSession) {
      // Update existing session
      const { error: updateError } = await supabaseAdmin
        .from('user_sessions')
        .update({
          token_hash: token.substring(0, 50),
          refresh_token_hash: refreshToken.substring(0, 50),
          ip_address: ipAddress,
          user_agent: userAgent,
          expires_at: expiresAt.toISOString(),
          last_activity: new Date().toISOString()
        })
        .eq('id', existingSession.id);

      if (updateError) {
        logger.error('Failed to update session:', updateError);
        throw Errors.internal('Failed to update session.');
      }

      logger.info(`✅ Updated existing session for user ${email}`);
    } else {
      // Create new session
      const { error: sessionError } = await supabaseAdmin
        .from('user_sessions')
        .insert({
          id: sessionId,
          user_id: profile.id,
          token_hash: token.substring(0, 50),
          refresh_token_hash: refreshToken.substring(0, 50),
          ip_address: ipAddress,
          user_agent: userAgent,
          expires_at: expiresAt.toISOString(),
          is_active: true
        });

      if (sessionError) {
        logger.error('Failed to create session:', sessionError);
        throw Errors.internal('Failed to create session.');
      }

      logger.info(`✅ Created new session for user ${email}`);
    }

    // ✅ Update last_login (non-blocking)
    supabaseAdmin
      .from('user_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', profile.id)
      .then(({ error }) => {
        if (error) {
          logger.error('Failed to update last_login:', error);
        }
      });

    logger.info(`User ${email} logged in successfully`);

    return {
      token,
      refreshToken,
      sessionId,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
        role: profile.role as UserRole,
        systemType: profile.system_type as SystemType,
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
 * Logout (no changes needed - already optimized)
 */
export async function logout(sessionId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('user_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (error) {
      logger.error('Failed to deactivate session:', error);
      throw Errors.internal('Failed to logout session');
    }

    logger.info(`✅ Session ${sessionId} logged out successfully`);
  } catch (error) {
    logger.error('Logout failed:', error);
    throw Errors.internal('Logout failed');
  }
}

/**
 * ✅ OPTIMIZED: Refresh with single query
 */
export async function refreshAccessToken(
  userId: string,
  sessionId: string,
  role: UserRole,
  systemType: SystemType
): Promise<string> {
  try {
    // ✅ OPTIMIZED: Single query to get user + permissions
    const query = role === 'core'
      ? `id, email, full_name, role, system_type, core_staff!inner(permissions)`
      : role === 'admin'
      ? `id, email, full_name, role, system_type, admin_staff!inner(permissions)`
      : `id, email, full_name, role, system_type`;

    const { data: user, error } = await supabase
      .from('user_profiles')
      .select(query)
      .eq('id', userId)
      .single();

    if (error || !user) {
      logger.error('Failed to fetch user for token refresh:', error);
      throw Errors.notFound('User');
    }

    // Type assertion
    const profile = user as any;

    // Extract permissions from JOIN
    let permissions: Record<string, boolean> = {};
    if (role === UserRole.CORE && profile.core_staff?.[0]?.permissions) {
      permissions = profile.core_staff[0].permissions;
    } else if (role === UserRole.ADMIN && profile.admin_staff?.[0]?.permissions) {
      permissions = profile.admin_staff[0].permissions;
    }

    // Generate new access token
    const token = generateAccessToken({
      userId,
      email: profile.email,
      name: profile.full_name,
      role,
      systemType,
      sessionId,
      permissions
    });

    // ✅ Update session activity (non-blocking)
    supabaseAdmin
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', sessionId)
      .then(({ error }) => {
        if (error) {
          logger.warn('Failed to update session activity:', error);
        }
      });

    logger.info(`Access token refreshed for user ${userId}`);
    return token;
  } catch (error) {
    if (error instanceof Errors) {
      throw error;
    }
    logger.error('Token refresh failed:', error);
    throw Errors.internal('Token refresh failed');
  }
}