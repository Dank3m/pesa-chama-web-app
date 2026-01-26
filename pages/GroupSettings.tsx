import React, { useState, useEffect } from 'react';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Settings,
  DollarSign,
  Calendar,
  Percent,
  Clock,
  Shield,
  Save,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import groupSettingsService, {
  GroupSettingsResponse,
  UpdateGroupSettingsRequest,
  MONTH_NAMES,
  INTEREST_METHODS
} from '../services/groupSettingsService';

/**
 * Group Settings Page
 * Admin-only page for managing group settings
 */
const GroupSettings: React.FC = () => {
  const { user } = useAuth();
  const groupId = user?.member?.groupId;

  // State
  const [settings, setSettings] = useState<GroupSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state (matches settings but editable)
  const [formData, setFormData] = useState<UpdateGroupSettingsRequest>({});

  // Load settings on mount
  useEffect(() => {
    if (groupId) {
      loadSettings();
    }
  }, [groupId]);

  // Load settings from API
  const loadSettings = async () => {
    if (!groupId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await groupSettingsService.getSettings(groupId);
      setSettings(data);
      // Initialize form with current settings
      setFormData({
        financialYearStartMonth: data.financialYearStartMonth,
        financialYearEndMonth: data.financialYearEndMonth,
        defaultContributionAmount: data.defaultContributionAmount,
        currency: data.currency,
        allowPartialContributions: data.allowPartialContributions,
        interestRate: data.interestRate,
        interestCalculationMethod: data.interestCalculationMethod,
        maxLoanDurationMonths: data.maxLoanDurationMonths,
        gracePeriodDays: data.gracePeriodDays,
        maxLoanMultiplier: data.maxLoanMultiplier,
        requireGuarantors: data.requireGuarantors,
        minGuarantors: data.minGuarantors,
        reminderDaysBeforeDue: data.reminderDaysBeforeDue,
        latePenaltyRate: data.latePenaltyRate,
        enablePenalties: data.enablePenalties,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
               type === 'number' ? parseFloat(value) || 0 : value
    }));
    setError(null);
    setSuccess(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await groupSettingsService.updateSettings(groupId, formData);
      setSettings(updated);
      setSuccess('Settings saved successfully');
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  // No settings state
  if (!settings) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{error || 'Settings not found'}</p>
          <button
            onClick={loadSettings}
            className="mt-4 text-blue-600 hover:underline flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="text-blue-600" size={28} />
          Group Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage settings for {settings.groupName}
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
          <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-green-700 dark:text-green-400 text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Financial Year Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            Financial Year
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Month
              </label>
              <select
                name="financialYearStartMonth"
                value={formData.financialYearStartMonth}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition cursor-pointer"
              >
                {MONTH_NAMES.map((month, index) => (
                  <option key={index + 1} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Month
              </label>
              <select
                name="financialYearEndMonth"
                value={formData.financialYearEndMonth}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition cursor-pointer"
              >
                {MONTH_NAMES.map((month, index) => (
                  <option key={index + 1} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contribution Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign size={20} className="text-green-600" />
            Contributions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Amount
              </label>
              <input
                type="number"
                name="defaultContributionAmount"
                value={formData.defaultContributionAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition cursor-pointer"
              >
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer mt-6">
                <input
                  type="checkbox"
                  name="allowPartialContributions"
                  checked={formData.allowPartialContributions}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Allow partial payments</span>
              </label>
            </div>
          </div>
        </div>

        {/* Loan Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Percent size={20} className="text-purple-600" />
            Loan Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interest Rate (decimal, e.g., 0.10 = 10%)
              </label>
              <input
                type="number"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleChange}
                min="0"
                max="1"
                step="0.01"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Calculation Method
              </label>
              <select
                name="interestCalculationMethod"
                value={formData.interestCalculationMethod}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition cursor-pointer"
              >
                {Object.entries(INTEREST_METHODS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Duration (months)
              </label>
              <input
                type="number"
                name="maxLoanDurationMonths"
                value={formData.maxLoanDurationMonths}
                onChange={handleChange}
                min="1"
                max="60"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Grace Period (days)
              </label>
              <input
                type="number"
                name="gracePeriodDays"
                value={formData.gracePeriodDays}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Loan Multiplier
              </label>
              <input
                type="number"
                name="maxLoanMultiplier"
                value={formData.maxLoanMultiplier}
                onChange={handleChange}
                min="0.5"
                max="10"
                step="0.5"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer mt-4">
                <input
                  type="checkbox"
                  name="requireGuarantors"
                  checked={formData.requireGuarantors}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Require guarantors</span>
              </label>
              {formData.requireGuarantors && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Min Guarantors
                  </label>
                  <input
                    type="number"
                    name="minGuarantors"
                    value={formData.minGuarantors}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Penalty Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield size={20} className="text-red-600" />
            Penalties
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="enablePenalties"
                  checked={formData.enablePenalties}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enable late penalties</span>
              </label>
            </div>
            {formData.enablePenalties && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Late Penalty Rate (decimal)
                </label>
                <input
                  type="number"
                  name="latePenaltyRate"
                  value={formData.latePenaltyRate}
                  onChange={handleChange}
                  min="0"
                  max="1"
                  step="0.01"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reminder Days Before Due
              </label>
              <input
                type="number"
                name="reminderDaysBeforeDue"
                value={formData.reminderDaysBeforeDue}
                onChange={handleChange}
                min="1"
                max="30"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={loadSettings}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GroupSettings;
