import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { usePurchases } from '@/hooks/usePurchases';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Check, Shield, Brain, Headphones, Loader2, RefreshCw, X } from 'lucide-react';
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

  const priceString = products.length > 0 
    ? products[0].priceString 
    : null;

  const benefits = [
    {
      icon: Brain,
      title: 'Sua jornada completa, tema por tema',
      description: 'Cada gatilho que você marcou vira um passo prático, no seu ritmo'
    },
    {
      icon: Headphones,
      title: 'Todas as hipnoses e vídeos',
      description: 'Áudios guiados para ouvir sempre que a vontade aparecer'
    },
    {
      icon: Shield,
      title: 'Neo com você nos momentos difíceis',
      description: 'Converse a qualquer hora e receba um plano para o seu gatilho'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="fixed right-3 top-[calc(env(safe-area-inset-top)+10px)] z-50 h-11 w-11 rounded-full bg-background/80 backdrop-blur-md shadow-md"
        aria-label="Fechar"
      >
        <X className="w-5 h-5" />
      </Button>
      <div className="min-h-screen overflow-y-auto flex items-start justify-center px-4 pt-[calc(env(safe-area-inset-top)+64px)] pb-[calc(env(safe-area-inset-bottom)+24px)]">
      <Card className="w-full max-w-md border-accent/20 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-3 rounded-full shadow-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-balance">
            Você já começou. Vamos até o fim?
          </CardTitle>
          <CardDescription className="text-base mt-2 text-balance">
            O primeiro tema é seu de graça. A assinatura libera todos os outros.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-balance">{benefit.title}</h4>
                  <p className="text-xs text-muted-foreground text-balance">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-1.5">
            <p className="text-sm text-muted-foreground flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
              <span className="text-balance">Cancele quando quiser, direto na loja do seu celular</span>
            </p>
            <p className="text-sm text-muted-foreground flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
              <span className="text-balance">Seu progresso e seus registros continuam salvos</span>
            </p>
          </div>

          {priceString && (
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-primary">{priceString}</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-balance">
                Menos do que você gasta com cigarro em poucos dias
              </p>
            </div>
          )}

          <Button 
            onClick={handlePurchase}
            disabled={isPurchasing}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
          >
            {isPurchasing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Crown className="w-5 h-5 mr-2" />
                Liberar minha jornada
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={handleRestore}
            disabled={isPurchasing}
            className="w-full text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Restaurar compras anteriores
          </Button>

          {/* Apple Required Subscription Terms (Guideline 3.1.2) */}
          <div className="text-center space-y-2 pt-2">
            <div className="text-[10px] text-muted-foreground leading-relaxed space-y-1">
              <p>
                A assinatura é renovada automaticamente a menos que a renovação automática seja desativada pelo menos 24 horas antes do final do período atual.
              </p>
              <p>
                O pagamento será cobrado na sua conta do iTunes na confirmação da compra. O valor da renovação será cobrado dentro de 24 horas antes do final do período atual.
              </p>
              <p>
                Você pode gerenciar e cancelar suas assinaturas acessando as configurações da sua conta na App Store após a compra.
              </p>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              <Link to="/terms" className="underline hover:text-primary">Termos de Uso</Link>
              {' • '}
              <Link to="/privacy" className="underline hover:text-primary">Política de Privacidade</Link>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Paywall;
