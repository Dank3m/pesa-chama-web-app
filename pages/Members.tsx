import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Mail, Phone, Calendar, ShieldCheck, Plus, X, Loader2,
  AlertCircle, Edit2, Eye, Search, Filter, UserCheck, UserX,
  UserMinus, Banknote, CreditCard, ChevronDown, Send
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import api from '../services/api';

// --- Types ---
interface Member {
  id: string;
  groupId: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phoneNumber: string;
  nationalId: string | null;
  dateOfBirth: string | null;
  address: string | null;
  joinDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LEFT';
  isAdmin: boolean;
  createdAt: string;
}

interface MemberBalance {
  id: string;
  memberId: string;
  financialYearId: string;
  yearName: string;
  totalContributions: number;
  totalLoansTaken: number;
  totalLoanRepayments: number;
  outstandingLoanBalance: number;
  shareValue: number;
  lastCalculatedAt: string;
}

interface LoanSummary {
  id: string;
  loanNumber: string;
  loanType: string;
  principalAmount: number;
  outstandingBalance: number;
  status: string;
  disbursementDate: string;
}

interface ContributionSummary {
  id: string;
  cycleMonth: string;
  expectedAmount: number;
  paidAmount: number;
  status: string;
}

interface MemberDetail {
  member: Member;
  currentBalance: MemberBalance | null;
  recentContributions: ContributionSummary[];
  activeLoans: LoanSummary[];
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

interface MemberStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  left: number;
  admins: number;
}

const MEMBER_STATUSES = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-600', icon: UserCheck },
  { value: 'INACTIVE', label: 'Inactive', color: 'bg-gray-100 text-gray-600', icon: UserMinus },
  { value: 'SUSPENDED', label: 'Suspended', color: 'bg-yellow-100 text-yellow-600', icon: UserX },
  { value: 'LEFT', label: 'Left', color: 'bg-red-100 text-red-600', icon: UserX }
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// --- Status Badge Component ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = MEMBER_STATUSES.find(s => s.value === status) || MEMBER_STATUSES[0];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

// --- Role Badge Component ---
const RoleBadge: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  if (isAdmin) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
        <ShieldCheck size={12} />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200">
      Member
    </span>
  );
};

// --- Member Form Data ---
interface MemberFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  nationalId: string;
  dateOfBirth: string;
  address: string;
  isAdmin: boolean;
}

// --- Member Modal Component ---
interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MemberFormData) => Promise<void>;
  member?: Member | null;
  groupId: string;
}

const MemberModal: React.FC<MemberModalProps> = ({ isOpen, onClose, onSubmit, member, groupId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<MemberFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    nationalId: '',
    dateOfBirth: '',
    address: '',
    isAdmin: false
  });

  useEffect(() => {
    if (isOpen) {
      if (member) {
        setFormData({
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email || '',
          phoneNumber: member.phoneNumber,
          nationalId: member.nationalId || '',
          dateOfBirth: member.dateOfBirth || '',
          address: member.address || '',
          isAdmin: member.isAdmin
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          nationalId: '',
          dateOfBirth: '',
          address: '',
          isAdmin: false
        });
      }
      setError(null);
    }
  }, [isOpen, member]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] transition-colors">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700 shrink-0">
          <h3 className="text-xl font-bold text-dark dark:text-white">
            {member ? 'Edit Member' : 'Add Member'}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">First Name *</label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Last Name *</label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="0712345678"
                pattern="^0[17]\d{8}$"
                title="Phone number should start with 07 or 01 and be 10 digits"
                className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@email.com"
                className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">National ID</label>
                <input
                  type="text"
                  maxLength={20}
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  placeholder="12345678"
                  className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street, Nairobi"
                className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isAdmin"
                checked={formData.isAdmin}
                onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isAdmin" className="text-sm font-medium text-dark dark:text-white">
                Grant admin privileges
              </label>
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
                {loading ? 'Saving...' : (member ? 'Update' : 'Add Member')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Member Detail Modal ---
interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string | null;
}

