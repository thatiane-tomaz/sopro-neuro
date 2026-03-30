import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

// No hardcoded product ID - uses dynamic offerings from RevenueCat

// RevenueCat API Keys (public keys - safe to include in code)
const REVENUECAT_API_KEY_IOS = 'appl_QmMRMglMnjgQtzPjEjHutHtUqMW';
const REVENUECAT_API_KEY_ANDROID = 'goog_PLACEHOLDER'; // TODO: Replace with actual Google Play API key

interface PurchaseProduct {
  identifier: string;
  priceString: string;
  price: number;
  title: string;
  description: string;
}

interface PurchasesState {
  isConfigured: boolean;
  products: PurchaseProduct[];
  isPurchasing: boolean;
  error: string | null;
}

export const usePurchases = () => {
  const [state, setState] = useState<PurchasesState>({
    isConfigured: false,
    products: [],
    isPurchasing: false,
    error: null
  });
  const { user } = useAuth();
  const { isPremium, checkSubscription } = useSubscription();
  const { toast } = useToast();

  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();
  const isNativeIOS = isNative && platform === 'ios';
  const isNativeAndroid = isNative && platform === 'android';
  const canPurchase = isNativeIOS || isNativeAndroid;

  // Get the appropriate API key based on platform
  const getApiKey = useCallback(() => {
    if (isNativeIOS) return REVENUECAT_API_KEY_IOS;
    if (isNativeAndroid) return REVENUECAT_API_KEY_ANDROID;
    return null;
  }, [isNativeIOS, isNativeAndroid]);

  // Configure RevenueCat - extracted as a reusable function
  const configureRevenueCat = useCallback(async () => {
    const apiKey = getApiKey();
    
    if (!canPurchase || !apiKey || apiKey.includes('PLACEHOLDER')) {
      console.log('[usePurchases] Not native or missing API key, skipping RevenueCat config');
      return false;
    }

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      
      console.log('[usePurchases] Step 1: Importing Purchases OK');
      console.log('[usePurchases] Step 2: Configuring with apiKey:', apiKey?.substring(0, 10) + '...', 'userID:', user?.id?.substring(0, 8));
      
      // Configure with user ID if available
      await Purchases.configure({
        apiKey,
        appUserID: user?.id || undefined
      });

      console.log('[usePurchases] Step 3: RevenueCat configured for', platform);
      
      // Get available products
      const offerings = await Purchases.getOfferings();
      console.log('[usePurchases] Step 4: FULL offerings object:', JSON.stringify(offerings));
      console.log('[usePurchases] Step 4: Offerings summary:', JSON.stringify({
        hasOfferings: !!offerings,
        hasCurrent: !!offerings?.current,
        currentId: offerings?.current?.identifier || 'none',
        allOfferingIds: Object.keys(offerings?.all || {}),
        packagesCount: offerings?.current?.availablePackages?.length || 0,
        packageIds: offerings?.current?.availablePackages?.map(p => p.product.identifier) || [],
        packageDetails: offerings?.current?.availablePackages?.map(p => ({
          id: p.product.identifier,
          price: p.product.priceString,
          type: p.packageType
        })) || []
      }));

      const products: PurchaseProduct[] = [];
      
      if (offerings.current?.availablePackages) {
        for (const pkg of offerings.current.availablePackages) {
          products.push({
            identifier: pkg.product.identifier,
            priceString: pkg.product.priceString,
            price: pkg.product.price,
            title: pkg.product.title,
            description: pkg.product.description
          });
        }
      }

      setState(prev => ({
        ...prev,
        isConfigured: true,
        products,
        error: null
      }));
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as any).code : 'unknown';
      console.error('[usePurchases] Error configuring RevenueCat:', { errorMsg, errorCode, fullError: JSON.stringify(error) });
      
      // Log to database for remote debugging
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.from('app_error_logs').insert({
          error_message: `RevenueCat config failed [${errorCode}]: ${errorMsg}`,
          error_stack: error instanceof Error ? error.stack : JSON.stringify(error),
          error_context: `usePurchases.configureRevenueCat | platform=${platform} | apiKey=${apiKey?.substring(0, 10)}`,
          page_url: window.location.pathname,
          platform,
        });
      } catch (logErr) {
        console.warn('[usePurchases] Failed to log error:', logErr);
      }
      
      setState(prev => ({
        ...prev,
        error: `Erro ao carregar produtos: ${errorMsg}`
      }));
      return false;
    }
  }, [canPurchase, platform, user?.id, getApiKey]);

  // Auto-configure on mount
  useEffect(() => {
    configureRevenueCat();
  }, [configureRevenueCat]);

  // Purchase the premium product
  const purchasePremium = useCallback(async () => {
    if (!canPurchase) {
      toast({
        title: "Erro",
        description: "Compras só estão disponíveis no app nativo",
        variant: "destructive"
      });
      return false;
    }

    // Try to configure on demand if not yet configured
    if (!state.isConfigured) {
      const configured = await configureRevenueCat();
      if (!configured) {
        toast({
          title: "Erro",
          description: state.error || "Não foi possível conectar à loja. Verifique sua conexão e tente novamente.",
          variant: "destructive"
        });
        return false;
      }
    }

    setState(prev => ({ ...prev, isPurchasing: true, error: null }));

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      
      console.log('[usePurchases] Purchase Step 1: Getting offerings...');
      // Get offerings and use the first available package (dynamic - works for any product type)
      const offerings = await Purchases.getOfferings();
      console.log('[usePurchases] Purchase Step 2: Offerings:', JSON.stringify({
        hasCurrent: !!offerings?.current,
        packagesCount: offerings?.current?.availablePackages?.length || 0,
        packageIds: offerings?.current?.availablePackages?.map(p => p.product.identifier) || []
      }));
      const pkg = offerings.current?.availablePackages?.[0];

      if (!pkg) {
        throw new Error('Nenhum produto disponível. Offerings: ' + JSON.stringify({
          hasCurrent: !!offerings?.current,
          allOfferingIds: Object.keys(offerings?.all || {})
        }));
      }

      console.log('[usePurchases] Purchase Step 3: Purchasing package:', pkg.product.identifier, pkg.product.priceString);
      // Make the purchase
      const purchaseResult = await Purchases.purchasePackage({ aPackage: pkg });
      console.log('[usePurchases] Purchase Step 4: Result:', JSON.stringify({
        hasEntitlements: !!purchaseResult?.customerInfo?.entitlements?.active,
        activeEntitlements: Object.keys(purchaseResult?.customerInfo?.entitlements?.active || {})
      }));

      // Check entitlements
      const customerInfo = purchaseResult.customerInfo;
      const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;

      if (hasPremium) {
        toast({
          title: "Compra realizada!",
          description: "Você agora tem acesso premium por 30 dias"
        });
        
        // Refresh subscription status
        await checkSubscription();
        
        setState(prev => ({ ...prev, isPurchasing: false }));
        return true;
      } else {
        throw new Error('Compra não concedeu acesso premium');
      }
    } catch (error: unknown) {
      console.error('[usePurchases] Purchase error:', JSON.stringify(error));
      
      let errorMessage = 'Erro ao realizar compra';
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as any).code : 'unknown';
      if (error && typeof error === 'object' && 'userCancelled' in error && error.userCancelled) {
        errorMessage = 'Compra cancelada';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Log purchase errors to database
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.from('app_error_logs').insert({
          error_message: `Purchase failed [${errorCode}]: ${errorMessage}`,
          error_stack: error instanceof Error ? error.stack : JSON.stringify(error),
          error_context: `usePurchases.purchasePremium | platform=${platform}`,
          page_url: window.location.pathname,
          platform,
        });
      } catch (logErr) {
        console.warn('[usePurchases] Failed to log purchase error:', logErr);
      }

      setState(prev => ({
        ...prev,
        isPurchasing: false,
        error: errorMessage
      }));

      toast({
        title: "Erro na compra",
        description: errorMessage,
        variant: "destructive"
      });

      return false;
    }
  }, [canPurchase, state.isConfigured, configureRevenueCat, checkSubscription, toast]);

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    if (!canPurchase) {
      return false;
    }

    setState(prev => ({ ...prev, isPurchasing: true, error: null }));

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      
      const customerInfo = await Purchases.restorePurchases();
      console.log('[usePurchases] Restore result:', customerInfo);

      const hasPremium = customerInfo.customerInfo.entitlements.active['premium'] !== undefined;

      if (hasPremium) {
        toast({
          title: "Compras restauradas!",
          description: "Seu acesso premium foi restaurado"
        });
        await checkSubscription();
        setState(prev => ({ ...prev, isPurchasing: false }));
        return true;
      } else {
        toast({
          title: "Nenhuma compra encontrada",
          description: "Não encontramos compras anteriores para restaurar"
        });
        setState(prev => ({ ...prev, isPurchasing: false }));
        return false;
      }
    } catch (error) {
      console.error('[usePurchases] Restore error:', error);
      setState(prev => ({
        ...prev,
        isPurchasing: false,
        error: 'Erro ao restaurar compras'
      }));
      return false;
    }
  }, [canPurchase, checkSubscription, toast]);

  return {
    isConfigured: state.isConfigured,
    products: state.products,
    isPurchasing: state.isPurchasing,
    error: state.error,
    isNative,
    isNativeIOS,
    isNativeAndroid,
    canPurchase,
    isPremium,
    purchasePremium,
    restorePurchases
  };
};
