import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowDownCircle, ArrowUpCircle, Loader2, Search, Download, 
  FileSpreadsheet, FileText, File, ChevronDown, ToggleLeft, ToggleRight 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import api, { TokenService } from '../services/api';

// Types
interface Transaction {
  id: string;
  transactionNumber: string;
  memberId: string | null;
  memberName: string | null;
  transactionType: string;
  transactionDate: string;
  amount: number;
  debitCredit: 'CREDIT' | 'DEBIT';
  description: string;
  referenceType: string | null;
}

interface PagedResponse {
  content: Transaction[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

type FilterType = 'All' | 'Income' | 'Expense';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

const Transactions: React.FC = () => {
  const { user } = useAuth();
  const { currentGroup, formatCurrency, formatDate } = useAppData();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Toggle between member transactions and all transactions
  const [showMyTransactionsOnly, setShowMyTransactionsOnly] = useState(false);
  
  // Export dropdown state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(0); // Reset to first page on search
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!currentGroup?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const params: Record<string, string> = {
        groupId: currentGroup.id,
        page: currentPage.toString(),
        size: pageSize.toString(),
      };
      
      // Add member filter if toggled on
      if (showMyTransactionsOnly && user?.member?.id) {
        params.memberId = user.member.id;
      }
      
      // Add type filter
      if (activeFilter === 'Income') {
        params.type = 'CREDIT';
      } else if (activeFilter === 'Expense') {
        params.type = 'DEBIT';
      }
      
      // Add search
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      
      const response = await api.get<PagedResponse>('/transactions', params);
      
      if (response.success && response.data) {
        setTransactions(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentGroup?.id, currentPage, pageSize, activeFilter, debouncedSearch, showMyTransactionsOnly, user?.member?.id]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [activeFilter, pageSize, showMyTransactionsOnly]);

  // Get category display name from transaction type
  const getCategoryLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'CONTRIBUTION': 'Contribution',
      'LOAN_DISBURSEMENT': 'Loan',
      'LOAN_REPAYMENT': 'Repayment',
      'INTEREST_ACCRUAL': 'Interest',
      'PENALTY': 'Penalty',
      'WITHDRAWAL': 'Withdrawal',
      'TRANSFER': 'Transfer',
      'ADJUSTMENT': 'Adjustment',
    };
    return labels[type] || type;
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers to display
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

  // Export handlers
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!currentGroup?.id) return;
    
    setIsExporting(true);
    setShowExportMenu(false);
    
