
export interface Transaction {
  id: string;
  description: string;
  transactionId: string;
  type: 'Credit' | 'Debit';
  category: string;
  date: string;
  amount: number;
  status: 'Completed' | 'Pending';
}

export interface Loan {
  id: string;
  applicantName: string;
  amount: number;
  type: 'Personal' | 'Business' | 'Emergency';
  dateApplied: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Disbursed' | 'Repaid';
  repaymentPeriod: number; // in months
  interestRate: number; // percentage
}

export interface Contribution {
  id: string;
  transactionId: string;
  date: string;
  amount: number;
  type: 'Monthly' | 'Welfare' | 'Penalty' | 'Project';
  status: 'Completed' | 'Pending' | 'Failed';
  method: 'M-Pesa' | 'Bank Transfer' | 'Cash';
}

export interface Expense {
  id: string;
  description: string;
  category: 'Loan Fees' | 'Meeting' | 'Social' | 'Office' | 'Bank Fees' | 'Other';
  date: string;
  amount: number;
  status: 'Completed' | 'Pending';
  approvedBy?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Member' | 'Treasurer' | 'Admin';
  avatar: string;
  bankingGroup?: string;
  status?: 'Active' | 'Inactive';
  phone?: string;
  joinedDate?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'alert' | 'success';
  read: boolean;
}

export enum CalculationPeriod {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
  Yearly = 'Yearly'
}