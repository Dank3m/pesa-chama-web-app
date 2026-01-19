/**
 * Auth.api.tsx - API-Connected Auth Page
 * 
 * Handles:
 * 1. Regular login
 * 2. Member registration via link (with memberId and token from URL)
 * 
 * Registration URL format: /register?memberId=xxx&token=yyy
 * 
 * To use this version, rename to Auth.tsx or import in App.api.tsx
 */

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle, User, Mail, Phone, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService, MemberRegistrationInfoResponse } from '../services/authService';

interface AuthProps {
  onLogin?: () => void;
}

type AuthMode = 'login' | 'member-register';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const { login, error: authError, clearError, isLoading: authLoading } = useAuth();
  
  // Determine mode based on URL params
  const [mode, setMode] = useState<AuthMode>('login');
  const [memberId, setMemberId] = useState<string | null>(null);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  
  // Member info from token validation
  const [memberInfo, setMemberInfo] = useState<MemberRegistrationInfoResponse | null>(null);
  const [validatingToken, setValidatingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  
  // Form state
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  // Login form data
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  
  // Member registration form data
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'MEMBER' as 'ADMIN' | 'TREASURER' | 'SECRETARY' | 'MEMBER',
  });

  // Check for registration link params on mount
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
        setRegisterData(prev => ({
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

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!loginData.email || !loginData.password) {
      setFormError('Please fill in all fields');
      return;
    }
    
    try {
      await login(loginData);
      onLogin?.();
    } catch (err: any) {
      setFormError(err?.message || 'Login failed');
    }
  };

  // Handle member registration
  const handleMemberRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!registerData.username || !registerData.password) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    if (registerData.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }
    
    if (!memberId || !registrationToken) {
      setFormError('Invalid registration link');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await authService.registerMember({
        memberId,
        token: registrationToken,
        username: registerData.username,
        password: registerData.password,
        role: registerData.role,
      });
      
      setRegistrationSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      setFormError(err?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = formError || authError || tokenError;
  const isLoading = authLoading || isSubmitting || validatingToken;

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
            Your account has been created. Redirecting to dashboard...
          </p>
          <Loader2 className="animate-spin text-primary mx-auto" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgLight dark:bg-gray-900 p-4 transition-colors">
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-lg w-full max-w-md transition-colors">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-2xl">
            P
          </div>
          <span className="text-2xl font-bold text-dark dark:text-white">PesaChama.</span>
        </div>

        {/* Header */}
        <h2 className="text-2xl font-bold text-dark dark:text-white mb-2 text-center">
          {mode === 'login' ? 'Welcome Back' : 'Complete Your Registration'}
        </h2>
        <p className="text-subtext dark:text-gray-400 text-center mb-6">
          {mode === 'login' 
            ? 'Enter your credentials to access your account' 
            : 'Create your account to start managing your savings'}
        </p>

        {/* Member Info Card (for registration) */}
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

        {/* Login Form */}
        {mode === 'login' && (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                Email or Username
              </label>
              <input 
                type="text"
                value={loginData.email}
                onChange={(e) => {
                  setLoginData({...loginData, email: e.target.value});
                  setFormError(null);
                  clearError?.();
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors placeholder-gray-400" 
                placeholder="user@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                Password
              </label>
              <input 
                type="password"
                value={loginData.password}
                onChange={(e) => {
                  setLoginData({...loginData, password: e.target.value});
                  setFormError(null);
                  clearError?.();
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors placeholder-gray-400" 
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-sm text-primary hover:underline">
                Forgot password?
              </button>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="animate-spin" size={20} />}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Member Registration Form */}
        {mode === 'member-register' && memberInfo && (
          <form className="space-y-4" onSubmit={handleMemberRegister}>
            <div>
              <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                Username *
              </label>
              <input 
                type="text"
                value={registerData.username}
                onChange={(e) => {
                  setRegisterData({...registerData, username: e.target.value});
                  setFormError(null);
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors placeholder-gray-400" 
                placeholder="Choose a username"
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-subtext dark:text-gray-500">
                Letters, numbers, and underscores only
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                Password *
              </label>
              <input 
                type="password"
                value={registerData.password}
                onChange={(e) => {
                  setRegisterData({...registerData, password: e.target.value});
                  setFormError(null);
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors placeholder-gray-400" 
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                Confirm Password *
              </label>
              <input 
                type="password"
                value={registerData.confirmPassword}
                onChange={(e) => {
                  setRegisterData({...registerData, confirmPassword: e.target.value});
                  setFormError(null);
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors placeholder-gray-400" 
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                Role *
              </label>
              <select 
                value={registerData.role}
                onChange={(e) => setRegisterData({...registerData, role: e.target.value as any})}
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

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="animate-spin" size={20} />}
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Token error - show link to request new one */}
        {mode === 'member-register' && tokenError && (
          <div className="text-center">
            <p className="text-subtext dark:text-gray-400 mb-4">
              Your registration link may have expired or already been used.
            </p>
            <button 
              onClick={() => {
                setMode('login');
                setTokenError(null);
                // Clear URL params
                window.history.replaceState({}, '', '/');
              }}
              className="text-primary font-bold hover:underline"
            >
              Go to Login
            </button>
          </div>
        )}

        {/* Footer */}
        {mode === 'login' && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
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
