import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

// RevenueCat API Keys (public keys - safe to include in code)
const REVENUECAT_API_KEY_IOS = 'appl_QmMRMglMnjgQtzPjEjHutHtUqMW';
const REVENUECAT_API_KEY_ANDROID = 'goog_PLACEHOLDER'; // TODO: Replace with actual Google Play API key

// Expected product ID for validation logging
const EXPECTED_PRODUCT_ID = 'sopro_30_days_sub';

// Retry config
const MAX_OFFERINGS_RETRIES = 3;
const RETRY_DELAY_MS = 2500;

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

interface RevenueCatCustomerInfo {
  entitlements?: {
    active?: Record<string, unknown>;
  };
  activeSubscriptions?: string[];
}

const getRevenueCatAccess = (customerInfo?: RevenueCatCustomerInfo) => {
  const activeEntitlements = Object.keys(customerInfo?.entitlements?.active || {});
  const activeSubscriptions = customerInfo?.activeSubscriptions || [];
  return {
    activeEntitlements,
    activeSubscriptions,
    hasAccess: activeEntitlements.length > 0 || activeSubscriptions.length > 0,
  };
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Wait for Capacitor platform to be fully ready */
const waitForPlatformReady = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  // Small delay to ensure native bridge is fully initialized
  await delay(300);
  console.log('[usePurchases] Platform ready confirmed');
};

