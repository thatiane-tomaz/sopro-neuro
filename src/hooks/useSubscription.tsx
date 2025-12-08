import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
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
      
      if (error) throw error;
      
      setSubscriptionData(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    checkSubscription();
    
    // Auto-refresh every minute
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const verifyPayment = async (sessionId: string) => {
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
  };

  const createCheckout = async () => {
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
  };

  const openCustomerPortal = async () => {
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
  };

  const daysRemaining = subscriptionData?.subscription_end 
    ? Math.ceil((new Date(subscriptionData.subscription_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    subscriptionData,
    loading,
    isPremium: subscriptionData?.subscribed || false,
    daysRemaining,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    verifyPayment
  };
};
