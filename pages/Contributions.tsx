import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PiggyBank, Calendar, TrendingUp, Loader2, AlertCircle,
  CheckCircle, Clock, XCircle, Download, ChevronDown,
  File, FileSpreadsheet, FileText, Search, ToggleLeft, ToggleRight,
  Plus, X, User, DollarSign, CreditCard, FileEdit
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import api, { TokenService } from '../services/api';
import { contributionService, PaymentMethod, RecordContributionRequest } from '../services/contributionService';
import { memberService, MemberResponse } from '../services/memberService';

// --- Types ---
interface Contribution {
  id: string;
  memberId: string;
  memberName: string;
  cycleId: string;
  cycleMonth: string;
  expectedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'DEFAULTED' | 'CONVERTED_TO_LOAN';
  paymentDate: string | null;
  convertedToLoan: boolean;
  notes: string | null;
}

interface ContributionCycle {
  id: string;
  financialYearId: string;
  cycleMonth: string;
  dueDate: string;
  expectedAmount: number;
  status: 'OPEN' | 'CLOSED';
  totalCollected: number;
  totalMembers: number;
  paidCount: number;
  pendingCount: number;
  isProcessed: boolean;
}

interface CycleSummary {
  cycleId: string;
  cycleMonth: string;
  totalExpected: number;
  totalCollected: number;
  outstandingAmount: number;
  paidCount: number;
  partialCount: number;
  pendingCount: number;
  defaultedCount: number;
  collectionRate: number;
}

type FilterType = 'All' | 'Paid' | 'Pending' | 'Partial';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

// --- Status Badge Component ---
const StatusBadge: React.FC<{ status: Contribution['status'] }> = ({ status }) => {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    PAID: { bg: 'bg-green-100', text: 'text-green-600', icon: <CheckCircle size={14} /> },
    PARTIAL: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: <Clock size={14} /> },
    PENDING: { bg: 'bg-gray-100', text: 'text-gray-600', icon: <Clock size={14} /> },
    DEFAULTED: { bg: 'bg-red-100', text: 'text-red-600', icon: <XCircle size={14} /> },
    CONVERTED_TO_LOAN: { bg: 'bg-purple-100', text: 'text-purple-600', icon: <AlertCircle size={14} /> },
  };
  
  const { bg, text, icon } = config[status] || config.PENDING;
  
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {icon}
      {status.replace('_', ' ')}
    </span>
  );
};

