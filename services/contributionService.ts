/**
 * Contribution Service
 * Handles contribution-related API calls
 */

import api, { ApiResponse, PagedResponse } from './api';

// DTOs matching backend
export interface ContributionResponse {
  id: string;
  memberId: string;
  memberName: string;
  memberNumber: string;
  cycleId: string;
  cycleMonth: string;
  expectedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: ContributionStatus;
  paymentDate?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface ContributionCycleResponse {
  id: string;
  financialYearId: string;
  financialYear: string;
  cycleMonth: string;
  dueDate: string;
  expectedAmount: number;
  totalCollected: number;
  status: CycleStatus;
  totalMembers: number;
  paidCount: number;
  partialCount: number;
  pendingCount: number;
  collectionRate: number;
}

export interface RecordContributionRequest {
  memberId: string;
  cycleId: string;
  amount: number;
  referenceNumber?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface RecordAdvanceContributionRequest {
  memberId: string;
  financialYearId: string;
  amount: number;
  monthsAhead: number;
  referenceNumber?: string;
  paymentMethod?: PaymentMethod;
}

export interface AdvancePaymentStatusResponse {
  memberId: string;
  memberName: string;
  financialYearId: string;
  monthsPaidAhead: number;
  totalPaidAhead: number;
  lastPaidMonth: string;
  contributions: ContributionResponse[];
}

export interface ContributionSummaryResponse {
  totalExpected: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  paidCount: number;
  partialCount: number;
  pendingCount: number;
  defaultedCount: number;
}

export type ContributionStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'DEFAULTED' | 'WAIVED';
export type CycleStatus = 'OPEN' | 'CLOSED' | 'PROCESSING';
export type PaymentMethod = 'MPESA' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE';

class ContributionService {
  private basePath = '/contributions';

  /**
   * Get contributions by cycle
   */
  async getContributionsByCycle(cycleId: string): Promise<ContributionResponse[]> {
    const response = await api.get<ContributionResponse[]>(`${this.basePath}/cycle/${cycleId}`);
    return response.data;
  }

  /**
   * Get contributions by member
   */
  async getContributionsByMember(memberId: string): Promise<ContributionResponse[]> {
    const response = await api.get<ContributionResponse[]>(`${this.basePath}/member/${memberId}`);
    return response.data;
  }

  /**
   * Get contributions by member for a specific year
   */
  async getContributionsByMemberForYear(memberId: string, financialYearId: string): Promise<ContributionResponse[]> {
    const response = await api.get<ContributionResponse[]>(
      `${this.basePath}/member/${memberId}/year/${financialYearId}`
    );
    return response.data;
  }

  /**
   * Get contribution by ID
   */
  async getContributionById(id: string): Promise<ContributionResponse> {
    const response = await api.get<ContributionResponse>(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Record a contribution payment
   */
  async recordContribution(data: RecordContributionRequest): Promise<ContributionResponse> {
    const response = await api.post<ContributionResponse>(`${this.basePath}/record`, data);
    return response.data;
  }

  /**
   * Record advance contribution (multiple months)
   */
  async recordAdvanceContribution(data: RecordAdvanceContributionRequest): Promise<ContributionResponse[]> {
    const response = await api.post<ContributionResponse[]>(`${this.basePath}/record-advance`, data);
    return response.data;
  }

  /**
   * Get advance payment status for a member
   */
  async getAdvancePaymentStatus(memberId: string, financialYearId: string): Promise<AdvancePaymentStatusResponse> {
    const response = await api.get<AdvancePaymentStatusResponse>(
      `${this.basePath}/member/${memberId}/advance-status`,
      { financialYearId }
    );
    return response.data;
  }

  /**
   * Get pending contributions for a cycle
   */
  async getPendingContributions(cycleId: string): Promise<ContributionResponse[]> {
    const response = await api.get<ContributionResponse[]>(`${this.basePath}/cycle/${cycleId}/pending`);
    return response.data;
  }

  /**
   * Get contribution summary for a cycle
   */
  async getCycleSummary(cycleId: string): Promise<ContributionSummaryResponse> {
    const response = await api.get<ContributionSummaryResponse>(`${this.basePath}/cycle/${cycleId}/summary`);
    return response.data;
  }

  // --- Contribution Cycles ---

  /**
   * Get all cycles for a financial year
   */
  async getCyclesByYear(financialYearId: string): Promise<ContributionCycleResponse[]> {
    const response = await api.get<ContributionCycleResponse[]>(`${this.basePath}/cycles/year/${financialYearId}`);
    return response.data;
  }

  /**
   * Get current cycle for a group
   */
  async getCurrentCycle(groupId: string): Promise<ContributionCycleResponse> {
    const response = await api.get<ContributionCycleResponse>(`${this.basePath}/cycles/current`, { groupId });
    return response.data;
  }

  /**
   * Get cycle by ID
   */
  async getCycleById(cycleId: string): Promise<ContributionCycleResponse> {
    const response = await api.get<ContributionCycleResponse>(`${this.basePath}/cycles/${cycleId}`);
    return response.data;
  }

  /**
   * Create new contribution cycle
   */
  async createCycle(financialYearId: string, cycleMonth: string): Promise<ContributionCycleResponse> {
    const response = await api.post<ContributionCycleResponse>(`${this.basePath}/cycles`, {
      financialYearId,
      cycleMonth,
    });
    return response.data;
  }

  /**
   * Process defaulted contributions (convert to loans)
   */
  async processDefaults(cycleId: string): Promise<number> {
    const response = await api.post<number>(`${this.basePath}/cycles/${cycleId}/process-defaults`);
    return response.data;
  }

  /**
   * Close a contribution cycle
   */
  async closeCycle(cycleId: string): Promise<ContributionCycleResponse> {
    const response = await api.post<ContributionCycleResponse>(`${this.basePath}/cycles/${cycleId}/close`);
    return response.data;
  }

  /**
   * Export contributions to CSV
   */
  async exportToCsv(cycleId: string): Promise<Blob> {
    const response = await fetch(`/api/v1${this.basePath}/cycle/${cycleId}/export`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    return response.blob();
  }
}

export const contributionService = new ContributionService();
export default contributionService;
