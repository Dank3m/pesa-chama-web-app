import React, { useState } from 'react';
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
  ChevronRight,
  ChevronLeft,
  Settings,
  DollarSign,
  Calendar,
  Percent
} from 'lucide-react';
import { authService, PublicRegistrationRequest } from '../services/authService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Public Registration Page
 * Multi-step registration with group creation
 */
const PublicRegister: React.FC = () => {
  // Current step
  const [step, setStep] = useState(1);

  // Loading and status states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // User form data
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    email: '',
  });

  // Group form data
  const [groupData, setGroupData] = useState({
    name: '',
    description: '',
    defaultContributionAmount: 3500,
    currency: 'KES',
    interestRate: 10,
    interestRatePeriod: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    interestCalculationMethod: 'SIMPLE' as 'SIMPLE' | 'DAILY_COMPOUND' | 'MONTHLY_COMPOUND' | 'FLAT_RATE',
    financialYearStartMonth: 12,
    financialYearEndMonth: 11,
    maxLoanDurationMonths: 12,
    maxLoanMultiplier: 3,
    requireGuarantors: false,
    enablePenalties: true,
    latePenaltyRate: 5,
    maxMembers: 50,
  });

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle user data change
  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Handle group data change
  const handleGroupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setGroupData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
               type === 'number' ? parseFloat(value) || 0 : value
    }));
    setError(null);
  };

  // Validate step 1 (user details)
  const validateStep1 = (): boolean => {
    if (!userData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!userData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!userData.username.trim() || userData.username.length < 4) {
      setError('Username must be at least 4 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    if (!userData.password || userData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(userData.password)) {
      setError('Password must contain uppercase, lowercase, and a number');
      return false;
    }
    if (userData.password !== userData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!userData.phoneNumber || !/^0[17]\d{8}$/.test(userData.phoneNumber)) {
      setError('Please enter a valid Kenyan phone number (e.g., 0712345678)');
      return false;
    }
    return true;
  };

  // Validate step 2 (group details)
  const validateStep2 = (): boolean => {
    if (!groupData.name.trim()) {
      setError('Group name is required');
      return false;
    }
    if (groupData.defaultContributionAmount < 100) {
      setError('Contribution amount must be at least 100');
      return false;
    }
    if (groupData.interestRate < 0 || groupData.interestRate > 100) {
      setError('Interest rate must be between 0 and 100');
      return false;
    }
    return true;
  };

  // Handle next step
  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateStep2()) {
      return;
    }

    setSubmitting(true);

    try {
      const request: PublicRegistrationRequest = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        password: userData.password,
        phoneNumber: userData.phoneNumber,
        email: userData.email || undefined,
        createGroup: true,
        groupDetails: {
          name: groupData.name,
          description: groupData.description || undefined,
          defaultContributionAmount: groupData.defaultContributionAmount,
          currency: groupData.currency,
          interestRate: groupData.interestRate / 100, // Convert to decimal
          interestRatePeriod: groupData.interestRatePeriod,
          interestCalculationMethod: groupData.interestCalculationMethod,
          financialYearStartMonth: groupData.financialYearStartMonth,
          financialYearEndMonth: groupData.financialYearEndMonth,
          maxLoanDurationMonths: groupData.maxLoanDurationMonths,
          maxLoanMultiplier: groupData.maxLoanMultiplier,
          requireGuarantors: groupData.requireGuarantors,
          enablePenalties: groupData.enablePenalties,
          latePenaltyRate: groupData.latePenaltyRate / 100,
          maxMembers: groupData.maxMembers,
        }
      };

      await authService.registerPublic(request);
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
            Your account and group have been created. Redirecting to dashboard...
          </p>
          <Loader2 className="animate-spin text-blue-600 mx-auto" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            P
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">PesaChama</span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              1
            </div>
            <span className="text-sm font-medium hidden sm:inline">Your Details</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              2
            </div>
            <span className="text-sm font-medium hidden sm:inline">Group Settings</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: User Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User size={20} className="text-blue-600" />
                Your Details
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={userData.firstName}
                    onChange={handleUserChange}
                    placeholder="John"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={userData.lastName}
                    onChange={handleUserChange}
                    placeholder="Doe"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={userData.username}
                  onChange={handleUserChange}
                  placeholder="johndoe"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={userData.phoneNumber}
                    onChange={handleUserChange}
                    placeholder="0712345678"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email (Optional)
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleUserChange}
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={userData.password}
                    onChange={handleUserChange}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={userData.confirmPassword}
                    onChange={handleUserChange}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 mt-6"
              >
                Next: Group Settings
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {/* Step 2: Group Settings */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Building2 size={20} className="text-blue-600" />
                Group Settings
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={groupData.name}
                  onChange={handleGroupChange}
                  placeholder="My Chama Group"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={groupData.description}
                  onChange={handleGroupChange}
                  placeholder="Brief description of your group"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <DollarSign size={14} className="inline mr-1" />
                    Monthly Contribution
                  </label>
                  <input
                    type="number"
                    name="defaultContributionAmount"
                    value={groupData.defaultContributionAmount}
                    onChange={handleGroupChange}
                    min="100"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Percent size={14} className="inline mr-1" />
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    name="interestRate"
                    value={groupData.interestRate}
                    onChange={handleGroupChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Calendar size={14} className="inline mr-1" />
                    Financial Year Starts
                  </label>
                  <select
                    name="financialYearStartMonth"
                    value={groupData.financialYearStartMonth}
                    onChange={handleGroupChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition cursor-pointer"
                  >
                    {MONTH_NAMES.map((month, index) => (
                      <option key={index + 1} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Calendar size={14} className="inline mr-1" />
                    Financial Year Ends
                  </label>
                  <select
                    name="financialYearEndMonth"
                    value={groupData.financialYearEndMonth}
                    onChange={handleGroupChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition cursor-pointer"
                  >
                    {MONTH_NAMES.map((month, index) => (
                      <option key={index + 1} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Interest Rate Period
                  </label>
                  <select
                    name="interestRatePeriod"
                    value={groupData.interestRatePeriod}
                    onChange={handleGroupChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition cursor-pointer"
                  >
                    <option value="DAILY">Per Day</option>
                    <option value="WEEKLY">Per Week</option>
                    <option value="MONTHLY">Per Month</option>
                    <option value="YEARLY">Per Year (Annual)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Interest Method
                  </label>
                  <select
                    name="interestCalculationMethod"
                    value={groupData.interestCalculationMethod}
                    onChange={handleGroupChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition cursor-pointer"
                  >
                    <option value="SIMPLE">Simple Interest</option>
                    <option value="DAILY_COMPOUND">Daily Compound</option>
                    <option value="MONTHLY_COMPOUND">Monthly Compound</option>
                    <option value="FLAT_RATE">Flat Rate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Loan Duration (months)
                  </label>
                  <input
                    type="number"
                    name="maxLoanDurationMonths"
                    value={groupData.maxLoanDurationMonths}
                    onChange={handleGroupChange}
                    min="1"
                    max="60"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Members
                  </label>
                  <input
                    type="number"
                    name="maxMembers"
                    value={groupData.maxMembers}
                    onChange={handleGroupChange}
                    min="2"
                    max="500"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="requireGuarantors"
                    checked={groupData.requireGuarantors}
                    onChange={handleGroupChange}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Require loan guarantors</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="enablePenalties"
                    checked={groupData.enablePenalties}
                    onChange={handleGroupChange}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enable late penalties</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={20} />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="animate-spin" size={20} />}
                  {submitting ? 'Creating...' : 'Create Group & Account'}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <a href="/" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default PublicRegister;
