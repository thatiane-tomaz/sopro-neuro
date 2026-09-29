import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { usePurchases } from '@/hooks/usePurchases';
import { Loader2 } from 'lucide-react';
import PaywallView from '@/components/PaywallView';
import { trackEvent } from '@/lib/tracking';

const Paywall = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isPremium, loading: subLoading } = useSubscription();
  const { 
    isConfigured, 
    products, 
    isPurchasing, 
    canPurchase,
    purchasePremium,
    restorePurchases
  } = usePurchases();

  // Diagnostic logging for paywall state
  useEffect(() => {
    console.log('[Paywall] Rendered with state:', {
      authLoading,
      subLoading,
      hasUser: !!user,
      isPremium,
      canPurchase,
      isConfigured,
      productsCount: products.length,
      productIds: products.map(p => p.identifier),
      isPurchasing,
    });
  }, [authLoading, subLoading, user, isPremium, canPurchase, isConfigured, products, isPurchasing]);

  // Funil: quantas pessoas realmente chegam nesta tela
  useEffect(() => {
    if (!authLoading && user && !isPremium) {
      trackEvent('paywall', 'view');
    }
  }, [authLoading, user, isPremium]);

  useEffect(() => {
    if (!subLoading && isPremium) {
      console.log('[Paywall] Redirecting to dashboard - user is premium');
      navigate('/dashboard', { replace: true });
    }
  }, [isPremium, subLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !user) {
      console.log('[Paywall] Redirecting to login - no user');
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handlePurchase = async () => {
    console.log('[Paywall] Purchase button clicked', { canPurchase, isConfigured, productsCount: products.length });
    trackEvent('paywall', 'purchase_click');
    const success = await purchasePremium();
    console.log('[Paywall] Purchase result:', success);
    trackEvent('paywall', success ? 'purchase_success' : 'purchase_fail');
    if (success) {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleRestore = async () => {
    console.log('[Paywall] Restore button clicked', { canPurchase, isConfigured });
    trackEvent('paywall', 'restore_click');
    const success = await restorePurchases();
    console.log('[Paywall] Restore result:', success);
    if (success) {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleClose = () => {
    trackEvent('paywall', 'close');
    navigate('/dashboard');
  };

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PaywallView
      isPurchasing={isPurchasing}
      onPurchase={handlePurchase}
      onRestore={handleRestore}
      onClose={handleClose}
    />
  );
};

export default Paywall;
