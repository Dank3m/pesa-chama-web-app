import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Loader2, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { stkPushService, StkPushStatus } from '../services/stkPushService';
import { useAppData } from '../contexts/AppDataContext';

interface MpesaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceId: string;
  sourceType: 'LOAN_REPAYMENT' | 'CONTRIBUTION';
  amount: number;
  defaultPhone?: string;
  onPaymentComplete: () => void;
}

type Step = 'input' | 'processing' | 'result';

const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS = 120000; // 2 minutes

const MpesaPaymentModal: React.FC<MpesaPaymentModalProps> = ({
  isOpen,
  onClose,
  sourceId,
  sourceType,
  amount,
  defaultPhone = '',
  onPaymentComplete,
}) => {
  const { formatCurrency } = useAppData();

  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [step, setStep] = useState<Step>('input');

  // M-Pesa only accepts whole numbers, so we round up
  const hasDecimals = amount % 1 !== 0;
  const mpesaAmount = hasDecimals ? Math.ceil(amount) : amount;
  const excessAmount = hasDecimals ? +(mpesaAmount - amount).toFixed(2) : 0;
  const [collectionRef, setCollectionRef] = useState<string | null>(null);
  const [status, setStatus] = useState<StkPushStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhoneNumber(defaultPhone);
      setStep('input');
      setCollectionRef(null);
      setStatus(null);
      setError(null);
      setIsInitiating(false);
    }
  }, [isOpen, defaultPhone]);

  // Cleanup polling on unmount or step change
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
          setStatus(statusResponse);
          setStep('result');
        } else if (statusResponse.status === 'FAILED' || statusResponse.status === 'CANCELLED') {
          stopPolling();
          setStatus(statusResponse);
          setError(statusResponse.statusDescription || 'Payment was not completed.');
          setStep('result');
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
      setError('Payment confirmation timed out. Please check your M-Pesa messages and try again if the payment was not completed.');
      setStep('result');
    }, TIMEOUT_MS);
  };

  const handleInitiate = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number.');
      return;
    }

    // Basic Kenyan phone validation
    const cleaned = phoneNumber.replace(/\s/g, '');
    if (!/^(07|01)\d{8}$/.test(cleaned)) {
      setError('Please enter a valid Kenyan phone number (e.g., 0712345678).');
      return;
    }

    setError(null);
    setIsInitiating(true);

    try {
      const response = await stkPushService.initiate({
        sourceId,
        sourceType,
        amount,
        phoneNumber: cleaned,
      });

      setCollectionRef(response.collectionRef);
      setStep('processing');
      startPolling(response.collectionRef);
    } catch (err: any) {
      setError(err?.message || 'Failed to initiate M-Pesa payment. Please try again.');
    } finally {
      setIsInitiating(false);
    }
  };

  const handleTryAgain = () => {
    stopPolling();
    setStep('input');
    setCollectionRef(null);
    setStatus(null);
    setError(null);
  };

  const handleDone = () => {
    stopPolling();
    onPaymentComplete();
    onClose();
  };

  const handleClose = () => {
    if (step === 'processing') return; // Don't allow close during processing
    stopPolling();
    onClose();
  };

  if (!isOpen) return null;

  const isSuccess = step === 'result' && status && (status.status === 'COMPLETED' || status.status === 'SUCCESS');
  const isFailed = step === 'result' && !isSuccess;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-dark dark:text-white flex items-center gap-2">
            <Smartphone size={24} className="text-green-600" />
            {step === 'result' && isSuccess ? 'Payment Complete' : 'Pay via M-Pesa'}
          </h2>
          {step !== 'processing' && (
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            >
              <X size={20} className="text-subtext dark:text-gray-400" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Input Step */}
          {step === 'input' && (
            <div className="space-y-5">
              {/* Amount Display */}
              <div>
                <label className="block text-sm font-medium text-subtext dark:text-gray-400 mb-1">
                  Amount
                </label>
                <p className="text-2xl font-bold text-dark dark:text-white">
                  {formatCurrency(amount)}
                </p>
                {hasDecimals && (
                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      M-Pesa will charge <span className="font-semibold">{formatCurrency(mpesaAmount)}</span> (rounded up from {formatCurrency(amount)}).
                      The excess of <span className="font-semibold">{formatCurrency(excessAmount)}</span> will be credited to your balance.
                    </p>
                  </div>
                )}
              </div>

              {/* Phone Number Input */}
              <div>
                <label className="block text-sm font-medium text-dark dark:text-gray-200 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setError(null);
                  }}
                  placeholder="0712345678"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-primary outline-none transition-colors"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleInitiate}
                disabled={isInitiating}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isInitiating ? (
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

              {/* Help Text */}
              <p className="text-xs text-subtext dark:text-gray-500 text-center">
                An STK push will be sent to your phone. Enter your M-Pesa PIN to complete payment.
              </p>
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
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

          {/* Result Step - Success */}
          {step === 'result' && isSuccess && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <CheckCircle size={56} className="text-green-500" />
              <div className="text-center">
                <p className="text-xl font-bold text-dark dark:text-white mb-1">
                  Payment Successful!
                </p>
                <p className="text-lg text-green-600 font-semibold">
                  {formatCurrency(hasDecimals ? mpesaAmount : amount)}
                </p>
                {hasDecimals && (
                  <p className="text-sm text-subtext dark:text-gray-400 mt-1">
                    {formatCurrency(amount)} applied + {formatCurrency(excessAmount)} credited to your balance
                  </p>
                )}
              </div>
              {status?.mpesaReceiptNumber && (
                <p className="text-sm text-subtext dark:text-gray-400">
                  Receipt: <span className="font-medium text-dark dark:text-white">{status.mpesaReceiptNumber}</span>
                </p>
              )}
              <button
                onClick={handleDone}
                className="w-full px-4 py-3 bg-primary text-white rounded-full font-bold hover:bg-blue-700 transition mt-4"
              >
                Done
              </button>
            </div>
          )}

          {/* Result Step - Failed/Timeout */}
          {step === 'result' && isFailed && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <XCircle size={56} className="text-red-500" />
              <div className="text-center">
                <p className="text-xl font-bold text-dark dark:text-white mb-1">
                  Payment Failed
                </p>
                <p className="text-sm text-subtext dark:text-gray-400">
                  {error || status?.statusDescription || 'The payment could not be completed.'}
                </p>
              </div>
              <button
                onClick={handleTryAgain}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition mt-4"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MpesaPaymentModal;
