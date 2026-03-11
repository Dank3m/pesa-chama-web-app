import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Calendar, Plus, X, Loader2,
  AlertCircle, Edit2, Trash2, Filter, Search,
  Landmark, BarChart3, Banknote, CircleDollarSign
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import api from '../services/api';

// --- Types ---
interface Investment {
  id: string;
  groupId: string;
  financialYearId: string;
  yearName: string;
  type: string;
  name: string;
  description: string | null;
  amount: number;
  currentValue: number | null;
  investmentDate: string;
  maturityDate: string | null;
  status: string;
  receiptNumber: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface InvestmentSummary {
  groupId: string;
  totalInvested: number;
  currentValue: number;
  activeCount: number;
  maturedCount: number;
  redeemedCount: number;
  totalCount: number;
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

const INVESTMENT_TYPES = [
  { value: 'LAND', label: 'Land' },
  { value: 'MONEY_MARKET', label: 'Money Market' },
  { value: 'FIXED_DEPOSIT', label: 'Fixed Deposit' },
  { value: 'BONDS', label: 'Bonds' },
  { value: 'SHARES', label: 'Shares' },
  { value: 'OTHER', label: 'Other' }
];

const INVESTMENT_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'MATURED', label: 'Matured' },
  { value: 'REDEEMED', label: 'Redeemed' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

// --- Status Badge Component ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { bg: string; text: string }> = {
    ACTIVE: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
    MATURED: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
    REDEEMED: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' },
    CANCELLED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  };

  const { bg, text } = config[status] || config.ACTIVE;
  const label = INVESTMENT_STATUSES.find(s => s.value === status)?.label || status;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

// --- Type Badge Component ---
const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    LAND: { bg: 'bg-amber-100', text: 'text-amber-600', icon: <Landmark size={12} /> },
    MONEY_MARKET: { bg: 'bg-blue-100', text: 'text-blue-600', icon: <BarChart3 size={12} /> },
    FIXED_DEPOSIT: { bg: 'bg-purple-100', text: 'text-purple-600', icon: <Banknote size={12} /> },
    BONDS: { bg: 'bg-teal-100', text: 'text-teal-600', icon: <CircleDollarSign size={12} /> },
    SHARES: { bg: 'bg-green-100', text: 'text-green-600', icon: <TrendingUp size={12} /> },
    OTHER: { bg: 'bg-gray-100', text: 'text-gray-600', icon: <CircleDollarSign size={12} /> },
  };

  const { bg, text, icon } = config[type] || config.OTHER;
  const label = INVESTMENT_TYPES.find(t => t.value === type)?.label || type;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {icon}
      {label}
    </span>
  );
};

// --- Investment Modal Component ---
interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InvestmentFormData) => Promise<void>;
  investment?: Investment | null;
  groupId: string;
}

interface InvestmentFormData {
  type: string;
  name: string;
  description?: string;
  amount: number;
  currentValue?: number;
  investmentDate: string;
  maturityDate?: string;
  status?: string;
  receiptNumber?: string;
  notes?: string;
}