const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ isOpen, onClose, memberId }) => {
  const { formatCurrency, formatDate } = useAppData();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && memberId) {
      fetchMemberDetail();
    }
  }, [isOpen, memberId]);

  const fetchMemberDetail = async () => {
    if (!memberId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<MemberDetail>(`/members/${memberId}/details`);
      if (response.success && response.data) {
        setDetail(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch member details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] transition-colors">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700 shrink-0">
          <h3 className="text-xl font-bold text-dark dark:text-white">Member Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">
              <AlertCircle size={32} className="mx-auto mb-2" />
              <p>{error}</p>
            </div>
          )}

          {detail && !loading && (
            <div className="space-y-6">
              {/* Member Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                  {detail.member.firstName[0]}{detail.member.lastName[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-xl font-bold text-dark dark:text-white">{detail.member.fullName}</h4>
                    <StatusBadge status={detail.member.status} />
                    <RoleBadge isAdmin={detail.member.isAdmin} />
                  </div>
                  <p className="text-subtext dark:text-gray-400 text-sm">{detail.member.memberNumber}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bgLight dark:bg-gray-700 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-subtext dark:text-gray-400 text-sm mb-1">
                    <Phone size={14} /> Phone
                  </div>
                  <p className="font-medium text-dark dark:text-white">{detail.member.phoneNumber}</p>
                </div>
                <div className="bg-bgLight dark:bg-gray-700 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-subtext dark:text-gray-400 text-sm mb-1">
                    <Mail size={14} /> Email
                  </div>
                  <p className="font-medium text-dark dark:text-white">{detail.member.email || '-'}</p>
                </div>
                <div className="bg-bgLight dark:bg-gray-700 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-subtext dark:text-gray-400 text-sm mb-1">
                    <Calendar size={14} /> Joined
                  </div>
                  <p className="font-medium text-dark dark:text-white">{formatDate(detail.member.joinDate)}</p>
                </div>
                <div className="bg-bgLight dark:bg-gray-700 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-subtext dark:text-gray-400 text-sm mb-1">
                    National ID
                  </div>
                  <p className="font-medium text-dark dark:text-white">{detail.member.nationalId || '-'}</p>
                </div>
              </div>

              {/* Financial Summary */}
              {detail.currentBalance && (
                <div>
                  <h5 className="font-bold text-dark dark:text-white mb-3">Financial Summary</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-center">
                      <p className="text-xs text-green-600 dark:text-green-400 mb-1">Contributions</p>
                      <p className="font-bold text-green-700 dark:text-green-300">{formatCurrency(detail.currentBalance.totalContributions)}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-center">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Loans Taken</p>
                      <p className="font-bold text-blue-700 dark:text-blue-300">{formatCurrency(detail.currentBalance.totalLoansTaken)}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl text-center">
                      <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Repayments</p>
                      <p className="font-bold text-purple-700 dark:text-purple-300">{formatCurrency(detail.currentBalance.totalLoanRepayments)}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-center">
                      <p className="text-xs text-red-600 dark:text-red-400 mb-1">Outstanding</p>
                      <p className="font-bold text-red-700 dark:text-red-300">{formatCurrency(detail.currentBalance.outstandingLoanBalance)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Loans */}
              {detail.activeLoans && detail.activeLoans.length > 0 && (
                <div>
                  <h5 className="font-bold text-dark dark:text-white mb-3">Active Loans</h5>
                  <div className="space-y-2">
                    {detail.activeLoans.map(loan => (
                      <div key={loan.id} className="flex items-center justify-between p-3 bg-bgLight dark:bg-gray-700 rounded-xl">
                        <div>
                          <p className="font-medium text-dark dark:text-white">{loan.loanNumber}</p>
                          <p className="text-xs text-subtext dark:text-gray-400">{loan.loanType}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-dark dark:text-white">{formatCurrency(loan.outstandingBalance)}</p>
                          <p className="text-xs text-subtext dark:text-gray-400">of {formatCurrency(loan.principalAmount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Contributions */}
              {detail.recentContributions && detail.recentContributions.length > 0 && (
                <div>
                  <h5 className="font-bold text-dark dark:text-white mb-3">Recent Contributions</h5>
                  <div className="space-y-2">
                    {detail.recentContributions.slice(0, 3).map(contrib => (
                      <div key={contrib.id} className="flex items-center justify-between p-3 bg-bgLight dark:bg-gray-700 rounded-xl">
                        <div>
                          <p className="font-medium text-dark dark:text-white">{formatDate(contrib.cycleMonth)}</p>
                          <p className="text-xs text-subtext dark:text-gray-400">{contrib.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(contrib.paidAmount)}</p>
                          <p className="text-xs text-subtext dark:text-gray-400">of {formatCurrency(contrib.expectedAmount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-dark dark:text-white font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Status Change Dropdown ---
interface StatusDropdownProps {
  member: Member;
  onStatusChange: (memberId: string, status: string) => Promise<void>;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({ member, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (status: string) => {
    if (status === member.status) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      await onStatusChange(member.id, status);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-1 text-sm"
      >
        <StatusBadge status={member.status} />
        <ChevronDown size={14} className="text-subtext" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-20 min-w-[140px]">
            {MEMBER_STATUSES.map(status => (
              <button
                key={status.value}
                onClick={() => handleStatusChange(status.value)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${
                  member.status === status.value ? 'bg-gray-50 dark:bg-gray-700' : ''
                }`}
              >
                <status.icon size={14} />
                {status.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// --- Main Members Page ---
const Members: React.FC = () => {
  const { user } = useAuth();
  const { currentGroup, formatCurrency, formatDate } = useAppData();

  // Data state
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<MemberStats>({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    left: 0,
    admins: 0
  });

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Fetch member stats
  const fetchStats = useCallback(async () => {
    if (!currentGroup?.id) return;

    try {
      const response = await api.get<MemberStats>(`/members/group/${currentGroup.id}/stats`);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch member stats:', err);
    }
  }, [currentGroup?.id]);

  // Fetch members
  const fetchMembers = useCallback(async () => {
    if (!currentGroup?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<PagedResponse<Member>>(
        `/members/group/${currentGroup.id}/paginated`,
        { page: currentPage, size: pageSize }
      );
      if (response.success && response.data) {
        setMembers(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch members');
    } finally {
      setIsLoading(false);
    }
  }, [currentGroup?.id, currentPage, pageSize]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Fetch stats when group changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(0);
  }, [statusFilter, pageSize]);

  // Filter members locally
  const filteredMembers = members.filter(member => {
    const matchesStatus = statusFilter === 'All' || member.status === statusFilter;
    const matchesSearch = !searchQuery ||
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phoneNumber.includes(searchQuery) ||
      member.memberNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handlers
  const handleCreateMember = async (data: MemberFormData) => {
    if (!currentGroup?.id) throw new Error('No group selected');

    const response = await api.post<Member>('/members', {
      groupId: currentGroup.id,
      ...data
    });

    if (response.success) {
      await fetchMembers();
      await fetchStats();
    } else {
      throw new Error(response.message || 'Failed to create member');
    }
  };

  const handleUpdateMember = async (data: MemberFormData) => {
    if (!selectedMember || !currentGroup?.id) throw new Error('No member selected');

    const response = await api.put<Member>(`/members/${selectedMember.id}`, {
      groupId: currentGroup.id,
      ...data
    });

    if (response.success) {
      await fetchMembers();
      await fetchStats();
    } else {
      throw new Error(response.message || 'Failed to update member');
    }
  };

  const handleStatusChange = async (memberId: string, status: string) => {
    const response = await api.patch<Member>(`/members/${memberId}/status?status=${status}`);

    if (response.success) {
      await fetchMembers();
      await fetchStats();
    } else {
      throw new Error(response.message || 'Failed to update status');
    }
  };

  const openEditModal = (member: Member) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const openDetailModal = (member: Member) => {
    setSelectedMemberId(member.id);
    setIsDetailModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedMember(null);
    setIsModalOpen(true);
  };

  const [resendingId, setResendingId] = useState<string | null>(null);

  const handleResendInvitation = async (member: Member) => {
    if (!confirm(`Resend registration invitation to ${member.fullName}?`)) return;

    setResendingId(member.id);
    try {
      const response = await api.post<void>(`/members/${member.id}/resend-invitation`);
      if (response.success) {
        alert('Invitation resent successfully');
      } else {
        alert(response.message || 'Failed to resend invitation');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to resend invitation');
    } finally {
      setResendingId(null);
    }
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
        <p className="text-subtext dark:text-gray-400">Please select a group to view members</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modals */}
      <MemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={selectedMember ? handleUpdateMember : handleCreateMember}
        member={selectedMember}
        groupId={currentGroup.id}
      />

      <MemberDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        memberId={selectedMemberId}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Members"
          value={stats.total.toString()}
          icon={<Users size={28} className="text-[#396AFF]" />}
          subtext="All registered members"
        />
        <StatCard
          title="Active Members"
          value={stats.active.toString()}
          icon={<UserCheck size={28} className="text-green-500" />}
          subtext="Currently active"
        />
        <StatCard
          title="Inactive Members"
          value={(stats.inactive + stats.suspended + stats.left).toString()}
          icon={<UserMinus size={28} className="text-gray-500" />}
          subtext="Inactive, suspended or left"
        />
        <StatCard
          title="Administrators"
          value={stats.admins.toString()}
          icon={<ShieldCheck size={28} className="text-purple-500" />}
          subtext="With admin privileges"
        />
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-3xl shadow-sm transition-colors">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-dark dark:text-white">Group Members</h3>
            <p className="text-subtext dark:text-gray-400 text-sm">
              Manage members of {currentGroup.name}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            Add Member
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
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-dark dark:text-white placeholder-subtext dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary w-56"
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
                {MEMBER_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
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
            <button onClick={fetchMembers} className="mt-2 text-primary hover:underline">
              Try again
            </button>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <>
            <div className="overflow-x-auto pb-4">
              <table className="w-full min-w-[900px]">
                <thead className="bg-bgLight dark:bg-gray-700 text-subtext dark:text-gray-300 text-left text-sm font-medium rounded-xl">
                  <tr>
                    <th className="p-4 rounded-l-xl whitespace-nowrap">Member</th>
                    <th className="p-4 whitespace-nowrap">Contact</th>
                    <th className="p-4 whitespace-nowrap">Role</th>
                    <th className="p-4 whitespace-nowrap">Joined</th>
                    <th className="p-4 whitespace-nowrap">Status</th>
                    <th className="p-4 rounded-r-xl whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-dark dark:text-gray-200">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {member.firstName[0]}{member.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-dark dark:text-white">{member.fullName}</p>
                            <p className="text-xs text-subtext dark:text-gray-400">{member.memberNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-subtext dark:text-gray-400">
                            <Phone size={14} /> {member.phoneNumber}
                          </div>
                          {member.email && (
                            <div className="flex items-center gap-2 text-sm text-subtext dark:text-gray-400">
                              <Mail size={14} /> {member.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <RoleBadge isAdmin={member.isAdmin} />
                      </td>
                      <td className="p-4 whitespace-nowrap text-sm text-subtext dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          {formatDate(member.joinDate)}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <StatusDropdown member={member} onStatusChange={handleStatusChange} />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetailModal(member)}
                            className="p-2 text-subtext hover:text-primary hover:bg-blue-50 dark:hover:bg-gray-600 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-2 text-subtext hover:text-primary hover:bg-blue-50 dark:hover:bg-gray-600 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          {user?.role === 'ADMIN' && (
                            <button
                              onClick={() => handleResendInvitation(member)}
                              disabled={resendingId === member.id}
                              className="p-2 text-subtext hover:text-green-600 hover:bg-green-50 dark:hover:bg-gray-600 rounded-lg transition disabled:opacity-50"
                              title="Resend Invitation"
                            >
                              {resendingId === member.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-subtext dark:text-gray-400">
                        No members found.
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

export default Members;
