import supabase from '../config/database';
import { getFreshSupabase } from '../config/database';
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
 * ✅ Verify email (no changes needed)
 */
export async function verifyEmail(email: string): Promise<EmailVerificationResult> {
  try {
    const supabase = getFreshSupabase();

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
 * ✅ FIXED: Login with proper last_login update
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

    // Fetch user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role, system_type, status')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !userProfile) {
      throw Errors.notFound('User profile');
    }

    if (!userProfile.system_type) {
      logger.error(`User ${userProfile.id} missing system_type during login!`);
      throw Errors.internal('Account configuration error.');
    }

    if (userProfile.role !== role) {
      logger.warn(`Role mismatch for ${email}`);
      throw Errors.invalidCredentials();
    }

    if (userProfile.system_type !== SystemType.SYSTEM_USERS) {
      logger.warn(`Non-system user attempted system login: ${email}`);
      throw Errors.forbidden('This login endpoint is for system users only');
    }

    if (userProfile.status !== 'active') {
      if (userProfile.status === 'suspended') {
        throw Errors.accountSuspended();
      } else if (userProfile.status === 'pending') {
        throw Errors.accountPending();
      } else {
        throw Errors.unauthorized('Account is not active');
      }
    }

    // Get permissions
    let permissions: Record<string, boolean> = {};
    if (role === UserRole.CORE) {
      const { data: coreStaff } = await supabase
        .from('core_staff')
        .select('permissions')
        .eq('user_id', userProfile.id)
        .single();
      if (coreStaff) permissions = coreStaff.permissions;
    } else if (role === UserRole.ADMIN) {
      const { data: adminStaff } = await supabase
        .from('admin_staff')
        .select('permissions')
        .eq('user_id', userProfile.id)
        .single();
      if (adminStaff) permissions = adminStaff.permissions;
    }

    // Generate session
    const sessionId = generateSessionId();
    const jwtPayload: JWTPayload = {
      userId: userProfile.id,
      email: userProfile.email,
      role: userProfile.role as UserRole,
      systemType: userProfile.system_type as SystemType,
      sessionId,
      permissions
    };

    const token = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken({
      userId: userProfile.id,
      email: userProfile.email,
      role: userProfile.role as UserRole,
      systemType: userProfile.system_type as SystemType,
      sessionId
    });

    // ✅ FIX: Match session expiry to refreshToken expiry (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // ✅ Use getFreshSupabase() for session operations (bypasses RLS)
    const adminClient = getFreshSupabase();

    // ✅ Check for existing active session
    const { data: existingSession } = await adminClient
      .from('user_sessions')
      .select('id')
      .eq('user_id', userProfile.id)
      .eq('is_active', true)
      .maybeSingle();

    if (existingSession) {
      // Update existing session
      const { error: updateError } = await adminClient
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
      const { error: sessionError } = await adminClient
        .from('user_sessions')
        .insert({
          id: sessionId,
          user_id: userProfile.id,
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

    // ✅ FIXED: Update last_login with error checking using admin client
    const { error: lastLoginError } = await adminClient
      .from('user_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userProfile.id);

    if (lastLoginError) {
      logger.error('Failed to update last_login:', lastLoginError);
      // Don't throw - login succeeded, this is just logging
    } else {
      logger.info(`✅ Updated last_login for user ${email}`);
    }

    logger.info(`User ${email} logged in successfully`);

    return {
      token,
      refreshToken,
      sessionId,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.full_name,
        role: userProfile.role as UserRole,
        systemType: userProfile.system_type as SystemType,
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
 * ✅ FIXED: Logout with proper session deactivation
 */
export async function logout(sessionId: string): Promise<void> {
  try {
    // ✅ Use getFreshSupabase() to bypass RLS restrictions
    const adminClient = getFreshSupabase();
    
    const { error } = await adminClient
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
 * ✅ OPTIMIZED: Refresh with better error handling
 */
export async function refreshAccessToken(
  userId: string,
  sessionId: string,
  role: UserRole,
  systemType: SystemType
): Promise<string> {
  try {
    // ✅ Use getFreshSupabase() for consistent session access
    const adminClient = getFreshSupabase();
    
    const { data: session, error } = await adminClient
      .from('user_sessions')
      .select('is_active, expires_at')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    // Session not found
    if (error || !session) {
      logger.warn(`Session ${sessionId} not found for user ${userId}`);
      throw Errors.unauthorized('Session not found or expired');
    }

    // Session inactive
    if (!session.is_active) {
      logger.warn(`Session ${sessionId} is inactive`);
      throw Errors.unauthorized('Session has been terminated');
    }

    // Session expired
    if (new Date(session.expires_at) < new Date()) {
      logger.warn(`Session ${sessionId} expired at ${session.expires_at}`);
      
      // Mark as inactive
      await adminClient
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);
      
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

    // Generate new access token
    const token = generateAccessToken({
      userId,
      email: user.email,
      role,
      systemType,
      sessionId,
      permissions
    });

    // ✅ Update session activity asynchronously (don't await)
    adminClient
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