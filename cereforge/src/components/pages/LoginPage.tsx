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

  // Auto-focus password field
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
        title: 'System Access',
        subtitle: 'Identify yourself to proceed',
        icon: <User className="w-5 h-5" />,
        accentColor: 'text-zinc-400',
        borderColor: 'border-zinc-700',
        badge: 'bg-zinc-800 text-zinc-400',
        buttonColor: 'bg-zinc-700 hover:bg-zinc-600'
      };
    }

    switch (verificationResult.role) {
      case 'partner':
        return {
          title: 'Partner Portal',
          subtitle: 'Welcome back, Partner',
          icon: <Building className="w-5 h-5" />,
          accentColor: 'text-orange-500',
          borderColor: 'border-orange-500/50',
          badge: 'bg-orange-500/10 text-orange-500',
          buttonColor: 'bg-orange-600 hover:bg-orange-500'
        };
      case 'admin':
        return {
          title: 'Admin Command',
          subtitle: 'Administrative Access',
          icon: <Shield className="w-5 h-5" />,
          accentColor: 'text-red-500',
          borderColor: 'border-red-500/50',
          badge: 'bg-red-500/10 text-red-500',
          buttonColor: 'bg-red-600 hover:bg-red-500'
        };
      case 'core':
        return {
          title: 'Core System',
          subtitle: 'Engineering Access',
          icon: <User className="w-5 h-5" />,
          accentColor: 'text-blue-500',
          borderColor: 'border-blue-500/50',
          badge: 'bg-blue-500/10 text-blue-500',
          buttonColor: 'bg-blue-600 hover:bg-blue-500'
        };
      default:
        return {
          title: 'System Access',
          subtitle: 'Identify yourself',
          icon: <User className="w-5 h-5" />,
          accentColor: 'text-zinc-400',
          borderColor: 'border-zinc-700',
          badge: 'bg-zinc-800 text-zinc-400',
          buttonColor: 'bg-zinc-700 hover:bg-zinc-600'
        };
    }
  };

  const config = getRoleConfig();

  return (
    // ✅ FIXED LAYOUT (No Body Scroll)
    <div className="fixed inset-0 bg-black text-zinc-100 font-sans flex flex-col items-center justify-center overflow-hidden">

      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
        <div className="w-[800px] h-[800px] border border-white/5 rounded-full animate-[spin_60s_linear_infinite] opacity-20 border-dashed"></div>
      </div>

      {/* ✅ FLEX WRAPPER */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md flex flex-col max-h-full p-4 gap-6">

        {/* 1. BRANDING (Restored Exact Skewed Box Design) */}
        <div className="flex-shrink-0 text-center">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500 blur-xl opacity-20 rounded-full"></div>
              {/* Logo Image */}
              <img src={cereForge} alt="Cereforge Logo" className="relative w-12 h-12 rounded-lg bg-white/10 p-1 object-contain drop-shadow-2xl border border-white/10" />
            </div>

            {/* Branding Text Component */}
            <div className="flex items-center">
              <div className="relative inline-block mr-1">
                {/* The Signature Skewed Box */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-lg transform -skew-x-12 border border-white/20"></div>
                <span className="text-blue-500 relative z-10 px-3 py-1 font-bold text-2xl tracking-tight">CERE</span>
              </div>
              <span className="text-white font-bold text-2xl tracking-tight">FORGE</span>
            </div>
          </div>
          <p className="text-zinc-500 text-xs sm:text-sm font-medium tracking-wide">Forging Intelligence into Innovation</p>
        </div>

        {/* 2. CARD (Dark Theme, Internal Scroll) */}
        <div className={`flex flex-col bg-zinc-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border ${config.borderColor} overflow-hidden shrink min-h-0 transition-all duration-300`}>

          {/* Header */}
          <div className="flex-shrink-0 p-4 sm:p-5 text-center border-b border-white/5 bg-white/5">
            <div className={`inline-flex items-center space-x-2 ${config.badge} border ${config.borderColor} px-4 py-1.5 rounded-full shadow-lg transition-all duration-300`}>
              {config.icon}
              <span className="font-semibold text-sm">{config.title}</span>
            </div>
            <p className="text-zinc-400 text-sm mt-2">{config.subtitle}</p>
          </div>

          {/* Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide overscroll-contain">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Switch Account */}
              {emailVerified && (
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-medium text-zinc-500 hover:text-white flex items-center transition-colors group"
                  >
                    <ArrowRight className="w-3 h-3 mr-1 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    Use different email
                  </button>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">
                  Identity / Email
                </label>
                <div className="relative group">
                  <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${emailVerified ? 'text-green-500' : 'text-zinc-500 group-focus-within:text-white'}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => email && !emailVerified && handleEmailVerification()}
                    disabled={emailVerified || isVerifying}
                    className={`w-full pl-10 pr-10 py-3 bg-black/50 border rounded-xl text-sm transition-all duration-200 outline-none
                        ${emailVerified
                        ? 'border-green-500/50 text-green-500'
                        : `border-white/10 text-white focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50`
                      } 
                        ${(emailVerified || isVerifying) ? 'cursor-not-allowed opacity-70' : ''}`}
                    placeholder="authorized@access.com"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isVerifying && <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />}
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
                  <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">
                    {verificationResult.role === 'partner' && 'Verified Partner'}
                    {verificationResult.role === 'admin' && 'Admin Privilege'}
                    {verificationResult.role === 'core' && 'Engineer ID'}
                  </label>
                  <div className="relative">
                    <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${config.accentColor}`}>
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
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-white/5 rounded-xl text-sm font-mono text-zinc-300 cursor-default"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-white/5 font-bold uppercase">Verified</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div className={`transition-all duration-300 ${!emailVerified ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">
                  Security Key
                </label>
                <div className="relative group">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${emailVerified ? 'text-zinc-500 group-focus-within:text-white' : 'text-zinc-600'}`} />
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!emailVerified}
                    className={`w-full pl-10 pr-10 py-3 bg-black/50 border rounded-xl text-sm text-white transition-all duration-200 outline-none
                        ${emailVerified
                        ? `border-white/10 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50`
                        : 'border-white/5 cursor-not-allowed'
                      }`}
                    placeholder={emailVerified ? "••••••••" : "Verify email first"}
                  />
                  {emailVerified && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-white p-1 transition-all"
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
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none border border-white/5'
                    : `${config.buttonColor} shadow-orange-900/20`
                  }`}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying Identity...</span>
                  </>
                ) : isLoggingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Establishing Session...</span>
                  </>
                ) : (
                  <>
                    <span>Access Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 bg-zinc-950/30 border-t border-white/5 flex items-center justify-between text-xs sm:text-sm">
            <label className="flex items-center space-x-2 text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors">
              <input type="checkbox" className="rounded border-zinc-700 bg-zinc-800 text-orange-600 focus:ring-orange-500" />
              <span>Remind Me</span>
            </label>
            <div className="flex space-x-4">
              <a href="#" className="text-zinc-500 hover:text-white transition-colors">Forgot Password?</a>
              <a href="/" className="text-zinc-500 hover:text-white transition-colors">Home</a>
            </div>
          </div>

        </div>

        {/* 3. COPYRIGHT */}
        <div className="flex-shrink-0 text-center text-zinc-600 text-xs font-medium">
          &copy; 2024 Cereforge Systems. 256-Bit Encrypted.
        </div>

      </div>
    </div>
  );
};

export default LoginPage;