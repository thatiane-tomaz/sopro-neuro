import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { usePurchases } from '@/hooks/usePurchases';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Check, Shield, Brain, Headphones, Loader2, RefreshCw } from 'lucide-react';

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

  useEffect(() => {
    if (!subLoading && isPremium) {
      navigate('/dashboard', { replace: true });
    }
  }, [isPremium, subLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handlePurchase = async () => {
    const success = await purchasePremium();
    if (success) {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleRestore = async () => {
    const success = await restorePurchases();
    if (success) {
      navigate('/dashboard', { replace: true });
    }
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
    : 'R$ 49,90';

  const benefits = [
    {
      icon: Brain,
      title: 'Processo completo de 14 dias',
      description: 'Metodologia cientificamente comprovada'
    },
    {
      icon: Headphones,
      title: 'Todas as hipnoses exclusivas',
      description: 'Áudios profissionais de alta qualidade'
    },
    {
      icon: Shield,
      title: 'Técnicas para lidar com gatilhos',
      description: 'Ferramentas práticas para o dia a dia'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-accent/20 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-4 rounded-full shadow-lg">
              <Crown className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Desbloqueie sua Transformação
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Acesso completo ao programa por 30 dias
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{benefit.title}</h4>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              <Check className="w-4 h-4 inline mr-1 text-green-500" />
              Cancele a qualquer momento pela loja
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-primary">{priceString}</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Assinatura recorrente, cancele a qualquer momento
            </p>
          </div>

          <Button 
            onClick={handlePurchase}
            disabled={isPurchasing || !isConfigured}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
          >
            {isPurchasing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Crown className="w-5 h-5 mr-2" />
                Começar Agora
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

          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              Ao continuar, você concorda com nossos{' '}
              <a href="/terms" className="underline hover:text-primary">Termos de Uso</a>
              {' '}e{' '}
              <a href="/privacy" className="underline hover:text-primary">Política de Privacidade</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Paywall;
