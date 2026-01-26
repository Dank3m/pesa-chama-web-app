/**
 * FeatureGate Component
 * Conditionally renders content based on subscription feature access
 */

import React, { useState, useEffect } from 'react';
import { Lock, Crown, ArrowRight, Loader2 } from 'lucide-react';
import subscriptionService, { FeatureAccess, formatFeatureName, getPlanDisplayName } from '../services/subscriptionService';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  onUpgradeClick?: () => void;
}

/**
 * Default upgrade prompt shown when feature is not available
 */
const DefaultUpgradePrompt: React.FC<{
  featureAccess: FeatureAccess;
  onUpgradeClick?: () => void;
}> = ({ featureAccess, onUpgradeClick }) => {
  const handleClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      // Navigate to billing page
      window.location.href = '/?page=billing';
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-750 rounded-2xl p-8 text-center">
      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock size={32} className="text-purple-600 dark:text-purple-400" />
      </div>

      <h3 className="text-xl font-bold text-dark dark:text-white mb-2">
        Upgrade to Access {formatFeatureName(featureAccess.feature)}
      </h3>

      <p className="text-subtext dark:text-gray-400 mb-6 max-w-md mx-auto">
        {featureAccess.message}
      </p>

      <div className="flex items-center justify-center gap-2 text-sm text-subtext dark:text-gray-400 mb-6">
        <span>Current: <strong className="text-dark dark:text-white">{getPlanDisplayName(featureAccess.currentPlan)}</strong></span>
        <ArrowRight size={16} />
        <span>Required: <strong className="text-purple-600">{getPlanDisplayName(featureAccess.requiredPlan)}</strong></span>
      </div>

      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition"
      >
        <Crown size={18} />
        Upgrade Now
      </button>
    </div>
  );
};

/**
 * FeatureGate wraps content that requires a specific subscription feature.
 * If the user doesn't have access, it shows an upgrade prompt.
 */
const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  onUpgradeClick,
}) => {
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkFeatureAccess();
  }, [feature]);

  const checkFeatureAccess = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await subscriptionService.checkFeature(feature);
      setFeatureAccess(response.data);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to check feature access');
      // Default to no access on error for safety
      setFeatureAccess({
        feature,
        hasAccess: false,
        currentPlan: 'UNKNOWN',
        requiredPlan: 'STANDARD',
        message: 'Unable to verify subscription. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  // User has access - render children
  if (featureAccess?.hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access
  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt && featureAccess) {
    return <DefaultUpgradePrompt featureAccess={featureAccess} onUpgradeClick={onUpgradeClick} />;
  }

  // If no fallback and no upgrade prompt, render nothing
  return null;
};

/**
 * Hook to check feature access programmatically
 */
export const useFeatureAccess = (feature: string) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true);
      try {
        const response = await subscriptionService.checkFeature(feature);
        setFeatureAccess(response.data);
        setHasAccess(response.data.hasAccess);
      } catch {
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAccess();
  }, [feature]);

  return { hasAccess, featureAccess, isLoading };
};

export default FeatureGate;