// --- Main Contributions Page ---
const Contributions: React.FC = () => {
  const { user } = useAuth();
  const { currentGroup, formatCurrency, formatDate } = useAppData();
  
  // Data state
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [currentCycle, setCurrentCycle] = useState<ContributionCycle | null>(null);
  const [cycleSummary, setCycleSummary] = useState<CycleSummary | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Export state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Toggle for viewing all contributions (admin/treasurer only)
  const [showMyContributionsOnly, setShowMyContributionsOnly] = useState(false);
  const isAdminOrTreasurer = user?.role === 'ADMIN' || user?.role === 'TREASURER';

  // Record Contribution Modal state
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [recordSuccess, setRecordSuccess] = useState(false);
  const [recordFormData, setRecordFormData] = useState<{
    memberId: string;
    cycleId: string;
    amount: string;
    referenceNumber: string;
    paymentMethod: PaymentMethod;
    notes: string;
  }>({
    memberId: '',
    cycleId: '',
    amount: '',
    referenceNumber: '',
    paymentMethod: 'MPESA',
    notes: '',
  });

  // Fetch contributions
  const fetchContributions = useCallback(async () => {
    if (!user?.member?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      let response;

      // Admin/Treasurer can view all contributions when toggle is off
      if (isAdminOrTreasurer && !showMyContributionsOnly && currentGroup?.id) {
        response = await api.get<Contribution[]>(`/contributions/group/${currentGroup.id}`);
      } else {
        // Regular members always see their own, admin/treasurer sees own when toggle is on
        response = await api.get<Contribution[]>(`/contributions/member/${user.member.id}`);
      }

      if (response.success && response.data) {
        setContributions(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contributions');
    } finally {
      setIsLoading(false);
    }
  }, [user?.member?.id, isAdminOrTreasurer, showMyContributionsOnly, currentGroup?.id]);

  // Fetch current cycle
  const fetchCurrentCycle = useCallback(async () => {
    if (!currentGroup?.id) return;
    
    try {
      const response = await api.get<ContributionCycle>('/contributions/cycles/current', { groupId: currentGroup.id });
      if (response.success && response.data) {
        setCurrentCycle(response.data);
        
        // Fetch cycle summary
        const summaryResponse = await api.get<CycleSummary>(`/contributions/cycles/${response.data.id}/summary`);
        if (summaryResponse.success && summaryResponse.data) {
          setCycleSummary(summaryResponse.data);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch current cycle:', err);
    }
  }, [currentGroup?.id]);

  useEffect(() => {
    fetchContributions();
    fetchCurrentCycle();
  }, [fetchContributions, fetchCurrentCycle]);

  // Fetch members when modal opens
  const fetchMembers = useCallback(async () => {
    if (!currentGroup?.id) return;

    setIsLoadingMembers(true);
    try {
      const membersList = await memberService.getActiveMembersByGroup(currentGroup.id);
      setMembers(membersList);
    } catch (err: any) {
      console.error('Failed to fetch members:', err);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [currentGroup?.id]);

  // Open record modal
  const openRecordModal = () => {
    setShowRecordModal(true);
    setRecordError(null);
    setRecordSuccess(false);
    setRecordFormData({
      memberId: '',
      cycleId: currentCycle?.id || '',
      amount: currentCycle?.expectedAmount?.toString() || '',
      referenceNumber: '',
      paymentMethod: 'MPESA',
      notes: '',
    });
    fetchMembers();
  };

  // Close record modal
  const closeRecordModal = () => {
    setShowRecordModal(false);
    setRecordError(null);
    setRecordSuccess(false);
  };

  // Handle record contribution submit
  const handleRecordContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecordError(null);

    // Validation
    if (!recordFormData.memberId) {
      setRecordError('Please select a member');
      return;
    }
    if (!recordFormData.cycleId) {
      setRecordError('Please select a contribution cycle');
      return;
    }
    if (!recordFormData.amount || parseFloat(recordFormData.amount) <= 0) {
      setRecordError('Please enter a valid amount');
      return;
    }

    setIsRecording(true);

    try {
      const request: RecordContributionRequest = {
        memberId: recordFormData.memberId,
        cycleId: recordFormData.cycleId,
        amount: parseFloat(recordFormData.amount),
        referenceNumber: recordFormData.referenceNumber || undefined,
        paymentMethod: recordFormData.paymentMethod,
        notes: recordFormData.notes || undefined,
      };

      await contributionService.recordContribution(request);
      setRecordSuccess(true);

      // Refresh contributions after recording
      fetchContributions();
      fetchCurrentCycle();

      // Close modal after short delay
      setTimeout(() => {
        closeRecordModal();
      }, 1500);
    } catch (err: any) {
      setRecordError(err?.message || 'Failed to record contribution');
    } finally {
      setIsRecording(false);
    }
  };

  // Calculate summaries
  const summary = useMemo(() => {
    const total = contributions.reduce((sum, item) => sum + item.paidAmount, 0);
    
    // Current month contributions
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthTotal = contributions
      .filter(item => {
        const d = new Date(item.cycleMonth);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, item) => sum + item.paidAmount, 0);

    // Estimated dividend (12% return)
    const estimatedDividend = total * 0.12;

    return { total, monthTotal, estimatedDividend };
  }, [contributions]);

  // Filter contributions
  const filteredContributions = useMemo(() => {
    let filtered = contributions;
    
    // Apply status filter
    if (activeFilter !== 'All') {
      const statusMap: Record<string, string[]> = {
        'Paid': ['PAID'],
        'Pending': ['PENDING'],
        'Partial': ['PARTIAL', 'DEFAULTED', 'CONVERTED_TO_LOAN']
      };
      filtered = filtered.filter(c => statusMap[activeFilter]?.includes(c.status));
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.cycleMonth.toLowerCase().includes(query) ||
        c.memberName?.toLowerCase().includes(query) ||
        c.notes?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [contributions, activeFilter, searchQuery]);

  // Pagination
  const paginatedContributions = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredContributions.slice(start, start + pageSize);
  }, [filteredContributions, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredContributions.length / pageSize);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(0);
  }, [activeFilter, searchQuery, pageSize]);

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(0, currentPage - 2);
      const end = Math.min(totalPages - 1, start + maxVisible - 1);
      for (let i = start; i <= end; i++) pages.push(i);
    }
    
    return pages;
  };

  // Export handler
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!user?.member?.id) return;
    
    setIsExporting(true);
    setShowExportMenu(false);
    
    try {
      // For now, create a simple CSV export on the frontend
      // Backend export endpoints can be added similar to transactions

      const showingAllContributions = isAdminOrTreasurer && !showMyContributionsOnly;
      const headers = showingAllContributions
        ? ['Member', 'Cycle Month', 'Expected', 'Paid', 'Outstanding', 'Status', 'Payment Date']
        : ['Cycle Month', 'Expected', 'Paid', 'Outstanding', 'Status', 'Payment Date'];
      const rows = filteredContributions.map(c => showingAllContributions
        ? [c.memberName, c.cycleMonth, c.expectedAmount, c.paidAmount, c.outstandingAmount, c.status, c.paymentDate || '']
        : [c.cycleMonth, c.expectedAmount, c.paidAmount, c.outstandingAmount, c.status, c.paymentDate || '']
      );
      
      if (format === 'csv') {
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contributions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert(`${format.toUpperCase()} export coming soon. Use CSV for now.`);
      }
    } catch (err: any) {
      console.error('Export error:', err);
      alert('Failed to export. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Format month display
  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (!user?.member?.id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-subtext dark:text-gray-400">Please log in to view contributions</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <StatCard 
          title="Total Contributions" 
          value={formatCurrency(summary.total)} 
          icon={<PiggyBank size={28} className="text-[#16DBCC]" />}
          subtext="Lifetime contributions"
        />
        <StatCard 
          title="This Month" 
          value={formatCurrency(summary.monthTotal)} 
          icon={<Calendar size={28} className="text-[#FF82AC]" />} 
          subtext={currentCycle ? formatMonth(currentCycle.cycleMonth) : 'Current month'}
        />
        <StatCard 
          title="Est. Dividend (Year End)" 
          value={formatCurrency(summary.estimatedDividend)} 
          icon={<TrendingUp size={28} className="text-[#396AFF]" />} 
          subtext="Based on 12% ROI"
        />
      </div>

      {/* Current Cycle Summary */}
      {cycleSummary && (
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-3xl shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-dark dark:text-white mb-4">
            Current Cycle: {formatMonth(cycleSummary.cycleMonth)}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-bgLight dark:bg-gray-700 rounded-xl p-4">
              <p className="text-subtext dark:text-gray-400 text-sm">Expected</p>
              <p className="text-xl font-bold text-dark dark:text-white">{formatCurrency(cycleSummary.totalExpected)}</p>
            </div>
            <div className="bg-bgLight dark:bg-gray-700 rounded-xl p-4">
              <p className="text-subtext dark:text-gray-400 text-sm">Collected</p>
              <p className="text-xl font-bold text-green-500">{formatCurrency(cycleSummary.totalCollected)}</p>
            </div>
            <div className="bg-bgLight dark:bg-gray-700 rounded-xl p-4">
              <p className="text-subtext dark:text-gray-400 text-sm">Collection Rate</p>
              <p className="text-xl font-bold text-primary">{cycleSummary.collectionRate.toFixed(1)}%</p>
            </div>
            <div className="bg-bgLight dark:bg-gray-700 rounded-xl p-4">
              <p className="text-subtext dark:text-gray-400 text-sm">Members Paid</p>
              <p className="text-xl font-bold text-dark dark:text-white">
                {cycleSummary.paidCount} / {cycleSummary.paidCount + cycleSummary.pendingCount + cycleSummary.partialCount}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contributions Table */}
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-3xl shadow-sm transition-colors">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-xl font-bold text-dark dark:text-white">Contribution History</h3>

          <div className="flex items-center gap-3">
            {/* Toggle for Admin/Treasurer to view all or own contributions */}
            {isAdminOrTreasurer && (
              <button
                onClick={() => setShowMyContributionsOnly(!showMyContributionsOnly)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  showMyContributionsOnly
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-gray-700 text-subtext dark:text-gray-300 border-gray-200 dark:border-gray-600'
                }`}
              >
                {showMyContributionsOnly ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                <span className="text-sm font-medium">My Contributions</span>
              </button>
            )}

            {/* Record Contribution Button - Admin/Treasurer only */}
            {isAdminOrTreasurer && (
              <button
                onClick={openRecordModal}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-blue-700 transition"
              >
                <Plus size={16} />
                Record Contribution
              </button>
            )}

            {/* Export Dropdown */}
            <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting || contributions.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-bgLight dark:bg-gray-700 text-subtext dark:text-gray-300 rounded-full text-sm font-medium hover:text-dark dark:hover:text-white disabled:opacity-50 transition"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Export
              <ChevronDown size={14} />
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 rounded-t-lg"
                >
                  <File size={18} className="text-green-500" />
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <FileSpreadsheet size={18} className="text-green-600" />
                  Export as Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 rounded-b-lg"
                >
                  <FileText size={18} className="text-red-500" />
                  Export as PDF
                </button>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Search and Page Size */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtext dark:text-gray-400" />
            <input
              type="text"
              placeholder={isAdminOrTreasurer && !showMyContributionsOnly ? "Search by member or month..." : "Search by month..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-dark dark:text-white placeholder-subtext dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-subtext dark:text-gray-400">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-8 mb-6 border-b border-gray-100 dark:border-gray-700 pb-1 overflow-x-auto no-scrollbar">
          {(['All', 'Paid', 'Pending', 'Partial'] as FilterType[]).map((filter) => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`text-base font-medium pb-3 px-2 whitespace-nowrap transition-colors relative ${
                activeFilter === filter 
                  ? 'text-primary' 
                  : 'text-subtext dark:text-gray-400 hover:text-dark dark:hover:text-white'
              }`}
            >
              {filter}
              {activeFilter === filter && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-lg"></div>
              )}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-8 text-red-500">
            <AlertCircle size={32} className="mx-auto mb-2" />
            <p>{error}</p>
            <button onClick={fetchContributions} className="mt-2 text-primary hover:underline">
              Try again
            </button>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <>
            <div className="overflow-x-auto pb-4">
              <table className="w-full min-w-[700px]">
                <thead className="border-b border-gray-100 dark:border-gray-700">
                  <tr className="text-left text-subtext dark:text-gray-400 text-sm font-medium">
                    {isAdminOrTreasurer && !showMyContributionsOnly && (
                      <th className="pb-4 pl-4 whitespace-nowrap">Member</th>
                    )}
                    <th className={`pb-4 whitespace-nowrap ${!(isAdminOrTreasurer && !showMyContributionsOnly) ? 'pl-4' : ''}`}>Cycle Month</th>
                    <th className="pb-4 whitespace-nowrap">Expected</th>
                    <th className="pb-4 whitespace-nowrap">Paid</th>
                    <th className="pb-4 whitespace-nowrap">Outstanding</th>
                    <th className="pb-4 whitespace-nowrap">Status</th>
                    <th className="pb-4 pr-4 whitespace-nowrap">Payment Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContributions.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {isAdminOrTreasurer && !showMyContributionsOnly && (
                        <td className="py-4 pl-4 font-medium text-dark dark:text-white whitespace-nowrap">
                          {item.memberName}
                        </td>
                      )}
                      <td className={`py-4 font-medium text-dark dark:text-white whitespace-nowrap ${!(isAdminOrTreasurer && !showMyContributionsOnly) ? 'pl-4' : ''}`}>
                        {formatMonth(item.cycleMonth)}
                      </td>
                      <td className="py-4 text-subtext dark:text-gray-400 whitespace-nowrap">
                        {formatCurrency(item.expectedAmount)}
                      </td>
                      <td className="py-4 font-bold text-green-500 whitespace-nowrap">
                        {formatCurrency(item.paidAmount)}
                      </td>
                      <td className="py-4 text-red-500 whitespace-nowrap">
                        {item.outstandingAmount > 0 ? formatCurrency(item.outstandingAmount) : '-'}
                      </td>
                      <td className="py-4 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-4 pr-4 text-subtext dark:text-gray-400 whitespace-nowrap">
                        {item.paymentDate ? formatDate(item.paymentDate) : '-'}
                      </td>
                    </tr>
                  ))}
                  {paginatedContributions.length === 0 && (
                    <tr>
                      <td colSpan={isAdminOrTreasurer && !showMyContributionsOnly ? 7 : 6} className="py-8 text-center text-subtext dark:text-gray-400">
                        No contributions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                <p className="text-sm text-subtext dark:text-gray-400">
                  Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, filteredContributions.length)} of {filteredContributions.length}
                </p>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-3 py-1 text-primary disabled:text-gray-300 dark:disabled:text-gray-600 font-medium"
                  >
                    Previous
                  </button>
                  
                  {getPageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-medium ${
                        currentPage === pageNum 
                          ? 'bg-primary text-white' 
                          : 'text-primary hover:bg-blue-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  ))}
                  
                  <button 
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="px-3 py-1 text-primary disabled:text-gray-300 dark:disabled:text-gray-600 font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Click outside to close export menu */}
      {showExportMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowExportMenu(false)} />
      )}

      {/* Record Contribution Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-dark dark:text-white flex items-center gap-2">
                <PiggyBank size={24} className="text-primary" />
                Record Contribution
              </h2>
              <button
                onClick={closeRecordModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
              >
                <X size={20} className="text-subtext dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleRecordContribution} className="p-6 space-y-5">
              {/* Success Message */}
              {recordSuccess && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                  <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                  <p className="text-green-700 dark:text-green-400 text-sm font-medium">
                    Contribution recorded successfully!
                  </p>
                </div>
              )}

              {/* Error Message */}
              {recordError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                  <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                  <p className="text-red-700 dark:text-red-400 text-sm">{recordError}</p>
                </div>
              )}

              {/* Member Selection */}
              <div>
                <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                  <User size={16} className="inline mr-2" />
                  Member *
                </label>
                {isLoadingMembers ? (
                  <div className="flex items-center gap-2 py-3 text-subtext dark:text-gray-400">
                    <Loader2 size={16} className="animate-spin" />
                    Loading members...
                  </div>
                ) : (
                  <select
                    value={recordFormData.memberId}
                    onChange={(e) => setRecordFormData({ ...recordFormData, memberId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors"
                    disabled={isRecording}
                  >
                    <option value="">Select a member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullName} ({member.memberNumber})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Cycle Selection */}
              <div>
                <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                  <Calendar size={16} className="inline mr-2" />
                  Contribution Cycle *
                </label>
                <select
                  value={recordFormData.cycleId}
                  onChange={(e) => setRecordFormData({ ...recordFormData, cycleId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors"
                  disabled={isRecording}
                >
                  <option value="">Select a cycle</option>
                  {currentCycle && (
                    <option value={currentCycle.id}>
                      {formatMonth(currentCycle.cycleMonth)} (Current - {formatCurrency(currentCycle.expectedAmount)})
                    </option>
                  )}
                </select>
                <p className="mt-1 text-xs text-subtext dark:text-gray-500">
                  Expected amount: {currentCycle ? formatCurrency(currentCycle.expectedAmount) : '-'}
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                  <DollarSign size={16} className="inline mr-2" />
                  Amount (KES) *
                </label>
                <input
                  type="number"
                  value={recordFormData.amount}
                  onChange={(e) => setRecordFormData({ ...recordFormData, amount: e.target.value })}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors"
                  disabled={isRecording}
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                  <CreditCard size={16} className="inline mr-2" />
                  Payment Method *
                </label>
                <select
                  value={recordFormData.paymentMethod}
                  onChange={(e) => setRecordFormData({ ...recordFormData, paymentMethod: e.target.value as PaymentMethod })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors"
                  disabled={isRecording}
                >
                  <option value="MPESA">M-Pesa</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={recordFormData.referenceNumber}
                  onChange={(e) => setRecordFormData({ ...recordFormData, referenceNumber: e.target.value })}
                  placeholder="e.g., M-Pesa transaction code"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors"
                  disabled={isRecording}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                  <FileEdit size={16} className="inline mr-2" />
                  Notes
                </label>
                <textarea
                  value={recordFormData.notes}
                  onChange={(e) => setRecordFormData({ ...recordFormData, notes: e.target.value })}
                  placeholder="Optional notes about this contribution"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors resize-none"
                  disabled={isRecording}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeRecordModal}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 text-subtext dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  disabled={isRecording}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecording || recordSuccess}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isRecording && <Loader2 size={20} className="animate-spin" />}
                  {isRecording ? 'Recording...' : 'Record Contribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contributions;