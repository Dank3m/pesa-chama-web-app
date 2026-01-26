import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Building2, CheckCircle, User, Mail, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService, MemberRegistrationInfoResponse } from '../services/authService';

type AuthMode = 'login' | 'register' | 'member-register';

const Auth: React.FC = () => {
  const { login, register, error, clearError, isLoading } = useAuth();

  // Mode and token state
  const [mode, setMode] = useState<AuthMode>('login');
  const [memberId, setMemberId] = useState<string | null>(null);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);

  // Member info from token validation
  const [memberInfo, setMemberInfo] = useState<MemberRegistrationInfoResponse | null>(null);
  const [validatingToken, setValidatingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Form state
  const [formError, setFormError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: 'MEMBER' as 'ADMIN' | 'TREASURER' | 'SECRETARY' | 'MEMBER',
  });

  // Check for member registration link params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const memberIdParam = params.get('memberId');
    const tokenParam = params.get('token');

    if (memberIdParam && tokenParam) {
      setMemberId(memberIdParam);
      setRegistrationToken(tokenParam);
      setMode('member-register');
      validateToken(memberIdParam, tokenParam);
    }
  }, []);

  // Validate registration token and fetch member info
  const validateToken = async (memberId: string, token: string) => {
    setValidatingToken(true);
    setTokenError(null);

    try {
      const info = await authService.validateRegistrationToken(memberId, token);
      setMemberInfo(info);

      // Pre-fill suggested role if available
      if (info.suggestedRole) {
        setFormData(prev => ({
          ...prev,
          role: info.suggestedRole as any
        }));
      }
    } catch (err: any) {
      setTokenError(err?.message || 'Invalid or expired registration link');
    } finally {
      setValidatingToken(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.username || !formData.password) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (mode === 'register') {
      if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
        setFormError('Please fill in all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setFormError('Passwords do not match');
        return;
      }
      if (formData.password.length < 8) {
        setFormError('Password must be at least 8 characters');
        return;
      }
    }

    if (mode === 'member-register') {
      if (formData.password !== formData.confirmPassword) {
        setFormError('Passwords do not match');
        return;
      }
      if (formData.password.length < 8) {
        setFormError('Password must be at least 8 characters');
        return;
      }
      if (!memberId || !registrationToken) {
        setFormError('Invalid registration link');
        return;
      }
    }

    try {
      if (mode === 'login') {
        await login({
          username: formData.username,
          password: formData.password,
        });
      } else if (mode === 'register') {
        await register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
        });
      } else if (mode === 'member-register') {
        await authService.registerMember({
          memberId: memberId!,
          token: registrationToken!,
          username: formData.username,
          password: formData.password,
          role: formData.role,
        });
        setRegistrationSuccess(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } catch (err: any) {
      setFormError(err?.message || 'An error occurred');
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setFormError(null);
    clearError();
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      role: 'MEMBER',
    });
  };

  const displayError = formError || error || tokenError;

  // Show loading while validating token
  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgLight dark:bg-gray-900 p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-subtext dark:text-gray-400">Validating registration link...</p>
        </div>
      </div>
    );
  }

  // Show success message
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgLight dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-dark dark:text-white mb-2">Registration Successful!</h2>
          <p className="text-subtext dark:text-gray-400 mb-4">
            Your account has been created. Redirecting to login...
          </p>
          <Loader2 className="animate-spin text-primary mx-auto" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgLight dark:bg-gray-900 p-4 transition-colors">
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-lg w-full max-w-md transition-colors">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-2xl">
            P
          </div>
          <span className="text-2xl font-bold text-dark dark:text-white">PesaChama.</span>
        </div>

        <h2 className="text-2xl font-bold text-dark dark:text-white mb-2 text-center">
          {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Complete Registration'}
        </h2>
        <p className="text-subtext dark:text-gray-400 text-center mb-6">
          {mode === 'login'
            ? 'Enter your credentials to access your account'
            : mode === 'register'
            ? 'Sign up to start managing your savings'
            : 'Set up your account credentials'}
        </p>

        {/* Member Info Card (for member registration via token) */}
        {mode === 'member-register' && memberInfo && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
            <h3 className="font-bold text-dark dark:text-white mb-3 flex items-center gap-2">
              <User size={18} /> Your Member Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-subtext dark:text-gray-400">
                <User size={14} />
                <span>{memberInfo.fullName}</span>
                <span className="ml-auto font-mono text-xs bg-white dark:bg-gray-700 px-2 py-0.5 rounded">
                  {memberInfo.memberNumber}
                </span>
              </div>
              <div className="flex items-center gap-2 text-subtext dark:text-gray-400">
                <Mail size={14} />
                <span>{memberInfo.email}</span>
              </div>
              <div className="flex items-center gap-2 text-subtext dark:text-gray-400">
                <Phone size={14} />
                <span>{memberInfo.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-subtext dark:text-gray-400">
                <Building2 size={14} />
                <span>{memberInfo.groupName}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {displayError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-red-700 dark:text-red-400 text-sm">{displayError}</p>
          </div>
        )}

        {/* Token error - show link to go to login */}
        {mode === 'member-register' && tokenError && (
          <div className="text-center">
            <p className="text-subtext dark:text-gray-400 mb-4">
              Your registration link may have expired or already been used.
            </p>
            <button
              onClick={() => {
                switchMode('login');
                setTokenError(null);
                window.history.replaceState({}, '', '/');
              }}
              className="text-primary font-bold hover:underline"
            >
              Go to Login
            </button>
          </div>
        )}

        {/* Form */}
        {!(mode === 'member-register' && tokenError) && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors placeholder-gray-400"
                    placeholder="John"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors placeholder-gray-400"
                    placeholder="Doe"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors placeholder-gray-400"
                placeholder="user@example.com"
                disabled={isLoading}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors placeholder-gray-400"
                  placeholder="+254 712 345 678"
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors placeholder-gray-400"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            {(mode === 'register' || mode === 'member-register') && (
              <div>
                <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors placeholder-gray-400"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            )}

            {mode === 'member-register' && memberInfo && (
              <div>
                <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors appearance-none cursor-pointer"
                  disabled={isLoading}
                >
                  <option value="MEMBER">Member</option>
                  <option value="SECRETARY">Secretary</option>
                  <option value="TREASURER">Treasurer</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <p className="mt-1 text-xs text-subtext dark:text-gray-500">
                  Role must match your assigned position in the group
                </p>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button type="button" className="text-sm text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="animate-spin" size={20} />}
              {isLoading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        )}

        {/* Switch mode (only for login/register) */}
        {mode !== 'member-register' && (
          <div className="mt-6 text-center">
            <p className="text-subtext dark:text-gray-400">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                disabled={isLoading}
                className="text-primary font-bold hover:underline disabled:opacity-50"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        )}

        {/* Public Registration Link */}
        {mode === 'login' && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-subtext dark:text-gray-400 mb-2">
              Want to create a new group?
            </p>
            <a
              href="/register/public"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            >
              <Building2 size={16} />
              Register & Create Group
            </a>
          </div>
        )}

        {/* Info for login mode */}
        {mode === 'login' && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-sm text-blue-700 dark:text-blue-400 text-center">
              <strong>New member?</strong> Ask your group admin to add you. You'll receive a registration link via SMS or email.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
