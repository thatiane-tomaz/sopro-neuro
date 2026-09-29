import PaywallView from '@/components/PaywallView';

/**
 * Rota apenas para preview/edição visual da tela de pagamento.
 * Não exige login, não registra eventos e não executa compras.
 */
const PaywallPreview = () => {
  return (
    <PaywallView
      isPurchasing={false}
      onPurchase={() => {}}
      onRestore={() => {}}
      onClose={() => {}}
    />
  );
};

export default PaywallPreview;