export const usePurchases = () => {
  const [state, setState] = useState<PurchasesState>({
    isConfigured: false,
    products: [],
    isPurchasing: false,
    error: null
  });
  const configuredUserIdRef = useRef<string | null>(null);
  const configuringRef = useRef(false); // Prevent parallel configure calls
  const { user } = useAuth();
  const { isPremium, checkSubscription } = useSubscription();
  const { toast } = useToast();

  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();
  const isNativeIOS = isNative && platform === 'ios';
  const isNativeAndroid = isNative && platform === 'android';
  const canPurchase = isNativeIOS || isNativeAndroid;

  const getApiKey = useCallback(() => {
    if (isNativeIOS) return REVENUECAT_API_KEY_IOS;
    if (isNativeAndroid) return REVENUECAT_API_KEY_ANDROID;
    return null;
  }, [isNativeIOS, isNativeAndroid]);

  /** Fetch offerings with retry logic */
  const fetchOfferingsWithRetry = useCallback(async (): Promise<PurchaseProduct[]> => {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    
    for (let attempt = 1; attempt <= MAX_OFFERINGS_RETRIES; attempt++) {
      try {
        console.log(`[usePurchases] getOfferings attempt ${attempt}/${MAX_OFFERINGS_RETRIES} — STARTING`);
        const offerings = await Purchases.getOfferings();
        console.log(`[usePurchases] getOfferings attempt ${attempt} — COMPLETE. Full response:`, JSON.stringify(offerings));
        
        console.log('[usePurchases] Offerings summary:', JSON.stringify({
          hasCurrent: !!offerings?.current,
          currentId: offerings?.current?.identifier || 'none',
          allOfferingIds: Object.keys(offerings?.all || {}),
          packagesCount: offerings?.current?.availablePackages?.length || 0,
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

        // Validate expected product
        if (products.length === 0) {
          console.warn(`[usePurchases] ⚠️ No offerings returned on attempt ${attempt}. current=${offerings?.current?.identifier || 'null'}, allIds=${Object.keys(offerings?.all || {}).join(',')}`);
          if (attempt < MAX_OFFERINGS_RETRIES) {
            console.log(`[usePurchases] Retrying getOfferings in ${RETRY_DELAY_MS}ms...`);
            await delay(RETRY_DELAY_MS);
            continue;
          }
        } else {
          const hasExpectedProduct = products.some(p => p.identifier === EXPECTED_PRODUCT_ID);
          console.log(`[usePurchases] ✅ Found ${products.length} product(s). Expected "${EXPECTED_PRODUCT_ID}" present: ${hasExpectedProduct}`);
          if (!hasExpectedProduct) {
            console.warn(`[usePurchases] ⚠️ Expected product "${EXPECTED_PRODUCT_ID}" NOT found. Available: ${products.map(p => p.identifier).join(', ')}`);
          }
        }

        return products;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorCode = error && typeof error === 'object' && 'code' in error ? (error as any).code : 'unknown';
        console.error(`[usePurchases] getOfferings attempt ${attempt} FAILED: [${errorCode}] ${errorMsg}`, error instanceof Error ? error.stack : '');
        
        if (attempt < MAX_OFFERINGS_RETRIES) {
          console.log(`[usePurchases] Retrying getOfferings in ${RETRY_DELAY_MS}ms...`);
          await delay(RETRY_DELAY_MS);
        } else {
          throw error; // Re-throw on final attempt
        }
      }
    }
    return [];
  }, []);

  /** Configure RevenueCat — sequential, guarded against parallel calls */
  const configureRevenueCat = useCallback(async (): Promise<{ success: boolean; errorDetail?: string }> => {
    const apiKey = getApiKey();

    if (!canPurchase || !apiKey || apiKey.includes('PLACEHOLDER')) {
      console.log('[usePurchases] Skipping config: not native or missing API key');
      return { success: false, errorDetail: `Plataforma não suportada (canPurchase=${canPurchase}, hasKey=${!!apiKey})` };
    }

    // Guard against parallel configure calls
    if (configuringRef.current) {
      console.log('[usePurchases] Configure already in progress, skipping duplicate call');
      return { success: false, errorDetail: 'Configure already in progress' };
    }
    configuringRef.current = true;

    try {
      // 1. Wait for platform to be fully ready
      console.log('[usePurchases] Step 1: Waiting for platform ready...');
      await waitForPlatformReady();

      // 2. Import and configure SDK
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      console.log('[usePurchases] Step 2: Purchases module imported OK');

      if (!state.isConfigured) {
        console.log('[usePurchases] Step 3: Calling Purchases.configure...', {
          apiKey: apiKey.substring(0, 10) + '...',
          appUserID: user?.id?.substring(0, 8) || 'anonymous'
        });

        await Purchases.configure({
          apiKey,
          appUserID: user?.id || undefined
        });
        configuredUserIdRef.current = user?.id || null;

        console.log('[usePurchases] Step 3: ✅ Purchases.configure completed for', platform);
      } else if (user?.id && configuredUserIdRef.current !== user.id) {
        console.log('[usePurchases] Step 3b: Linking user via logIn...', user.id.substring(0, 8));
        const logIn = (Purchases as unknown as {
          logIn?: (params: { appUserID: string }) => Promise<unknown>;
        }).logIn;
        if (logIn) {
          await logIn({ appUserID: user.id });
          configuredUserIdRef.current = user.id;
          console.log('[usePurchases] Step 3b: ✅ User linked');
        }
      }

      // 3. Fetch offerings ONLY after configure is fully complete
      console.log('[usePurchases] Step 4: Fetching offerings (after configure)...');
      const products = await fetchOfferingsWithRetry();

      // Log to DB if empty
      if (products.length === 0) {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          await supabase.from('app_error_logs').insert({
            error_message: `RevenueCat: 0 products after ${MAX_OFFERINGS_RETRIES} attempts`,
            error_context: `usePurchases.configureRevenueCat | platform=${platform}`,
            page_url: window.location.pathname,
            platform,
          });
        } catch (_) { /* ignore */ }
      }

      setState(prev => ({
        ...prev,
        isConfigured: true,
        products,
        error: null
      }));

      console.log('[usePurchases] Step 5: ✅ Init complete. Products:', products.length);
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as any).code : 'unknown';
      const errorDetail = `[${errorCode}] ${errorMsg}`;
      console.error('[usePurchases] ❌ Configure FAILED:', errorDetail);
      console.error('[usePurchases] Full error:', JSON.stringify(error));
      if (error instanceof Error) console.error('[usePurchases] Stack:', error.stack);

      try {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.from('app_error_logs').insert({
          error_message: `RevenueCat config failed ${errorDetail}`,
          error_stack: error instanceof Error ? error.stack : JSON.stringify(error),
          error_context: `usePurchases.configureRevenueCat | platform=${platform} | apiKey=${apiKey?.substring(0, 10)}`,
          page_url: window.location.pathname,
          platform,
        });
      } catch (_) { /* ignore */ }

      setState(prev => ({ ...prev, error: errorDetail }));
      return { success: false, errorDetail };
    } finally {
      configuringRef.current = false;
    }
  }, [canPurchase, platform, user?.id, getApiKey, state.isConfigured, fetchOfferingsWithRetry]);

  // Auto-configure on mount
  useEffect(() => {
    configureRevenueCat();
  }, [configureRevenueCat]);

  // Purchase the premium product
  const purchasePremium = useCallback(async () => {
    if (!canPurchase) {
      toast({ title: "Erro", description: "Compras só estão disponíveis no app nativo", variant: "destructive" });
      return false;
    }

    // On-demand configure if needed
    if (!state.isConfigured) {
      console.log('[usePurchases] Purchase: not configured yet, configuring on-demand...');
      const result = await configureRevenueCat();
      if (!result.success) {
        toast({ title: "Erro ao conectar à loja", description: result.errorDetail || "Não foi possível conectar à loja.", variant: "destructive" });
        return false;
      }
    }

    setState(prev => ({ ...prev, isPurchasing: true, error: null }));

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');

      console.log('[usePurchases] Purchase: fetching offerings...');
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages?.[0];

      console.log('[usePurchases] Purchase: package:', pkg ? `${pkg.product.identifier} @ ${pkg.product.priceString}` : 'NONE');

      if (!pkg) {
        throw new Error('Nenhum produto disponível. ' + JSON.stringify({
          hasCurrent: !!offerings?.current,
          allOfferingIds: Object.keys(offerings?.all || {})
        }));
      }

      // Validate product ID
      if (pkg.product.identifier !== EXPECTED_PRODUCT_ID) {
        console.warn(`[usePurchases] ⚠️ Product ID mismatch! Expected "${EXPECTED_PRODUCT_ID}", got "${pkg.product.identifier}"`);
      }

      console.log('[usePurchases] Purchase: calling purchasePackage...');
      const purchaseResult = await Purchases.purchasePackage({ aPackage: pkg });
      const access = getRevenueCatAccess(purchaseResult.customerInfo as RevenueCatCustomerInfo);
      console.log('[usePurchases] Purchase result:', JSON.stringify({
        activeEntitlements: access.activeEntitlements,
        activeSubscriptions: access.activeSubscriptions,
        hasAccess: access.hasAccess
      }));

      if (access.hasAccess) {
        toast({ title: "Compra realizada!", description: "Você agora tem acesso premium por 30 dias" });
        await checkSubscription();
        setState(prev => ({ ...prev, isPurchasing: false }));
        return true;
      } else {
        throw new Error('Compra concluída, mas nenhum entitlement/assinatura ativa identificado');
      }
    } catch (error: unknown) {
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as any).code : 'unknown';
      let errorMessage = 'Erro ao realizar compra';
      if (error && typeof error === 'object' && 'userCancelled' in error && error.userCancelled) {
        errorMessage = 'Compra cancelada';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error(`[usePurchases] ❌ Purchase error [${errorCode}]:`, errorMessage);
      if (error instanceof Error) console.error('[usePurchases] Stack:', error.stack);

      try {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.from('app_error_logs').insert({
          error_message: `Purchase failed [${errorCode}]: ${errorMessage}`,
          error_stack: error instanceof Error ? error.stack : JSON.stringify(error),
          error_context: `usePurchases.purchasePremium | platform=${platform}`,
          page_url: window.location.pathname,
          platform,
        });
      } catch (_) { /* ignore */ }

      setState(prev => ({ ...prev, isPurchasing: false, error: errorMessage }));
      toast({ title: "Erro na compra", description: errorMessage, variant: "destructive" });
      return false;
    }
  }, [canPurchase, state.isConfigured, configureRevenueCat, checkSubscription, toast, platform]);

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    if (!canPurchase) return false;

    setState(prev => ({ ...prev, isPurchasing: true, error: null }));

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      console.log('[usePurchases] Restore: calling restorePurchases...');
      const customerInfo = await Purchases.restorePurchases();
      const access = getRevenueCatAccess(customerInfo.customerInfo as RevenueCatCustomerInfo);
      console.log('[usePurchases] Restore result:', JSON.stringify(access));

      if (access.hasAccess) {
        toast({ title: "Compras restauradas!", description: "Seu acesso premium foi restaurado" });
        await checkSubscription();
        setState(prev => ({ ...prev, isPurchasing: false }));
        return true;
      } else {
        toast({ title: "Nenhuma compra encontrada", description: "Não encontramos compras anteriores para restaurar" });
        setState(prev => ({ ...prev, isPurchasing: false }));
        return false;
      }
    } catch (error) {
      console.error('[usePurchases] ❌ Restore error:', error);
      setState(prev => ({ ...prev, isPurchasing: false, error: 'Erro ao restaurar compras' }));
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