const InvestmentModal: React.FC<InvestmentModalProps> = ({ isOpen, onClose, onSubmit, investment }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<InvestmentFormData>({
    type: 'OTHER',
    name: '',
    description: '',
    amount: 0,
    currentValue: 0,
    investmentDate: new Date().toISOString().split('T')[0],
    maturityDate: '',
    receiptNumber: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (investment) {
        setFormData({
          type: investment.type,
          name: investment.name,
          description: investment.description || '',
          amount: investment.amount,
          currentValue: investment.currentValue ?? investment.amount,
          investmentDate: investment.investmentDate,
          maturityDate: investment.maturityDate || '',
          status: investment.status,
          receiptNumber: investment.receiptNumber || '',
          notes: investment.notes || ''
        });
      } else {
        setFormData({
          type: 'OTHER',
          name: '',
          description: '',
          amount: 0,
          currentValue: 0,
          investmentDate: new Date().toISOString().split('T')[0],
          maturityDate: '',
          receiptNumber: '',
          notes: ''
        });
      }
      setError(null);
    }
  }, [isOpen, investment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = { ...formData };
      if (!submitData.maturityDate) delete submitData.maturityDate;
      await onSubmit(submitData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save investment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] transition-colors">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700 shrink-0">
          <h3 className="text-xl font-bold text-dark dark:text-white">
            {investment ? 'Edit Investment' : 'Record Investment'}
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
              <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Name</label>
              <input
                type="text"
                required
                maxLength={255}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Investment name"
                className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Type</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
              >
                {INVESTMENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Current Value</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-dark dark:text-gray-400 font-semibold text-xs">KES</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.currentValue}
                    onChange={(e) => setFormData({ ...formData, currentValue: Number(e.target.value) })}
                    className="w-full pl-12 pr-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Investment Date</label>
                <input
                  type="date"
                  required
                  value={formData.investmentDate}
                  onChange={(e) => setFormData({ ...formData, investmentDate: e.target.value })}
                  className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Maturity Date (Optional)</label>
                <input
                  type="date"
                  value={formData.maturityDate}
                  onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                  className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
                />
              </div>
            </div>

            {investment && (
              <div>
                <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
                >
                  {INVESTMENT_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Description (Optional)</label>
              <input
                type="text"
                maxLength={255}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of investment"
                className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                {loading ? 'Saving...' : (investment ? 'Update' : 'Save')}
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
  investment: Investment | null;
}

const DeleteConfirmModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm, investment }) => {
  const [loading, setLoading] = useState(false);
  const { formatCurrency } = useAppData();

  if (!isOpen || !investment) return null;

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
          <h3 className="text-xl font-bold text-dark dark:text-white mb-2">Delete Investment?</h3>
          <p className="text-subtext dark:text-gray-400 mb-4">
            Are you sure you want to delete this investment?
          </p>
          <div className="bg-bgLight dark:bg-gray-700 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-subtext dark:text-gray-400">Name</p>
            <p className="font-medium text-dark dark:text-white">{investment.name}</p>
            <p className="text-sm text-subtext dark:text-gray-400 mt-2">Amount</p>
            <p className="font-bold text-red-500">{formatCurrency(investment.amount)}</p>
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

// --- Main Investments Page ---
const Investments: React.FC = () => {
  const { user } = useAuth();
  const { currentGroup, formatCurrency, formatDate } = useAppData();

  // Data state
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<InvestmentSummary | null>(null);

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
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  // Fetch investments
  const fetchInvestments = useCallback(async () => {
    if (!currentGroup?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<PagedResponse<Investment>>(
        `/investments/group/${currentGroup.id}`,
        { page: currentPage, size: pageSize }
      );
      if (response.success && response.data) {
        setInvestments(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch investments');
    } finally {
      setIsLoading(false);
    }
  }, [currentGroup?.id, currentPage, pageSize]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    if (!currentGroup?.id) return;

    setIsSummaryLoading(true);

    try {
      const response = await api.get<InvestmentSummary>(`/investments/group/${currentGroup.id}/summary`);
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch investment summary:', err);
    } finally {
      setIsSummaryLoading(false);
    }
  }, [currentGroup?.id]);

  useEffect(() => {
    fetchInvestments();
    fetchSummary();
  }, [fetchInvestments, fetchSummary]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(0);
  }, [statusFilter, pageSize]);

  // Filter investments locally (for status and search)
  const filteredInvestments = investments.filter(inv => {
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    const matchesSearch = !searchQuery ||
      inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handlers
  const handleCreateInvestment = async (data: InvestmentFormData) => {
    if (!currentGroup?.id) throw new Error('No group selected');

    const response = await api.post<Investment>('/investments', {
      groupId: currentGroup.id,
      ...data
    });

    if (response.success) {
      await fetchInvestments();
      await fetchSummary();
    } else {
      throw new Error(response.message || 'Failed to create investment');
    }
  };

  const handleUpdateInvestment = async (data: InvestmentFormData) => {
    if (!selectedInvestment) throw new Error('No investment selected');

    const response = await api.put<Investment>(`/investments/${selectedInvestment.id}`, {
      investmentId: selectedInvestment.id,
      ...data
    });

    if (response.success) {
      await fetchInvestments();
      await fetchSummary();
    } else {
      throw new Error(response.message || 'Failed to update investment');
    }
  };

  const handleDeleteInvestment = async () => {
    if (!selectedInvestment) return;

    const response = await api.delete(`/investments/${selectedInvestment.id}`);

    if (response.success) {
      await fetchInvestments();
      await fetchSummary();
    } else {
      throw new Error(response.message || 'Failed to delete investment');
    }
  };

  const openEditModal = (investment: Investment) => {
    setSelectedInvestment(investment);
    setIsModalOpen(true);
  };

  const openDeleteModal = (investment: Investment) => {
    setSelectedInvestment(investment);
    setIsDeleteModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedInvestment(null);
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
        <p className="text-subtext dark:text-gray-400">Please select a group to view investments</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modals */}
      <InvestmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={selectedInvestment ? handleUpdateInvestment : handleCreateInvestment}
        investment={selectedInvestment}
        groupId={currentGroup.id}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteInvestment}
        investment={selectedInvestment}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Invested"
          value={isSummaryLoading ? '...' : formatCurrency(summary?.totalInvested ?? 0)}
          icon={<TrendingUp size={28} className="text-[#396AFF]" />}
          subtext={`${summary?.totalCount ?? 0} investments`}
        />
        <StatCard
          title="Current Value"
          value={isSummaryLoading ? '...' : formatCurrency(summary?.currentValue ?? 0)}
          icon={<CircleDollarSign size={28} className="text-[#16DBCC]" />}
          subtext="Portfolio value"
        />
        <StatCard
          title="Active Investments"
          value={isSummaryLoading ? '...' : String(summary?.activeCount ?? 0)}
          icon={<BarChart3 size={28} className="text-green-500" />}
          subtext={`${summary?.maturedCount ?? 0} matured`}
        />
        <StatCard
          title="Redeemed"
          value={isSummaryLoading ? '...' : String(summary?.redeemedCount ?? 0)}
          icon={<Banknote size={28} className="text-[#FF82AC]" />}
          subtext="Investments redeemed"
        />
      </div>

      {/* Investments Table */}
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-3xl shadow-sm transition-colors">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-xl font-bold text-dark dark:text-white">Investments</h3>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            Record Investment
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
                placeholder="Search investments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-dark dark:text-white placeholder-subtext dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary w-48"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-subtext dark:text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="All">All Statuses</option>
                {INVESTMENT_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
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
            <button onClick={fetchInvestments} className="mt-2 text-primary hover:underline">
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
                    <th className="pb-4 pl-4 whitespace-nowrap">Name</th>
                    <th className="pb-4 whitespace-nowrap">Type</th>
                    <th className="pb-4 whitespace-nowrap">Date</th>
                    <th className="pb-4 text-right whitespace-nowrap">Amount</th>
                    <th className="pb-4 text-right whitespace-nowrap">Current Value</th>
                    <th className="pb-4 whitespace-nowrap">Status</th>
                    <th className="pb-4 text-right pr-4 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvestments.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700">
                      <td className="py-4 pl-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-primary shrink-0">
                            <TrendingUp size={14} />
                          </div>
                          <div>
                            <p className="font-medium text-dark dark:text-white">{inv.name}</p>
                            {inv.receiptNumber && (
                              <p className="text-xs text-subtext dark:text-gray-500">#{inv.receiptNumber}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 whitespace-nowrap">
                        <TypeBadge type={inv.type} />
                      </td>
                      <td className="py-4 text-subtext dark:text-gray-400 whitespace-nowrap">
                        {formatDate(inv.investmentDate)}
                      </td>
                      <td className="py-4 text-right font-bold text-dark dark:text-white whitespace-nowrap">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-4 text-right font-bold whitespace-nowrap">
                        <span className={inv.currentValue != null && inv.currentValue >= inv.amount ? 'text-green-500' : 'text-red-500'}>
                          {formatCurrency(inv.currentValue ?? inv.amount)}
                        </span>
                      </td>
                      <td className="py-4 whitespace-nowrap">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-4 text-right pr-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(inv)}
                            className="p-2 text-subtext hover:text-primary hover:bg-blue-50 dark:hover:bg-gray-600 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(inv)}
                            className="p-2 text-subtext hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-600 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInvestments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-subtext dark:text-gray-400">
                        No investments found.
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

export default Investments;
