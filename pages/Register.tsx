import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  User, 
  Mail, 
  Phone, 
  Building2,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';
import { authService,  MemberRegistrationInfoResponse } from '../services/authService';

/**
 * Register Page
 * Handles member self-registration via link: /register?memberId=xxx&token=yyy
 */
const Register: React.FC = () => {
  // URL params
  const [memberId, setMemberId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Member info from token validation
  const [memberInfo, setMemberInfo] = useState<MemberRegistrationInfoResponse | null>(null);

  // Loading states
  const [validating, setValidating] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Status states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'MEMBER' as 'ADMIN' | 'TREASURER' | 'SECRETARY' | 'MEMBER',
  });

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Parse URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const memberIdParam = params.get('memberId');
    const tokenParam = params.get('token');

    if (!memberIdParam || !tokenParam) {
      setError('Invalid registration link. Missing required parameters.');
      setValidating(false);
      return;
    }

    setMemberId(memberIdParam);
    setToken(tokenParam);
    validateToken(memberIdParam, tokenParam);
  }, []);

  // Validate token and fetch member info
  const validateToken = async (memberId: string, token: string) => {
    setValidating(true);
    setError(null);

    try {
      const info = await authService.validateRegistrationToken(memberId, token);
      setMemberInfo(info);

      // Pre-select suggested role
      if (info.suggestedRole) {
        setFormData(prev => ({
          ...prev,
          role: info.suggestedRole as any
        }));
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired registration link');
    } finally {
      setValidating(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (!formData.password) {
      setError('Password is required');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!memberId || !token) {
      setError('Invalid registration link');
      return;
    }

    setSubmitting(true);

    try {
      await authService.registerMember({
        memberId,
        token,
        username: formData.username,
        password: formData.password,
        role: formData.role,
      });

      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Loading state
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Validating registration link...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Registration Successful!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your account has been created. Redirecting to dashboard...
          </p>
          <Loader2 className="animate-spin text-blue-600 mx-auto" size={24} />
        </div>
      </div>
    );
  }

  // Error state (invalid link)
  if (error && !memberInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-600 dark:text-red-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid Registration Link
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Please contact your group administrator to request a new registration link.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="mt-6 text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            P
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">PesaChama</span>
        </div>

        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          Complete Your Registration
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          Create your account to start managing your contributions
        </p>

        {/* Member Info Card */}
        {memberInfo && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <User size={18} className="text-blue-600" />
              Your Member Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <User size={14} className="text-gray-400" />
                <span>{memberInfo.fullName}</span>
                <span className="ml-auto font-mono text-xs bg-white dark:bg-gray-700 px-2 py-0.5 rounded">
                  {memberInfo.memberNumber}
                </span>
              </div>
              {memberInfo.email && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Mail size={14} className="text-gray-400" />
                  <span>{memberInfo.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Phone size={14} className="text-gray-400" />
                <span>{memberInfo.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Building2 size={14} className="text-gray-400" />
                <span>{memberInfo.groupName}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              disabled={submitting}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Letters, numbers, and underscores only
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={submitting}
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Minimum 8 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={submitting}
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <span className="flex items-center gap-1">
                <Shield size={14} />
                Role <span className="text-red-500">*</span>
              </span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={submitting}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:opacity-60 cursor-pointer"
            >
              <option value="MEMBER">Member</option>
              <option value="SECRETARY">Secretary</option>
              <option value="TREASURER">Treasurer</option>
              <option value="ADMIN">Admin</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Role must match your assigned position in the group
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-6"
          >
            {submitting && <Loader2 className="animate-spin" size={20} />}
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;