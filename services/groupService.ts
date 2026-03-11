/**
 * Group and Financial Year Service
 * Handles banking group and financial year API calls
 */

import api, { ApiResponse } from './api';

// Group DTOs
export interface BankingGroupResponse {
  id: string;
  name: string;
  description?: string;
  contributionAmount: number;
  interestRate: number;
  currency: string;
  financialYearStartMonth: number;
  financialYearStartDay: number;
  isActive: boolean;
  memberCount: number;
  totalContributions: number;
  totalLoansDisbursted: number;
  currentFinancialYearId?: string;
  currentFinancialYear?: string;
  createdAt: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  contributionAmount: number;
  interestRate?: number;
  currency?: string;
  financialYearStartMonth?: number;
  financialYearStartDay?: number;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  contributionAmount?: number;
  interestRate?: number;
}

// Financial Year DTOs
export interface FinancialYearResponse {
  id: string;
  groupId: string;
  groupName: string;
  yearName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isClosed: boolean;
  totalContributions: number;
  totalLoansDisbursted: number;
  totalInterestEarned: number;
  totalExpenses: number;
  netIncome: number;
  createdAt: string;
}

export interface CreateFinancialYearRequest {
  groupId: string;
  startDate: string;
}

export interface FinancialYearSummaryResponse {
  financialYearId: string;
  yearName: string;
  totalMembers: number;
  activeMembers: number;
  totalContributions: number;
  totalLoansDisbursted: number;
  totalLoansRepaid: number;
  outstandingLoans: number;
  totalInterestEarned: number;
  totalExpenses: number;
  netIncome: number;
  collectionRate: number;
  loanRepaymentRate: number;
}

// Dashboard DTOs
export interface DashboardResponse {
  totalBalance: number;
  openingBalance: number;
  totalContributions: number;
  totalRepayments: number;
  totalDisbursements: number;
  totalExpenses: number;
  totalLoans: number;
  activeLoans: number;
  outstandingLoanBalance: number;
  memberCount: number;
  currentMonthContributions: number;
  currentMonthTarget: number;
  collectionRate: number;
  recentTransactions: TransactionResponse[];
  monthlyActivity: MonthlyActivityResponse[];
  upcomingDueDate?: string;
}

export interface TransactionResponse {
  id: string;
  type: 'CONTRIBUTION' | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT' | 'EXPENSE' | 'INTEREST';
  description: string;
  amount: number;
  date: string;
  referenceNumber?: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  memberId?: string;
  memberName?: string;
}

export interface MonthlyActivityResponse {
  month: string;
  contributions: number;
  disbursements: number;
  repayments: number;
}

class GroupService {
  private basePath = '/groups';

  /**
   * Get all groups (admin only)
   */
  async getGroups(): Promise<BankingGroupResponse[]> {
    const response = await api.get<BankingGroupResponse[]>(this.basePath);
    return response.data;
  }

  /**
   * Get group by ID
   */
  async getGroupById(id: string): Promise<BankingGroupResponse> {
    const response = await api.get<BankingGroupResponse>(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Create new group
   */
  async createGroup(data: CreateGroupRequest): Promise<BankingGroupResponse> {
    const response = await api.post<BankingGroupResponse>(this.basePath, data);
    return response.data;
  }

  /**
   * Update group
   */
  async updateGroup(id: string, data: UpdateGroupRequest): Promise<BankingGroupResponse> {
    const response = await api.put<BankingGroupResponse>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  /**
   * Get group dashboard
   */
  async getDashboard(groupId: string): Promise<DashboardResponse> {
    const response = await api.get<DashboardResponse>(`${this.basePath}/${groupId}/dashboard`);
    return response.data;
  }
}

class FinancialYearService {
  private basePath = '/financial-years';

  /**
   * Get financial years by group
   */
  async getFinancialYearsByGroup(groupId: string): Promise<FinancialYearResponse[]> {
    const response = await api.get<FinancialYearResponse[]>(`${this.basePath}/group/${groupId}`);
    return response.data;
  }

  /**
   * Get current financial year for group
   */
  async getCurrentFinancialYear(groupId: string): Promise<FinancialYearResponse> {
    const response = await api.get<FinancialYearResponse>(`${this.basePath}/group/${groupId}/current`);
    return response.data;
  }

  /**
   * Get financial year by ID
   */
  async getFinancialYearById(id: string): Promise<FinancialYearResponse> {
    const response = await api.get<FinancialYearResponse>(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Create new financial year
   */
  async createFinancialYear(data: CreateFinancialYearRequest): Promise<FinancialYearResponse> {
    const response = await api.post<FinancialYearResponse>(this.basePath, data);
    return response.data;
  }

  /**
   * Get financial year summary
   */
  async getFinancialYearSummary(id: string): Promise<FinancialYearSummaryResponse> {
    const response = await api.get<FinancialYearSummaryResponse>(`${this.basePath}/${id}/summary`);
    return response.data;
  }

  /**
   * Close financial year
   */
  async closeFinancialYear(id: string): Promise<FinancialYearResponse> {
    const response = await api.post<FinancialYearResponse>(`${this.basePath}/${id}/close`);
    return response.data;
  }
}

export const groupService = new GroupService();
export const financialYearService = new FinancialYearService();

export default { groupService, financialYearService };
