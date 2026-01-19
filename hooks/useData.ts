/**
 * Data fetching hooks for dashboard and related data
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// ==================== TYPES ====================

export interface DashboardData {
  totalBalance: number;
  totalContributions: number;
  activeLoans: number;
  memberCount: number;
  collectionRate: number;
  monthlyActivity: MonthlyActivity[];
  fundAllocation: FundAllocation[];
  recentTransactions: Transaction[];
}

export interface MonthlyActivity {
  name: string;
  month: string;
  contributions: number;
  disbursements: number;
}

export interface FundAllocation {
  name: string;
  value: number;
  fill: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  memberName: string;
  category: string;
}

export interface ContributionCycle {
  id: string;
  cycleMonth: string;
  dueDate: string;
  expectedAmount: number;
  status: string;
  totalCollected: number;
}

export interface CycleSummary {
  cycleId: string;
  totalExpected: number;
  totalCollected: number;
  paidCount: number;
  partialCount: number;
  pendingCount: number;
}

export interface LoanSummary {
  totalPrincipal: number;
  totalInterestAccrued: number;
  totalOutstanding: number;
  activeLoansCount: number;
}

export interface Member {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: string;
}

// ==================== GENERIC HOOK ====================

function useApiData<T>(
  endpoint: string | null,
  params?: Record<string, string>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!endpoint) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<T>(endpoint, params);
      setData(response.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch data');
      console.error(`Error fetching ${endpoint}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  return { data, isLoading, error, refetch: fetchData };
}

// ==================== DASHBOARD HOOKS ====================

export function useDashboard(groupId: string | undefined, financialYearId?: string) {
  const params: Record<string, string> = {};
  if (groupId) params.groupId = groupId;
  if (financialYearId) params.financialYearId = financialYearId;

  return useApiData<DashboardData>(
    groupId ? '/dashboard/overview' : null,
    params,
    [groupId, financialYearId]
  );
}

export function useMemberDashboard(memberId: string | undefined) {
  return useApiData<any>(
    memberId ? `/dashboard/member/${memberId}` : null,
    undefined,
    [memberId]
  );
}

// ==================== CONTRIBUTION HOOKS ====================

export function useCurrentCycle(groupId?: string) {
  return useApiData<ContributionCycle>(
    groupId ? '/contributions/cycles/current' : null,
    groupId ? { groupId } : undefined,
    [groupId]
  );
}

export function useCycleSummary(cycleId: string | undefined) {
  return useApiData<CycleSummary>(
    cycleId ? `/contributions/cycles/${cycleId}/summary` : null,
    undefined,
    [cycleId]
  );
}

// ==================== LOAN HOOKS ====================

export function useLoanSummary(groupId?: string) {
  return useApiData<LoanSummary>(
    groupId ? '/loans/summary' : null,
    groupId ? { groupId } : undefined,
    [groupId]
  );
}

// ==================== MEMBER HOOKS ====================

export function useActiveMembers(groupId?: string) {
  return useApiData<Member[]>(
    groupId ? '/members/active' : null,
    groupId ? { groupId } : undefined,
    [groupId]
  );
}

export default {
  useDashboard,
  useMemberDashboard,
  useCurrentCycle,
  useCycleSummary,
  useLoanSummary,
  useActiveMembers,
};