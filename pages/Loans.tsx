import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Briefcase, User, Calculator, X, Loader2,
  ChevronRight, Calendar, Percent, Clock, AlertCircle,
  CheckCircle, XCircle, Banknote, Wallet, TrendingDown, CreditCard,
  ToggleLeft, ToggleRight, Smartphone
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { stkPushService, StkPushStatus } from '../services/stkPushService';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import api, { TokenService } from '../services/api';

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
  expectedEndDate: string | null;
  actualEndDate: string | null;
  totalInterestAccrued: number;
  totalAmountDue: number;
  totalAmountPaid: number;
  outstandingBalance: number;
  status: 'PENDING' | 'APPROVED' | 'DISBURSED' | 'ACTIVE' | 'PAID_OFF' | 'REJECTED' | 'OVERDUE' | 'DEFAULTED' | 'WRITTEN_OFF';
  daysActive: number;
  createdAt: string;
  disbursementChannel?: string | null;
  disbursementStatus?: string | null;
  disbursementReference?: string | null;
  disbursementFailureReason?: string | null;
}

interface LoanRepayment {
  id: string;
  loanId: string;
  paymentNumber: number;
  paymentDate: string;
  amount: number;
  principalPortion: number;
  interestPortion: number;
  balanceAfter: number;
  paymentMethod: string;
  referenceNumber: string;
}

interface LoanDetail {
  loan: Loan;
  repayments: LoanRepayment[];
  recentAccruals: any[];
  schedule: {
    totalPrincipal: number;
    estimatedTotalInterest: number;
    estimatedTotalPayable: number;
    estimatedEndDate: string;
    dailyInterestAmount: number;
    monthlyInterestRate: number;
  };
}

type LoanCategory = 'Active' | 'Completed';

interface MemberLoanStats {
  memberId: string;
  totalOutstanding: number;
  activeLoansCount: number;
  totalBorrowed: number;
  totalRepaid: number;
}

enum CalculationPeriod {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
  Yearly = 'Yearly'
}

// --- Loan Application Modal ---
interface LoanApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; durationMonths: number; purpose: string }) => Promise<void>;
  defaultAmount?: number;
  defaultDuration?: number;
}

const LoanApplicationModal: React.FC<LoanApplicationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  defaultAmount = 5000, 
  defaultDuration = 12 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: defaultAmount,
    duration: defaultDuration,
    purpose: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        amount: defaultAmount,
        duration: defaultDuration
      }));
      setError(null);
    }
  }, [isOpen, defaultAmount, defaultDuration]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await onSubmit({
        amount: Number(formData.amount),
        durationMonths: Number(formData.duration),
        purpose: formData.purpose
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] transition-colors">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700 shrink-0">
          <h3 className="text-xl font-bold text-dark dark:text-white">Apply for a Loan</h3>
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
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Loan Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-dark dark:text-gray-400 font-semibold text-xs mt-0.5">KES</span>
                <input 
                  type="number" 
                  required
                  min="100"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                  className="w-full pl-12 pr-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Duration (Months)</label>
              <input 
                type="number" 
                required
                min="1"
                max="12"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition" 
              />
              <p className="text-xs text-subtext dark:text-gray-500 mt-1">Maximum 12 months</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Purpose of Loan</label>
              <textarea 
                rows={3}
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                placeholder="Briefly describe why you need this loan..."
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
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Loan Repayment Modal ---
interface LoanRepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  onSubmit: (data: { loanId: string; amount: number; paymentMethod: string; referenceNumber: string }) => Promise<void>;
  defaultPhone?: string;
  onPaymentComplete?: () => void;
}

const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS = 120000; // 2 minutes

