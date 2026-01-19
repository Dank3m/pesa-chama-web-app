import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt, Calendar, TrendingDown, Plus, X, Loader2,
  AlertCircle, Edit2, Trash2, Filter, Search, Building2,
  Banknote, Users, MoreHorizontal
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import api from '../services/api';

// --- Types ---
interface Expense {
  id: string;
  groupId: string;
  financialYearId: string;
  yearName: string;
  category: string;
  amount: number;
  expenseDate: string;
  description: string;
  vendor: string | null;
  receiptNumber: string | null;
  loanId: string | null;
  loanNumber: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface ExpenseSummary {
  groupId: string;
  financialYearId: string;
  totalExpenses: number;
  expenseCount: number;
  transactionFees: number;
  agmExpenses: number;
  administrativeExpenses: number;
  otherExpenses: number;
}

interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

const EXPENSE_CATEGORIES = [
  { value: 'TRANSACTION_FEE', label: 'Transaction Fee' },
  { value: 'DISBURSEMENT_FEE', label: 'Disbursement Fee' },
  { value: 'AGM_VENUE', label: 'AGM Venue' },
  { value: 'AGM_CATERING', label: 'AGM Catering' },
  { value: 'AGM_OTHER', label: 'AGM Other' },
  { value: 'ADMINISTRATIVE', label: 'Administrative' },
  { value: 'BANK_CHARGES', label: 'Bank Charges' },
  { value: 'COMMUNICATION', label: 'Communication' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'OTHER', label: 'Other' }
];

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

// --- Category Badge Component ---
const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    TRANSACTION_FEE: { bg: 'bg-blue-100', text: 'text-blue-600', icon: <Banknote size={12} /> },
    DISBURSEMENT_FEE: { bg: 'bg-purple-100', text: 'text-purple-600', icon: <Banknote size={12} /> },
    AGM_VENUE: { bg: 'bg-orange-100', text: 'text-orange-600', icon: <Building2 size={12} /> },
    AGM_CATERING: { bg: 'bg-pink-100', text: 'text-pink-600', icon: <Users size={12} /> },
    AGM_OTHER: { bg: 'bg-amber-100', text: 'text-amber-600', icon: <MoreHorizontal size={12} /> },
    ADMINISTRATIVE: { bg: 'bg-gray-100', text: 'text-gray-600', icon: <Receipt size={12} /> },
    BANK_CHARGES: { bg: 'bg-red-100', text: 'text-red-600', icon: <Banknote size={12} /> },
    COMMUNICATION: { bg: 'bg-teal-100', text: 'text-teal-600', icon: <Receipt size={12} /> },
    LEGAL: { bg: 'bg-indigo-100', text: 'text-indigo-600', icon: <Receipt size={12} /> },
    OTHER: { bg: 'bg-gray-100', text: 'text-gray-600', icon: <Receipt size={12} /> },
  };

  const { bg, text, icon } = config[category] || config.OTHER;
  const label = EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {icon}
      {label}
    </span>
  );
};

// --- Expense Modal Component ---
interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  expense?: Expense | null;
  groupId: string;
}

