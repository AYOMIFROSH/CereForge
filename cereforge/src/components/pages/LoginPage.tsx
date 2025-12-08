import { useState, useRef, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, Shield, Building, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import cereForge from '../../assets/cereForge.png';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// ✅ Redux hooks
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { useVerifyEmailMutation, useLoginMutation, useGetMeQuery } from '@/store/api/authApi';
import { selectEmailVerified, selectVerificationResult, clearEmailVerification, selectIsAuthenticated, selectUser } from '@/store/slices/authSlice';import { addToast } from '@/store/slices/uiSlice';

const LoginPage = () => {
  useDocumentTitle(
    "Cereforge - Login",
    "Login to your Cereforge account - Unified portal for all users.",
    "/login"
  );

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // ✅ Redux selectors
  const emailVerified = useAppSelector(selectEmailVerified);
  const verificationResult = useAppSelector(selectVerificationResult);
  const isAuthenticated = useAppSelector(selectIsAuthenticated); // ✅ ADD THIS
  const user = useAppSelector(selectUser); // ✅ ADD THIS

  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  // ✅ ADD THIS: Check session on mount
  const { isLoading: isCheckingSession } = useGetMeQuery();

  // ✅ ADD THIS: Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('✅ LoginPage: User already authenticated, redirecting...');
      
      switch (user.role) {
        case 'core':
          navigate('/core/dashboard', { replace: true });
          break;
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'partner':
          navigate('/partner/dashboard', { replace: true });
          break;
      }
    }
  }, [isAuthenticated, user, navigate]);

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus password field when email is verified
  useEffect(() => {
    if (emailVerified && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [emailVerified]);

  const handleEmailVerification = async () => {
    if (!email) {
      setEmailError('Please enter your email');
      return;
    }

    setEmailError(null);

    try {
      const result = await verifyEmail({ email }).unwrap();

      if (result.data.exists) {
        // ✅ Email verified, password field will auto-focus
        dispatch(addToast({
          message: `Welcome back! Login as ${result.data.role}`,
          type: 'success'
        }));
      } else {
        setEmailError('Email not registered in our system');
      }
    } catch (error: any) {
      const serverError = error?.data?.error;
      setEmailError(serverError?.message || 'Unable to verify email. Please try again.');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!emailVerified) {
      setEmailError('Please verify your email first');
      return;
    }

    if (!password) {
      setLoginError('Please enter your password');
      return;
    }

    setLoginError(null);

    try {
      await login({
        email,
        password,
        role: verificationResult!.role!
      }).unwrap();

      // ✅ Navigate based on role
      const role = verificationResult!.role!;
      switch (role) {
        case 'core':``
          navigate('/core/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'partner':
          navigate('/partner/dashboard');
          break;
      }
    } catch (error: any) {
      const serverError = error?.data?.error;
      setLoginError(serverError?.message || 'Login failed. Please try again.');
      
      dispatch(addToast({
        message: serverError?.message || 'Login failed',
        type: 'error'
      }));
    }
  };

  const handleReset = () => {
    setEmail('');
    setPassword('');
    setEmailError(null);
    setLoginError(null);
    dispatch(clearEmailVerification());
  };

  // Get role-specific config
  const getRoleConfig = () => {
    if (!verificationResult?.role) {
      return {
        title: 'Cereforge',
        subtitle: 'Sign in to your account',
        icon: <User className="w-6 h-6" />,
        color: 'bg-blue-800',
        hoverColor: 'hover:bg-blue-900',
        focusColor: 'focus:ring-blue-500 focus:border-blue-500'
      };
    }

    switch (verificationResult.role) {
      case 'partner':
        return {
          title: 'Partners Portal',
          subtitle: 'Welcome back, partner',
          icon: <Building className="w-6 h-6" />,
          color: 'bg-orange-500',
          hoverColor: 'hover:bg-orange-600',
          focusColor: 'focus:ring-orange-500 focus:border-orange-500'
        };
      case 'admin':
        return {
          title: 'Admin Portal',
          subtitle: 'Administrative access',
          icon: <Shield className="w-6 h-6" />,
          color: 'bg-gray-600',
          hoverColor: 'hover:bg-gray-700',
          focusColor: 'focus:ring-gray-500 focus:border-gray-500'
        };
      case 'core':
        return {
          title: 'Core Portal',
          subtitle: 'Core system access',
          icon: <User className="w-6 h-6" />,
          color: 'bg-blue-800',
          hoverColor: 'hover:bg-blue-900',
          focusColor: 'focus:ring-blue-500 focus:border-blue-500'
        };
      default:
        return {
          title: 'Cereforge',
          subtitle: 'Sign in to your account',
          icon: <User className="w-6 h-6" />,
          color: 'bg-blue-800',
          hoverColor: 'hover:bg-blue-900',
          focusColor: 'focus:ring-blue-500 focus:border-blue-500'
        };
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>Checking session...</p>
        </div>
      </div>
    );
  }
  
  const config = getRoleConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex flex-col overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}></div>

      {/* Main Login Content */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 relative">
        <div className="w-full max-w-sm sm:max-w-md relative z-10">
          {/* Logo and Branding */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-2 sm:mb-1">
              <img src={cereForge} alt="Cereforge Logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/10 p-2" />
              <h1 className="text-xl sm:text-1xl font-bold text-white">
                <span className="relative inline-block">
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-lg transform -skew-x-12 shadow-lg border border-white/30"></div>
                  <span className="text-blue-900 relative z-10 px-2 sm:px-3 py-1 text-lg sm:text-xl">CERE</span>
                </span>
                <span className="text-white text-lg sm:text-xl">FORGE</span>
              </h1>
            </div>
            <p className="text-blue-200 text-xs sm:text-sm">Forging Intelligence into Innovation</p>
          </div>

          {/* Login Container */}
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col max-h-[calc(100vh-150px)]">
            {/* Portal Header */}
            <div className="p-2 sm:p-4 border-b border-gray-200 flex-shrink-0">
              <div className="text-center">
                <div className={`inline-flex items-center space-x-1 sm:space-x-2 ${config.color} text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full mb-2 text-sm sm:text-base`}>
                  {config.icon}
                  <span className="font-semibold">{config.title}</span>
                </div>
                <p className="text-gray-600 text-sm sm:text-base">{config.subtitle}</p>
              </div>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {emailVerified && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                  >
                    ← Use different email
                  </button>
                )}

                {/* Email Input */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => email && !emailVerified && handleEmailVerification()}
                      disabled={emailVerified || isVerifying}
                      className={`w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 ${config.focusColor} transition-colors ${
                        emailVerified ? 'bg-gray-50 border-green-500' : 'border-gray-300'
                      } ${(emailVerified || isVerifying) ? 'cursor-not-allowed' : ''}`}
                      placeholder="Enter your email"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isVerifying && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 animate-spin" />}
                      {emailVerified && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />}
                    </div>
                  </div>
                  {emailError && (
                    <div className="flex items-center space-x-1 mt-2 text-red-600 text-xs sm:text-sm">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{emailError}</span>
                    </div>
                  )}
                </div>

                {/* Role Display Field */}
                {emailVerified && verificationResult && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      {verificationResult.role === 'partner' && 'Partner Name'}
                      {verificationResult.role === 'admin' && 'Category'}
                      {verificationResult.role === 'core' && 'Position'}
                    </label>
                    <div className="relative">
                      {verificationResult.role === 'partner' && <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />}
                      {verificationResult.role === 'admin' && <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />}
                      {verificationResult.role === 'core' && <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />}
                      <input
                        type="text"
                        value={
                          verificationResult.displayInfo?.partnerName ||
                          verificationResult.displayInfo?.category ||
                          verificationResult.displayInfo?.employeeId ||
                          ''
                        }
                        disabled
                        className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                {/* Password Input */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      ref={passwordInputRef}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={!emailVerified}
                      className={`w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 ${config.focusColor} transition-colors ${
                        !emailVerified ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      placeholder={emailVerified ? "Enter password" : "Verify email first"}
                    />
                    {emailVerified && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </button>
                    )}
                  </div>
                  {loginError && (
                    <div className="flex items-center space-x-1 mt-2 text-red-600 text-xs sm:text-sm">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{loginError}</span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!emailVerified || !password || isVerifying || isLoggingIn}
                  className={`w-full py-2 sm:py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-105 ${config.color} ${config.hoverColor} shadow-lg text-sm sm:text-base ${
                    (!emailVerified || !password || isVerifying || isLoggingIn) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isVerifying ? (
                    <span className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </span>
                  ) : isLoggingIn ? (
                    <span className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </span>
                  ) : (
                    `Sign In${emailVerified ? ` to ${config.title}` : ''}`
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Options */}
            <div className="p-4 sm:px-8 sm:py-4 border-t border-gray-200 flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm space-y-2 sm:space-y-0">
                <label className="flex items-center space-x-2 text-gray-600">
                  <input type="checkbox" className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500" />
                  <span>Remember me</span>
                </label>
                <div className="flex space-x-4">
                  <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">
                    Forgot password?
                  </a>
                  <a href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                    Home
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;