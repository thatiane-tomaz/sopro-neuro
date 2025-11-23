import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown, Settings } from 'lucide-react';

interface SubscriptionButtonProps {
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline';
}

export const SubscriptionButton = ({ size = 'sm', variant = 'default' }: SubscriptionButtonProps) => {
  const { isPremium, createCheckout, openCustomerPortal, loading } = useSubscription();

  if (loading) {
    return <Button disabled size={size}>Carregando...</Button>;
  }

  if (isPremium) {
    return (
      <Button
        onClick={openCustomerPortal}
        variant="outline"
        size={size}
        className="gap-2"
      >
        <Settings className="w-4 h-4" />
        {size !== 'sm' && 'Gerenciar Assinatura'}
      </Button>
    );
  }

  return (
    <Button
      onClick={createCheckout}
      variant={variant}
      size={size}
      className="gap-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
    >
      <Crown className="w-3 h-3" />
      {size === 'sm' ? 'Premium' : 'Assinar Premium - R$ 49,90/mês'}
    </Button>
  );
};
