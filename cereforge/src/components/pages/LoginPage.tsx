import { useState, useRef, FormEvent } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Shield, Building, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import cereForge from '../../assets/cereForge.png';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/hooks/useAuth';

type PortalType = 'partners' | 'admins' | 'cereforge';

interface PortalConfig {
  title: string;
  subtitle: string;
  icon: JSX.Element;
  color: string;
  hoverColor: string;
  focusColor: string;
}

const LoginPage = () => {
  useDocumentTitle(
    "Cereforge - Login",
    "Login to your Cereforge account - Partners Portal, Admin Portal, and Core System access.",
    "/login"
  );

  const { verifyEmail, login, isLoading, emailVerified, verificationResult, clearEmailVerification } = useAuth();

  const [activePortal, setActivePortal] = useState<PortalType>('partners');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Form state
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  // UI state
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handlePortalChange = (portal: PortalType) => {
    setActivePortal(portal);
    // Clear state when switching portals
    setEmail('');
    setPassword('');
    setEmailError(null);
    setLoginError(null);
    clearEmailVerification();
  };

  const handleEmailVerification = async () => {
    if (!email) {
      setEmailError('Please enter your email');
      return;
    }

    setEmailError(null);
    setIsVerifying(true);

    try {
      const result = await verifyEmail(email);

      if (result.exists) {
        // Check account status
        if (result.accountStatus !== 'active') {
          setEmailError(`Account is ${result.accountStatus}`);
          return;
        }

        // Success - focus password field
        setTimeout(() => {
          passwordInputRef.current?.focus();
        }, 100);
      } else {
        setEmailError('Email not registered in our system');
      }
    } catch (error: any) {
      setEmailError(error.response?.data?.error?.message || 'Failed to verify email');
    } finally {
      setIsVerifying(false);
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
      await login(email, password, verificationResult!.role!);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Login failed. Please try again.';
      setLoginError(errorMessage);
    }
  };

  const getPortalConfig = (): PortalConfig => {
    switch (activePortal) {
      case 'partners':
        return {
          title: 'Partners Portal',
          subtitle: 'Welcome back, partner',
          icon: <Building className="w-4 sm:w-6 h-4 sm:h-6" />,
          color: 'bg-orange-500',
          hoverColor: 'hover:bg-orange-600',
          focusColor: 'focus:ring-orange-500 focus:border-orange-500'
        };
      case 'admins':
        return {
          title: 'Admin Portal',
          subtitle: 'Administrative access',
          icon: <Shield className="w-4 sm:w-6 h-4 sm:h-6" />,
          color: 'bg-gray-600',
          hoverColor: 'hover:bg-gray-700',
          focusColor: 'focus:ring-gray-500 focus:border-gray-500'
        };
      case 'cereforge':
        return {
          title: 'Cereforge Portal',
          subtitle: 'Core system access',
          icon: <User className="w-4 sm:w-6 h-4 sm:h-6" />,
          color: 'bg-blue-800',
          hoverColor: 'hover:bg-blue-900',
          focusColor: 'focus:ring-blue-500 focus:border-blue-500'
        };
      default:
        return {
          title: '',
          subtitle: '',
          icon: <></>,
          color: '',
          hoverColor: '',
          focusColor: ''
        };
    }
  };

  const config = getPortalConfig();

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
            <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
              <img src={cereForge} alt="Cereforge Logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/10 p-2" />
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                <span className="relative inline-block">
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-lg transform -skew-x-12 shadow-lg border border-white/30"></div>
                  <span className="text-blue-900 relative z-10 px-2 sm:px-3 py-1 text-lg sm:text-xl">CERE</span>
                </span>
                <span className="text-white text-lg sm:text-xl">FORGE</span>
              </h1>
            </div>
            <p className="text-blue-200 text-xs sm:text-sm">Forging Intelligence into Innovation</p>
          </div>

          {/* Portal Tabs */}
          <div className="bg-white/10 backdrop-blur-sm rounded-t-xl border border-white/20 border-b-0">
            <div className="flex">
              {[
                { id: 'partners' as PortalType, label: 'Partners', shortLabel: 'Part', icon: <Building className="w-3 h-3 sm:w-4 sm:h-4" /> },
                { id: 'admins' as PortalType, label: 'Admins', shortLabel: 'Admin', icon: <Shield className="w-3 h-3 sm:w-4 sm:h-4" /> },
                { id: 'cereforge' as PortalType, label: 'Cereforge', shortLabel: 'Core', icon: <User className="w-3 h-3 sm:w-4 sm:h-4" /> }
              ].map((portal) => (
                <button
                  key={portal.id}
                  onClick={() => handlePortalChange(portal.id)}
                  className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 border-b-2 ${
                    activePortal === portal.id
                      ? 'text-white border-white bg-white/10'
                      : 'text-blue-200 border-transparent hover:text-white hover:bg-white/5'
                  }`}
                >
                  {portal.icon}
                  <span className="hidden sm:inline">{portal.label}</span>
                  <span className="sm:hidden">{portal.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Login Container */}
          <div className="bg-white rounded-b-xl shadow-2xl border border-gray-200">
            <div className="p-4 sm:p-8">
              {/* Portal Header */}
              <div className="text-center mb-4 sm:mb-6">
                <div className={`inline-flex items-center space-x-1 sm:space-x-2 ${config.color} text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full mb-2 text-sm sm:text-base`}>
                  {config.icon}
                  <span className="font-semibold">{config.title}</span>
                </div>
                <p className="text-gray-600 text-sm sm:text-base">{config.subtitle}</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Email Input (Step 1) */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Email / Username
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
                      placeholder="Enter email or username"
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

                {/* Role-Specific Display Field (Auto-filled, Disabled) */}
                {emailVerified && verificationResult && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      {verificationResult.role === 'partner' && 'Partner Name'}
                      {verificationResult.role === 'admin' && 'Category'}
                      {verificationResult.role === 'core' && 'Employee ID'}
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

                {/* Password Input (Step 2 - Enabled after email verified) */}
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
                  disabled={!emailVerified || !password || isLoading}
                  className={`w-full py-2 sm:py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-105 ${config.color} ${config.hoverColor} shadow-lg text-sm sm:text-base ${
                    (!emailVerified || !password || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </span>
                  ) : (
                    `Sign In to ${config.title}`
                  )}
                </button>

                {/* Additional Options */}
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
                      Back home?
                    </a>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;