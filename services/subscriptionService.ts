/**
 * Subscription Service
 * Handles subscription plans, billing, and feature access
 */

import api, { ApiResponse, PagedResponse } from './api';

// ==================== TYPES ====================

export interface SubscriptionPlan {
  id: string;
  name: string; // FREE, STANDARD, PREMIUM
  displayName: string;
  description?: string;
  price: number;
  currency: string;
  billingPeriod: string; // MONTHLY, YEARLY
  maxMembers: number | null;
  unlimitedMembers: boolean;
  features: Record<string, boolean>;
  sortOrder: number;
  isCurrentPlan: boolean;
}

export interface GroupSubscription {
  id: string;
  groupId: string;
  groupName: string;
  plan: SubscriptionPlan;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  isGrandfathered: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number | null;
  createdAt: string;
}

export interface SubscriptionPayment {
  id: string;
  paymentNumber: string;
  subscriptionId: string;
  planName: string;
  amount: number;
  currency: string;
  paymentMethod: 'MPESA' | 'BANK' | 'PESALINK' | 'CARD';
  paymentReference: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paidByName: string | null;
  paidAt: string | null;
  periodStart: string;
  periodEnd: string;
  failureReason: string | null;
  createdAt: string;
}

export interface PaymentInitiationResponse {
  paymentNumber: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: string;
  // M-Pesa specific
  checkoutRequestId?: string;
  merchantRequestId?: string;
  // Bank transfer specific
  bankAccountNumber?: string;
  bankName?: string;
  paymentReference?: string;
  instructions?: string;
  // Card payment specific
  checkoutUrl?: string;
  clientSecret?: string;
}

export interface FeatureAccess {
  feature: string;
  hasAccess: boolean;
  currentPlan: string;
  requiredPlan: string;
  message: string;
}

export interface SubscriptionOverview {
  currentSubscription: GroupSubscription | null;
  availablePlans: SubscriptionPlan[];
  recentPayments: SubscriptionPayment[];
  currentMemberCount: number;
  maxMembersAllowed: number | null;
  canAddMoreMembers: boolean;
}

export interface InitiatePaymentRequest {
  planId: string;
  paymentMethod: 'MPESA' | 'BANK' | 'PESALINK' | 'CARD';
  phoneNumber?: string;
}

// ==================== SERVICE ====================

export const subscriptionService = {
  /**
   * Get all available subscription plans
   */
  getPlans: async (): Promise<ApiResponse<SubscriptionPlan[]>> => {
    return api.get('/subscriptions/plans');
  },

  /**
   * Get current subscription for the user's group
   */
  getCurrentSubscription: async (): Promise<ApiResponse<GroupSubscription>> => {
    return api.get('/subscriptions/current');
  },

  /**
   * Get subscription overview (plans, current subscription, payments)
   */
  getOverview: async (): Promise<ApiResponse<SubscriptionOverview>> => {
    return api.get('/subscriptions/overview');
  },

  /**
   * Check if a specific feature is available
   */
  checkFeature: async (feature: string): Promise<ApiResponse<FeatureAccess>> => {
    return api.get(`/subscriptions/features/${feature}`);
  },

  /**
   * Check multiple features at once
   */
  checkFeatures: async (features: string[]): Promise<ApiResponse<FeatureAccess[]>> => {
    return api.get('/subscriptions/features', { features: features.join(',') });
  },

  /**
   * Initiate subscription upgrade (returns info for payment)
   */
  upgradeSubscription: async (planId: string): Promise<ApiResponse<GroupSubscription>> => {
    return api.post('/subscriptions/upgrade', { planId });
  },

  /**
   * Cancel subscription auto-renewal
   */
  cancelSubscription: async (reason?: string): Promise<ApiResponse<GroupSubscription>> => {
    return api.post('/subscriptions/cancel', { reason });
  },

  /**
   * Initiate a payment for subscription
   */
  initiatePayment: async (request: InitiatePaymentRequest): Promise<ApiResponse<PaymentInitiationResponse>> => {
    return api.post('/billing/initiate', request);
  },

  /**
   * Get payment history
   */
  getPaymentHistory: async (page = 0, size = 10): Promise<ApiResponse<PagedResponse<SubscriptionPayment>>> => {
    return api.get('/billing/payments', { page, size });
  },

  /**
   * Get specific payment details
   */
  getPaymentDetails: async (paymentId: string): Promise<ApiResponse<SubscriptionPayment>> => {
    return api.get(`/billing/payments/${paymentId}`);
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get a readable plan tier name
 */
export const getPlanDisplayName = (planName: string): string => {
  switch (planName) {
    case 'FREE':
      return 'Starter';
    case 'STANDARD':
      return 'Standard';
    case 'PREMIUM':
      return 'Premium';
    default:
      return planName;
  }
};

/**
 * Get plan badge color
 */
export const getPlanColor = (planName: string): string => {
  switch (planName) {
    case 'FREE':
      return 'gray';
    case 'STANDARD':
      return 'blue';
    case 'PREMIUM':
      return 'purple';
    default:
      return 'gray';
  }
};

/**
 * Format feature name for display
 */
export const formatFeatureName = (feature: string): string => {
  const names: Record<string, string> = {
    contributions: 'Contributions Tracking',
    basicReports: 'Basic Reports',
    loans: 'Loan Management',
    sms: 'SMS Notifications',
    externalLoans: 'External Loans',
    apiAccess: 'API Access',
    prioritySupport: 'Priority Support',
  };
  return names[feature] || feature;
};

/**
 * Check if user has access to a feature based on current subscription
 */
export const hasFeature = (subscription: GroupSubscription | null, feature: string): boolean => {
  if (!subscription || !subscription.plan) {
    // No subscription means only basic features
    return feature === 'contributions' || feature === 'basicReports';
  }
  return subscription.plan.features[feature] === true;
};

export default subscriptionService;
