/**
 * Group Settings Service
 * Handles group settings API calls
 */

import api, { ApiResponse } from './api';

// Types for group settings
export interface GroupSettingsResponse {
  id: string;
  groupId: string;
  groupName: string;

  // Financial Year Settings
  financialYearStartMonth: number;
  financialYearEndMonth: number;

  // Contribution Settings
  defaultContributionAmount: number;
  currency: string;
  allowPartialContributions: boolean;

  // Loan Settings
  interestRate: number;
  interestRatePeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interestCalculationMethod: 'SIMPLE' | 'DAILY_COMPOUND' | 'MONTHLY_COMPOUND' | 'FLAT_RATE';
  maxLoanDurationMonths: number;
  gracePeriodDays: number;
  maxLoanMultiplier: number;
  requireGuarantors: boolean;
  minGuarantors: number;

  // Scheduler Settings
  contributionCheckCron: string;
  interestAccrualCron: string;
  overdueCheckCron: string;
  reminderDaysBeforeDue: number;

  // Penalty Settings
  latePenaltyRate: number;
  enablePenalties: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface UpdateGroupSettingsRequest {
  // Financial Year Settings
  financialYearStartMonth?: number;
  financialYearEndMonth?: number;

  // Contribution Settings
  defaultContributionAmount?: number;
  currency?: string;
  allowPartialContributions?: boolean;

  // Loan Settings
  interestRate?: number;
  interestRatePeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interestCalculationMethod?: 'SIMPLE' | 'DAILY_COMPOUND' | 'MONTHLY_COMPOUND' | 'FLAT_RATE';
  maxLoanDurationMonths?: number;
  gracePeriodDays?: number;
  maxLoanMultiplier?: number;
  requireGuarantors?: boolean;
  minGuarantors?: number;

  // Scheduler Settings
  contributionCheckCron?: string;
  interestAccrualCron?: string;
  overdueCheckCron?: string;
  reminderDaysBeforeDue?: number;

  // Penalty Settings
  latePenaltyRate?: number;
  enablePenalties?: boolean;
}

// Month names for display
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Interest calculation method labels
export const INTEREST_METHODS = {
  SIMPLE: 'Simple Interest',
  DAILY_COMPOUND: 'Daily Compound',
  MONTHLY_COMPOUND: 'Monthly Compound',
  FLAT_RATE: 'Flat Rate'
};

// Interest rate period labels
export const INTEREST_RATE_PERIODS = {
  DAILY: 'Per Day',
  WEEKLY: 'Per Week',
  MONTHLY: 'Per Month',
  YEARLY: 'Per Year (Annual)'
};

// User-friendly schedule options for cron expressions
export interface ScheduleOption {
  label: string;
  description: string;
  cron: string;
}

export const CONTRIBUTION_CHECK_SCHEDULES: ScheduleOption[] = [
  { label: 'Daily at midnight', description: 'Runs every day at 12:00 AM', cron: '0 0 0 * * ?' },
  { label: 'Daily at 6 AM', description: 'Runs every day at 6:00 AM', cron: '0 0 6 * * ?' },
  { label: 'Daily at 9 AM', description: 'Runs every day at 9:00 AM', cron: '0 0 9 * * ?' },
  { label: 'Every Monday at 9 AM', description: 'Runs every Monday morning', cron: '0 0 9 ? * MON' },
  { label: 'First of every month', description: 'Runs on the 1st day of each month at 9 AM', cron: '0 0 9 1 * ?' },
  { label: 'Every 6 hours', description: 'Runs at 12 AM, 6 AM, 12 PM, 6 PM', cron: '0 0 */6 * * ?' },
];

export const INTEREST_ACCRUAL_SCHEDULES: ScheduleOption[] = [
  { label: 'Daily at midnight', description: 'Accrues interest daily at 12:00 AM', cron: '0 0 0 * * ?' },
  { label: 'Daily at 1 AM', description: 'Accrues interest daily at 1:00 AM', cron: '0 0 1 * * ?' },
  { label: 'Weekly on Sunday', description: 'Accrues interest every Sunday at midnight', cron: '0 0 0 ? * SUN' },
  { label: 'Monthly on 1st', description: 'Accrues interest on the 1st of each month', cron: '0 0 0 1 * ?' },
  { label: 'Monthly on last day', description: 'Accrues interest on the last day of each month', cron: '0 0 0 L * ?' },
];

export const OVERDUE_CHECK_SCHEDULES: ScheduleOption[] = [
  { label: 'Daily at 8 AM', description: 'Checks overdue payments every day at 8:00 AM', cron: '0 0 8 * * ?' },
  { label: 'Daily at noon', description: 'Checks overdue payments every day at 12:00 PM', cron: '0 0 12 * * ?' },
  { label: 'Twice daily', description: 'Checks at 8 AM and 6 PM', cron: '0 0 8,18 * * ?' },
  { label: 'Every Monday', description: 'Checks every Monday at 8 AM', cron: '0 0 8 ? * MON' },
  { label: 'Every weekday', description: 'Checks Monday-Friday at 8 AM', cron: '0 0 8 ? * MON-FRI' },
];

class GroupSettingsService {
  /**
   * Get group settings by group ID
   */
  async getSettings(groupId: string): Promise<GroupSettingsResponse> {
    const response = await api.get<GroupSettingsResponse>(`/groups/${groupId}/settings`);
    return response.data;
  }