const LoanRepaymentModal: React.FC<LoanRepaymentModalProps> = ({ isOpen, onClose, loan, onSubmit, defaultPhone = '', onPaymentComplete }) => {
  const { formatCurrency } = useAppData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: 0,
    paymentMethod: 'MPESA',
    referenceNumber: ''
  });

  // M-Pesa STK Push state
  const [mpesaStep, setMpesaStep] = useState<'input' | 'processing' | 'result'>('input');
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [collectionRef, setCollectionRef] = useState<string | null>(null);
  const [mpesaStatus, setMpesaStatus] = useState<StkPushStatus | null>(null);
  const [mpesaError, setMpesaError] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen && loan) {
      setFormData({
        amount: loan.outstandingBalance,
        paymentMethod: 'MPESA',
        referenceNumber: ''
      });
      setError(null);
      // Reset M-Pesa state
      setMpesaStep('input');
      setPhoneNumber(defaultPhone);
      setCollectionRef(null);
      setMpesaStatus(null);
      setMpesaError(null);
    }
  }, [isOpen, loan, defaultPhone]);

  // Reset M-Pesa state when payment method changes
  useEffect(() => {
    if (formData.paymentMethod === 'MPESA') {
      setMpesaStep('input');
      setCollectionRef(null);
      setMpesaStatus(null);
      setMpesaError(null);
    }
  }, [formData.paymentMethod]);

  if (!isOpen || !loan) return null;

  // Rounding: all payment channels require whole number amounts
  const hasDecimals = formData.amount % 1 !== 0;
  const roundedAmount = hasDecimals ? Math.ceil(formData.amount) : formData.amount;
  const excessAmount = hasDecimals ? +(roundedAmount - formData.amount).toFixed(2) : 0;

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startPolling = (ref: string) => {
    stopPolling();

    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusResponse = await stkPushService.getStatus(ref);
        if (statusResponse.status === 'COMPLETED' || statusResponse.status === 'SUCCESS') {
          stopPolling();
          setMpesaStatus(statusResponse);
          setMpesaStep('result');
        } else if (statusResponse.status === 'FAILED' || statusResponse.status === 'CANCELLED') {
          stopPolling();
          setMpesaStatus(statusResponse);
          setMpesaError(statusResponse.statusDescription || 'Payment was not completed.');
          setMpesaStep('result');
        }
        // If still PENDING, keep polling
      } catch (err: any) {
        // Don't stop polling on transient errors
        console.error('Status poll error:', err);
      }
    }, POLL_INTERVAL_MS);

    // Timeout after 2 minutes
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setMpesaError('Payment confirmation timed out. Please check your M-Pesa messages and try again if the payment was not completed.');
      setMpesaStep('result');
    }, TIMEOUT_MS);
  };

  const handleMpesaInitiate = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number.');
      return;
    }
    const cleaned = phoneNumber.replace(/\s/g, '');
    if (!/^(07|01)\d{8}$/.test(cleaned)) {
      setError('Please enter a valid Kenyan phone number (e.g., 0712345678).');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await stkPushService.initiate({
        sourceId: loan.id,
        sourceType: 'LOAN_REPAYMENT',
        amount: formData.amount,
        phoneNumber: cleaned,
      });
      setCollectionRef(response.collectionRef);
      setMpesaStep('processing');
      startPolling(response.collectionRef);
    } catch (err: any) {
      setError(err?.message || 'Failed to initiate M-Pesa payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleMpesaTryAgain = () => {
    stopPolling();
    setMpesaStep('input');
    setCollectionRef(null);
    setMpesaStatus(null);
    setMpesaError(null);
    setError(null);
  };

  const handleMpesaDone = () => {
    stopPolling();
    onPaymentComplete?.();
    onClose();
  };

  const handleClose = () => {
    if (mpesaStep === 'processing') return; // Don't allow close during processing
    stopPolling();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        loanId: loan.id,
        amount: roundedAmount,
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const isMpesa = formData.paymentMethod === 'MPESA';
  const isSuccess = mpesaStep === 'result' && mpesaStatus && (mpesaStatus.status === 'COMPLETED' || mpesaStatus.status === 'SUCCESS');
  const isFailed = mpesaStep === 'result' && !isSuccess;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
          <h3 className="text-xl font-bold text-dark dark:text-white">
            {isMpesa && mpesaStep === 'result' && isSuccess ? 'Payment Complete' : 'Make Repayment'}
          </h3>
          {!(isMpesa && mpesaStep === 'processing') && (
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full">
              <X size={24} />
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Loan Info - hide during M-Pesa processing/result */}
          {!(isMpesa && mpesaStep !== 'input') && (
            <div className="bg-bgLight dark:bg-gray-700 rounded-xl p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-subtext dark:text-gray-400">Loan Number</span>
                <span className="font-medium text-dark dark:text-white">{loan.loanNumber}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-subtext dark:text-gray-400">Outstanding Balance</span>
                <span className="font-bold text-red-500">KES {loan.outstandingBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtext dark:text-gray-400">Total Interest</span>
                <span className="font-medium text-dark dark:text-white">KES {loan.totalInterestAccrued.toLocaleString()}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* M-Pesa Processing Step */}
          {isMpesa && mpesaStep === 'processing' && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <Loader2 size={48} className="animate-spin text-green-600" />
              <div className="text-center">
                <p className="text-lg font-bold text-dark dark:text-white mb-1">
                  Waiting for M-Pesa confirmation...
                </p>
                <p className="text-sm text-subtext dark:text-gray-400">
                  Check your phone and enter your M-Pesa PIN
                </p>
              </div>
              {collectionRef && (
                <p className="text-xs text-subtext dark:text-gray-500">
                  Ref: {collectionRef}
                </p>
              )}
            </div>
          )}

          {/* M-Pesa Result Step - Success */}
          {isMpesa && mpesaStep === 'result' && isSuccess && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <CheckCircle size={56} className="text-green-500" />
              <div className="text-center">
                <p className="text-xl font-bold text-dark dark:text-white mb-1">
                  Payment Successful!
                </p>
                <p className="text-lg text-green-600 font-semibold">
                  {formatCurrency(roundedAmount)}
                </p>
                {hasDecimals && (
                  <p className="text-sm text-subtext dark:text-gray-400 mt-1">
                    {formatCurrency(formData.amount)} applied + {formatCurrency(excessAmount)} credited to your balance
                  </p>
                )}
              </div>
              {mpesaStatus?.mpesaReceiptNumber && (
                <p className="text-sm text-subtext dark:text-gray-400">
                  Receipt: <span className="font-medium text-dark dark:text-white">{mpesaStatus.mpesaReceiptNumber}</span>
                </p>
              )}
              <button
                onClick={handleMpesaDone}
                className="w-full px-4 py-3 bg-primary text-white rounded-full font-bold hover:bg-blue-700 transition mt-4"
              >
                Done
              </button>
            </div>
          )}

          {/* M-Pesa Result Step - Failed/Timeout */}
          {isMpesa && mpesaStep === 'result' && isFailed && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <XCircle size={56} className="text-red-500" />
              <div className="text-center">
                <p className="text-xl font-bold text-dark dark:text-white mb-1">
                  Payment Failed
                </p>
                <p className="text-sm text-subtext dark:text-gray-400">
                  {mpesaError || mpesaStatus?.statusDescription || 'The payment could not be completed.'}
                </p>
              </div>
              <button
                onClick={handleMpesaTryAgain}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition mt-4"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Form - shown for M-Pesa input step or non-M-Pesa methods */}
          {(!isMpesa || mpesaStep === 'input') && (
            <form onSubmit={!isMpesa ? handleSubmit : (e) => e.preventDefault()} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Payment Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-dark dark:text-gray-400 font-semibold text-xs">KES</span>
                  <input
                    type="number"
                    required
                    min="0.01"
                    max={loan.outstandingBalance}
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    className="w-full pl-12 pr-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium"
                  />
                </div>
                {hasDecimals && (
                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Amount will be rounded up to <span className="font-semibold">{formatCurrency(roundedAmount)}</span>.
                      The excess of <span className="font-semibold">{formatCurrency(excessAmount)}</span> will be credited to your balance.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium"
                >
                  <option value="MPESA">M-Pesa</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              {/* M-Pesa: Phone number + rounding info + STK Push button */}
              {isMpesa && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => { setPhoneNumber(e.target.value); setError(null); }}
                      placeholder="0712345678"
                      className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleMpesaInitiate}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Initiating...
                      </>
                    ) : (
                      <>
                        <Smartphone size={20} />
                        Pay via M-Pesa
                      </>
                    )}
                  </button>

                  <p className="text-xs text-subtext dark:text-gray-500 text-center">
                    An STK push will be sent to your phone. Enter your M-Pesa PIN to complete payment.
                  </p>
                </>
              )}

              {/* Non-M-Pesa: Reference number + Make Payment button */}
              {!isMpesa && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Reference Number</label>
                    <input
                      type="text"
                      value={formData.referenceNumber}
                      onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})}
                      placeholder="e.g., transaction reference code"
                      className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 py-3 text-subtext font-medium bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition flex justify-center items-center gap-2 disabled:opacity-70"
                    >
                      {loading && <Loader2 className="animate-spin" size={20} />}
                      {loading ? 'Processing...' : 'Make Payment'}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Disbursement Channel Modal ---
interface DisbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  onSubmit: (data: { loanId: string; disbursementChannel: string; phoneNumber?: string; bankAccount?: string; bankCode?: string }) => Promise<void>;
}

