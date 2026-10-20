import { Link } from "react-router-dom";
import { Smartphone, Apple, Info } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { AccountShell, AccountCard } from "@/components/account/AccountShell";

const IOS_STEPS = [
  <>Abra o app <strong>Ajustes</strong></>,
  <>Toque no seu <strong>nome / Apple ID</strong></>,
  <>Entre em <strong>Assinaturas</strong></>,
  <>Selecione o app <strong>Sopro</strong></>,
  <>Toque em <strong>Cancelar assinatura</strong></>,
];

const ANDROID_STEPS = [
  <>Abra a <strong>Google Play Store</strong></>,
  <>Toque na sua <strong>foto de perfil</strong> (canto superior direito)</>,
  <>Vá em <strong>Pagamentos e assinaturas</strong></>,
  <>Toque em <strong>Assinaturas</strong></>,
  <>Selecione o app <strong>Sopro</strong></>,
  <>Toque em <strong>Cancelar assinatura</strong></>,
];

const Steps = ({ steps }: { steps: React.ReactNode[] }) => (
  <ol className="space-y-2.5">
    {steps.map((step, i) => (
      <li key={i} className="flex items-start gap-3">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--electric-blue))] to-[hsl(var(--lilac))] text-sm font-bold text-primary-foreground">
          {i + 1}
        </span>
        <p className="pt-0.5 text-sm text-foreground">{step}</p>
      </li>
    ))}
  </ol>
);

const CancelSubscription = () => {
  const isIOS = Capacitor.getPlatform() === "ios";

  return (
    <AccountShell
      title="Cancelar assinatura"
      subtitle="Siga as instruções abaixo para gerenciar sua assinatura."
    >
      {/* Aviso */}
      <section className="flex items-start gap-3 rounded-3xl border border-[hsl(var(--lilac)/0.2)] bg-gradient-to-br from-[hsl(var(--electric-blue)/0.12)] to-[hsl(var(--lilac)/0.18)] p-4">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-[hsl(var(--lilac))]" />
        <p className="text-balance text-sm text-muted-foreground">
          O acesso ao conteúdo continua disponível até o{" "}
          <strong className="text-foreground">fim do período atual</strong> que já foi pago.
        </p>
      </section>

      <AccountCard icon={<Apple className="h-5 w-5" />} title="iPhone / iPad">
        <Steps steps={IOS_STEPS} />
      </AccountCard>

      {/* Android oculto no iOS para seguir as regras da App Store */}
      {!isIOS && (
        <AccountCard icon={<Smartphone className="h-5 w-5" />} title="Android">
          <Steps steps={ANDROID_STEPS} />
        </AccountCard>
      )}

      <Link
        to="/dashboard"
        className="flex h-12 w-full items-center justify-center rounded-full bg-card/80 text-sm font-bold text-[hsl(var(--electric-blue))] shadow-primary ring-1 ring-border/40 backdrop-blur transition-transform active:scale-[0.98]"
      >
        Voltar ao início
      </Link>
    </AccountShell>
  );
};

export default CancelSubscription;
