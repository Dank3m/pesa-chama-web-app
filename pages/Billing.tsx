/**
 * Billing Page
 * Displays subscription plans, current plan, and payment history
 */

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  X,
  Crown,
  Star,
  Zap,
  Users,
  Phone,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import subscriptionService, {
  SubscriptionPlan,
  GroupSubscription,
  SubscriptionPayment,
  PaymentInitiationResponse,
  getPlanColor,
  formatFeatureName,
} from '../services/subscriptionService';
import { useAppData } from '../contexts/AppDataContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: SubscriptionPlan | null;
  onPaymentInitiated: (response: PaymentInitiationResponse) => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, selectedPlan, onPaymentInitiated }) => {
  const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'BANK' | 'PESALINK' | 'CARD'>('MPESA');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !selectedPlan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await subscriptionService.initiatePayment({
        planId: selectedPlan.id,
        paymentMethod,
        phoneNumber: paymentMethod === 'MPESA' ? phoneNumber : undefined,
      });
      onPaymentInitiated(response.data);
      onClose();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to initiate payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-dark dark:text-white">Upgrade to {selectedPlan.displayName}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <p className="text-subtext dark:text-gray-400 mt-2">
            KES {selectedPlan.price.toLocaleString()}/{selectedPlan.billingPeriod.toLowerCase()}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-dark dark:text-white mb-3">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('MPESA')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${
                  paymentMethod === 'MPESA'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <Phone size={24} className={paymentMethod === 'MPESA' ? 'text-primary' : 'text-gray-400'} />
                <span className={paymentMethod === 'MPESA' ? 'text-primary font-medium' : 'text-subtext'}>M-Pesa</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('BANK')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${
                  paymentMethod === 'BANK'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <Building2 size={24} className={paymentMethod === 'BANK' ? 'text-primary' : 'text-gray-400'} />
                <span className={paymentMethod === 'BANK' ? 'text-primary font-medium' : 'text-subtext'}>Bank Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('PESALINK')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${
                  paymentMethod === 'PESALINK'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <Zap size={24} className={paymentMethod === 'PESALINK' ? 'text-primary' : 'text-gray-400'} />
                <span className={paymentMethod === 'PESALINK' ? 'text-primary font-medium' : 'text-subtext'}>PesaLink</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${
                  paymentMethod === 'CARD'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <CreditCard size={24} className={paymentMethod === 'CARD' ? 'text-primary' : 'text-gray-400'} />
                <span className={paymentMethod === 'CARD' ? 'text-primary font-medium' : 'text-subtext'}>Card</span>
              </button>
            </div>
          </div>

          {/* M-Pesa Phone Number */}
          {paymentMethod === 'MPESA' && (
            <div>
              <label className="block text-sm font-medium text-dark dark:text-white mb-2">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0712345678"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                required
                pattern="^0[17]\d{8}$"
              />
              <p className="text-xs text-subtext dark:text-gray-400 mt-1">Enter your Safaricom or Airtel number</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay KES {selectedPlan.price.toLocaleString()}
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const PaymentInstructionsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentInitiationResponse | null;
}> = ({ isOpen, onClose, payment }) => {
  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-dark dark:text-white">Payment Instructions</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {payment.paymentMethod === 'MPESA' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone size={32} className="text-green-600" />
              </div>
              <h4 className="font-medium text-dark dark:text-white mb-2">M-Pesa STK Push Sent</h4>
              <p className="text-subtext dark:text-gray-400">
                Check your phone for the M-Pesa prompt and enter your PIN to complete payment.
              </p>
            </div>
          )}

          {(payment.paymentMethod === 'BANK' || payment.paymentMethod === 'PESALINK') && (
            <div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-xs text-subtext dark:text-gray-400">Bank Name</p>
                  <p className="font-medium text-dark dark:text-white">{payment.bankName}</p>
                </div>
                <div>
                  <p className="text-xs text-subtext dark:text-gray-400">Account Number</p>
                  <p className="font-medium text-dark dark:text-white">{payment.bankAccountNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-subtext dark:text-gray-400">Reference</p>
                  <p className="font-medium text-dark dark:text-white font-mono">{payment.paymentReference}</p>
                </div>
                <div>
                  <p className="text-xs text-subtext dark:text-gray-400">Amount</p>
                  <p className="font-medium text-dark dark:text-white">KES {payment.amount.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-sm text-subtext dark:text-gray-400 mt-4">{payment.instructions}</p>
            </div>
          )}

          {payment.paymentMethod === 'CARD' && payment.checkoutUrl && (
            <div className="text-center">
              <p className="text-subtext dark:text-gray-400 mb-4">
                You will be redirected to complete your payment securely.
              </p>
              <a
                href={payment.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition"
              >
                <CreditCard size={20} />
                Complete Payment
              </a>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 rounded-b-2xl">
          <p className="text-sm text-subtext dark:text-gray-400 text-center">
            Payment Number: <span className="font-mono">{payment.paymentNumber}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const Billing: React.FC = () => {
  const { formatCurrency } = useAppData();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<GroupSubscription | null>(null);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [paymentInstructions, setPaymentInstructions] = useState<PaymentInitiationResponse | null>(null);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const overviewResponse = await subscriptionService.getOverview();
      setPlans(overviewResponse.data.availablePlans);
      setSubscription(overviewResponse.data.currentSubscription);
      setPayments(overviewResponse.data.recentPayments);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeClick = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const handlePaymentInitiated = (response: PaymentInitiationResponse) => {
    setPaymentInstructions(response);
    setShowInstructionsModal(true);
    // Refresh data after a delay to check for payment completion
    setTimeout(fetchData, 5000);
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'FREE':
        return <Star size={24} />;
      case 'STANDARD':
        return <Zap size={24} />;
      case 'PREMIUM':
        return <Crown size={24} />;
      default:
        return <Star size={24} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Completed</span>;
      case 'PENDING':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Pending</span>;
      case 'FAILED':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Failed</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <p className="text-subtext dark:text-gray-400">{error}</p>
        <button onClick={fetchData} className="mt-4 text-primary hover:underline flex items-center gap-2 mx-auto">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Plan Card */}
      {subscription && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                getPlanColor(subscription.plan.name) === 'purple' ? 'bg-purple-100 text-purple-600' :
                getPlanColor(subscription.plan.name) === 'blue' ? 'bg-blue-100 text-blue-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {getPlanIcon(subscription.plan.name)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-dark dark:text-white">{subscription.plan.displayName} Plan</h3>
                <p className="text-subtext dark:text-gray-400">
                  {subscription.isGrandfathered ? (
                    <span className="text-green-600">Grandfathered - Free forever!</span>
                  ) : subscription.endDate ? (
                    <>Renews on {new Date(subscription.endDate).toLocaleDateString()}</>
                  ) : (
                    'Free tier - No expiry'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {subscription.isExpiringSoon && (
                <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-sm rounded-full flex items-center gap-1">
                  <Clock size={14} /> Expiring soon
                </span>
              )}
              <span className={`px-3 py-1.5 text-sm rounded-full ${
                subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                subscription.status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {subscription.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div>
        <h2 className="text-xl font-bold text-dark dark:text-white mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-2 transition ${
                plan.isCurrentPlan
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
              }`}
            >
              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                  getPlanColor(plan.name) === 'purple' ? 'bg-purple-100 text-purple-600' :
                  getPlanColor(plan.name) === 'blue' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {getPlanIcon(plan.name)}
                </div>
                <h3 className="text-lg font-bold text-dark dark:text-white">{plan.displayName}</h3>
                <p className="text-subtext dark:text-gray-400 text-sm mt-1">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-dark dark:text-white">
                    KES {plan.price.toLocaleString()}
                  </span>
                  <span className="text-subtext dark:text-gray-400">/{plan.billingPeriod.toLowerCase()}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <Users size={16} className="text-gray-400" />
                  <span className="text-subtext dark:text-gray-300">
                    {plan.unlimitedMembers ? 'Unlimited members' : `Up to ${plan.maxMembers} members`}
                  </span>
                </li>
                {Object.entries(plan.features).map(([feature, enabled]) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    {enabled ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <X size={16} className="text-gray-300" />
                    )}
                    <span className={enabled ? 'text-dark dark:text-white' : 'text-gray-400 line-through'}>
                      {formatFeatureName(feature)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              {plan.isCurrentPlan ? (
                <button
                  disabled
                  className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-subtext dark:text-gray-400 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Current Plan
                </button>
              ) : plan.price > 0 ? (
                <button
                  onClick={() => handleUpgradeClick(plan)}
                  className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition"
                >
                  Upgrade to {plan.displayName}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-subtext dark:text-gray-400 rounded-xl font-medium"
                >
                  Free Plan
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-dark dark:text-white">Payment History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-750">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-subtext dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-subtext dark:text-gray-400 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-subtext dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-subtext dark:text-gray-400 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-subtext dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark dark:text-white">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark dark:text-white">
                      {payment.planName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark dark:text-white">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-subtext dark:text-gray-400">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        selectedPlan={selectedPlan}
        onPaymentInitiated={handlePaymentInitiated}
      />

      <PaymentInstructionsModal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
        payment={paymentInstructions}
      />
    </div>
  );
};

export default Billing;
