import { Transaction, Loan, User, Contribution, Notification, Expense } from './types';

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Eddy Cusuma',
  email: 'eddy@pesachama.com',
  role: 'Treasurer', 
  avatar: 'https://picsum.photos/200',
  bankingGroup: 'Chama Alpha',
  status: 'Active',
  phone: '+254 712 345 678',
  joinedDate: '2022-01-15'
};

export const MOCK_MEMBERS: User[] = [
  { id: 'u1', name: 'Eddy Cusuma', email: 'eddy@pesachama.com', role: 'Treasurer', avatar: 'https://picsum.photos/200', bankingGroup: 'Chama Alpha', status: 'Active', phone: '+254 712 345 678', joinedDate: '2022-01-15' },
  { id: 'u2', name: 'Jane Doe', email: 'jane@pesachama.com', role: 'Member', avatar: 'https://picsum.photos/201', bankingGroup: 'Chama Alpha', status: 'Active', phone: '+254 722 111 222', joinedDate: '2022-02-01' },
  { id: 'u3', name: 'Mike Ross', email: 'mike@pesachama.com', role: 'Member', avatar: 'https://picsum.photos/202', bankingGroup: 'Chama Alpha', status: 'Inactive', phone: '+254 733 444 555', joinedDate: '2022-03-10' },
  { id: 'u4', name: 'Harvey Specter', email: 'harvey@pesachama.com', role: 'Admin', avatar: 'https://picsum.photos/203', bankingGroup: 'Chama Beta', status: 'Active', phone: '+254 711 999 888', joinedDate: '2021-11-05' },
  { id: 'u5', name: 'Rachel Zane', email: 'rachel@pesachama.com', role: 'Member', avatar: 'https://picsum.photos/204', bankingGroup: 'Chama Beta', status: 'Active', phone: '+254 755 666 777', joinedDate: '2022-05-20' },
  { id: 'u6', name: 'Louis Litt', email: 'louis@pesachama.com', role: 'Member', avatar: 'https://picsum.photos/205', bankingGroup: 'Chama Alpha', status: 'Active', phone: '+254 788 222 333', joinedDate: '2022-01-20' },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Loan Approved', message: 'Your loan application for KES 20,000 has been approved.', time: '2 hrs ago', type: 'success', read: false },
  { id: 'n2', title: 'Payment Due', message: 'Monthly contribution of KES 5,000 is due tomorrow.', time: '5 hrs ago', type: 'alert', read: false },
  { id: 'n3', title: 'New Feature', message: 'Check out the new loan calculator in the dashboard.', time: '1 day ago', type: 'info', read: true },
  { id: 'n4', title: 'Meeting Reminder', message: 'Monthly chama meeting is scheduled for Saturday.', time: '2 days ago', type: 'info', read: true },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', description: 'Monthly Contribution', transactionId: '#TRX-9812', type: 'Credit', category: 'Contribution', date: '2023-10-28', amount: 2500, status: 'Completed' },
  { id: '2', description: 'Loan Disbursement - John', transactionId: '#TRX-9813', type: 'Debit', category: 'Loan', date: '2023-10-27', amount: 50000, status: 'Completed' },
  { id: '3', description: 'Late Penalty Fee', transactionId: '#TRX-9814', type: 'Credit', category: 'Fine', date: '2023-10-26', amount: 500, status: 'Completed' },
  { id: '4', description: 'Emergency Fund Deposit', transactionId: '#TRX-9815', type: 'Credit', category: 'Savings', date: '2023-10-25', amount: 10000, status: 'Completed' },
  { id: '5', description: 'Server Maintenance', transactionId: '#TRX-9816', type: 'Debit', category: 'Expense', date: '2023-10-24', amount: 120, status: 'Pending' },
  { id: '6', description: 'Sarah Contribution', transactionId: '#TRX-9817', type: 'Credit', category: 'Contribution', date: '2023-10-23', amount: 2500, status: 'Completed' },
  { id: '7', description: 'Office Supplies', transactionId: '#TRX-9818', type: 'Debit', category: 'Expense', date: '2023-10-22', amount: 450, status: 'Completed' },
  { id: '8', description: 'Investment Return', transactionId: '#TRX-9819', type: 'Credit', category: 'Investment', date: '2023-10-21', amount: 15000, status: 'Completed' },
];

