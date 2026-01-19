/**
 * Loan Service
 * Handles loan-related API calls including regular and guaranteed loans
 */

import api, { ApiResponse, PagedResponse } from './api';

// DTOs matching backend
export interface LoanResponse {
  id: string;
  loanNumber: string;
  memberId?: string;
  memberName?: string;
  memberNumber?: string;
  externalBorrowerId?: string;
  borrowerName: string;
  financialYearId: string;
  financialYear: string;
  loanType: LoanType;
  principalAmount: number;
  interestRate: number;
  disbursementDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  totalInterestAccrued: number;
  totalAmountDue: number;
  totalAmountPaid: number;
  outstandingBalance: number;
  status: LoanStatus;
  sourceContributionId?: string;
  guarantors?: LoanGuarantorResponse[];
  notes?: string;
  createdAt: string;
}

export interface LoanRepaymentResponse {
  id: string;
  loanId: string;
  loanNumber: string;
  paymentNumber: number;
  amount: number;
  principalPortion: number;
  interestPortion: number;
  balanceBefore: number;
  balanceAfter: number;
  paymentDate: string;
  referenceNumber?: string;
  paymentMethod?: string;
}

export interface LoanSummaryResponse {
  totalLoansCount: number;
  activeLoansCount: number;
  totalPrincipal: number;
  totalInterestAccrued: number;
  totalOutstanding: number;
  totalRepaid: number;
  defaultedCount: number;
  defaultedAmount: number;
}

export interface CreateLoanRequest {
  memberId: string;
  principalAmount: number;
  disbursementDate: string;
  interestRate?: number;
  notes?: string;
}

export interface RecordRepaymentRequest {
  loanId: string;
  amount: number;
  referenceNumber?: string;
  paymentMethod?: string;
  notes?: string;
}

// Guaranteed Loan DTOs
export interface ExternalBorrowerResponse {
  id: string;
  groupId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  nationalId?: string;
  address?: string;
  employer?: string;
  occupation?: string;
  status: ExternalBorrowerStatus;
  activeLoansCount: number;
  totalOutstanding: number;
  notes?: string;
  createdAt: string;
}

export interface CreateExternalBorrowerRequest {
  groupId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  nationalId?: string;
  address?: string;
  employer?: string;
  occupation?: string;
  notes?: string;
}

export interface CreateGuaranteedLoanRequest {
  externalBorrowerId: string;
  guarantorMemberId: string;
  principalAmount: number;
  disbursementDate: string;
  guaranteePercentage?: number;
  interestRate?: number;
  notes?: string;
}

export interface AddGuarantorRequest {
  loanId: string;
  memberId: string;
  guaranteePercentage?: number;
  notes?: string;
}

export interface LoanGuarantorResponse {
  id: string;
  loanId: string;
  memberId: string;
  memberName: string;
  memberNumber: string;
  guaranteedAmount?: number;
  guaranteePercentage: number;
  status: GuarantorStatus;
  acceptedAt?: string;
  releasedAt?: string;
  amountPaidOnBehalf: number;
  notes?: string;
}

export interface GuarantorExposureResponse {
  memberId: string;
  memberName: string;
  totalContributions: number;
  maxExposureLimit: number;
  currentExposure: number;
  availableExposure: number;
  activeGuaranteesCount: number;
  totalGuaranteedAmount: number;
  totalPaidOnBehalf: number;
  activeGuarantees: LoanGuarantorResponse[];
}

export type LoanType = 'REGULAR' | 'CONTRIBUTION_DEFAULT' | 'GUARANTEED';
export type LoanStatus = 'PENDING' | 'APPROVED' | 'DISBURSED' | 'ACTIVE' | 'PAID_OFF' | 'DEFAULTED' | 'WRITTEN_OFF';
export type ExternalBorrowerStatus = 'ACTIVE' | 'SUSPENDED' | 'BLACKLISTED' | 'INACTIVE';
export type GuarantorStatus = 'PENDING' | 'ACTIVE' | 'RELEASED' | 'DEFAULTED' | 'DECLINED';

class LoanService {
  private basePath = '/loans';
  private guaranteedPath = '/guaranteed-loans';

  // --- Regular Loans ---

