/**
 * App Data Context
 * Provides dashboard data, current group, financial year, and utility functions
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { DashboardData, ContributionCycle, CycleSummary } from '../hooks/useData';

// ==================== TYPES ====================

interface Group {
  id: string;
  name: string;
  description?: string;
}

interface FinancialYear {
  id: string;
  yearName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface AppDataContextType {
  // Current selections
  currentGroup: Group | null;
  currentFinancialYear: FinancialYear | null;
  
  // Dashboard data
  dashboard: DashboardData | null;
  isDashboardLoading: boolean;
  
  // Actions
  setCurrentGroup: (group: Group) => void;
  setCurrentFinancialYear: (year: FinancialYear) => void;
  refreshDashboard: () => void;
  
  // Utility functions
  formatCurrency: (amount: number | undefined | null) => string;
  formatDate: (date: string | undefined | null) => string;
}

// ==================== CONTEXT ====================

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const useAppData = (): AppDataContextType => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
};

// ==================== PROVIDER ====================

interface AppDataProviderProps {
  children: ReactNode;
}

export const AppDataProvider: React.FC<AppDataProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [currentFinancialYear, setCurrentFinancialYear] = useState<FinancialYear | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  // Fetch user's group on auth
  useEffect(() => {
    console.log('AppDataContext - Auth state:', { isAuthenticated, user });
    
    // Handle different user structures - groupId might be nested
    const groupId = user?.groupId || user?.member?.groupId || user?.member?.group?.id;
    
    if (isAuthenticated && groupId) {
      console.log('Fetching group with ID:', groupId);
      fetchGroup(groupId);
    } else if (isAuthenticated && !groupId) {
      console.warn('User authenticated but no groupId found in user object:', user);
    }
  }, [isAuthenticated, user]);

  // Fetch dashboard when group changes
  useEffect(() => {
    console.log('Dashboard useEffect triggered - currentGroup:', currentGroup);
    if (currentGroup?.id) {
      fetchDashboard();
      fetchCurrentFinancialYear();
    }
  }, [currentGroup?.id]);

  // Fetch group details
  const fetchGroup = async (groupId: string) => {
    console.log('fetchGroup called with:', groupId);
    try {
      const response = await api.get<Group>(`/groups/${groupId}`);
      console.log('Group response:', response);
      setCurrentGroup(response.data);
    } catch (err) {
      console.error('Failed to fetch group:', err);
      // Set a default group from user data if API fails
      const groupName = user?.groupName || user?.member?.group?.name || 'Your Chama';
      console.log('Using fallback group:', { id: groupId, name: groupName });
      setCurrentGroup({ id: groupId, name: groupName });
    }
  };

  // Fetch current financial year
  const fetchCurrentFinancialYear = async () => {
    if (!currentGroup?.id) return;
    try {
      const response = await api.get<FinancialYear>('/financial-years/current', { groupId: currentGroup.id });
      setCurrentFinancialYear(response.data);
    } catch (err) {
      console.error('Failed to fetch financial year:', err);
    }
  };

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    if (!currentGroup?.id) {
      console.log('fetchDashboard skipped - no currentGroup.id');
      return;
    }
    
    console.log('Fetching dashboard for group:', currentGroup.id);
    setIsDashboardLoading(true);
    try {
      const params: Record<string, string> = { groupId: currentGroup.id };
      if (currentFinancialYear?.id) {
        params.financialYearId = currentFinancialYear.id;
      }
      
      console.log('Dashboard API call with params:', params);
      const response = await api.get<DashboardData>('/dashboard/overview', params);
      console.log('Dashboard response:', response);
      setDashboard(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setIsDashboardLoading(false);
    }
  }, [currentGroup?.id, currentFinancialYear?.id]);

  // Refresh dashboard
  const refreshDashboard = useCallback(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Format currency (KES)
  const formatCurrency = useCallback((amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) return 'Ksh 0';
    return `Ksh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }, []);

  // Format date
  const formatDate = useCallback((date: string | undefined | null): string => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return date;
    }
  }, []);

  // Context value
  const value = useMemo(() => ({
    currentGroup,
    currentFinancialYear,
    dashboard,
    isDashboardLoading,
    setCurrentGroup,
    setCurrentFinancialYear,
    refreshDashboard,
    formatCurrency,
    formatDate,
  }), [
    currentGroup,
    currentFinancialYear,
    dashboard,
    isDashboardLoading,
    refreshDashboard,
    formatCurrency,
    formatDate,
  ]);

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};

export default AppDataContext;