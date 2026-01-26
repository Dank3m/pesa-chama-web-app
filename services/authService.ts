/**
 * Authentication Service
 * Handles login, logout, registration, and token management
 */

import api, { TokenService, ApiResponse } from './api';

// DTOs matching backend
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  phoneNumber: string;
  groupId?: string;
}

/**
 * Public registration request - creates user and optionally a new group
 */
export interface PublicRegistrationRequest {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  phoneNumber: string;
  email?: string;
  createGroup: boolean;
  groupDetails?: CreateGroupWithSettingsRequest;
}

/**
 * Group details for registration with settings
 */
export interface CreateGroupWithSettingsRequest {
  name: string;
  description?: string;
  financialYearStartMonth?: number;
  financialYearEndMonth?: number;
  defaultContributionAmount?: number;
  currency?: string;
  allowPartialContributions?: boolean;
  interestRate?: number;
  interestRatePeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interestCalculationMethod?: 'SIMPLE' | 'DAILY_COMPOUND' | 'MONTHLY_COMPOUND' | 'FLAT_RATE';
  maxLoanDurationMonths?: number;
  gracePeriodDays?: number;
  maxLoanMultiplier?: number;
  requireGuarantors?: boolean;
  minGuarantors?: number;
  latePenaltyRate?: number;
  enablePenalties?: boolean;
  maxMembers?: number;
}

/**
 * Response from public registration with group
 */
export interface RegistrationResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
  group?: GroupResponse;
  groupSettings?: GroupSettingsResponse;
}

export interface GroupResponse {
  id: string;
  name: string;
  description?: string;
  contributionAmount: number;
  currency: string;
  interestRate: number;
  financialYearStartMonth: number;
  maxMembers: number;
  currentMemberCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface GroupSettingsResponse {
  id: string;
  groupId: string;
  groupName: string;
  financialYearStartMonth: number;
  financialYearEndMonth: number;
  defaultContributionAmount: number;
  currency: string;
  allowPartialContributions: boolean;
  interestRate: number;
  interestCalculationMethod: string;
  maxLoanDurationMonths: number;
  gracePeriodDays: number;
  maxLoanMultiplier: number;
  requireGuarantors: boolean;
  minGuarantors: number;
  latePenaltyRate: number;
  enablePenalties: boolean;
}

/**
 * Member self-registration request
 * Used when member clicks registration link to create their account
 */
export interface MemberRegistrationRequest {
  memberId: string;
  token: string;
  username: string;
  password: string;
  role: 'ADMIN' | 'TREASURER' | 'SECRETARY' | 'MEMBER';
}

/**
 * Response from validating registration token
 */
export interface MemberRegistrationInfoResponse {
  memberId: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  groupId: string;
  groupName: string;
  tokenValid: boolean;
  tokenExpiry: string;
  suggestedRole?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
  availableGroups?: GroupMembershipResponse[];
  defaultGroupId?: string;
  hasMultipleGroups?: boolean;
}

export interface GroupMembershipResponse {
  groupId: string;
  groupName: string;
  memberId: string;
  memberNumber: string;
  role: string;
  isDefault: boolean;
}

export interface UserResponse {
  id: string;
  username: string;
  role: 'ADMIN' | 'TREASURER' | 'SECRETARY' | 'MEMBER';
  member: Member | null;
}

export interface Member {
  id: string;
  groupId?: string;
  memberNumber?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  nationalId?: string;
  dateOfBirth?: string;
  address?: string;
  joinDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  isAdmin?: boolean;
  createdAt?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    
    if (response.success && response.data) {
      TokenService.setToken(response.data.accessToken);
      TokenService.setRefreshToken(response.data.refreshToken);
      TokenService.setCurrentUser(response.data.user);
    }
    
    return response.data;
  }

  /**
   * Register new user (direct registration by admin)
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);

    if (response.success && response.data) {
      TokenService.setToken(response.data.accessToken);
      TokenService.setRefreshToken(response.data.refreshToken);
      TokenService.setCurrentUser(response.data.user);
    }

    return response.data;
  }

  // ==================== PUBLIC REGISTRATION ====================

  /**
   * Public registration - create user and optionally a new banking group
   */
  async registerPublic(data: PublicRegistrationRequest): Promise<RegistrationResponse> {
    const response = await api.post<RegistrationResponse>('/auth/register/public', data);

    if (response.success && response.data) {
      TokenService.setToken(response.data.accessToken);
      TokenService.setRefreshToken(response.data.refreshToken);
      TokenService.setCurrentUser(response.data.user);
    }

    return response.data;
  }

  // ==================== MEMBER SELF-REGISTRATION ====================

  /**
   * Validate registration token and get member info
   * Called when user opens registration link
   */
  async validateRegistrationToken(memberId: string, token: string): Promise<MemberRegistrationInfoResponse> {
    const response = await api.get<MemberRegistrationInfoResponse>(
      '/auth/register/validate',
      { memberId, token }
    );
    return response.data;
  }

  /**
   * Complete member registration - create user account
   * Called when member submits the registration form
   */
  async registerMember(data: MemberRegistrationRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register/member', data);
    
    if (response.success && response.data) {
      TokenService.setToken(response.data.accessToken);
      TokenService.setRefreshToken(response.data.refreshToken);
      TokenService.setCurrentUser(response.data.user);
    }
    
    return response.data;
  }

  /**
   * Resend registration notification to member
   */
  async resendRegistrationNotification(memberId: string, channel?: 'EMAIL' | 'SMS' | 'BOTH'): Promise<void> {
    await api.post('/auth/register/resend', { memberId, channel });
  }

  // ==================== END MEMBER SELF-REGISTRATION ====================

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      TokenService.clearAll();
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserResponse> {
    const response = await api.get<UserResponse>('/auth/me');
    
    if (response.success && response.data) {
      TokenService.setCurrentUser(response.data);
    }
    
    return response.data;
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await api.post('/auth/change-password', data);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { token, newPassword });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return TokenService.isAuthenticated();
  }

  /**
   * Get cached current user
   */
  getCachedUser(): UserResponse | null {
    return TokenService.getCurrentUser<UserResponse>();
  }

  // ==================== MULTI-GROUP SUPPORT ====================

  /**
   * Get all groups the current user has access to
   */
  async getAvailableGroups(): Promise<GroupMembershipResponse[]> {
    const response = await api.get<GroupMembershipResponse[]>('/auth/groups');
    return response.data;
  }

  /**
   * Set the user's default group
   */
  async setDefaultGroup(groupId: string): Promise<void> {
    await api.put(`/auth/default-group/${groupId}`);
  }

  /**
   * Switch to a different group and get member info for that group
   */
  async switchGroup(groupId: string): Promise<Member> {
    const response = await api.get<Member>(`/auth/switch-group/${groupId}`);
    return response.data;
  }

  /**
   * Store selected group in localStorage for session persistence
   */
  setSelectedGroup(groupId: string): void {
    localStorage.setItem('selectedGroupId', groupId);
  }

  /**
   * Get the currently selected group from localStorage
   */
  getSelectedGroup(): string | null {
    return localStorage.getItem('selectedGroupId');
  }

  /**
   * Clear selected group from localStorage
   */
  clearSelectedGroup(): void {
    localStorage.removeItem('selectedGroupId');
  }

  // ==================== END MULTI-GROUP SUPPORT ====================
}

export const authService = new AuthService();
export default authService;