export const MOCK_LOANS: Loan[] = [
  { id: 'l1', applicantName: 'Jane Doe', amount: 50000, type: 'Business', dateApplied: '2023-10-20', status: 'Pending', repaymentPeriod: 12, interestRate: 12 },
  { id: 'l2', applicantName: 'Mike Ross', amount: 20000, type: 'Personal', dateApplied: '2023-10-18', status: 'Disbursed', repaymentPeriod: 6, interestRate: 10 },
  { id: 'l3', applicantName: 'Harvey Specter', amount: 100000, type: 'Business', dateApplied: '2023-10-22', status: 'Approved', repaymentPeriod: 24, interestRate: 8 },
  { id: 'l4', applicantName: 'Rachel Zane', amount: 15000, type: 'Emergency', dateApplied: '2023-10-25', status: 'Pending', repaymentPeriod: 3, interestRate: 5 },
  { id: 'l5', applicantName: 'Louis Litt', amount: 5000, type: 'Personal', dateApplied: '2023-01-15', status: 'Repaid', repaymentPeriod: 3, interestRate: 10 },
  { id: 'l6', applicantName: 'Donna Paulsen', amount: 30000, type: 'Emergency', dateApplied: '2023-02-20', status: 'Rejected', repaymentPeriod: 12, interestRate: 8 },
];

export const MOCK_CONTRIBUTIONS: Contribution[] = [
  { id: 'c1', transactionId: '#CTR-2023-001', date: '2023-10-01', amount: 5000, type: 'Monthly', status: 'Completed', method: 'M-Pesa' },
  { id: 'c2', transactionId: '#CTR-2023-002', date: '2023-10-01', amount: 1000, type: 'Welfare', status: 'Completed', method: 'M-Pesa' },
  { id: 'c3', transactionId: '#CTR-2023-003', date: '2023-09-01', amount: 5000, type: 'Monthly', status: 'Completed', method: 'Bank Transfer' },
  { id: 'c4', transactionId: '#CTR-2023-004', date: '2023-09-01', amount: 1000, type: 'Welfare', status: 'Completed', method: 'Bank Transfer' },
  { id: 'c5', transactionId: '#CTR-2023-005', date: '2023-08-01', amount: 5000, type: 'Monthly', status: 'Completed', method: 'M-Pesa' },
  { id: 'c6', transactionId: '#CTR-2023-006', date: '2023-08-01', amount: 1000, type: 'Welfare', status: 'Completed', method: 'Cash' },
  { id: 'c7', transactionId: '#CTR-2023-007', date: '2023-07-01', amount: 5000, type: 'Monthly', status: 'Completed', method: 'M-Pesa' },
  { id: 'c8', transactionId: '#CTR-2023-008', date: '2023-07-15', amount: 2500, type: 'Project', status: 'Completed', method: 'M-Pesa' },
  { id: 'c9', transactionId: '#CTR-2023-009', date: '2023-10-05', amount: 200, type: 'Penalty', status: 'Pending', method: 'M-Pesa' },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: 'e1', description: 'Loan Disbursement Fee - John', category: 'Loan Fees', date: '2023-10-27', amount: 50, status: 'Completed', approvedBy: 'Treasurer' },
  { id: 'e2', description: 'Annual General Meeting (AGM) Refreshments', category: 'Meeting', date: '2023-10-15', amount: 300, status: 'Completed', approvedBy: 'Chairperson' },
  { id: 'e3', description: "Chairman's Mbuzi Celebration", category: 'Social', date: '2023-10-15', amount: 150, status: 'Completed', approvedBy: 'Committee' },
  { id: 'e4', description: 'Stationery & Printing', category: 'Office', date: '2023-10-01', amount: 45, status: 'Completed', approvedBy: 'Secretary' },
  { id: 'e5', description: 'Bank Service Charges', category: 'Bank Fees', date: '2023-09-30', amount: 15, status: 'Completed' },
  { id: 'e6', description: 'Disbursement - Sarah', category: 'Loan Fees', date: '2023-09-25', amount: 50, status: 'Completed', approvedBy: 'Treasurer' },
  { id: 'e7', description: 'Website Hosting Renewal', category: 'Office', date: '2023-09-15', amount: 120, status: 'Pending' },
];

export const MONTHLY_ACTIVITY_DATA = [
  { name: 'Dec 2025', contributions: 400, disbursements: 240 },
  { name: 'Jan 2026', contributions: 300, disbursements: 139 },
  { name: 'Feb 2026', contributions: 200, disbursements: 980 },
  { name: 'Mar 2026', contributions: 278, disbursements: 390 },
  { name: 'Apr 2026', contributions: 0, disbursements: 0 },
  { name: 'May 2026', contributions: 0, disbursements: 0 },
  { name: 'Jun 2026', contributions: 0, disbursements: 0 },
  { name: 'Jul 2026', contributions: 0, disbursements: 0 },
  { name: 'Aug 2026', contributions: 0, disbursements: 0 },
  { name: 'Sep 2026', contributions: 0, disbursements: 0 },
  { name: 'Oct 2026', contributions: 0, disbursements: 0 },
  { name: 'Nov 2026', contributions: 0, disbursements: 0 },
];

export const FUND_ALLOCATION = [
  { name: 'Loans Disbursed', value: 30, fill: '#343C6A' },
  { name: 'Interest Earned', value: 15, fill: '#FC7900' },
  { name: 'Expenses', value: 20, fill: '#FE5C73' },
  { name: 'Available', value: 35, fill: '#2D60FF' },
];