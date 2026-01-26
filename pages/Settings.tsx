import React, { useState, useEffect } from 'react';
import { Edit2, Bell, Shield, Loader2, CheckCircle, XCircle, Settings2, Calendar, DollarSign, Clock, AlertTriangle, Building2, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  settingsService,
  ProfileResponse,
  UserSettingsResponse,
  SecuritySettingsResponse,
  groupSettingsService,
  GroupSettingsResponse,
  UpdateGroupSettingsRequest,
  MONTH_NAMES,
  INTEREST_METHODS,
  INTEREST_RATE_PERIODS,
  CONTRIBUTION_CHECK_SCHEDULES,
  INTEREST_ACCRUAL_SCHEDULES,
  OVERDUE_CHECK_SCHEDULES,
  authService
} from '../services';

// Notification component for feedback
const Notification: React.FC<{ type: 'success' | 'error'; message: string; onClose: () => void }> = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white animate-in slide-in-from-top duration-300`}>
      {type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-75">&times;</button>
    </div>
  );
};

const Settings: React.FC = () => {
  const { user, availableGroups, hasMultipleGroups } = useAuth();
  const [activeTab, setActiveTab] = useState<'edit-profile' | 'preferences' | 'security' | 'group-settings'>('edit-profile');
  const [isSavingDefaultGroup, setIsSavingDefaultGroup] = useState(false);

  // Check if user can edit group settings (ADMIN or SECRETARY)
  const canEditGroupSettings = user?.role === 'ADMIN' || user?.role === 'SECRETARY' || user?.role === 'SUPER_ADMIN';

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Profile state
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: ''
  });

  // Preferences state
  const [preferences, setPreferences] = useState<UserSettingsResponse | null>(null);
  const [preferencesForm, setPreferencesForm] = useState({
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    notifyDigitalPayment: true,
    notifyRecommendations: true
  });

  // Security state
  const [securitySettings, setSecuritySettings] = useState<SecuritySettingsResponse | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Group Settings state
  const [groupSettings, setGroupSettings] = useState<GroupSettingsResponse | null>(null);
  const [groupSettingsForm, setGroupSettingsForm] = useState<UpdateGroupSettingsRequest>({});
  const [isLoadingGroupSettings, setIsLoadingGroupSettings] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [profileData, prefsData, securityData] = await Promise.all([
          settingsService.getProfile(),
          settingsService.getPreferences(),
          settingsService.getSecuritySettings()
        ]);

        setProfile(profileData);
        setProfileForm({
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          email: profileData.email || '',
          phoneNumber: profileData.phoneNumber || '',
          dateOfBirth: profileData.dateOfBirth || '',
          address: profileData.address || ''
        });

        setPreferences(prefsData);
        setPreferencesForm({
          currency: prefsData.currency,
          timezone: prefsData.timezone,
          notifyDigitalPayment: prefsData.notifyDigitalPayment,
          notifyRecommendations: prefsData.notifyRecommendations
        });

        setSecuritySettings(securityData);
        setTwoFactorEnabled(securityData.twoFactorEnabled);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load settings';
        setNotification({ type: 'error', message: errorMessage });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch group settings when tab is selected
  useEffect(() => {
    const fetchGroupSettings = async () => {
      if (activeTab !== 'group-settings' || !user?.member?.groupId) return;

      setIsLoadingGroupSettings(true);
      try {
        const settings = await groupSettingsService.getSettings(user.member.groupId);
        setGroupSettings(settings);
        setGroupSettingsForm({
          financialYearStartMonth: settings.financialYearStartMonth,
          financialYearEndMonth: settings.financialYearEndMonth,
          defaultContributionAmount: settings.defaultContributionAmount,
          currency: settings.currency,
          allowPartialContributions: settings.allowPartialContributions,
          interestRate: settings.interestRate,
          interestRatePeriod: settings.interestRatePeriod,
          interestCalculationMethod: settings.interestCalculationMethod,
          maxLoanDurationMonths: settings.maxLoanDurationMonths,
          gracePeriodDays: settings.gracePeriodDays,
          maxLoanMultiplier: settings.maxLoanMultiplier,
          requireGuarantors: settings.requireGuarantors,
          minGuarantors: settings.minGuarantors,
          contributionCheckCron: settings.contributionCheckCron,
          interestAccrualCron: settings.interestAccrualCron,
          overdueCheckCron: settings.overdueCheckCron,
          reminderDaysBeforeDue: settings.reminderDaysBeforeDue,
          latePenaltyRate: settings.latePenaltyRate,
          enablePenalties: settings.enablePenalties,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load group settings';
        setNotification({ type: 'error', message: errorMessage });
      } finally {
        setIsLoadingGroupSettings(false);
      }
    };

    fetchGroupSettings();
  }, [activeTab, user?.member?.groupId]);

  // Save handlers
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updated = await settingsService.updateProfile(profileForm);
      setProfile(updated);
      setNotification({ type: 'success', message: 'Profile updated successfully' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setNotification({ type: 'error', message: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      const updated = await settingsService.updatePreferences(preferencesForm);
      setPreferences(updated);
      setNotification({ type: 'success', message: 'Preferences saved successfully' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save preferences';
      setNotification({ type: 'error', message: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGroupSettings = async () => {
    if (!user?.member?.groupId || !canEditGroupSettings) return;

    setIsSaving(true);
    try {
      const updated = await groupSettingsService.updateSettings(user.member.groupId, groupSettingsForm);
      setGroupSettings(updated);
      setNotification({ type: 'success', message: 'Group settings saved successfully' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save group settings';
      setNotification({ type: 'error', message: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setNotification({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setNotification({ type: 'error', message: 'Password must be at least 8 characters' });
      return;
    }

    setIsSaving(true);
    try {
      await settingsService.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setNotification({ type: 'success', message: 'Password changed successfully' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      setNotification({ type: 'error', message: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      let password: string | undefined;
      if (!enabled) {
        password = window.prompt('Enter your password to disable 2FA') || undefined;
        if (!password) {
          setIsSaving(false);
          return;
        }
      }

      const updated = await settingsService.toggle2FA({ enabled, password });
      setTwoFactorEnabled(updated.twoFactorEnabled);
      setNotification({ type: 'success', message: enabled ? '2FA enabled' : '2FA disabled' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update 2FA';
      setNotification({ type: 'error', message: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefaultGroup = async (groupId: string) => {
    setIsSavingDefaultGroup(true);
    try {
      await authService.setDefaultGroup(groupId);
      setNotification({ type: 'success', message: 'Default group updated successfully' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set default group';
      setNotification({ type: 'error', message: errorMessage });
    } finally {
      setIsSavingDefaultGroup(false);
    }
  };

  // Get current default group
  const defaultGroup = availableGroups.find(g => g.isDefault);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm min-h-[600px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-3xl shadow-sm min-h-[600px] transition-colors">
      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Tabs Navigation */}
      <div className="flex gap-8 border-b border-gray-100 dark:border-gray-700 mb-8 overflow-x-auto no-scrollbar">
         <button
           onClick={() => setActiveTab('edit-profile')}
           className={`pb-3 px-2 font-medium whitespace-nowrap transition-colors relative ${activeTab === 'edit-profile' ? 'text-primary' : 'text-subtext dark:text-gray-400 hover:text-dark dark:hover:text-white'}`}
         >
           Edit Profile
           {activeTab === 'edit-profile' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-lg"></div>}
         </button>
         <button
           onClick={() => setActiveTab('preferences')}
           className={`pb-3 px-2 font-medium whitespace-nowrap transition-colors relative ${activeTab === 'preferences' ? 'text-primary' : 'text-subtext dark:text-gray-400 hover:text-dark dark:hover:text-white'}`}
         >
           Preferences
           {activeTab === 'preferences' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-lg"></div>}
         </button>
         <button
           onClick={() => setActiveTab('security')}
           className={`pb-3 px-2 font-medium whitespace-nowrap transition-colors relative ${activeTab === 'security' ? 'text-primary' : 'text-subtext dark:text-gray-400 hover:text-dark dark:hover:text-white'}`}
         >
           Security
           {activeTab === 'security' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-lg"></div>}
         </button>
         <button
           onClick={() => setActiveTab('group-settings')}
           className={`pb-3 px-2 font-medium whitespace-nowrap transition-colors relative ${activeTab === 'group-settings' ? 'text-primary' : 'text-subtext dark:text-gray-400 hover:text-dark dark:hover:text-white'}`}
         >
           Group
           {activeTab === 'group-settings' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-lg"></div>}
         </button>
      </div>

      {/* Edit Profile Tab */}
      {activeTab === 'edit-profile' && (
        <div className="flex flex-col md:flex-row gap-8 animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4">
             <div className="relative">
               <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-bold">
                 {profile?.firstName?.charAt(0) || 'U'}{profile?.lastName?.charAt(0) || ''}
               </div>
               <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white hover:bg-blue-700 transition">
                 <Edit2 size={14} />
               </button>
             </div>
             <div className="text-center">
               <p className="font-medium text-dark dark:text-white">{profile?.fullName}</p>
               <p className="text-sm text-subtext dark:text-gray-400">{profile?.memberNumber}</p>
             </div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-subtext dark:text-gray-400 text-sm">First Name</label>
               <input
                 type="text"
                 value={profileForm.firstName}
                 onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                 className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors"
               />
             </div>
             <div className="space-y-2">
               <label className="text-subtext dark:text-gray-400 text-sm">Last Name</label>
               <input
                 type="text"
                 value={profileForm.lastName}
                 onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                 className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors"
               />
             </div>
             <div className="space-y-2">
               <label className="text-subtext dark:text-gray-400 text-sm">Email</label>
               <input
                 type="email"
                 value={profileForm.email}
                 onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                 className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors"
               />
             </div>
             <div className="space-y-2">
               <label className="text-subtext dark:text-gray-400 text-sm">Phone Number</label>
               <input
                 type="text"
                 value={profileForm.phoneNumber}
                 onChange={(e) => setProfileForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                 className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors"
               />
             </div>
             <div className="space-y-2">
               <label className="text-subtext dark:text-gray-400 text-sm">Date of Birth</label>
               <input
                 type="date"
                 value={profileForm.dateOfBirth}
                 onChange={(e) => setProfileForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                 className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors"
               />
             </div>
             <div className="space-y-2">
               <label className="text-subtext dark:text-gray-400 text-sm">Address</label>
               <input
                 type="text"
                 value={profileForm.address}
                 onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                 className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors"
               />
             </div>
             <div className="space-y-2">
               <label className="text-subtext dark:text-gray-400 text-sm">Group</label>
               <input
                 type="text"
                 value={profile?.groupName || ''}
                 disabled
                 className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-subtext dark:text-gray-400 outline-none cursor-not-allowed"
               />
             </div>

             <div className="md:col-span-2 flex justify-end mt-4">
               <button
                 onClick={handleSaveProfile}
                 disabled={isSaving}
                 className="bg-primary text-white px-12 py-3 rounded-2xl font-medium hover:bg-blue-700 transition w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                 {isSaving && <Loader2 size={18} className="animate-spin" />}
                 Save
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="max-w-3xl animate-in fade-in duration-300 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <label className="text-subtext dark:text-gray-400 text-sm">Currency</label>
               <select
                 value={preferencesForm.currency}
                 onChange={(e) => setPreferencesForm(prev => ({ ...prev, currency: e.target.value }))}
                 className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors"
               >
                 <option value="KES">KES - Kenyan Shilling</option>
                 <option value="USD">USD - US Dollar</option>
                 <option value="EUR">EUR - Euro</option>
                 <option value="GBP">GBP - British Pound</option>
               </select>
             </div>
             <div className="space-y-2">
               <label className="text-subtext dark:text-gray-400 text-sm">Time Zone</label>
               <select
                 value={preferencesForm.timezone}
                 onChange={(e) => setPreferencesForm(prev => ({ ...prev, timezone: e.target.value }))}
                 className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors"
               >
                 <option value="Africa/Nairobi">(GMT+03:00) Nairobi</option>
                 <option value="Africa/Lagos">(GMT+01:00) Lagos</option>
                 <option value="Africa/Cairo">(GMT+02:00) Cairo</option>
                 <option value="Europe/London">(GMT+00:00) London</option>
                 <option value="America/New_York">(GMT-05:00) New York</option>
               </select>
             </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-bold text-dark dark:text-white mb-4">Notification Settings</h4>

            <div className="space-y-4">
              {/* Digital Currency Notification Toggle */}
              <div className="flex items-center justify-between">
                 <div className="flex items-start gap-3">
                   <div className="mt-1"><Bell size={20} className="text-primary" /></div>
                   <div>
                     <p className="font-medium text-dark dark:text-white text-base">Digital Currency Notification</p>
                     <p className="text-subtext dark:text-gray-400 text-xs">Receive notification for every transaction</p>
                   </div>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferencesForm.notifyDigitalPayment}
                    onChange={() => setPreferencesForm(prev => ({ ...prev, notifyDigitalPayment: !prev.notifyDigitalPayment }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Recommendations Notification Toggle */}
              <div className="flex items-center justify-between">
                 <div className="flex items-start gap-3">
                   <div className="mt-1"><Bell size={20} className="text-primary" /></div>
                   <div>
                     <p className="font-medium text-dark dark:text-white text-base">Recommendations Notification</p>
                     <p className="text-subtext dark:text-gray-400 text-xs">Receive recommendations from our platform</p>
                   </div>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferencesForm.notifyRecommendations}
                    onChange={() => setPreferencesForm(prev => ({ ...prev, notifyRecommendations: !prev.notifyRecommendations }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Default Group Setting - Only show for multi-group users */}
          {hasMultipleGroups && availableGroups.length > 1 && (
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Building2 size={20} className="text-primary" />
                <h4 className="text-lg font-bold text-dark dark:text-white">Default Group</h4>
              </div>
              <p className="text-sm text-subtext dark:text-gray-400">
                Choose which group to show by default when you log in. You belong to {availableGroups.length} groups.
              </p>
              <div className="space-y-3">
                {availableGroups.map((group) => (
                  <button
                    key={group.groupId}
                    onClick={() => handleSetDefaultGroup(group.groupId)}
                    disabled={isSavingDefaultGroup || group.isDefault}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between ${
                      group.isDefault
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                    } ${isSavingDefaultGroup ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-dark dark:text-white">
                          {group.groupName}
                        </span>
                        {group.isDefault && (
                          <span className="flex items-center gap-1 text-xs text-primary">
                            <Star size={12} className="fill-current" />
                            Current Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-subtext dark:text-gray-400">
                          {group.memberNumber}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {group.role}
                        </span>
                      </div>
                    </div>
                    {!group.isDefault && (
                      <span className="text-sm text-primary font-medium">
                        {isSavingDefaultGroup ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          'Set as Default'
                        )}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-8">
             <button
               onClick={handleSavePreferences}
               disabled={isSaving}
               className="bg-primary text-white px-12 py-3 rounded-2xl font-medium hover:bg-blue-700 transition w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
             >
               {isSaving && <Loader2 size={18} className="animate-spin" />}
               Save Preferences
             </button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="max-w-2xl animate-in fade-in duration-300 space-y-8">
           <div className="space-y-4">
             <h4 className="text-lg font-bold text-dark dark:text-white">Change Password</h4>
             <div className="space-y-3">
               <div>
                 <label className="text-subtext dark:text-gray-400 text-sm mb-1 block">Current Password</label>
                 <input
                   type="password"
                   placeholder="Enter current password"
                   value={passwordForm.currentPassword}
                   onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                   className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors"
                 />
               </div>
               <div>
                 <label className="text-subtext dark:text-gray-400 text-sm mb-1 block">New Password</label>
                 <input
                   type="password"
                   placeholder="Enter new password"
                   value={passwordForm.newPassword}
                   onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                   className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors"
                 />
               </div>
               <div>
                 <label className="text-subtext dark:text-gray-400 text-sm mb-1 block">Confirm Password</label>
                 <input
                   type="password"
                   placeholder="Confirm new password"
                   value={passwordForm.confirmPassword}
                   onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                   className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors"
                 />
               </div>
               <div className="flex justify-end">
                 <button
                   onClick={handleChangePassword}
                   disabled={isSaving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                   className="bg-primary text-white px-8 py-2 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                 >
                   {isSaving && <Loader2 size={16} className="animate-spin" />}
                   Change Password
                 </button>
               </div>
             </div>
           </div>

           <div className="space-y-4 pt-4">
             <h4 className="text-lg font-bold text-dark dark:text-white">Two-Factor Authentication</h4>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-full ${twoFactorEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                      <Shield size={20}/>
                   </div>
                   <div>
                     <p className="font-medium text-dark dark:text-white">Enable 2FA</p>
                     <p className="text-xs text-subtext dark:text-gray-400">
                       {twoFactorEnabled ? '2FA is currently enabled' : 'Secure your account with 2FA'}
                     </p>
                   </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={twoFactorEnabled}
                    onChange={() => handleToggle2FA(!twoFactorEnabled)}
                    disabled={isSaving}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                </label>
             </div>
           </div>
        </div>
      )}

      {/* Group Settings Tab */}
      {activeTab === 'group-settings' && (
        <div className="animate-in fade-in duration-300">
          {isLoadingGroupSettings ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !groupSettings ? (
            <div className="text-center py-12 text-subtext dark:text-gray-400">
              <Settings2 size={48} className="mx-auto mb-4 opacity-50" />
              <p>No group settings found. Please contact your administrator.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Read-only notice for members */}
              {!canEditGroupSettings && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
                  <p className="text-amber-700 dark:text-amber-300 text-sm">
                    You can view group settings but only Admins and Secretaries can make changes.
                  </p>
                </div>
              )}

              {/* Group Info Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Settings2 size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-dark dark:text-white">{groupSettings.groupName}</h3>
                  <p className="text-sm text-subtext dark:text-gray-400">Group Configuration Settings</p>
                </div>
              </div>

              {/* Financial Year Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-primary" />
                  <h4 className="text-lg font-bold text-dark dark:text-white">Financial Year</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-subtext dark:text-gray-400 text-sm">Start Month</label>
                    <select
                      value={groupSettingsForm.financialYearStartMonth || 1}
                      onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, financialYearStartMonth: parseInt(e.target.value) }))}
                      disabled={!canEditGroupSettings}
                      className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {MONTH_NAMES.map((month, idx) => (
                        <option key={idx} value={idx + 1}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-subtext dark:text-gray-400 text-sm">End Month</label>
                    <select
                      value={groupSettingsForm.financialYearEndMonth || 12}
                      onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, financialYearEndMonth: parseInt(e.target.value) }))}
                      disabled={!canEditGroupSettings}
                      className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {MONTH_NAMES.map((month, idx) => (
                        <option key={idx} value={idx + 1}>{month}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Contribution Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign size={20} className="text-primary" />
                  <h4 className="text-lg font-bold text-dark dark:text-white">Contribution Settings</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-subtext dark:text-gray-400 text-sm">Default Amount</label>
                    <input
                      type="number"
                      value={groupSettingsForm.defaultContributionAmount || 0}
                      onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, defaultContributionAmount: parseFloat(e.target.value) }))}
                      disabled={!canEditGroupSettings}
                      className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-subtext dark:text-gray-400 text-sm">Currency</label>
                    <select
                      value={groupSettingsForm.currency || 'KES'}
                      onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, currency: e.target.value }))}
                      disabled={!canEditGroupSettings}
                      className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="KES">KES - Kenyan Shilling</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-subtext dark:text-gray-400 text-sm">Allow Partial Contributions</label>
                    <div className="flex items-center h-[56px]">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={groupSettingsForm.allowPartialContributions || false}
                          onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, allowPartialContributions: e.target.checked }))}
                          disabled={!canEditGroupSettings}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                        <span className="ml-3 text-sm text-dark dark:text-white">
                          {groupSettingsForm.allowPartialContributions ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign size={20} className="text-primary" />
                  <h4 className="text-lg font-bold text-dark dark:text-white">Loan Settings</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-subtext dark:text-gray-400 text-sm">Interest Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={((groupSettingsForm.interestRate || 0) * 100).toFixed(2)}
                      onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, interestRate: parseFloat(e.target.value) / 100 }))}
                      disabled={!canEditGroupSettings}
                      className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-subtext dark:text-gray-400 text-sm">Interest Rate Period</label>
                    <select
                      value={groupSettingsForm.interestRatePeriod || 'MONTHLY'}
                      onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, interestRatePeriod: e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' }))}
                      disabled={!canEditGroupSettings}
                      className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {Object.entries(INTEREST_RATE_PERIODS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-subtext dark:text-gray-400 text-sm">Interest Calculation Method</label>
                    <select
                      value={groupSettingsForm.interestCalculationMethod || 'SIMPLE'}
                      onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, interestCalculationMethod: e.target.value as 'SIMPLE' | 'DAILY_COMPOUND' | 'MONTHLY_COMPOUND' | 'FLAT_RATE' }))}
                      disabled={!canEditGroupSettings}
                      className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {Object.entries(INTEREST_METHODS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-subtext dark:text-gray-400 text-sm">Max Loan Duration (months)</label>
                    <input
                      type="number"
                      value={groupSettingsForm.maxLoanDurationMonths || 12}
                      onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, maxLoanDurationMonths: parseInt(e.target.value) }))}
                      disabled={!canEditGroupSettings}
                      className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-subtext dark:text-gray-400 text-sm">Grace Period (days)</label>
                    <input
                      type="number"
                      value={groupSettingsForm.gracePeriodDays || 0}
                      onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, gracePeriodDays: parseInt(e.target.value) }))}
                      disabled={!canEditGroupSettings}
                      className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-subtext dark:text-gray-400 text-sm">Max Loan Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={groupSettingsForm.maxLoanMultiplier || 3}
                      onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, maxLoanMultiplier: parseFloat(e.target.value) }))}
                      disabled={!canEditGroupSettings}
                      className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-subtext dark:text-gray-500">Times the member's total contributions</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-subtext dark:text-gray-400 text-sm">Require Guarantors</label>
                    <div className="flex items-center h-[56px]">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={groupSettingsForm.requireGuarantors || false}
                          onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, requireGuarantors: e.target.checked }))}
                          disabled={!canEditGroupSettings}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                        <span className="ml-3 text-sm text-dark dark:text-white">
                          {groupSettingsForm.requireGuarantors ? 'Required' : 'Not Required'}
                        </span>
                      </label>
                    </div>
                  </div>
                  {groupSettingsForm.requireGuarantors && (
                    <div className="space-y-2">
                      <label className="text-subtext dark:text-gray-400 text-sm">Minimum Guarantors</label>
                      <input
                        type="number"
                        min="1"
                        value={groupSettingsForm.minGuarantors || 1}
                        onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, minGuarantors: parseInt(e.target.value) }))}
                        disabled={!canEditGroupSettings}
                        className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Scheduler Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-primary" />
                  <h4 className="text-lg font-bold text-dark dark:text-white">Scheduler Settings</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-subtext dark:text-gray-400 text-sm">Contribution Check Schedule</label>
                    <select
                      value={groupSettingsForm.contributionCheckCron || '0 0 0 * * ?'}
                      onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, contributionCheckCron: e.target.value }))}
                      disabled={!canEditGroupSettings}
                      className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {CONTRIBUTION_CHECK_SCHEDULES.map((schedule) => (
                        <option key={schedule.cron} value={schedule.cron}>{schedule.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-subtext dark:text-gray-500">
                      {groupSettingsService.getCronDescription(groupSettingsForm.contributionCheckCron || '', 'contribution')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-subtext dark:text-gray-400 text-sm">Interest Accrual Schedule</label>
                    <select
                      value={groupSettingsForm.interestAccrualCron || '0 0 0 * * ?'}
                      onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, interestAccrualCron: e.target.value }))}
                      disabled={!canEditGroupSettings}
                      className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {INTEREST_ACCRUAL_SCHEDULES.map((schedule) => (
                        <option key={schedule.cron} value={schedule.cron}>{schedule.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-subtext dark:text-gray-500">
                      {groupSettingsService.getCronDescription(groupSettingsForm.interestAccrualCron || '', 'interest')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-subtext dark:text-gray-400 text-sm">Overdue Check Schedule</label>
                    <select
                      value={groupSettingsForm.overdueCheckCron || '0 0 8 * * ?'}
                      onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, overdueCheckCron: e.target.value }))}
                      disabled={!canEditGroupSettings}
                      className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {OVERDUE_CHECK_SCHEDULES.map((schedule) => (
                        <option key={schedule.cron} value={schedule.cron}>{schedule.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-subtext dark:text-gray-500">
                      {groupSettingsService.getCronDescription(groupSettingsForm.overdueCheckCron || '', 'overdue')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-subtext dark:text-gray-400 text-sm">Reminder Days Before Due</label>
                    <input
                      type="number"
                      min="0"
                      value={groupSettingsForm.reminderDaysBeforeDue || 3}
                      onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, reminderDaysBeforeDue: parseInt(e.target.value) }))}
                      disabled={!canEditGroupSettings}
                      className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-subtext dark:text-gray-500">Days before due date to send reminders</p>
                  </div>
                </div>
              </div>

              {/* Penalty Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={20} className="text-primary" />
                  <h4 className="text-lg font-bold text-dark dark:text-white">Penalty Settings</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-subtext dark:text-gray-400 text-sm">Enable Penalties</label>
                    <div className="flex items-center h-[56px]">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={groupSettingsForm.enablePenalties || false}
                          onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, enablePenalties: e.target.checked }))}
                          disabled={!canEditGroupSettings}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                        <span className="ml-3 text-sm text-dark dark:text-white">
                          {groupSettingsForm.enablePenalties ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </div>
                  </div>
                  {groupSettingsForm.enablePenalties && (
                    <div className="space-y-2">
                      <label className="text-subtext dark:text-gray-400 text-sm">Late Penalty Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={((groupSettingsForm.latePenaltyRate || 0) * 100).toFixed(2)}
                        onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, latePenaltyRate: parseFloat(e.target.value) / 100 }))}
                        disabled={!canEditGroupSettings}
                        className="w-full p-4 rounded-2xl bg-bgLight dark:bg-gray-700 border border-transparent text-dark dark:text-white outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      <p className="text-xs text-subtext dark:text-gray-500">Applied to late loan repayments</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              {canEditGroupSettings && (
                <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={handleSaveGroupSettings}
                    disabled={isSaving}
                    className="bg-primary text-white px-12 py-3 rounded-2xl font-medium hover:bg-blue-700 transition w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving && <Loader2 size={18} className="animate-spin" />}
                    Save Group Settings
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
