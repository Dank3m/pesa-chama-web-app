import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, XCircle, DollarSign, Clock, Wallet,
  CreditCard, Loader2, AlertCircle, X, Ban, History
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import api from '../services/api';

// --- Types ---
interface Loan {
  id: string;
  loanNumber: string;
  memberId: string;
  memberName: string;
  loanType: string;
  principalAmount: number;
  interestRate: number;
  dailyInterestRate: number;
  disbursementDate: string | null;
  expectedEndDate: string;
  actualEndDate: string | null;
  totalInterestAccrued: number;
  totalAmountDue: number;
  totalAmountPaid: number;
  outstandingBalance: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'ACTIVE' | 'PAID_OFF' | 'DEFAULTED' | 'WRITTEN_OFF';
  rejectionReason?: string;
  daysActive: number;
  createdAt: string;
}

interface DisbursementStats {
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  totalDisbursed: number;
  activeLoansCount: number;
  rejectedCount?: number;
  rejectedAmount?: number;
  disbursedCount?: number;
}

type TabType = 'action-required' | 'disbursed' | 'rejected';

// --- Status Badge Component ---
const StatusBadge: React.FC<{ status: Loan['status'] }> = ({ status }) => {
  const config: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
    APPROVED: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
    REJECTED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
    DISBURSED: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
    ACTIVE: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
    PAID_OFF: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300' },
    DEFAULTED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
    WRITTEN_OFF: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-500 dark:text-gray-400' },
  };

  const { bg, text } = config[status] || config.PENDING;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

// --- Loan Type Badge Component ---
const LoanTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const config: Record<string, { bg: string; text: string }> = {
    REGULAR: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
    EMERGENCY: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
    CONTRIBUTION_DEFAULT: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
    GUARANTEED: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  };

  const { bg, text } = config[type] || { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' };
  const label = type.replace('_', ' ');

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

// --- Reject Modal Component ---
interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  loanNumber: string;
  memberName: string;
  amount: number;
}

