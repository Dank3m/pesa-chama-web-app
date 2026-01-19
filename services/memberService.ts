/**
 * Member Service
 * Handles member-related API calls
 */

import api, { ApiResponse, PagedResponse } from './api';

// DTOs matching backend
export interface MemberResponse {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  nationalId?: string;
  address?: string;
  status: MemberStatus;
  role: MemberRole;
  groupId: string;
  groupName: string;
  joinDate: string;
  totalContributions: number;
  outstandingLoans: number;
  avatar?: string;
}

export interface MemberBalanceResponse {
  memberId: string;
  memberName: string;
  financialYearId: string;
  financialYear: string;
  totalContributions: number;
  totalLoans: number;
  outstandingLoanBalance: number;
  totalInterestPaid: number;
  netBalance: number;
}

export interface CreateMemberRequest {
  groupId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  nationalId?: string;
  address?: string;
  role?: MemberRole;
}

export interface UpdateMemberRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  nationalId?: string;
  address?: string;
}

export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'EXITED';
export type MemberRole = 'ADMIN' | 'TREASURER' | 'SECRETARY' | 'MEMBER';

class MemberService {
  private basePath = '/members';

  /**
   * Get all members (with optional filters)
   */
  async getMembers(params?: {
    groupId?: string;
    status?: MemberStatus;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<MemberResponse>> {
    const response = await api.get<PagedResponse<MemberResponse>>(this.basePath, params);
    return response.data;
  }

  /**
   * Get members by group
   */
  async getMembersByGroup(groupId: string): Promise<MemberResponse[]> {
    const response = await api.get<MemberResponse[]>(`${this.basePath}/group/${groupId}`);
    return response.data;
  }

  /**
   * Get active members by group
   */
  async getActiveMembersByGroup(groupId: string): Promise<MemberResponse[]> {
    const response = await api.get<MemberResponse[]>(`${this.basePath}/group/${groupId}/active`);
    return response.data;
  }

  /**
   * Get member by ID
   */
  async getMemberById(id: string): Promise<MemberResponse> {
    const response = await api.get<MemberResponse>(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Get member by member number
   */
  async getMemberByNumber(memberNumber: string): Promise<MemberResponse> {
    const response = await api.get<MemberResponse>(`${this.basePath}/number/${memberNumber}`);
    return response.data;
  }

  /**
   * Create new member
   */
  async createMember(data: CreateMemberRequest): Promise<MemberResponse> {
    const response = await api.post<MemberResponse>(this.basePath, data);
    return response.data;
  }

  /**
   * Update member
   */
  async updateMember(id: string, data: UpdateMemberRequest): Promise<MemberResponse> {
    const response = await api.put<MemberResponse>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  /**
   * Update member status
   */
  async updateMemberStatus(id: string, status: MemberStatus): Promise<MemberResponse> {
    const response = await api.patch<MemberResponse>(`${this.basePath}/${id}/status`, { status });
    return response.data;
  }

  /**
   * Update member role
   */
  async updateMemberRole(id: string, role: MemberRole): Promise<MemberResponse> {
    const response = await api.patch<MemberResponse>(`${this.basePath}/${id}/role`, { role });
    return response.data;
  }

  /**
   * Get member balance summary
   */
  async getMemberBalance(memberId: string, financialYearId?: string): Promise<MemberBalanceResponse> {
    const params = financialYearId ? { financialYearId } : undefined;
    const response = await api.get<MemberBalanceResponse>(`${this.basePath}/${memberId}/balance`, params);
    return response.data;
  }

  /**
   * Search members
   */
  async searchMembers(query: string, groupId?: string): Promise<MemberResponse[]> {
    const response = await api.get<MemberResponse[]>(`${this.basePath}/search`, { query, groupId });
    return response.data;
  }
}

export const memberService = new MemberService();
export default memberService;
