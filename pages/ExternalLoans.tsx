import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Loader2, AlertCircle, Search, ChevronDown, ChevronUp,
  User, Phone, Mail, Building2, Calendar, DollarSign, Clock,
  CheckCircle, XCircle, AlertTriangle, Eye, Plus, X, Users
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import {
  loanService,
  LoanResponse,
  ExternalBorrowerResponse,
  LoanGuarantorResponse,
  GuarantorExposureResponse,
  GuarantorStatus,
  LoanStatus,
  ExternalBorrowerStatus
} from '../services/loanService';

// Status badge component for loan status
const LoanStatusBadge: React.FC<{ status: LoanStatus }> = ({ status }) => {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    PENDING: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', icon: <Clock size={14} /> },
    APPROVED: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', icon: <CheckCircle size={14} /> },
    DISBURSED: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', icon: <CheckCircle size={14} /> },
    ACTIVE: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', icon: <CheckCircle size={14} /> },
    PAID_OFF: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', icon: <CheckCircle size={14} /> },
    DEFAULTED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', icon: <XCircle size={14} /> },
    WRITTEN_OFF: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-500 dark:text-gray-400', icon: <XCircle size={14} /> },
    REJECTED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', icon: <XCircle size={14} /> },
  };

  const { bg, text, icon } = config[status] || config.PENDING;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {icon}
      {status.replace('_', ' ')}
    </span>
  );
};

// Guarantor status badge
const GuarantorStatusBadge: React.FC<{ status: GuarantorStatus }> = ({ status }) => {
  const config: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400' },
    ACTIVE: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
    RELEASED: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
    DEFAULTED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
    DECLINED: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-500 dark:text-gray-400' },
  };

  const { bg, text } = config[status] || config.PENDING;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {status}
    </span>
  );
};

// Borrower status badge
const BorrowerStatusBadge: React.FC<{ status: ExternalBorrowerStatus }> = ({ status }) => {
  const config: Record<string, { bg: string; text: string }> = {
    ACTIVE: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
    SUSPENDED: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400' },
    BLACKLISTED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
    INACTIVE: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-500 dark:text-gray-400' },
  };

  const { bg, text } = config[status] || config.INACTIVE;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {status}
    </span>
  );
};