  /**
   * Get all loans (with filters)
   */
  async getLoans(params?: {
    groupId?: string;
    memberId?: string;
    status?: LoanStatus;
    loanType?: LoanType;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<LoanResponse>> {
    const response = await api.get<PagedResponse<LoanResponse>>(this.basePath, params);
    return response.data;
  }

  /**
   * Get loans by member
   */
  async getLoansByMember(memberId: string): Promise<LoanResponse[]> {
    const response = await api.get<LoanResponse[]>(`${this.basePath}/member/${memberId}`);
    return response.data;
  }

  /**
   * Get active loans
   */
  async getActiveLoans(groupId?: string): Promise<LoanResponse[]> {
    const response = await api.get<LoanResponse[]>(`${this.basePath}/active`, { groupId });
    return response.data;
  }

  /**
   * Get loan by ID
   */
  async getLoanById(id: string): Promise<LoanResponse> {
    const response = await api.get<LoanResponse>(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Get loan by loan number
   */
  async getLoanByNumber(loanNumber: string): Promise<LoanResponse> {
    const response = await api.get<LoanResponse>(`${this.basePath}/number/${loanNumber}`);
    return response.data;
  }

  /**
   * Create new loan
   */
  async createLoan(data: CreateLoanRequest): Promise<LoanResponse> {
    const response = await api.post<LoanResponse>(this.basePath, data);
    return response.data;
  }

  /**
   * Record loan repayment
   */
  async recordRepayment(data: RecordRepaymentRequest): Promise<LoanRepaymentResponse> {
    const response = await api.post<LoanRepaymentResponse>(`${this.basePath}/repayments`, data);
    return response.data;
  }

  /**
   * Get loan repayments
   */
  async getLoanRepayments(loanId: string): Promise<LoanRepaymentResponse[]> {
    const response = await api.get<LoanRepaymentResponse[]>(`${this.basePath}/${loanId}/repayments`);
    return response.data;
  }

  /**
   * Get loan summary for financial year
   */
  async getLoanSummary(financialYearId: string): Promise<LoanSummaryResponse> {
    const response = await api.get<LoanSummaryResponse>(`${this.basePath}/summary`, { financialYearId });
    return response.data;
  }

  // --- Guaranteed Loans ---

  /**
   * Create external borrower
   */
  async createExternalBorrower(data: CreateExternalBorrowerRequest): Promise<ExternalBorrowerResponse> {
    const response = await api.post<ExternalBorrowerResponse>(`${this.guaranteedPath}/borrowers`, data);
    return response.data;
  }

  /**
   * Get external borrowers by group
   */
  async getExternalBorrowers(groupId: string): Promise<ExternalBorrowerResponse[]> {
    const response = await api.get<ExternalBorrowerResponse[]>(`${this.guaranteedPath}/borrowers`, { groupId });
    return response.data;
  }

  /**
   * Get external borrower by ID
   */
  async getExternalBorrower(id: string): Promise<ExternalBorrowerResponse> {
    const response = await api.get<ExternalBorrowerResponse>(`${this.guaranteedPath}/borrowers/${id}`);
    return response.data;
  }

  /**
   * Update external borrower status
   */
  async updateBorrowerStatus(id: string, status: ExternalBorrowerStatus): Promise<ExternalBorrowerResponse> {
    const response = await api.patch<ExternalBorrowerResponse>(
      `${this.guaranteedPath}/borrowers/${id}/status`,
      { status }
    );
    return response.data;
  }

  /**
   * Create guaranteed loan
   */
  async createGuaranteedLoan(data: CreateGuaranteedLoanRequest): Promise<LoanResponse> {
    const response = await api.post<LoanResponse>(this.guaranteedPath, data);
    return response.data;
  }

  /**
   * Get guaranteed loans by group
   */
  async getGuaranteedLoans(groupId: string): Promise<LoanResponse[]> {
    const response = await api.get<LoanResponse[]>(this.guaranteedPath, { groupId });
    return response.data;
  }

  /**
   * Get loans by external borrower
   */
  async getLoansByExternalBorrower(borrowerId: string): Promise<LoanResponse[]> {
    const response = await api.get<LoanResponse[]>(`${this.guaranteedPath}/borrower/${borrowerId}`);
    return response.data;
  }

  /**
   * Add guarantor to loan
   */
  async addGuarantor(data: AddGuarantorRequest): Promise<LoanGuarantorResponse> {
    const response = await api.post<LoanGuarantorResponse>(`${this.guaranteedPath}/guarantors`, data);
    return response.data;
  }

  /**
   * Get guarantor exposure
   */
  async getGuarantorExposure(memberId: string): Promise<GuarantorExposureResponse> {
    const response = await api.get<GuarantorExposureResponse>(
      `${this.guaranteedPath}/guarantors/member/${memberId}/exposure`
    );
    return response.data;
  }

  /**
   * Process guarantor liability on default
   */
  async processGuarantorLiability(loanId: string): Promise<void> {
    await api.post(`${this.guaranteedPath}/${loanId}/process-default`);
  }

  // --- Loan Calculator ---

  /**
   * Calculate loan details
   */
  calculateLoan(params: {
    principal: number;
    interestRate: number;
    durationMonths: number;
    compoundFrequency?: 'DAILY' | 'MONTHLY' | 'YEARLY';
  }): {
    totalInterest: number;
    totalAmount: number;
    monthlyPayment: number;
    effectiveRate: number;
  } {
    const { principal, interestRate, durationMonths, compoundFrequency = 'MONTHLY' } = params;
    
    // Simple interest calculation (matching backend 10% monthly)
    const monthlyRate = interestRate;
    const totalInterest = principal * monthlyRate * durationMonths;
    const totalAmount = principal + totalInterest;
    const monthlyPayment = totalAmount / durationMonths;
    const effectiveRate = (totalInterest / principal) * 100;

    return {
      totalInterest,
      totalAmount,
      monthlyPayment,
      effectiveRate,
    };
  }
}

export const loanService = new LoanService();
export default loanService;