const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loanNumber,
  memberName,
  amount
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { formatCurrency } = useAppData();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (error) {
      console.error('Failed to reject loan:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-dark dark:text-white">Reject Loan Application</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
          >
            <X size={20} className="text-subtext" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400">
            You are about to reject the loan application:
          </p>
          <p className="mt-1 font-medium text-dark dark:text-white">
            {memberName} - {loanNumber}
          </p>
          <p className="text-sm text-subtext dark:text-gray-400">
            Amount: {formatCurrency(amount)}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-1">
              Rejection Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder="Enter the reason for rejection..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-subtext hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle size={16} />
                  Reject Loan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Component ---
const Disbursements: React.FC = () => {
  const { user } = useAuth();
  const { currentGroup, formatCurrency, formatDate } = useAppData();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('action-required');

  // State for each tab's loans
  const [actionRequiredLoans, setActionRequiredLoans] = useState<Loan[]>([]);
  const [disbursedLoans, setDisbursedLoans] = useState<Loan[]>([]);
  const [rejectedLoans, setRejectedLoans] = useState<Loan[]>([]);

  const [stats, setStats] = useState<DisbursementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Reject modal state
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    loan: Loan | null;
  }>({ isOpen: false, loan: null });

  // Fetch pending and approved loans (action required)
  const fetchActionRequiredLoans = useCallback(async () => {
    if (!currentGroup?.id) return;

    try {
      const response = await api.get<Loan[]>(`/loans/group/${currentGroup.id}/pending-approved`);
      setActionRequiredLoans(response.data || []);
    } catch (err: any) {
      console.error('Error fetching action required loans:', err);
    }
  }, [currentGroup?.id]);

  // Fetch disbursed loans
  const fetchDisbursedLoans = useCallback(async () => {
    if (!currentGroup?.id) return;

    try {
      const response = await api.get<{ content: Loan[] }>(`/loans/group/${currentGroup.id}?status=DISBURSED&size=100`);
      setDisbursedLoans(response.data?.content || []);
    } catch (err: any) {
      console.error('Error fetching disbursed loans:', err);
    }
  }, [currentGroup?.id]);

  // Fetch rejected loans
  const fetchRejectedLoans = useCallback(async () => {
    if (!currentGroup?.id) return;

    try {
      const response = await api.get<{ content: Loan[] }>(`/loans/group/${currentGroup.id}?status=REJECTED&size=100`);
      setRejectedLoans(response.data?.content || []);
    } catch (err: any) {
      console.error('Error fetching rejected loans:', err);
    }
  }, [currentGroup?.id]);

  // Fetch all loans based on active tab
  const fetchLoans = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Always fetch action required for stats
      await fetchActionRequiredLoans();

      // Fetch based on active tab
      if (activeTab === 'disbursed') {
        await fetchDisbursedLoans();
      } else if (activeTab === 'rejected') {
        await fetchRejectedLoans();
      }
    } catch (err: any) {
      console.error('Error fetching loans:', err);
      setError(err.message || 'Failed to fetch loans');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, fetchActionRequiredLoans, fetchDisbursedLoans, fetchRejectedLoans]);

  // Fetch disbursement stats
  const fetchStats = useCallback(async () => {
    if (!currentGroup?.id) return;

    setIsStatsLoading(true);

    try {
      const response = await api.get<DisbursementStats>(`/loans/group/${currentGroup.id}/disbursement-stats`);
      setStats(response.data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, [currentGroup?.id]);

  // Initial fetch
  useEffect(() => {
    fetchLoans();
    fetchStats();
  }, [fetchLoans, fetchStats]);

  // Fetch tab-specific data when tab changes
  useEffect(() => {
    if (activeTab === 'disbursed' && disbursedLoans.length === 0) {
      fetchDisbursedLoans();
    } else if (activeTab === 'rejected' && rejectedLoans.length === 0) {
      fetchRejectedLoans();
    }
  }, [activeTab, disbursedLoans.length, rejectedLoans.length, fetchDisbursedLoans, fetchRejectedLoans]);

  // Approve loan handler
  const handleApprove = async (loanId: string) => {
    setActionLoading(loanId);
    try {
      await api.post(`/loans/${loanId}/approve`);
      await Promise.all([fetchActionRequiredLoans(), fetchStats()]);
    } catch (err: any) {
      console.error('Error approving loan:', err);
      setError(err.message || 'Failed to approve loan');
    } finally {
      setActionLoading(null);
    }
  };

  // Reject loan handler
  const handleReject = async (reason: string) => {
    if (!rejectModal.loan) return;

    const loanId = rejectModal.loan.id;
    setActionLoading(loanId);
    try {
      await api.post(`/loans/${loanId}/reject`, { reason });
      await Promise.all([fetchActionRequiredLoans(), fetchRejectedLoans(), fetchStats()]);
    } catch (err: any) {
      console.error('Error rejecting loan:', err);
      throw err;
    } finally {
      setActionLoading(null);
    }
  };

  // Disburse loan handler
  const handleDisburse = async (loanId: string) => {
    setActionLoading(loanId);
    try {
      await api.post(`/loans/${loanId}/disburse`);
      await Promise.all([fetchActionRequiredLoans(), fetchDisbursedLoans(), fetchStats()]);
    } catch (err: any) {
      console.error('Error disbursing loan:', err);
      setError(err.message || 'Failed to disburse loan');
    } finally {
      setActionLoading(null);
    }
  };

  // Get current loans based on active tab
  const getCurrentLoans = (): Loan[] => {
    switch (activeTab) {
      case 'disbursed':
        return disbursedLoans;
      case 'rejected':
        return rejectedLoans;
      default:
        return actionRequiredLoans;
    }
  };

  // Check permissions
  const userRole = user?.role || user?.member?.role;
  const hasPermission = userRole === 'ADMIN' || userRole === 'TREASURER' ||
                       userRole === 'Admin' || userRole === 'Treasurer';

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-subtext dark:text-gray-400">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
          <p>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const currentLoans = getCurrentLoans();

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Approval"
          value={isStatsLoading ? '...' : `${stats?.pendingCount || 0}`}
          subtext={isStatsLoading ? '' : formatCurrency(stats?.pendingAmount || 0)}
          icon={<Clock size={28} className="text-[#FFBB38]" />}
        />
        <StatCard
          title="Awaiting Disbursement"
          value={isStatsLoading ? '...' : `${stats?.approvedCount || 0}`}
          subtext={isStatsLoading ? '' : formatCurrency(stats?.approvedAmount || 0)}
          icon={<CheckCircle size={28} className="text-green-500" />}
        />
        <StatCard
          title="Total Disbursed"
          value={isStatsLoading ? '...' : formatCurrency(stats?.totalDisbursed || 0)}
          icon={<Wallet size={28} className="text-[#396AFF]" />}
        />
        <StatCard
          title="Active Loans"
          value={isStatsLoading ? '...' : `${stats?.activeLoansCount || 0}`}
          icon={<CreditCard size={28} className="text-[#16DBCC]" />}
        />
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-3xl shadow-sm transition-colors">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-dark dark:text-white mb-2">
            Loan Disbursements & Approvals
          </h3>
          <p className="text-subtext dark:text-gray-400">
            Manage member loan applications. Approve pending requests, disburse funds, and view loan history.
            {currentGroup && (
              <span className="block mt-1 text-xs text-primary font-medium">
                Viewing requests for {currentGroup.name}
              </span>
            )}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('action-required')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors relative ${
              activeTab === 'action-required'
                ? 'text-primary'
                : 'text-subtext dark:text-gray-400 hover:text-dark dark:hover:text-white'
            }`}
          >
            <Clock size={16} />
            Action Required
            {actionRequiredLoans.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                {actionRequiredLoans.length}
              </span>
            )}
            {activeTab === 'action-required' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('disbursed')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors relative ${
              activeTab === 'disbursed'
                ? 'text-primary'
                : 'text-subtext dark:text-gray-400 hover:text-dark dark:hover:text-white'
            }`}
          >
            <DollarSign size={16} />
            Disbursed
            {disbursedLoans.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {disbursedLoans.length}
              </span>
            )}
            {activeTab === 'disbursed' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors relative ${
              activeTab === 'rejected'
                ? 'text-primary'
                : 'text-subtext dark:text-gray-400 hover:text-dark dark:hover:text-white'
            }`}
          >
            <Ban size={16} />
            Rejected
            {rejectedLoans.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {rejectedLoans.length}
              </span>
            )}
            {activeTab === 'rejected' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded"
            >
              <X size={16} className="text-red-500" />
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <table className="w-full min-w-[900px]">
              <thead className="bg-bgLight dark:bg-gray-700 text-subtext dark:text-gray-300 text-left text-sm font-medium rounded-xl">
                <tr>
                  <th className="p-4 rounded-l-xl whitespace-nowrap">Applicant</th>
                  <th className="p-4 whitespace-nowrap">Loan #</th>
                  <th className="p-4 whitespace-nowrap">Amount</th>
                  <th className="p-4 whitespace-nowrap">Type</th>
                  <th className="p-4 whitespace-nowrap">
                    {activeTab === 'disbursed' ? 'Disbursed Date' : activeTab === 'rejected' ? 'Date Applied' : 'Date Applied'}
                  </th>
                  <th className="p-4 whitespace-nowrap">Status</th>
                  {activeTab === 'rejected' && (
                    <th className="p-4 whitespace-nowrap">Reason</th>
                  )}
                  {activeTab === 'disbursed' && (
                    <th className="p-4 whitespace-nowrap">Outstanding</th>
                  )}
                  {activeTab === 'action-required' && (
                    <th className="p-4 rounded-r-xl whitespace-nowrap text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="text-dark dark:text-gray-200">
                {currentLoans.map(loan => (
                  <tr
                    key={loan.id}
                    className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                  >
                    <td className="p-4 font-medium text-dark dark:text-white whitespace-nowrap">
                      {loan.memberName}
                    </td>
                    <td className="p-4 text-subtext dark:text-gray-400 whitespace-nowrap">
                      {loan.loanNumber}
                    </td>
                    <td className="p-4 font-bold text-primary whitespace-nowrap">
                      {formatCurrency(loan.principalAmount)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <LoanTypeBadge type={loan.loanType} />
                    </td>
                    <td className="p-4 text-subtext dark:text-gray-400 whitespace-nowrap">
                      {activeTab === 'disbursed' && loan.disbursementDate
                        ? formatDate(loan.disbursementDate)
                        : formatDate(loan.createdAt)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <StatusBadge status={loan.status} />
                    </td>
                    {activeTab === 'rejected' && (
                      <td className="p-4 text-subtext dark:text-gray-400 max-w-[200px] truncate" title={loan.rejectionReason || 'No reason provided'}>
                        {loan.rejectionReason || <span className="italic text-gray-400">No reason provided</span>}
                      </td>
                    )}
                    {activeTab === 'disbursed' && (
                      <td className="p-4 font-medium whitespace-nowrap">
                        {loan.outstandingBalance > 0 ? (
                          <span className="text-orange-600 dark:text-orange-400">
                            {formatCurrency(loan.outstandingBalance)}
                          </span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">Paid Off</span>
                        )}
                      </td>
                    )}
                    {activeTab === 'action-required' && (
                      <td className="p-4 flex justify-end gap-2 whitespace-nowrap">
                        {loan.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(loan.id)}
                              disabled={actionLoading === loan.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 whitespace-nowrap transition disabled:opacity-50"
                            >
                              {actionLoading === loan.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <CheckCircle size={14} />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectModal({ isOpen: true, loan })}
                              disabled={actionLoading === loan.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 whitespace-nowrap transition disabled:opacity-50"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}
                        {loan.status === 'APPROVED' && (
                          <button
                            onClick={() => handleDisburse(loan.id)}
                            disabled={actionLoading === loan.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs hover:bg-blue-600 whitespace-nowrap transition disabled:opacity-50"
                          >
                            {actionLoading === loan.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <DollarSign size={14} />
                            )}
                            Disburse Funds
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {currentLoans.length === 0 && (
                  <tr>
                    <td colSpan={activeTab === 'action-required' ? 7 : activeTab === 'rejected' ? 7 : 7} className="py-12 text-center text-subtext dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        {activeTab === 'action-required' ? (
                          <>
                            <CheckCircle size={32} className="text-gray-200 dark:text-gray-600" />
                            <p>No pending loans requiring action.</p>
                          </>
                        ) : activeTab === 'disbursed' ? (
                          <>
                            <History size={32} className="text-gray-200 dark:text-gray-600" />
                            <p>No disbursed loans found.</p>
                          </>
                        ) : (
                          <>
                            <Ban size={32} className="text-gray-200 dark:text-gray-600" />
                            <p>No rejected loans found.</p>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <RejectModal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, loan: null })}
        onConfirm={handleReject}
        loanNumber={rejectModal.loan?.loanNumber || ''}
        memberName={rejectModal.loan?.memberName || ''}
        amount={rejectModal.loan?.principalAmount || 0}
      />
    </div>
  );
};

export default Disbursements;