    try {
      const params: Record<string, string> = {
        groupId: currentGroup.id,
      };
      
      if (showMyTransactionsOnly && user?.member?.id) {
        params.memberId = user.member.id;
      }
      
      if (activeFilter === 'Income') {
        params.type = 'CREDIT';
      } else if (activeFilter === 'Expense') {
        params.type = 'DEBIT';
      }
      
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      
      const queryString = new URLSearchParams(params).toString();
      const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
      
      // Get token using TokenService
      let token = TokenService.getToken();
      
      // Debug: Log all localStorage keys to find the correct token key
      console.log('LocalStorage keys:', Object.keys(localStorage));
      console.log('Token from TokenService:', token ? `${token.substring(0, 20)}...` : 'null');
      
      // Fallback: try other common token keys
      if (!token) {
        const possibleKeys = ['accessToken', 'access_token', 'token', 'jwt', 'auth_token', 'authToken'];
        for (const key of possibleKeys) {
          const val = localStorage.getItem(key);
          if (val && val.includes('.')) { // JWT tokens contain periods
            token = val;
            console.log(`Found token under key: ${key}`);
            break;
          }
        }
      }
      
      // Remove "Bearer " prefix if present
      if (token && token.startsWith('Bearer ')) {
        token = token.substring(7);
      }
      
      if (!token || !token.includes('.')) {
        console.error('Invalid or missing token:', token);
        throw new Error('No valid authentication token found. Please login again.');
      }
      
      console.log('Export URL:', `${baseUrl}/transactions/export/${format}?${queryString}`);
      
      const response = await fetch(`${baseUrl}/transactions/export/${format}?${queryString}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': format === 'pdf' ? 'application/pdf' : 
                   format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                   'text/csv',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export response error:', response.status, errorText);
        throw new Error(`Export failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const extensions: Record<string, string> = { csv: 'csv', excel: 'xlsx', pdf: 'pdf' };
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.${extensions[format]}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (err: any) {
      console.error('Export error:', err);
      alert(err.message || 'Failed to export transactions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!currentGroup?.id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-subtext dark:text-gray-400">No group selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-3xl shadow-sm transition-colors">
        {/* Header with title and controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-dark dark:text-white">Transactions</h3>
            <span className="text-sm text-subtext dark:text-gray-400">
              {totalElements} total transactions
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* My Transactions Toggle */}
            {user?.member?.id && (
              <button
                onClick={() => setShowMyTransactionsOnly(!showMyTransactionsOnly)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  showMyTransactionsOnly 
                    ? 'bg-primary text-white border-primary' 
                    : 'bg-white dark:bg-gray-700 text-subtext dark:text-gray-300 border-gray-200 dark:border-gray-600'
                }`}
              >
                {showMyTransactionsOnly ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                <span className="text-sm font-medium">My Transactions</span>
              </button>
            )}
            
            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting || transactions.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-subtext dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                <span className="text-sm font-medium">Export</span>
                <ChevronDown size={16} />
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
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtext dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-dark dark:text-white placeholder-subtext dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          {/* Page Size Selector */}
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
            <span className="text-sm text-subtext dark:text-gray-400">per page</span>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex gap-8 mb-6 border-b border-gray-100 dark:border-gray-700 pb-1 overflow-x-auto no-scrollbar">
          {(['All', 'Income', 'Expense'] as FilterType[]).map((filter) => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`text-base font-medium pb-3 px-2 whitespace-nowrap transition-colors relative ${
                activeFilter === filter 
                  ? 'text-primary' 
                  : 'text-subtext dark:text-gray-400 hover:text-dark dark:hover:text-white'
              }`}
            >
              {filter === 'All' ? 'All Transactions' : filter}
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
            <p>{error}</p>
            <button 
              onClick={fetchTransactions}
              className="mt-2 text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Transactions Table */}
        {!isLoading && !error && (
          <>
            <div className="overflow-x-auto pb-4">
              <table className="w-full min-w-[800px]">
                <thead className="border-b border-gray-100 dark:border-gray-700">
                  <tr className="text-left text-subtext dark:text-gray-400 text-sm font-medium">
                    <th className="pb-4 pl-4 whitespace-nowrap">Description</th>
                    <th className="pb-4 whitespace-nowrap">Transaction ID</th>
                    <th className="pb-4 whitespace-nowrap">Type</th>
                    <th className="pb-4 whitespace-nowrap">Category</th>
                    <th className="pb-4 whitespace-nowrap">Date</th>
                    <th className="pb-4 text-right pr-4 whitespace-nowrap">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="py-4 pl-4 font-medium text-dark dark:text-gray-100 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            trx.debitCredit === 'CREDIT' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {trx.debitCredit === 'CREDIT' 
                              ? <ArrowDownCircle size={16} /> 
                              : <ArrowUpCircle size={16} />}
                          </div>
                          <div>
                            <div>{trx.description || getCategoryLabel(trx.transactionType)}</div>
                            {trx.memberName && (
                              <div className="text-xs text-subtext dark:text-gray-500">{trx.memberName}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-subtext dark:text-gray-400 whitespace-nowrap font-mono text-sm">
                        {trx.transactionNumber}
                      </td>
                      <td className="py-4 text-subtext dark:text-gray-400 whitespace-nowrap">
                        {trx.debitCredit === 'CREDIT' ? 'Credit' : 'Debit'}
                      </td>
                      <td className="py-4 text-subtext dark:text-gray-400 whitespace-nowrap">
                        <span className="px-3 py-1 border border-gray-200 dark:border-gray-600 rounded-full text-xs">
                          {getCategoryLabel(trx.transactionType)}
                        </span>
                      </td>
                      <td className="py-4 text-subtext dark:text-gray-400 whitespace-nowrap">
                        {formatDate(trx.transactionDate)}
                      </td>
                      <td className={`py-4 text-right pr-4 font-medium whitespace-nowrap ${
                        trx.debitCredit === 'CREDIT' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {trx.debitCredit === 'CREDIT' ? '+' : '-'}{formatCurrency(trx.amount)}
                      </td>
                    </tr>
                  ))}
                  
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-subtext dark:text-gray-500">
                        {debouncedSearch 
                          ? `No transactions found matching "${debouncedSearch}"`
                          : 'No transactions found for this category.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                <p className="text-sm text-subtext dark:text-gray-400">
                  Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements}
                </p>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-3 py-1 text-primary disabled:text-gray-300 dark:disabled:text-gray-600 font-medium whitespace-nowrap"
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
                    className="px-3 py-1 text-primary disabled:text-gray-300 dark:disabled:text-gray-600 font-medium whitespace-nowrap"
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
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
};

export default Transactions;