interface ExpenseFormData {
  category: string;
  amount: number;
  expenseDate: string;
  description: string;
  vendor?: string;
  receiptNumber?: string;
  notes?: string;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, onSubmit, expense, groupId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    category: 'OTHER',
    amount: 0,
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
    vendor: '',
    receiptNumber: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setFormData({
          category: expense.category,
          amount: expense.amount,
          expenseDate: expense.expenseDate,
          description: expense.description,
          vendor: expense.vendor || '',
          receiptNumber: expense.receiptNumber || '',
          notes: expense.notes || ''
        });
      } else {
        setFormData({
          category: 'OTHER',
          amount: 0,
          expenseDate: new Date().toISOString().split('T')[0],
          description: '',
          vendor: '',
          receiptNumber: '',
          notes: ''
        });
      }
      setError(null);
    }
  }, [isOpen, expense]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] transition-colors">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700 shrink-0">
          <h3 className="text-xl font-bold text-dark dark:text-white">
            {expense ? 'Edit Expense' : 'Record Expense'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Category</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-dark dark:text-gray-400 font-semibold text-xs">KES</span>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full pl-12 pr-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Date</label>
              <input
                type="date"
                required
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Description</label>
              <input
                type="text"
                required
                maxLength={255}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of expense"
                className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Vendor (Optional)</label>
                <input
                  type="text"
                  maxLength={100}
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="Vendor name"
                  className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Receipt # (Optional)</label>
                <input
                  type="text"
                  maxLength={50}
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                  placeholder="Receipt number"
                  className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Notes (Optional)</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition resize-none"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-subtext font-medium hover:text-dark dark:hover:text-white transition bg-gray-50 dark:bg-gray-700 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="animate-spin" size={20} />}
                {loading ? 'Saving...' : (expense ? 'Update' : 'Save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Delete Confirmation Modal ---
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  expense: Expense | null;
}

const DeleteConfirmModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm, expense }) => {
  const [loading, setLoading] = useState(false);
  const { formatCurrency } = useAppData();

  if (!isOpen || !expense) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={32} className="text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-dark dark:text-white mb-2">Delete Expense?</h3>
          <p className="text-subtext dark:text-gray-400 mb-4">
            Are you sure you want to delete this expense?
          </p>
          <div className="bg-bgLight dark:bg-gray-700 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-subtext dark:text-gray-400">Description</p>
            <p className="font-medium text-dark dark:text-white">{expense.description}</p>
            <p className="text-sm text-subtext dark:text-gray-400 mt-2">Amount</p>
            <p className="font-bold text-red-500">{formatCurrency(expense.amount)}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-subtext font-medium bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Expenses Page ---
const Expenses: React.FC = () => {
  const { user } = useAuth();
  const { currentGroup, formatCurrency, formatDate } = useAppData();

  // Data state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    if (!currentGroup?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<PagedResponse<Expense>>(
        `/expenses/group/${currentGroup.id}`,
        { page: currentPage, size: pageSize }
      );
      if (response.success && response.data) {
        setExpenses(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch expenses');
    } finally {
      setIsLoading(false);
    }
  }, [currentGroup?.id, currentPage, pageSize]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    if (!currentGroup?.id) return;

    setIsSummaryLoading(true);

    try {
      const response = await api.get<ExpenseSummary>(`/expenses/group/${currentGroup.id}/summary`);
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch expense summary:', err);
    } finally {
      setIsSummaryLoading(false);
    }
  }, [currentGroup?.id]);

  useEffect(() => {
    fetchExpenses();
    fetchSummary();
  }, [fetchExpenses, fetchSummary]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(0);
  }, [categoryFilter, pageSize]);

  // Filter expenses locally (for category and search)
  const filteredExpenses = expenses.filter(expense => {
    const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
    const matchesSearch = !searchQuery ||
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.vendor?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handlers
  const handleCreateExpense = async (data: ExpenseFormData) => {
    if (!currentGroup?.id) throw new Error('No group selected');

    const response = await api.post<Expense>('/expenses', {
      groupId: currentGroup.id,
      ...data
    });

    if (response.success) {
      await fetchExpenses();
      await fetchSummary();
    } else {
      throw new Error(response.message || 'Failed to create expense');
    }
  };

  const handleUpdateExpense = async (data: ExpenseFormData) => {
    if (!selectedExpense) throw new Error('No expense selected');

    const response = await api.put<Expense>(`/expenses/${selectedExpense.id}`, {
      expenseId: selectedExpense.id,
      ...data
    });

    if (response.success) {
      await fetchExpenses();
      await fetchSummary();
    } else {
      throw new Error(response.message || 'Failed to update expense');
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;

    const response = await api.delete(`/expenses/${selectedExpense.id}`);

    if (response.success) {
      await fetchExpenses();
      await fetchSummary();
    } else {
      throw new Error(response.message || 'Failed to delete expense');
    }
  };

  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const openDeleteModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedExpense(null);
    setIsModalOpen(true);
  };

  // Pagination
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

  if (!currentGroup?.id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-subtext dark:text-gray-400">Please select a group to view expenses</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modals */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={selectedExpense ? handleUpdateExpense : handleCreateExpense}
        expense={selectedExpense}
        groupId={currentGroup.id}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteExpense}
        expense={selectedExpense}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Expenses"
          value={isSummaryLoading ? '...' : formatCurrency(summary?.totalExpenses ?? 0)}
          icon={<TrendingDown size={28} className="text-red-500" />}
          subtext={`${summary?.expenseCount ?? 0} expenses recorded`}
        />
        <StatCard
          title="Transaction Fees"
          value={isSummaryLoading ? '...' : formatCurrency(summary?.transactionFees ?? 0)}
          icon={<Banknote size={28} className="text-[#396AFF]" />}
          subtext="Bank & M-Pesa fees"
        />
        <StatCard
          title="AGM Expenses"
          value={isSummaryLoading ? '...' : formatCurrency(summary?.agmExpenses ?? 0)}
          icon={<Users size={28} className="text-[#16DBCC]" />}
          subtext="Venue, catering & other"
        />
        <StatCard
          title="Administrative"
          value={isSummaryLoading ? '...' : formatCurrency(summary?.administrativeExpenses ?? 0)}
          icon={<Receipt size={28} className="text-[#FF82AC]" />}
          subtext="Admin & communication"
        />
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-3xl shadow-sm transition-colors">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-xl font-bold text-dark dark:text-white">Expense History</h3>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            Record Expense
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtext dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-dark dark:text-white placeholder-subtext dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary w-48"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-subtext dark:text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="All">All Categories</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Page Size */}
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
            <button onClick={fetchExpenses} className="mt-2 text-primary hover:underline">
              Try again
            </button>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <>
            <div className="overflow-x-auto pb-4">
              <table className="w-full min-w-[800px]">
                <thead className="border-b border-gray-100 dark:border-gray-700">
                  <tr className="text-left text-subtext dark:text-gray-400 text-sm font-medium">
                    <th className="pb-4 pl-4 whitespace-nowrap">Description</th>
                    <th className="pb-4 whitespace-nowrap">Category</th>
                    <th className="pb-4 whitespace-nowrap">Date</th>
                    <th className="pb-4 whitespace-nowrap">Vendor</th>
                    <th className="pb-4 text-right whitespace-nowrap">Amount</th>
                    <th className="pb-4 text-right pr-4 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700">
                      <td className="py-4 pl-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-500 shrink-0">
                            <Receipt size={14} />
                          </div>
                          <div>
                            <p className="font-medium text-dark dark:text-white">{expense.description}</p>
                            {expense.receiptNumber && (
                              <p className="text-xs text-subtext dark:text-gray-500">#{expense.receiptNumber}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 whitespace-nowrap">
                        <CategoryBadge category={expense.category} />
                      </td>
                      <td className="py-4 text-subtext dark:text-gray-400 whitespace-nowrap">
                        {formatDate(expense.expenseDate)}
                      </td>
                      <td className="py-4 text-subtext dark:text-gray-400 whitespace-nowrap">
                        {expense.vendor || '-'}
                      </td>
                      <td className="py-4 text-right font-bold text-red-500 whitespace-nowrap">
                        -{formatCurrency(expense.amount)}
                      </td>
                      <td className="py-4 text-right pr-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(expense)}
                            className="p-2 text-subtext hover:text-primary hover:bg-blue-50 dark:hover:bg-gray-600 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(expense)}
                            className="p-2 text-subtext hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-600 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-subtext dark:text-gray-400">
                        No expenses found.
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
                  Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements}
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
    </div>
  );
};

export default Expenses;