// Loan detail row component for expandable view
const LoanDetailRow: React.FC<{
  loan: LoanResponse;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ loan, formatCurrency, formatDate, isExpanded, onToggle }) => {
  // Get guarantor names summary
  const guarantorNames = loan.guarantors?.map(g => g.memberName) || [];
  const guarantorDisplay = guarantorNames.length > 0
    ? guarantorNames.length === 1
      ? guarantorNames[0]
      : `${guarantorNames[0]} +${guarantorNames.length - 1}`
    : '-';

  return (
    <>
      <tr
        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="py-4 pl-4">
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span className="font-mono text-sm text-primary">{loan.loanNumber}</span>
          </div>
        </td>
        <td className="py-4 font-medium text-dark dark:text-white">{loan.borrowerName}</td>
        <td className="py-4">
          {guarantorNames.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {guarantorNames.slice(0, 2).map((name, idx) => (
                  <div
                    key={idx}
                    className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold border-2 border-white dark:border-gray-800"
                    title={name}
                  >
                    {name.split(' ').map(n => n[0]).join('')}
                  </div>
                ))}
                {guarantorNames.length > 2 && (
                  <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-subtext dark:text-gray-400 border-2 border-white dark:border-gray-800">
                    +{guarantorNames.length - 2}
                  </div>
                )}
              </div>
              <span className="text-sm text-dark dark:text-white hidden xl:inline">{guarantorDisplay}</span>
            </div>
          ) : (
            <span className="text-subtext dark:text-gray-400">-</span>
          )}
        </td>
        <td className="py-4 text-subtext dark:text-gray-400">{formatCurrency(loan.principalAmount)}</td>
        <td className="py-4 text-subtext dark:text-gray-400">{formatCurrency(loan.outstandingBalance)}</td>
        <td className="py-4"><LoanStatusBadge status={loan.status} /></td>
        <td className="py-4 pr-4 text-subtext dark:text-gray-400">{formatDate(loan.disbursementDate)}</td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50 dark:bg-gray-700/50">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Loan Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-dark dark:text-white text-sm">Loan Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-subtext dark:text-gray-400">Interest Rate:</span>
                    <span className="ml-2 text-dark dark:text-white">{(loan.interestRate * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-subtext dark:text-gray-400">Total Due:</span>
                    <span className="ml-2 text-dark dark:text-white">{formatCurrency(loan.totalAmountDue)}</span>
                  </div>
                  <div>
                    <span className="text-subtext dark:text-gray-400">Interest Accrued:</span>
                    <span className="ml-2 text-dark dark:text-white">{formatCurrency(loan.totalInterestAccrued)}</span>
                  </div>
                  <div>
                    <span className="text-subtext dark:text-gray-400">Total Paid:</span>
                    <span className="ml-2 text-green-500">{formatCurrency(loan.totalAmountPaid)}</span>
                  </div>
                  <div>
                    <span className="text-subtext dark:text-gray-400">Expected End:</span>
                    <span className="ml-2 text-dark dark:text-white">{formatDate(loan.expectedEndDate)}</span>
                  </div>
                </div>
                {loan.notes && (
                  <div className="text-sm">
                    <span className="text-subtext dark:text-gray-400">Notes:</span>
                    <p className="mt-1 text-dark dark:text-white">{loan.notes}</p>
                  </div>
                )}
              </div>

              {/* Guarantors */}
              <div className="space-y-3">
                <h4 className="font-bold text-dark dark:text-white text-sm">Guarantors</h4>
                {loan.guarantors && loan.guarantors.length > 0 ? (
                  <div className="space-y-2">
                    {loan.guarantors.map((guarantor) => (
                      <div
                        key={guarantor.id}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {guarantor.memberName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-dark dark:text-white">{guarantor.memberName}</p>
                            <p className="text-xs text-subtext dark:text-gray-400">
                              {guarantor.guaranteePercentage}% ({formatCurrency(guarantor.guaranteedAmount || (loan.outstandingBalance * guarantor.guaranteePercentage / 100))})
                            </p>
                          </div>
                        </div>
                        <GuarantorStatusBadge status={guarantor.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-subtext dark:text-gray-400">No guarantors assigned</p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// Main External Loans Page
const ExternalLoans: React.FC = () => {
  const { user } = useAuth();
  const { currentGroup, formatCurrency, formatDate } = useAppData();

  // Role check
  const isAdminOrTreasurer = user?.role === 'ADMIN' || user?.role === 'TREASURER';

  // Data state
  const [guaranteedLoans, setGuaranteedLoans] = useState<LoanResponse[]>([]);
  const [myExposure, setMyExposure] = useState<GuarantorExposureResponse | null>(null);
  const [externalBorrowers, setExternalBorrowers] = useState<ExternalBorrowerResponse[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'loans' | 'borrowers'>('loans');

  // Fetch data based on role
  const fetchData = useCallback(async () => {
    if (!user?.member?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      if (isAdminOrTreasurer && currentGroup?.id) {
        // Admin/Treasurer: Fetch all guaranteed loans for the group
        const [loans, borrowers] = await Promise.all([
          loanService.getGuaranteedLoans(currentGroup.id),
          loanService.getExternalBorrowers(currentGroup.id),
        ]);
        setGuaranteedLoans(loans);
        setExternalBorrowers(borrowers);
      } else {
        // Member: Fetch only their guarantor exposure
        const exposure = await loanService.getGuarantorExposure(user.member.id);
        setMyExposure(exposure);

        // Extract loans from active guarantees
        // Since activeGuarantees contains LoanGuarantorResponse, we need to fetch full loan details
        if (exposure.activeGuarantees && exposure.activeGuarantees.length > 0) {
          const loanPromises = exposure.activeGuarantees.map(g =>
            loanService.getLoanById(g.loanId).catch(() => null)
          );
          const loans = await Promise.all(loanPromises);
          setGuaranteedLoans(loans.filter((l): l is LoanResponse => l !== null));
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.member?.id, isAdminOrTreasurer, currentGroup?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter loans by search
  const filteredLoans = guaranteedLoans.filter(loan => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      loan.loanNumber.toLowerCase().includes(query) ||
      loan.borrowerName.toLowerCase().includes(query) ||
      loan.guarantors?.some(g => g.memberName.toLowerCase().includes(query))
    );
  });

  // Filter borrowers by search
  const filteredBorrowers = externalBorrowers.filter(borrower => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      borrower.fullName.toLowerCase().includes(query) ||
      borrower.phoneNumber.includes(query) ||
      borrower.email?.toLowerCase().includes(query)
    );
  });

  // Calculate summary stats
  const stats = {
    totalLoans: guaranteedLoans.length,
    activeLoans: guaranteedLoans.filter(l => ['ACTIVE', 'DISBURSED'].includes(l.status)).length,
    totalOutstanding: guaranteedLoans.reduce((sum, l) => sum + l.outstandingBalance, 0),
    totalBorrowers: externalBorrowers.length,
    myExposure: myExposure?.currentExposure || 0,
    myGuarantees: myExposure?.activeGuaranteesCount || 0,
  };

  if (!user?.member?.id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-subtext dark:text-gray-400">Please log in to view external loans</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isAdminOrTreasurer ? (
          <>
            <StatCard
              title="Total Guaranteed Loans"
              value={stats.totalLoans.toString()}
              icon={<Shield size={28} className="text-[#396AFF]" />}
              subtext={`${stats.activeLoans} active`}
            />
            <StatCard
              title="Total Outstanding"
              value={formatCurrency(stats.totalOutstanding)}
              icon={<DollarSign size={28} className="text-[#FF82AC]" />}
              subtext="Across all loans"
            />
            <StatCard
              title="External Borrowers"
              value={stats.totalBorrowers.toString()}
              icon={<Users size={28} className="text-[#16DBCC]" />}
              subtext="Registered borrowers"
            />
          </>
        ) : (
          <>
            <StatCard
              title="My Guarantees"
              value={stats.myGuarantees.toString()}
              icon={<Shield size={28} className="text-[#396AFF]" />}
              subtext="Active guarantees"
            />
            <StatCard
              title="Current Exposure"
              value={formatCurrency(stats.myExposure)}
              icon={<AlertTriangle size={28} className="text-[#FF82AC]" />}
              subtext="Total guaranteed amount"
            />
            <StatCard
              title="Available Exposure"
              value={formatCurrency(myExposure?.availableExposure || 0)}
              icon={<CheckCircle size={28} className="text-[#16DBCC]" />}
              subtext={`Max: ${formatCurrency(myExposure?.maxExposureLimit || 0)}`}
            />
          </>
        )}
      </div>

      {/* My Exposure Summary (for members) */}
      {!isAdminOrTreasurer && myExposure && (
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-3xl shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-dark dark:text-white mb-4">My Guarantor Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-bgLight dark:bg-gray-700 rounded-xl p-4">
              <p className="text-subtext dark:text-gray-400 text-sm">Total Contributions</p>
              <p className="text-xl font-bold text-dark dark:text-white">{formatCurrency(myExposure.totalContributions)}</p>
            </div>
            <div className="bg-bgLight dark:bg-gray-700 rounded-xl p-4">
              <p className="text-subtext dark:text-gray-400 text-sm">Max Exposure Limit</p>
              <p className="text-xl font-bold text-dark dark:text-white">{formatCurrency(myExposure.maxExposureLimit)}</p>
            </div>
            <div className="bg-bgLight dark:bg-gray-700 rounded-xl p-4">
              <p className="text-subtext dark:text-gray-400 text-sm">Current Exposure</p>
              <p className="text-xl font-bold text-yellow-500">{formatCurrency(myExposure.currentExposure)}</p>
            </div>
            <div className="bg-bgLight dark:bg-gray-700 rounded-xl p-4">
              <p className="text-subtext dark:text-gray-400 text-sm">Paid on Behalf</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(myExposure.totalPaidOnBehalf)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-3xl shadow-sm transition-colors">
        {/* Header with Tabs (Admin/Treasurer only) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-dark dark:text-white">
              {isAdminOrTreasurer ? 'External Guaranteed Loans' : 'My Guaranteed Loans'}
            </h3>
            <p className="text-sm text-subtext dark:text-gray-400 mt-1">
              {isAdminOrTreasurer
                ? 'View and manage all loans guaranteed by group members'
                : 'Loans you are guaranteeing for external borrowers'}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtext dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search loans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-dark dark:text-white placeholder-subtext dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Tabs (Admin/Treasurer only) */}
        {isAdminOrTreasurer && (
          <div className="flex gap-8 mb-6 border-b border-gray-100 dark:border-gray-700 pb-1">
            <button
              onClick={() => setActiveTab('loans')}
              className={`text-base font-medium pb-3 px-2 transition-colors relative ${
                activeTab === 'loans'
                  ? 'text-primary'
                  : 'text-subtext dark:text-gray-400 hover:text-dark dark:hover:text-white'
              }`}
            >
              Guaranteed Loans
              {activeTab === 'loans' && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-lg"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('borrowers')}
              className={`text-base font-medium pb-3 px-2 transition-colors relative ${
                activeTab === 'borrowers'
                  ? 'text-primary'
                  : 'text-subtext dark:text-gray-400 hover:text-dark dark:hover:text-white'
              }`}
            >
              External Borrowers
              {activeTab === 'borrowers' && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-lg"></div>
              )}
            </button>
          </div>
        )}

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
            <button onClick={fetchData} className="mt-2 text-primary hover:underline">
              Try again
            </button>
          </div>
        )}

        {/* Loans Table */}
        {!isLoading && !error && (activeTab === 'loans' || !isAdminOrTreasurer) && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead className="border-b border-gray-100 dark:border-gray-700">
                <tr className="text-left text-subtext dark:text-gray-400 text-sm font-medium">
                  <th className="pb-4 pl-4">Loan #</th>
                  <th className="pb-4">Borrower</th>
                  <th className="pb-4">Guarantor(s)</th>
                  <th className="pb-4">Principal</th>
                  <th className="pb-4">Outstanding</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 pr-4">Disbursed</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((loan) => (
                  <LoanDetailRow
                    key={loan.id}
                    loan={loan}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    isExpanded={expandedLoanId === loan.id}
                    onToggle={() => setExpandedLoanId(expandedLoanId === loan.id ? null : loan.id)}
                  />
                ))}
                {filteredLoans.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-subtext dark:text-gray-400">
                      <Shield size={48} className="mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No guaranteed loans found</p>
                      <p className="text-sm mt-1">
                        {isAdminOrTreasurer
                          ? 'Create a guaranteed loan to get started'
                          : "You haven't guaranteed any external loans yet"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* External Borrowers Table (Admin/Treasurer only) */}
        {!isLoading && !error && isAdminOrTreasurer && activeTab === 'borrowers' && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="border-b border-gray-100 dark:border-gray-700">
                <tr className="text-left text-subtext dark:text-gray-400 text-sm font-medium">
                  <th className="pb-4 pl-4">Name</th>
                  <th className="pb-4">Phone</th>
                  <th className="pb-4">Email</th>
                  <th className="pb-4">Active Loans</th>
                  <th className="pb-4">Outstanding</th>
                  <th className="pb-4 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBorrowers.map((borrower) => (
                  <tr key={borrower.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-4 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {borrower.firstName[0]}{borrower.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-dark dark:text-white">{borrower.fullName}</p>
                          {borrower.employer && (
                            <p className="text-xs text-subtext dark:text-gray-400">{borrower.employer}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-subtext dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Phone size={14} />
                        {borrower.phoneNumber}
                      </div>
                    </td>
                    <td className="py-4 text-subtext dark:text-gray-400">
                      {borrower.email ? (
                        <div className="flex items-center gap-1">
                          <Mail size={14} />
                          {borrower.email}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-4 text-dark dark:text-white font-medium">
                      {borrower.activeLoansCount}
                    </td>
                    <td className="py-4 text-red-500 font-medium">
                      {formatCurrency(borrower.totalOutstanding)}
                    </td>
                    <td className="py-4 pr-4">
                      <BorrowerStatusBadge status={borrower.status} />
                    </td>
                  </tr>
                ))}
                {filteredBorrowers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-subtext dark:text-gray-400">
                      <Users size={48} className="mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No external borrowers found</p>
                      <p className="text-sm mt-1">Register an external borrower to issue guaranteed loans</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExternalLoans;
