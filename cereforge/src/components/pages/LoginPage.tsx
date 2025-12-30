import { useState, useRef, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, Shield, Building, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import cereForge from '../../assets/cereForge.png';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// ✅ Redux hooks
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { useVerifyEmailMutation, useLoginMutation } from '@/store/api/authApi';
import { selectEmailVerified, selectVerificationResult, clearEmailVerification, selectIsAuthenticated, selectUser } from '@/store/slices/authSlice';
import { addToast } from '@/store/slices/uiSlice';

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
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  // ✅ PRESERVED LOGIC: Quick redirect check
  useEffect(() => {
    if (isAuthenticated && user) {
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
        const roleName = result.data.role ? result.data.role.toUpperCase() : 'USER';
        dispatch(addToast({
          message: `Identity confirmed: ${roleName}`,
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

      const role = verificationResult!.role!;
      switch (role) {
        case 'core':
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

  const getRoleConfig = () => {
    if (!verificationResult?.role) {
      return {
        title: 'Cereforge Portal',
        subtitle: 'Sign in to your account',
        icon: <User className="w-5 h-5" />,
        color: 'bg-blue-800',
        hoverColor: 'hover:bg-blue-900',
        focusColor: 'focus:ring-blue-500 focus:border-blue-500'
      };
    }

    switch (verificationResult.role) {
      case 'partner':
        return {
          title: 'Partners Portal',
          subtitle: 'Welcome back, Partner',
          icon: <Building className="w-5 h-5" />,
          color: 'bg-orange-500',
          hoverColor: 'hover:bg-orange-600',
          focusColor: 'focus:ring-orange-500 focus:border-orange-500'
        };
      case 'admin':
        return {
          title: 'Admin Portal',
          subtitle: 'Administrative access',
          icon: <Shield className="w-5 h-5" />,
          color: 'bg-gray-700',
          hoverColor: 'hover:bg-gray-800',
          focusColor: 'focus:ring-gray-600 focus:border-gray-600'
        };
      case 'core':
        return {
          title: 'Core System',
          subtitle: 'Engineering Access',
          icon: <User className="w-5 h-5" />,
          color: 'bg-blue-800',
          hoverColor: 'hover:bg-blue-900',
          focusColor: 'focus:ring-blue-500 focus:border-blue-500'
        };
      default:
        return {
          title: 'Cereforge',
          subtitle: 'Sign in to your account',
          icon: <User className="w-5 h-5" />,
          color: 'bg-blue-800',
          hoverColor: 'hover:bg-blue-900',
          focusColor: 'focus:ring-blue-500 focus:border-blue-500'
        };
    }
  };

  const config = getRoleConfig();

  return (
    // ✅ FIX 1: Use 'fixed inset-0' to lock the viewport size. No body scroll ever.
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex flex-col items-center justify-center overflow-hidden">
      
      {/* Texture Background */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}></div>

      {/* ✅ FIX 2: Layout Constraint Wrapper */}
      {/* This flex container forces the logo and copyright to stay put, and squeezes the card if needed. */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md flex flex-col max-h-full p-4 gap-4">
          
          {/* 1. LOGO (Always Visible, Never Shrinks) */}
          <div className="flex-shrink-0 text-center">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-30 rounded-full"></div>
                <img src={cereForge} alt="Cereforge Logo" className="relative w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm p-2 border border-white/20 shadow-lg" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                <span className="relative inline-block mr-1">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded transform -skew-x-12 border border-white/20"></div>
                  <span className="text-blue-100 relative z-10 px-2">CERE</span>
                </span>
                <span>FORGE</span>
              </h1>
            </div>
            <p className="text-blue-200/80 text-xs sm:text-sm font-medium tracking-wide">Forging Intelligence into Innovation</p>
          </div>

          {/* 2. CARD (Flexible Height, Internal Scroll) */}
          {/* 'min-h-0' and 'shrink' are critical here. They tell the card to shrink below its content size if the screen is small. */}
          <div className="flex flex-col bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden shrink min-h-0 transition-all duration-300">
            
            {/* Card Header (Fixed) */}
            <div className="flex-shrink-0 p-4 sm:p-5 text-center border-b border-gray-100">
               <div className={`inline-flex items-center space-x-2 ${config.color} text-white px-4 py-1.5 rounded-full shadow-md transition-colors duration-300`}>
                  {config.icon}
                  <span className="font-semibold text-sm">{config.title}</span>
                </div>
                <p className="text-gray-500 text-sm mt-2">{config.subtitle}</p>
            </div>

            {/* ✅ Card Body (The ONLY thing that scrolls) */}
            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide overscroll-contain">
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Switch Account */}
                {emailVerified && (
                  <div className="flex justify-start">
                     <button
                        type="button"
                        onClick={handleReset}
                        className="text-xs font-medium text-gray-500 hover:text-blue-600 flex items-center transition-colors group"
                      >
                        <ArrowRight className="w-3 h-3 mr-1 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        Use different email
                      </button>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${emailVerified ? 'text-green-500' : 'text-gray-400 group-focus-within:text-blue-600'}`} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => email && !emailVerified && handleEmailVerification()}
                      disabled={emailVerified || isVerifying}
                      className={`w-full pl-10 pr-10 py-3 bg-gray-50 border rounded-xl text-sm font-medium transition-all duration-200 outline-none
                        ${emailVerified 
                            ? 'border-green-500 bg-green-50 text-gray-800' 
                            : `border-gray-200 focus:bg-white ${config.focusColor} focus:ring-4 focus:ring-opacity-20`
                        } 
                        ${(emailVerified || isVerifying) ? 'cursor-not-allowed opacity-90' : ''}`}
                      placeholder="name@company.com"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isVerifying && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                      {emailVerified && <CheckCircle className="w-5 h-5 text-green-500 animate-in zoom-in duration-300" />}
                    </div>
                  </div>
                  {emailError && (
                    <div className="flex items-center space-x-1.5 mt-2 text-red-500 text-xs font-medium animate-in slide-in-from-top-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{emailError}</span>
                    </div>
                  )}
                </div>

                {/* Role Display */}
                {emailVerified && verificationResult && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                      {verificationResult.role === 'partner' && 'Verified Partner'}
                      {verificationResult.role === 'admin' && 'Admin Privilege'}
                      {verificationResult.role === 'core' && 'Engineer ID'}
                    </label>
                    <div className="relative">
                       <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          {config.icon}
                       </div>
                      <input
                        type="text"
                        value={
                          verificationResult.displayInfo?.partnerName ||
                          verificationResult.displayInfo?.category ||
                          verificationResult.displayInfo?.employeeId ||
                          ''
                        }
                        disabled
                        className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl text-sm font-bold text-gray-700 cursor-default"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md font-bold uppercase">Verified</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Password Field */}
                <div className={`transition-all duration-300 ${!emailVerified ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${emailVerified ? 'text-gray-400 group-focus-within:text-blue-600' : 'text-gray-300'}`} />
                    <input
                      ref={passwordInputRef}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={!emailVerified}
                      className={`w-full pl-10 pr-10 py-3 bg-gray-50 border rounded-xl text-sm font-medium transition-all duration-200 outline-none
                        ${emailVerified 
                            ? `border-gray-200 focus:bg-white ${config.focusColor} focus:ring-4 focus:ring-opacity-20` 
                            : 'border-gray-200 cursor-not-allowed'
                        }`}
                      placeholder={emailVerified ? "••••••••" : "Verify email first"}
                    />
                    {emailVerified && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  {loginError && (
                    <div className="flex items-center space-x-1.5 mt-2 text-red-500 text-xs font-medium animate-in slide-in-from-top-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{loginError}</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button
                  type="submit"
                  disabled={!emailVerified || !password || isVerifying || isLoggingIn}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2
                    ${(!emailVerified || !password || isVerifying || isLoggingIn) 
                        ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                        : `${config.color} ${config.hoverColor} shadow-blue-900/20`
                    }`}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Checking System...</span>
                    </>
                  ) : isLoggingIn ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                        <span>Sign In Securely</span>
                        <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Card Footer (Fixed) */}
            <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs sm:text-sm">
                <label className="flex items-center space-x-2 text-gray-500 cursor-pointer hover:text-gray-700">
                  <input type="checkbox" className={`rounded border-gray-300 text-blue-600 ${config.focusColor}`} />
                  <span>Remember me</span>
                </label>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-500 hover:text-blue-600 font-medium transition-colors">Forgot password?</a>
                  <a href="/" className="text-gray-500 hover:text-blue-600 font-medium transition-colors">Home</a>
                </div>
            </div>

          </div>
          
          {/* 3. COPYRIGHT (Always Visible, Never Shrinks) */}
          <div className="flex-shrink-0 text-center text-blue-200/40 text-xs font-medium">
             &copy; 2024 Cereforge Systems. Secure Portal.
          </div>

      </div>
    </div>
  );
};

export default LoginPage;