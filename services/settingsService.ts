/**
 * Settings Service
 * Handles settings-related API calls for profile, preferences, and security
 */

import api, { ApiResponse } from './api';

// ==================== TYPES ====================

export interface ProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  dateOfBirth?: string;
  memberNumber: string;
  groupId: string;
  groupName: string;
  preferredDisbursementChannel?: string;
  bankAccountNumber?: string;
  bankCode?: string;
  bankName?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  preferredDisbursementChannel?: string;
  bankAccountNumber?: string;
  bankCode?: string;
  bankName?: string;
}

export interface UserSettingsResponse {
  id: string;
  currency: string;
  timezone: string;
  notifyDigitalPayment: boolean;
  notifyRecommendations: boolean;
}

export interface UpdateUserSettingsRequest {
  currency?: string;
  timezone?: string;
  notifyDigitalPayment?: boolean;
  notifyRecommendations?: boolean;
}

export interface SecuritySettingsResponse {
  twoFactorEnabled: boolean;
  lastLogin?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface Toggle2FARequest {
  enabled: boolean;
  password?: string;
}

// ==================== SERVICE ====================

class SettingsService {
  private basePath = '/settings';

  // ==================== PROFILE ====================

  /**
   * Get current user's profile
   * @param groupId - Optional group ID for multi-group users to get the correct member profile
   */
  async getProfile(groupId?: string): Promise<ProfileResponse> {
    const params = groupId ? { groupId } : undefined;
    const response = await api.get<ProfileResponse>(`${this.basePath}/profile`, params);
    return response.data;
  }

  /**
   * Update current user's profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<ProfileResponse> {
    const response = await api.put<ProfileResponse>(`${this.basePath}/profile`, data);
    return response.data;
  }

  // ==================== PREFERENCES ====================

  /**
   * Get user preferences/settings
   */
  async getPreferences(): Promise<UserSettingsResponse> {
    const response = await api.get<UserSettingsResponse>(`${this.basePath}/preferences`);
    return response.data;
  }

  /**
   * Update user preferences/settings
   */
  async updatePreferences(data: UpdateUserSettingsRequest): Promise<UserSettingsResponse> {
    const response = await api.put<UserSettingsResponse>(`${this.basePath}/preferences`, data);
    return response.data;
  }

  // ==================== SECURITY ====================

  /**
   * Get security settings
   */
  async getSecuritySettings(): Promise<SecuritySettingsResponse> {
    const response = await api.get<SecuritySettingsResponse>(`${this.basePath}/security`);
    return response.data;
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await api.post(`${this.basePath}/security/change-password`, data);
  }

  /**
   * Toggle two-factor authentication
   */
  async toggle2FA(data: Toggle2FARequest): Promise<SecuritySettingsResponse> {
    const response = await api.put<SecuritySettingsResponse>(`${this.basePath}/security/2fa`, data);
    return response.data;
  }
}

export const settingsService = new SettingsService();
export default settingsService;