const DisbursementModal: React.FC<DisbursementModalProps> = ({ isOpen, onClose, loan, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<'MPESA' | 'BANK'>('MPESA');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankCode, setBankCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      setChannel('MPESA');
      setPhoneNumber('');
      setBankAccount('');
      setBankCode('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !loan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        loanId: loan.id,
        disbursementChannel: channel,
        ...(phoneNumber && { phoneNumber }),
        ...(channel === 'BANK' && bankAccount && { bankAccount }),
        ...(channel === 'BANK' && bankCode && { bankCode }),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to disburse loan');
    } finally {
      setLoading(false);
    }
  };

  const { formatCurrency } = useAppData();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] transition-colors">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700 shrink-0">
          <h3 className="text-xl font-bold text-dark dark:text-white">Disburse Loan</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-sm text-subtext dark:text-gray-400">Loan: <span className="font-semibold text-dark dark:text-white">{loan.loanNumber}</span></p>
            <p className="text-sm text-subtext dark:text-gray-400">Member: <span className="font-semibold text-dark dark:text-white">{loan.memberName}</span></p>
            <p className="text-sm text-subtext dark:text-gray-400">Amount: <span className="font-semibold text-dark dark:text-white">{formatCurrency(loan.principalAmount)}</span></p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Disbursement Channel</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setChannel('MPESA')}
                  className={`flex-1 py-3 rounded-xl font-medium text-sm transition border ${
                    channel === 'MPESA'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400'
                      : 'bg-bgLight dark:bg-gray-700 border-transparent text-subtext dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  M-Pesa
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('BANK')}
                  className={`flex-1 py-3 rounded-xl font-medium text-sm transition border ${
                    channel === 'BANK'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400'
                      : 'bg-bgLight dark:bg-gray-700 border-transparent text-subtext dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  Bank Transfer
                </button>
              </div>
            </div>

            {channel === 'MPESA' && (
              <div>
                <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Phone Number (optional override)</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Uses member's phone if empty"
                  className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
                />
              </div>
            )}

            {channel === 'BANK' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Bank Account Number</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="Uses member's bank account if empty"
                    className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Bank Code</label>
                  <input
                    type="text"
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    placeholder="Uses member's bank code if empty"
                    className="w-full px-4 py-3 bg-bgLight dark:bg-gray-900 rounded-xl border border-transparent dark:border-gray-700 focus:border-primary outline-none text-dark dark:text-white font-medium transition"
                  />
                </div>
              </>
            )}

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
                {loading ? 'Disbursing...' : 'Disburse Loan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Disbursement Status Badge ---
const DisbursementStatusBadge: React.FC<{ status: string | null | undefined }> = ({ status }) => {
  if (!status) return null;
  const config: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-600' },
    COMPLETED: { bg: 'bg-green-100', text: 'text-green-600' },
    FAILED: { bg: 'bg-red-100', text: 'text-red-600' },
  };
  const { bg, text } = config[status] || config.PENDING;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {status}
    </span>
  );
};