  /**
   * Update group settings
   */
  async updateSettings(groupId: string, data: UpdateGroupSettingsRequest): Promise<GroupSettingsResponse> {
    const response = await api.put<GroupSettingsResponse>(`/groups/${groupId}/settings`, data);
    return response.data;
  }

  /**
   * Format interest rate for display (e.g., 0.10 -> 10%)
   */
  formatInterestRate(rate: number): string {
    return `${(rate * 100).toFixed(1)}%`;
  }

  /**
   * Format amount for display with currency
   */
  formatAmount(amount: number, currency: string = 'KES'): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Get month name from number (1-12)
   */
  getMonthName(month: number): string {
    return MONTH_NAMES[month - 1] || 'Unknown';
  }

  /**
   * Get interest method label
   */
  getInterestMethodLabel(method: string): string {
    return INTEREST_METHODS[method as keyof typeof INTEREST_METHODS] || method;
  }

  /**
   * Get user-friendly label for a cron expression
   */
  getCronLabel(cron: string, scheduleType: 'contribution' | 'interest' | 'overdue'): string {
    const schedules = this.getScheduleOptions(scheduleType);
    const match = schedules.find(s => s.cron === cron);
    return match?.label || 'Custom schedule';
  }

  /**
   * Get description for a cron expression
   */
  getCronDescription(cron: string, scheduleType: 'contribution' | 'interest' | 'overdue'): string {
    const schedules = this.getScheduleOptions(scheduleType);
    const match = schedules.find(s => s.cron === cron);
    if (match) {
      return match.description;
    }
    // Parse common cron patterns for custom schedules
    return this.parseCronToDescription(cron);
  }

  /**
   * Get schedule options by type
   */
  getScheduleOptions(type: 'contribution' | 'interest' | 'overdue'): ScheduleOption[] {
    switch (type) {
      case 'contribution':
        return CONTRIBUTION_CHECK_SCHEDULES;
      case 'interest':
        return INTEREST_ACCRUAL_SCHEDULES;
      case 'overdue':
        return OVERDUE_CHECK_SCHEDULES;
      default:
        return [];
    }
  }

  /**
   * Parse cron expression to human-readable description
   */
  private parseCronToDescription(cron: string): string {
    const parts = cron.split(' ');
    if (parts.length < 6) return 'Invalid cron expression';

    const [seconds, minutes, hours, dayOfMonth, month, dayOfWeek] = parts;

    // Basic parsing for common patterns
    if (dayOfMonth === '*' && dayOfWeek === '?') {
      if (hours.includes('/')) {
        const interval = hours.split('/')[1];
        return `Runs every ${interval} hours`;
      }
      if (hours !== '*') {
        return `Runs daily at ${hours}:${minutes.padStart(2, '0')}`;
      }
    }

    if (dayOfWeek !== '?' && dayOfWeek !== '*') {
      const days: Record<string, string> = {
        'MON': 'Monday', 'TUE': 'Tuesday', 'WED': 'Wednesday',
        'THU': 'Thursday', 'FRI': 'Friday', 'SAT': 'Saturday', 'SUN': 'Sunday'
      };
      const dayName = days[dayOfWeek] || dayOfWeek;
      return `Runs every ${dayName} at ${hours}:${minutes.padStart(2, '0')}`;
    }

    if (dayOfMonth === 'L') {
      return `Runs on the last day of each month at ${hours}:${minutes.padStart(2, '0')}`;
    }

    if (dayOfMonth !== '*' && dayOfMonth !== '?') {
      return `Runs on day ${dayOfMonth} of each month at ${hours}:${minutes.padStart(2, '0')}`;
    }

    return `Custom: ${cron}`;
  }
}

export const groupSettingsService = new GroupSettingsService();
export default groupSettingsService;
