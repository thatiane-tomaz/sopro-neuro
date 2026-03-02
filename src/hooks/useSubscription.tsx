import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
  status?: string;
  has_subscription?: boolean;
  expires_at?: string;
  started_at?: string;
  amount_paid?: number;
}

export const useSubscription = () => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();

  const checkSubscription = useCallback(async () => {
    if (!user || !session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      
      setSubscriptionData(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    let isMounted = true;
    let interval: ReturnType<typeof setInterval> | null = null;
    
    const doCheck = async () => {
      if (!isMounted || !user || !session?.access_token) return;
      await checkSubscription();
    };
    
    doCheck();
    
    if (user && session?.access_token) {
      interval = setInterval(() => {
        if (isMounted && user && session?.access_token) {
          checkSubscription();
        }
      }, 60000);
    }
    
    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [checkSubscription, user, session]);

  // Calculate days remaining with validation
  const daysRemaining = (() => {
    try {
      let endDate: Date | null = null;
      
      if (subscriptionData?.subscription_end) {
        endDate = new Date(subscriptionData.subscription_end);
      } else if (subscriptionData?.expires_at) {
        endDate = new Date(subscriptionData.expires_at);
      }
      
      if (!endDate || isNaN(endDate.getTime())) return 0;
      
      const days = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(0, days);
    } catch (error) {
      console.error('Error calculating days remaining:', error);
      return 0;
    }
  })();

  const isExpired = subscriptionData?.has_subscription && 
    subscriptionData?.status === 'expired' && 
    !subscriptionData?.subscribed;

  return {
    subscriptionData,
    loading,
    isPremium: subscriptionData?.subscribed || false,
    isExpired,
    daysRemaining,
    checkSubscription,
  };
};
