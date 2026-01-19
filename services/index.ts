/**
 * Services Index
 * Central export point for all API services
 */

export { default as api, TokenService } from './api';
export type { ApiResponse, PagedResponse, ApiError } from './api';

export { default as authService } from './authService';
export type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  UserResponse, 
  ChangePasswordRequest 
} from './authService';

export { default as memberService } from './memberService';
export type { 
  MemberResponse, 
  MemberBalanceResponse, 
  CreateMemberRequest, 
  UpdateMemberRequest,
  MemberStatus,
  MemberRole
} from './memberService';

export { default as contributionService } from './contributionService';
export type { 
  ContributionResponse, 
  ContributionCycleResponse, 
  RecordContributionRequest,
  RecordAdvanceContributionRequest,
  AdvancePaymentStatusResponse,
  ContributionSummaryResponse,
  ContributionStatus,
  CycleStatus,
  PaymentMethod
} from './contributionService';

export { default as loanService } from './loanService';
export type { 
  LoanResponse, 
  LoanRepaymentResponse, 
  LoanSummaryResponse,
  CreateLoanRequest,
  RecordRepaymentRequest,
  ExternalBorrowerResponse,
  CreateExternalBorrowerRequest,
  CreateGuaranteedLoanRequest,
  AddGuarantorRequest,
  LoanGuarantorResponse,
  GuarantorExposureResponse,
  LoanType,
  LoanStatus,
  ExternalBorrowerStatus,
  GuarantorStatus
} from './loanService';

export { groupService, financialYearService } from './groupService';
export type {
  BankingGroupResponse,
  CreateGroupRequest,
  UpdateGroupRequest,
  FinancialYearResponse,
  CreateFinancialYearRequest,
  FinancialYearSummaryResponse,
  DashboardResponse,
  TransactionResponse,
  MonthlyActivityResponse
} from './groupService';

export { default as settingsService } from './settingsService';
export type {
  ProfileResponse,
  UpdateProfileRequest,
  UserSettingsResponse,
  UpdateUserSettingsRequest,
  SecuritySettingsResponse,
  ChangePasswordRequest as SettingsChangePasswordRequest,
  Toggle2FARequest
} from './settingsService';
