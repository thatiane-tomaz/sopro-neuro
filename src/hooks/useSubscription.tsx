import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const checkSubscription = useCallback(async () => {
    // Only call if we have both user and a valid session
    if (!user || !session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        // Don't throw, just log - subscription check failure shouldn't crash the app
        return;
      }
      
      setSubscriptionData(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Silently fail - subscription check is not critical
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
    
    // Auto-refresh every minute only if user is authenticated
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

  const verifyPayment = useCallback(async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { session_id: sessionId }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        await checkSubscription();
        toast({
          title: "Pagamento confirmado!",
          description: "Você agora tem acesso premium por 30 dias",
        });
      }
      return data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar pagamento",
        variant: "destructive"
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkSubscription]);

  const createCheckout = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar sessão de pagamento",
        variant: "destructive"
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCustomerPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Erro",
        description: "Erro ao abrir portal do cliente",
        variant: "destructive"
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      return Math.max(0, days); // Never return negative days
    } catch (error) {
      console.error('Error calculating days remaining:', error);
      return 0;
    }
  })();

  // Check if subscription is expired (had subscription but now inactive)
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
    createCheckout,
    openCustomerPortal,
    verifyPayment
  };
};
