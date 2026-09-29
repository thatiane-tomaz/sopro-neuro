import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain, Headphones, MessageCircle, Check, Loader2, RefreshCw, X, Sparkles, ShieldCheck, Wind } from 'lucide-react';

interface Props {
  isPurchasing: boolean;
  onPurchase: () => void;
  onRestore: () => void;
  onClose: () => void;
}

const benefits = [
  { icon: Brain, title: 'Sua jornada completa, tema por tema', text: 'Cada gatilho seu vira um passo prático' },
  { icon: Headphones, title: 'Hipnoses e vídeos guiados', text: 'Inclusive o SOS para quando a vontade aperta' },
  { icon: MessageCircle, title: 'Neo 24h com você', text: 'Um plano na hora para o seu momento difícil' },
];

const PaywallView = ({ isPurchasing, onPurchase, onRestore, onClose }: Props) => (
  <div className="min-h-screen bg-background relative flex flex-col">
    <Button
      variant="ghost"
      size="icon"
      onClick={onClose}
      className="absolute right-3 top-[calc(env(safe-area-inset-top)+10px)] z-50 h-11 w-11 rounded-full bg-background/20 text-primary-foreground hover:bg-background/30 backdrop-blur-md"
      aria-label="Fechar"
    >
      <X className="w-5 h-5" />
    </Button>

    {/* Topo */}
    <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground px-6 pt-[calc(env(safe-area-inset-top)+64px)] pb-16 rounded-b-[2.5rem]">
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-background/10 blur-2xl" />
      <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-accent/40 blur-3xl" />
      <div className="relative max-w-md mx-auto text-center">
        <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-background/15 backdrop-blur flex items-center justify-center">
          <Wind className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold leading-tight text-balance">
          Respire livre do cigarro
        </h1>
        <p className="mt-3 text-base opacity-90 text-balance">
          Seu plano já está pronto, montado a partir dos seus gatilhos.
        </p>
      </div>
    </div>

    <div className="flex-1 px-5 -mt-10 pb-[calc(env(safe-area-inset-bottom)+24px)]">
      <div className="max-w-md mx-auto space-y-5">
        {/* Preço */}
        <div className="relative rounded-3xl bg-card border-2 border-primary shadow-2xl p-6 text-center">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-accent text-accent-foreground text-xs font-bold px-3 py-1 uppercase tracking-wide">
            <Sparkles className="w-3 h-3" /> Acesso completo
          </span>
          <div className="flex items-baseline justify-center gap-1 mt-2">
            <span className="text-5xl font-extrabold text-foreground">R$ 14,90</span>
            <span className="text-muted-foreground font-medium">/mês</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-primary text-balance">
            Menos de R$ 0,50 por dia, menos que um cigarro.
          </p>
        </div>

        {/* Benefícios */}
        <div className="space-y-3">
          {benefits.map((b) => (
            <div key={b.title} className="flex items-center gap-4 rounded-2xl bg-muted/50 p-4">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <b.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{b.title}</p>
                <p className="text-xs text-muted-foreground text-balance">{b.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2"><Check className="w-4 h-4 text-accent shrink-0" /> Cancele quando quiser, direto na loja</p>
          <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-accent shrink-0" /> Pagamento seguro pela Apple ou Google</p>
        </div>

        <Button
          onClick={onPurchase}
          disabled={isPurchasing}
          className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-xl hover:opacity-95"
        >
          {isPurchasing ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processando...</>
          ) : (
            'Começar minha jornada'
          )}
        </Button>

        <Button variant="ghost" onClick={onRestore} disabled={isPurchasing} className="w-full text-sm text-muted-foreground">
          <RefreshCw className="w-4 h-4 mr-2" /> Restaurar compras
        </Button>

        {/* Termos obrigatórios (Apple 3.1.2) */}
        <div className="text-center space-y-2">
          <div className="text-[10px] text-muted-foreground leading-relaxed space-y-1">
            <p>A assinatura é renovada automaticamente a menos que a renovação automática seja desativada pelo menos 24 horas antes do final do período atual.</p>
            <p>O pagamento será cobrado na sua conta do iTunes na confirmação da compra. O valor da renovação será cobrado dentro de 24 horas antes do final do período atual.</p>
            <p>Você pode gerenciar e cancelar suas assinaturas acessando as configurações da sua conta na App Store após a compra.</p>
          </div>
          <p className="text-xs text-muted-foreground">
            <Link to="/terms" className="underline">Termos de Uso</Link>{' • '}
            <Link to="/privacy" className="underline">Política de Privacidade</Link>
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default PaywallView;
