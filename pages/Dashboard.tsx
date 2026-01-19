import React, { useMemo } from 'react';
import { Wallet, CreditCard, TrendingUp, Users, ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../components/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { useCurrentCycle, useCycleSummary } from '../hooks/useData';

interface DashboardProps {
  isDark?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ isDark }) => {
  const chartTextColor = isDark ? '#9CA3AF' : '#718EBF';
  const chartGridColor = isDark ? '#374151' : '#F3F3F5';
  const tooltipBgColor = isDark ? '#1F2937' : '#FFFFFF';
  const tooltipTextColor = isDark ? '#F3F4F6' : '#343C6A';

  const { user } = useAuth();
  const { currentGroup, currentFinancialYear, dashboard, isDashboardLoading, formatCurrency, formatDate } = useAppData();
  
  const { data: currentCycle } = useCurrentCycle(currentGroup?.id);
  const { data: cycleSummary } = useCycleSummary(currentCycle?.id);

  // Stats from API
  const stats = useMemo(() => {
    if (!dashboard) {
      return {
        totalBalance: 0,
        totalContributions: 0,
        activeLoans: 0,
        memberCount: 0,
        collectionRate: 0,
      };
    }
    return {
      totalBalance: dashboard.totalBalance || 0,
      totalContributions: dashboard.totalContributions || 0,
      activeLoans: dashboard.activeLoans || 0,
      memberCount: dashboard.memberCount || 0,
      collectionRate: dashboard.collectionRate || 0,
    };
  }, [dashboard]);

  // Monthly activity from API
  const monthlyActivityData = useMemo(() => {
    if (!dashboard?.monthlyActivity?.length) {
      return Array.from({ length: 12 }, (_, i) => ({
        name: new Date(2025, i).toLocaleString('en', { month: 'short' }),
        contributions: 0,
        disbursements: 0,
      }));
    }
    return dashboard.monthlyActivity;
  }, [dashboard]);

  // Fund allocation from API
  const fundAllocation = useMemo(() => {
    if (!dashboard?.fundAllocation?.length) {
      return [
        { name: 'Loans Disbursed', value: 40, fill: '#2D60FF' },
        { name: 'Interest Earned', value: 30, fill: '#16DBCC' },
        { name: 'Expenses', value: 15, fill: '#FFBB38' },
        { name: 'Available', value: 15, fill: '#FF82AC' },
      ];
    }
    return dashboard.fundAllocation;
  }, [dashboard]);

  // Recent transactions from API
  const recentTransactions = useMemo(() => {
    if (!dashboard?.recentTransactions?.length) return [];
    return dashboard.recentTransactions.slice(0, 3).map(tx => ({
      id: tx.id,
      description: tx.description || tx.memberName || 'Transaction',
      category: tx.category || tx.type?.replace('_', ' ') || 'Other',
      date: tx.date,
      amount: tx.amount,
      type: tx.type === 'CONTRIBUTION' ? 'Credit' : 'Debit',
    }));
  }, [dashboard]);

  if (isDashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="text-subtext dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl text-dark dark:text-white font-bold mb-1">
              Welcome back, {user?.member?.fullName || 'Member'}! 👋
            </h2>
            <p className="text-subtext dark:text-gray-400">
              {currentGroup?.name || 'Your Chama'} • {currentFinancialYear?.yearName || 'Financial Year'}
            </p>
          </div>
          <div className="bg-primary rounded-2xl px-6 py-3">
            <p className="text-sm text-blue-100">Total Balance</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalBalance)}</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Contributions" 
          value={formatCurrency(stats.totalContributions)}
          icon={<Wallet size={28} className="text-[#FFBB38]" />}
          subtext="This year"
        />
        <StatCard 
          title="Active Loans" 
          value={stats.activeLoans.toString()}
          icon={<CreditCard size={28} className="text-[#396AFF]" />} 
          subtext="Outstanding balance"
        />
        <StatCard 
          title="Collection Rate" 
          value={`${stats.collectionRate.toFixed(1)}%`}
          icon={<TrendingUp size={28} className="text-[#FF82AC]" />} 
          subtext="This cycle"
        />
        <StatCard 
          title="Active Members" 
          value={stats.memberCount.toString()}
          icon={<Users size={28} className="text-[#16DBCC]" />} 
          subtext="Registered members"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Activity Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-3xl shadow-sm transition-colors">
          <h3 className="text-xl font-bold text-dark dark:text-white mb-6">Monthly Activity</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyActivityData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barSize={15}
                barGap={10}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartTextColor }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: chartTextColor }} 
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} 
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: '10px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    backgroundColor: tooltipBgColor,
                    color: tooltipTextColor
                  }}
                  itemStyle={{ color: tooltipTextColor }}
                />
                <Bar dataKey="contributions" name="Contributions" fill="#16DBCC" radius={[10, 10, 10, 10]} />
                <Bar dataKey="disbursements" name="Disbursements" fill="#1814F3" radius={[10, 10, 10, 10]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fund Allocation Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-3xl shadow-sm flex flex-col transition-colors">
          <h3 className="text-xl font-bold text-dark dark:text-white mb-6">Fund Allocation</h3>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fundAllocation}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {fundAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${value}%`}
                  contentStyle={{
                    borderRadius: '10px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    backgroundColor: tooltipBgColor,
                    color: tooltipTextColor
                  }}
                  itemStyle={{ color: tooltipTextColor }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {fundAllocation.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                <span className="text-sm text-subtext dark:text-gray-400">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-dark dark:text-white">Recent Transactions</h3>
            <button className="text-primary font-medium hover:underline">See All</button>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-subtext dark:text-gray-400">No recent transactions</div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <table className="w-full min-w-[600px]">
                <thead className="border-b border-gray-100 dark:border-gray-700">
                  <tr className="text-left text-subtext dark:text-gray-400 text-sm font-medium">
                    <th className="pb-4 pl-4 whitespace-nowrap">Description</th>
                    <th className="pb-4 whitespace-nowrap">Category</th>
                    <th className="pb-4 whitespace-nowrap">Date</th>
                    <th className="pb-4 text-right pr-4 whitespace-nowrap">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="py-4 pl-4 flex items-center gap-3 whitespace-nowrap">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          trx.type === 'Credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {trx.type === 'Credit' ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                        </div>
                        <span className="font-medium text-dark dark:text-gray-100">{trx.description}</span>
                      </td>
                      <td className="py-4 text-subtext dark:text-gray-400 whitespace-nowrap capitalize">{trx.category}</td>
                      <td className="py-4 text-subtext dark:text-gray-400 whitespace-nowrap">{formatDate(trx.date)}</td>
                      <td className={`py-4 text-right pr-4 font-medium whitespace-nowrap ${
                        trx.type === 'Credit' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {trx.type === 'Credit' ? '+' : '-'}{formatCurrency(trx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Current Cycle Info */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-dark dark:text-white mb-4">Current Cycle</h3>
          {currentCycle ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="text-sm text-subtext dark:text-gray-400">Cycle Month</p>
                <p className="text-xl font-bold text-dark dark:text-white">
                  {new Date(currentCycle.cycleMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="text-sm text-subtext dark:text-gray-400">Due Date</p>
                <p className="text-lg font-bold text-dark dark:text-white">{formatDate(currentCycle.dueDate)}</p>
              </div>
              {cycleSummary && (
                <>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <p className="text-sm text-subtext dark:text-gray-400">Collected</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(cycleSummary.totalCollected)}</p>
                    <p className="text-xs text-subtext dark:text-gray-500">
                      of {formatCurrency(cycleSummary.totalExpected)} expected
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-lg font-bold text-green-600">{cycleSummary.paidCount}</p>
                      <p className="text-xs text-subtext dark:text-gray-400">Paid</p>
                    </div>
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-lg font-bold text-yellow-600">{cycleSummary.partialCount}</p>
                      <p className="text-xs text-subtext dark:text-gray-400">Partial</p>
                    </div>
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-lg font-bold text-red-600">{cycleSummary.pendingCount}</p>
                      <p className="text-xs text-subtext dark:text-gray-400">Pending</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-subtext dark:text-gray-400">No active cycle</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;