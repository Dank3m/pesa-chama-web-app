/**
 * Updated Types
 * These types extend backend DTOs with frontend-specific properties
 * for backwards compatibility with existing UI components
 */

// Re-export all backend types
export * from '../services';

// Legacy type mappings for backwards compatibility
import { 
  MemberResponse, 
  ContributionResponse, 
  LoanResponse,
  TransactionResponse as BackendTransaction,
  MemberRole,
  LoanStatus,
  ContributionStatus
} from '../services';

// Legacy User type (maps to MemberResponse)
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Member' | 'Treasurer' | 'Admin';
  avatar: string;
  bankingGroup?: string;
  status?: 'Active' | 'Inactive';
  phone?: string;
  joinedDate?: string;
}

// Convert backend MemberResponse to legacy User
export function toUser(member: MemberResponse): User {
  const roleMap: Record<MemberRole, 'Member' | 'Treasurer' | 'Admin'> = {
    'ADMIN': 'Admin',
    'TREASURER': 'Treasurer',
    'SECRETARY': 'Member',
    'MEMBER': 'Member',
  };

  return {
    id: member.id,
    name: member.fullName,
    email: member.email,
    role: roleMap[member.role] || 'Member',
    avatar: member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=2D60FF&color=fff`,
    bankingGroup: member.groupName,
    status: member.status === 'ACTIVE' ? 'Active' : 'Inactive',
    phone: member.phoneNumber,
    joinedDate: member.joinDate,
  };
}

// Legacy Transaction type
export interface Transaction {
  id: string;
  description: string;
  transactionId: string;
  type: 'Credit' | 'Debit';
  category: string;
  date: string;
  amount: number;
  status: 'Completed' | 'Pending';
}

// Convert backend transaction to legacy format
export function toTransaction(tx: BackendTransaction): Transaction {
  const typeMap: Record<string, 'Credit' | 'Debit'> = {
    'CONTRIBUTION': 'Credit',
    'LOAN_DISBURSEMENT': 'Debit',
    'LOAN_REPAYMENT': 'Credit',
    'EXPENSE': 'Debit',
    'INTEREST': 'Credit',
  };

  const categoryMap: Record<string, string> = {
    'CONTRIBUTION': 'Contribution',
    'LOAN_DISBURSEMENT': 'Loan',
    'LOAN_REPAYMENT': 'Loan Repayment',
    'EXPENSE': 'Expense',
    'INTEREST': 'Interest',
  };

  return {
    id: tx.id,
    description: tx.description,
    transactionId: tx.referenceNumber || `#TRX-${tx.id.substring(0, 4)}`,
    type: typeMap[tx.type] || 'Credit',
    category: categoryMap[tx.type] || tx.type,
    date: tx.date,
    amount: tx.amount,
    status: tx.status === 'COMPLETED' ? 'Completed' : 'Pending',
  };
}

// Legacy Loan type
export interface Loan {
  id: string;
  applicantName: string;
  amount: number;
  type: 'Personal' | 'Business' | 'Emergency';
  dateApplied: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Disbursed' | 'Repaid';
  repaymentPeriod: number;
  interestRate: number;
}

// Convert backend loan to legacy format
export function toLoan(loan: LoanResponse): Loan {
  const statusMap: Record<LoanStatus, 'Pending' | 'Approved' | 'Rejected' | 'Disbursed' | 'Repaid'> = {
    'PENDING': 'Pending',
    'APPROVED': 'Approved',
    'DISBURSED': 'Disbursed',
    'ACTIVE': 'Disbursed',
    'PAID_OFF': 'Repaid',
    'DEFAULTED': 'Rejected',
    'WRITTEN_OFF': 'Rejected',
  };

  // Calculate months between disbursement and expected end
  const start = new Date(loan.disbursementDate);
  const end = new Date(loan.expectedEndDate);
  const months = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));

  return {
    id: loan.id,
    applicantName: loan.borrowerName,
    amount: loan.principalAmount,
    type: loan.loanType === 'GUARANTEED' ? 'Business' : 'Personal',
    dateApplied: loan.disbursementDate,
    status: statusMap[loan.status] || 'Pending',
    repaymentPeriod: months,
    interestRate: loan.interestRate * 100, // Convert decimal to percentage
  };
}

// Legacy Contribution type
export interface Contribution {
  id: string;
  transactionId: string;
  date: string;
  amount: number;
  type: 'Monthly' | 'Welfare' | 'Penalty' | 'Project';
  status: 'Completed' | 'Pending' | 'Failed';
  method: 'M-Pesa' | 'Bank Transfer' | 'Cash';
}

// Convert backend contribution to legacy format
export function toContribution(contribution: ContributionResponse): Contribution {
  const statusMap: Record<ContributionStatus, 'Completed' | 'Pending' | 'Failed'> = {
    'PAID': 'Completed',
    'PARTIAL': 'Pending',
    'PENDING': 'Pending',
    'DEFAULTED': 'Failed',
    'WAIVED': 'Completed',
  };

  return {
    id: contribution.id,
    transactionId: contribution.referenceNumber || `#CTR-${contribution.id.substring(0, 8)}`,
    date: contribution.cycleMonth,
    amount: contribution.paidAmount,
    type: 'Monthly', // Backend doesn't have contribution types yet
    status: statusMap[contribution.status] || 'Pending',
    method: 'M-Pesa', // Default, backend doesn't track this yet
  };
}

// Notification type (unchanged)
export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'alert' | 'success';
  read: boolean;
}

// Expense type (for future use)
export interface Expense {
  id: string;
  description: string;
  category: 'Loan Fees' | 'Meeting' | 'Social' | 'Office' | 'Bank Fees' | 'Other';
  date: string;
  amount: number;
  status: 'Completed' | 'Pending';
  approvedBy?: string;
}

// Calculation period enum
export enum CalculationPeriod {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
  Yearly = 'Yearly'
}