// --- Loan Detail Modal ---
interface LoanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string | null;
}

const LoanDetailModal: React.FC<LoanDetailModalProps> = ({ isOpen, onClose, loanId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<LoanDetail | null>(null);
  const { formatCurrency, formatDate } = useAppData();

  useEffect(() => {
    if (isOpen && loanId) {
      fetchLoanDetails();
    }
  }, [isOpen, loanId]);

  const fetchLoanDetails = async () => {
    if (!loanId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get<LoanDetail>(`/loans/${loanId}/details`);
      if (response.success && response.data) {
        setDetail(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch loan details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
          <h3 className="text-xl font-bold text-dark dark:text-white">Loan Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full">
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
          
          {!loading && !error && detail && (
            <div className="space-y-6">
              {/* Loan Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bgLight dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-subtext dark:text-gray-400 text-sm">Principal</p>
                  <p className="text-xl font-bold text-dark dark:text-white">{formatCurrency(detail.loan.principalAmount)}</p>
                </div>
                <div className="bg-bgLight dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-subtext dark:text-gray-400 text-sm">Outstanding</p>
                  <p className="text-xl font-bold text-red-500">{formatCurrency(detail.loan.outstandingBalance)}</p>
                </div>
                <div className="bg-bgLight dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-subtext dark:text-gray-400 text-sm">Interest Accrued</p>
                  <p className="text-xl font-bold text-orange-500">{formatCurrency(detail.loan.totalInterestAccrued)}</p>
                </div>
                <div className="bg-bgLight dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-subtext dark:text-gray-400 text-sm">Total Paid</p>
                  <p className="text-xl font-bold text-green-500">{formatCurrency(detail.loan.totalAmountPaid)}</p>
                </div>
              </div>
              
              {/* Loan Info */}
              <div className="bg-bgLight dark:bg-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-subtext dark:text-gray-400">Loan Number</span>
                  <span className="font-medium text-dark dark:text-white">{detail.loan.loanNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtext dark:text-gray-400">Interest Rate</span>
                  <span className="font-medium text-dark dark:text-white">{(detail.loan.interestRate * 100).toFixed(1)}% monthly</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtext dark:text-gray-400">Disbursed On</span>
                  <span className="font-medium text-dark dark:text-white">{detail.loan.disbursementDate ? formatDate(detail.loan.disbursementDate) : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtext dark:text-gray-400">Due Date</span>
                  <span className="font-medium text-dark dark:text-white">{detail.loan.expectedEndDate ? formatDate(detail.loan.expectedEndDate) : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtext dark:text-gray-400">Days Active</span>
                  <span className="font-medium text-dark dark:text-white">{detail.loan.daysActive} days</span>
                </div>
              </div>
              
              {/* Repayments */}
              {detail.repayments.length > 0 && (
                <div>
                  <h4 className="font-bold text-dark dark:text-white mb-3">Payment History</h4>
                  <div className="space-y-2">
                    {detail.repayments.map((r) => (
                      <div key={r.id} className="flex justify-between items-center bg-bgLight dark:bg-gray-700 rounded-xl p-3">
                        <div>
                          <p className="font-medium text-dark dark:text-white">{formatCurrency(r.amount)}</p>
                          <p className="text-xs text-subtext dark:text-gray-400">{formatDate(r.paymentDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-subtext dark:text-gray-400">Balance After</p>
                          <p className="font-medium text-dark dark:text-white">{formatCurrency(r.balanceAfter)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Loan Calculator Component ---
const LoanCalculator = ({ onApply }: { onApply: (amount: number, duration: number) => void }) => {
  const [amount, setAmount] = useState<number>(10000);
  const [rate, setRate] = useState<number>(10);
  const [duration, setDuration] = useState<number>(12);
  const [period, setPeriod] = useState<'Months' | 'Years'>('Months');
  const [compoundFreq, setCompoundFreq] = useState<CalculationPeriod>(CalculationPeriod.Monthly);
  const [interestRatePeriod, setInterestRatePeriod] = useState<'Monthly' | 'Yearly'>('Monthly');

  const results = useMemo(() => {
    const P = amount;
    
    let annualRate = rate;
    if (interestRatePeriod === 'Monthly') {
      annualRate = rate * 12;
    }
    const r = annualRate / 100;
    
    let n = 12;
    if (compoundFreq === CalculationPeriod.Daily) n = 365;
    if (compoundFreq === CalculationPeriod.Weekly) n = 52;
    if (compoundFreq === CalculationPeriod.Monthly) n = 12;
    if (compoundFreq === CalculationPeriod.Yearly) n = 1;

    const t = period === 'Months' ? duration / 12 : duration;

    const A = P * Math.pow((1 + r / n), (n * t));
    const totalInterest = A - P;
    
    const totalMonths = t * 12;
    const monthlyPayment = totalMonths > 0 ? A / totalMonths : A;

    return {
      totalRepayment: A,
      interest: totalInterest,
      monthlyInstallment: monthlyPayment
    };
  }, [amount, rate, duration, period, compoundFreq, interestRatePeriod]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-3xl shadow-sm transition-colors">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 dark:bg-gray-700 rounded-full text-primary">
          <Calculator size={24} />
        </div>
        <h3 className="text-xl font-bold text-dark dark:text-white">Loan Calculator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Loan Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-subtext dark:text-gray-400 text-xs mt-0.5">KES</span>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-12 pr-4 py-3 bg-bgLight dark:bg-gray-700 rounded-xl border-none outline-none text-dark dark:text-white font-medium" 
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Duration</label>
              <input 
                type="number" 
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-4 py-3 bg-bgLight dark:bg-gray-700 rounded-xl border-none outline-none text-dark dark:text-white font-medium" 
              />
            </div>
            <div className="w-1/3">
              <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Period</label>
              <select 
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="w-full px-2 py-3 bg-bgLight dark:bg-gray-700 rounded-xl border-none outline-none text-dark dark:text-white font-medium"
              >
                <option>Months</option>
                <option>Years</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Interest Rate (%)</label>
            <div className="flex gap-4">
              <input 
                type="number" 
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="flex-1 px-4 py-3 bg-bgLight dark:bg-gray-700 rounded-xl border-none outline-none text-dark dark:text-white font-medium" 
              />
              <select 
                value={interestRatePeriod}
                onChange={(e) => setInterestRatePeriod(e.target.value as 'Monthly' | 'Yearly')}
                className="w-1/3 px-2 py-3 bg-bgLight dark:bg-gray-700 rounded-xl border-none outline-none text-dark dark:text-white font-medium"
              >
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-2">Compounding</label>
            <select 
              value={compoundFreq}
              onChange={(e) => setCompoundFreq(e.target.value as CalculationPeriod)}
              className="w-full px-4 py-3 bg-bgLight dark:bg-gray-700 rounded-xl border-none outline-none text-dark dark:text-white font-medium"
            >
              <option value={CalculationPeriod.Daily}>Daily</option>
              <option value={CalculationPeriod.Weekly}>Weekly</option>
              <option value={CalculationPeriod.Monthly}>Monthly</option>
              <option value={CalculationPeriod.Yearly}>Yearly</option>
            </select>
          </div>
        </div>

        <div className="bg-bgLight dark:bg-gray-700 rounded-2xl p-6 flex flex-col justify-center space-y-6 transition-colors">
          <div>
            <p className="text-subtext dark:text-gray-300 text-sm mb-1">Monthly Installment</p>
            <h2 className="text-3xl font-bold text-dark dark:text-white">KES {results.monthlyInstallment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <div className="flex justify-between mb-2">
              <span className="text-subtext dark:text-gray-400">Total Interest</span>
              <span className="font-semibold text-red-500">KES {results.interest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-subtext dark:text-gray-400">Total Repayment</span>
              <span className="font-semibold text-primary">KES {results.totalRepayment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
          </div>
          <button 
            onClick={() => onApply(amount, period === 'Months' ? duration : duration * 12)}
            className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition"
          >
            Apply for this Amount
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Status Badge Component ---
const StatusBadge: React.FC<{ status: Loan['status'] }> = ({ status }) => {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: <Clock size={14} /> },
    APPROVED: { bg: 'bg-green-100', text: 'text-green-600', icon: <CheckCircle size={14} /> },
    DISBURSED: { bg: 'bg-blue-100', text: 'text-blue-600', icon: <Banknote size={14} /> },
    ACTIVE: { bg: 'bg-blue-100', text: 'text-blue-600', icon: <Banknote size={14} /> },
    PAID_OFF: { bg: 'bg-indigo-100', text: 'text-indigo-600', icon: <CheckCircle size={14} /> },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-600', icon: <XCircle size={14} /> },
    OVERDUE: { bg: 'bg-red-100', text: 'text-red-600', icon: <AlertCircle size={14} /> },
    DEFAULTED: { bg: 'bg-red-100', text: 'text-red-600', icon: <AlertCircle size={14} /> },
    WRITTEN_OFF: { bg: 'bg-gray-100', text: 'text-gray-600', icon: <XCircle size={14} /> },
  };
  
  const { bg, text, icon } = config[status] || config.PENDING;
  
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {icon}
      {status}
    </span>
  );
};

// --- Main Loans Page ---
const Loans: React.FC = () => {
  const { user } = useAuth();
  const { formatCurrency, formatDate, currentGroup } = useAppData();

  const [activeTab, setActiveTab] = useState<'Overview' | 'Calculator'>('Overview');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanStats, setLoanStats] = useState<MemberLoanStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loanCategory, setLoanCategory] = useState<LoanCategory>('Active');

  // Toggle for viewing all loans (admin/treasurer only)
  const [showMyLoansOnly, setShowMyLoansOnly] = useState(false);
  const isAdminOrTreasurer = user?.role === 'ADMIN' || user?.role === 'TREASURER';

  // Modal States
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDisbursementModalOpen, setIsDisbursementModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [modalDefaults, setModalDefaults] = useState({ amount: 5000, duration: 12 });

  // Fetch loans
  const fetchLoans = useCallback(async () => {
    if (!user?.member?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      let response;

      // Admin/Treasurer can view all loans when toggle is off
      if (isAdminOrTreasurer && !showMyLoansOnly && currentGroup?.id) {
        response = await api.get<Loan[]>(`/loans/group/${currentGroup.id}`);
      } else {
        // Regular members always see their own, admin/treasurer sees own when toggle is on
        response = await api.get<Loan[]>(`/loans/member/${user.member.id}`);
      }

      if (response.success && response.data) {
        setLoans(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch loans');
    } finally {
      setIsLoading(false);
    }
  }, [user?.member?.id, isAdminOrTreasurer, showMyLoansOnly, currentGroup?.id]);

  // Fetch loan statistics from backend
  const fetchLoanStats = useCallback(async () => {
    if (!user?.member?.id) return;

    setIsStatsLoading(true);

    try {
      const response = await api.get<MemberLoanStats>(`/loans/member/${user.member.id}/stats`);
      if (response.success && response.data) {
        setLoanStats(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch loan stats:', err);
      // Fallback: keep showing zeros if stats fail
      setLoanStats({
        memberId: user.member.id,
        totalOutstanding: 0,
        activeLoansCount: 0,
        totalBorrowed: 0,
        totalRepaid: 0
      });
    } finally {
      setIsStatsLoading(false);
    }
  }, [user?.member?.id]);

  useEffect(() => {
    fetchLoans();
    fetchLoanStats();
  }, [fetchLoans, fetchLoanStats]);

  // Filter loans by category
  const displayedLoans = useMemo(() => {
    return loans.filter(loan => {
      if (loanCategory === 'Active') {
        return ['PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE', 'OVERDUE'].includes(loan.status);
      }
      return ['PAID_OFF', 'REJECTED', 'DEFAULTED', 'WRITTEN_OFF'].includes(loan.status);
    });
  }, [loans, loanCategory]);

  // Handlers
  const handleOpenApplicationModal = (amount: number = 5000, duration: number = 12) => {
    setModalDefaults({ amount, duration });
    setIsApplicationModalOpen(true);
  };

  const handleApplyLoan = async (data: { amount: number; durationMonths: number; purpose: string }) => {
    if (!user?.member?.id) throw new Error('User not found');
    
    const response = await api.post<Loan>('/loans/apply', {
      memberId: user.member.id,
      amount: data.amount,
      durationMonths: data.durationMonths,
      purpose: data.purpose,
      notes: data.purpose
    });
    
    if (response.success) {
      await fetchLoans();
      await fetchLoanStats();
    } else {
      throw new Error(response.message || 'Failed to apply for loan');
    }
  };

  const handleOpenRepaymentModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsRepaymentModalOpen(true);
  };

  const handleRepayment = async (data: { loanId: string; amount: number; paymentMethod: string; referenceNumber: string }) => {
    const response = await api.post('/loans/repay', {
      loanId: data.loanId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber
    });
    
    if (response.success) {
      await fetchLoans();
      await fetchLoanStats();
    } else {
      throw new Error(response.message || 'Failed to process payment');
    }
  };

  const handleOpenDisbursementModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsDisbursementModalOpen(true);
  };

  const handleDisburse = async (data: { loanId: string; disbursementChannel: string; phoneNumber?: string; bankAccount?: string; bankCode?: string }) => {
    const response = await api.post<Loan>(`/loans/${data.loanId}/disburse`, {
      loanId: data.loanId,
      disbursementChannel: data.disbursementChannel,
      phoneNumber: data.phoneNumber,
      bankAccount: data.bankAccount,
      bankCode: data.bankCode,
    });

    if (response.success) {
      await fetchLoans();
      await fetchLoanStats();
    } else {
      throw new Error(response.message || 'Failed to disburse loan');
    }
  };

  const handleViewDetails = (loan: Loan) => {
    setSelectedLoanId(loan.id);
    setIsDetailModalOpen(true);
  };

  if (!user?.member?.id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-subtext dark:text-gray-400">Please log in to view loans</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modals */}
      <LoanApplicationModal 
        isOpen={isApplicationModalOpen} 
        onClose={() => setIsApplicationModalOpen(false)}
        onSubmit={handleApplyLoan}
        defaultAmount={modalDefaults.amount}
        defaultDuration={modalDefaults.duration}
      />
      
      <LoanRepaymentModal
        isOpen={isRepaymentModalOpen}
        onClose={() => setIsRepaymentModalOpen(false)}
        loan={selectedLoan}
        onSubmit={handleRepayment}
        defaultPhone={user?.member?.phoneNumber || ''}
        onPaymentComplete={() => { fetchLoans(); fetchLoanStats(); }}
      />
      
      <LoanDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        loanId={selectedLoanId}
      />

      <DisbursementModal
        isOpen={isDisbursementModalOpen}
        onClose={() => setIsDisbursementModalOpen(false)}
        loan={selectedLoan}
        onSubmit={handleDisburse}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Outstanding"
          value={isStatsLoading ? '...' : formatCurrency(loanStats?.totalOutstanding ?? 0)}
          icon={<TrendingDown size={28} className="text-red-500" />}
          subtext="Active loan balances"
        />
        <StatCard
          title="Active Loans"
          value={isStatsLoading ? '...' : (loanStats?.activeLoansCount ?? 0).toString()}
          icon={<CreditCard size={28} className="text-[#396AFF]" />}
          subtext="Pending & disbursed"
        />
        <StatCard
          title="Total Borrowed"
          value={isStatsLoading ? '...' : formatCurrency(loanStats?.totalBorrowed ?? 0)}
          icon={<Wallet size={28} className="text-[#16DBCC]" />}
          subtext="Lifetime borrowing"
        />
        <StatCard
          title="Total Repaid"
          value={isStatsLoading ? '...' : formatCurrency(loanStats?.totalRepaid ?? 0)}
          icon={<CheckCircle size={28} className="text-green-500" />}
          subtext="All time repayments"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-1 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('Overview')}
          className={`pb-3 px-4 font-medium transition-colors relative whitespace-nowrap ${activeTab === 'Overview' ? 'text-primary' : 'text-subtext dark:text-gray-400 hover:text-dark dark:hover:text-white'}`}
        >
          My Loans
          {activeTab === 'Overview' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-lg"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('Calculator')}
          className={`pb-3 px-4 font-medium transition-colors relative whitespace-nowrap ${activeTab === 'Calculator' ? 'text-primary' : 'text-subtext dark:text-gray-400 hover:text-dark dark:hover:text-white'}`}
        >
          Calculator
          {activeTab === 'Calculator' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-lg"></div>}
        </button>
      </div>

      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-3xl shadow-sm transition-colors">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h3 className="text-xl font-bold text-dark dark:text-white">
                {isAdminOrTreasurer && !showMyLoansOnly ? 'All Loans' : 'My Loans'}
              </h3>

              <div className="flex items-center gap-3">
                {/* Toggle for Admin/Treasurer to view all or own loans */}
                {isAdminOrTreasurer && (
                  <button
                    onClick={() => setShowMyLoansOnly(!showMyLoansOnly)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      showMyLoansOnly
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white dark:bg-gray-700 text-subtext dark:text-gray-300 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {showMyLoansOnly ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    <span className="text-sm font-medium">My Loans</span>
                  </button>
                )}

                {/* Active/Completed Filter */}
                <div className="bg-bgLight dark:bg-gray-700 p-1 rounded-xl flex">
                <button 
                  onClick={() => setLoanCategory('Active')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${loanCategory === 'Active' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-subtext dark:text-gray-400 hover:text-dark dark:hover:text-white'}`}
                >
                  Active
                </button>
                <button 
                  onClick={() => setLoanCategory('Completed')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${loanCategory === 'Completed' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-subtext dark:text-gray-400 hover:text-dark dark:hover:text-white'}`}
                >
                  Completed
                </button>
                </div>
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
                <button onClick={fetchLoans} className="mt-2 text-primary hover:underline">
                  Try again
                </button>
              </div>
            )}

            {/* Loans Table */}
            {!isLoading && !error && (
              <div className="overflow-x-auto pb-4">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-bgLight dark:bg-gray-700 text-subtext dark:text-gray-300 text-left text-sm font-medium rounded-xl">
                    <tr>
                      <th className="p-4 rounded-l-xl whitespace-nowrap">Loan No.</th>
                      {isAdminOrTreasurer && !showMyLoansOnly && (
                        <th className="p-4 whitespace-nowrap">Member</th>
                      )}
                      <th className="p-4 whitespace-nowrap">Principal</th>
                      <th className="p-4 whitespace-nowrap">Status</th>
                      <th className="p-4 whitespace-nowrap">Outstanding</th>
                      <th className="p-4 rounded-r-xl whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-dark dark:text-gray-200">
                    {displayedLoans.map((loan) => (
                      <tr 
                        key={loan.id} 
                        className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
                        onClick={() => handleViewDetails(loan)}
                      >
                        <td className="p-4 font-medium whitespace-nowrap">{loan.loanNumber}</td>
                        {isAdminOrTreasurer && !showMyLoansOnly && (
                          <td className="p-4 whitespace-nowrap">{loan.memberName}</td>
                        )}
                        <td className="p-4 whitespace-nowrap">{formatCurrency(loan.principalAmount)}</td>
                        <td className="p-4 whitespace-nowrap">
                          <StatusBadge status={loan.status} />
                        </td>
                        <td className="p-4 whitespace-nowrap font-medium text-red-500">
                          {loan.outstandingBalance > 0 ? formatCurrency(loan.outstandingBalance) : '-'}
                        </td>
                        <td className="p-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {['DISBURSED', 'ACTIVE', 'OVERDUE'].includes(loan.status) ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenRepaymentModal(loan)}
                                className="px-4 py-2 border border-primary text-primary rounded-full text-sm hover:bg-primary hover:text-white transition"
                              >
                                Repay
                              </button>
                              {loan.disbursementStatus && (
                                <DisbursementStatusBadge status={loan.disbursementStatus} />
                              )}
                            </div>
                          ) : loan.status === 'APPROVED' && isAdminOrTreasurer ? (
                            <button
                              onClick={() => handleOpenDisbursementModal(loan)}
                              className="px-4 py-2 bg-primary text-white rounded-full text-sm hover:bg-blue-700 transition"
                            >
                              Disburse
                            </button>
                          ) : loan.status === 'PAID_OFF' || loan.status === 'REJECTED' || loan.status === 'DEFAULTED' || loan.status === 'WRITTEN_OFF' ? (
                            <span className="text-sm text-subtext dark:text-gray-500 italic">Closed</span>
                          ) : (
                            <span className="text-sm text-subtext dark:text-gray-500 italic">Awaiting approval</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {displayedLoans.length === 0 && (
                      <tr>
                        <td colSpan={isAdminOrTreasurer && !showMyLoansOnly ? 6 : 5} className="p-8 text-center text-subtext dark:text-gray-400">
                          No {loanCategory.toLowerCase()} loans found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Apply Card */}
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-3xl shadow-sm flex flex-col justify-between transition-colors">
            <div>
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Briefcase />
              </div>
              <h3 className="text-xl font-bold text-dark dark:text-white mb-2">Need Cash?</h3>
              <p className="text-subtext dark:text-gray-400 text-sm mb-6">Apply for a quick loan with competitive interest rates.</p>
              <div className="space-y-4">
                <div 
                  onClick={() => handleOpenApplicationModal(50000, 6)}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-bgLight dark:bg-gray-700 p-4 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition gap-2"
                >
                  <div className="flex items-center gap-3">
                    <User size={20} className="text-subtext dark:text-gray-400"/>
                    <span className="text-sm font-medium text-dark dark:text-white">Quick Loan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-dark dark:text-white">KES 50,000</span>
                    <ChevronRight size={16} className="text-subtext" />
                  </div>
                </div>
                <div 
                  onClick={() => handleOpenApplicationModal(100000, 12)}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-bgLight dark:bg-gray-700 p-4 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition gap-2"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase size={20} className="text-subtext dark:text-gray-400"/>
                    <span className="text-sm font-medium text-dark dark:text-white">Business Loan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-dark dark:text-white">KES 100,000</span>
                    <ChevronRight size={16} className="text-subtext" />
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => handleOpenApplicationModal()} 
              className="w-full mt-6 bg-dark dark:bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-black transition"
            >
              Apply Now
            </button>
          </div>
        </div>
      )}

      {activeTab === 'Calculator' && (
        <LoanCalculator onApply={handleOpenApplicationModal} />
      )}
    </div>
  );
};

export default Loans;