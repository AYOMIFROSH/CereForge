import supabase from '../config/database';
import { getFreshSupabase } from '../config/database';
import { generateAccessToken, generateRefreshToken, generateSessionId, JWTPayload } from '../utils/jwt';
import { Errors } from '../utils/errors';
import logger from '../utils/logger';

interface EmailVerificationResult {
  exists: boolean;
  role?: 'core' | 'admin' | 'partner';
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
    role: 'core' | 'admin' | 'partner';
    permissions?: Record<string, boolean>;
  };
}

/**
 * Verify email and return user role + display info (Step 1 of Smart Login)
 */
export async function verifyEmail(email: string): Promise<EmailVerificationResult> {
  try {
    // ✅ FIX: Use a fresh Supabase query with service role (bypasses RLS and auth state)
    const supabase = getFreshSupabase();
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('id, email, role, status, full_name')
      .eq('email', email)
      .maybeSingle(); // ✅ Use maybeSingle instead of single to avoid throwing on not found

    // ✅ Handle not found explicitly
    if (error) {
      logger.error('Error querying user_profiles:', error);
      return { exists: false };
    }

    if (!user) {
      logger.info(`Email verification: ${email} not found`);
      return { exists: false };
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

    logger.info(`Email verification: ${email} found with role ${user.role}`);

    return {
      exists: true,
      role: user.role,
      displayInfo,
      accountStatus: user.status,
      userId: user.id
    };
  } catch (error) {
    logger.error('Email verification failed:', error);
    // ✅ Return exists: false instead of throwing
    return { exists: false };
  }
}

/**
 * Login user (Step 2 of Smart Login)
 */
export async function login(
  email: string,
  password: string,
  role: 'core' | 'admin' | 'partner',
  ipAddress: string,
  userAgent: string
): Promise<LoginResult> {
  try {
    // Get user from Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      logger.warn(`Failed login attempt for ${email}`);
      throw Errors.invalidCredentials();
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role, status')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !userProfile) {
      throw Errors.notFound('User profile');
    }

    // Verify role matches
    if (userProfile.role !== role) {
      logger.warn(`Role mismatch for ${email}: expected ${role}, got ${userProfile.role}`);
      throw Errors.invalidCredentials();
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

    if (role === 'core') {
      const { data: coreStaff } = await supabase
        .from('core_staff')
        .select('permissions')
        .eq('user_id', userProfile.id)
        .single();

      if (coreStaff) {
        permissions = coreStaff.permissions;
      }
    } else if (role === 'admin') {
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

    // Create JWT payload
    const jwtPayload: JWTPayload = {
      userId: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
      sessionId,
      permissions
    };

    // Generate tokens
    const token = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken({
      userId: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
      sessionId
    });

    // Create session record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await supabase.from('user_sessions').insert({
      id: sessionId,
      user_id: userProfile.id,
      token_hash: token.substring(0, 50), // Store partial hash for reference
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

    logger.info(`User ${email} logged in successfully`);

    return {
      token,
      refreshToken,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.full_name,
        role: userProfile.role,
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
 * Logout user
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
 * Refresh access token
 */
export async function refreshAccessToken(
  userId: string,
  sessionId: string,
  role: 'core' | 'admin' | 'partner'
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

    if (role === 'core') {
      const { data: coreStaff } = await supabase
        .from('core_staff')
        .select('permissions')
        .eq('user_id', userId)
        .single();

      if (coreStaff) {
        permissions = coreStaff.permissions;
      }
    } else if (role === 'admin') {
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