import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Auth: React.FC = () => {
  const { login, register, error, clearError, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!isLogin) {
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

    try {
      if (isLogin) {
        await login({
          username: formData.username,
          password: formData.password,
        });
      } else {
        await register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
        });
      }
    } catch (err) {
      // Error is handled by context
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormError(null);
    clearError();
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
    });
  };

  const displayError = formError || error;

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
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-subtext dark:text-gray-400 text-center mb-8">
          {isLogin ? 'Enter your credentials to access your account' : 'Sign up to start managing your savings'}
        </p>

        {/* Error Alert */}
        {displayError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-red-700 dark:text-red-400 text-sm">{displayError}</p>
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
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

          {!isLogin && (
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

          {!isLogin && (
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

          {isLogin && (
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
            {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        {/* Switch mode */}
        <div className="mt-6 text-center">
          <p className="text-subtext dark:text-gray-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={switchMode}
              disabled={isLoading}
              className="text-primary font-bold hover:underline disabled:opacity-50"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;