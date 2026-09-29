import { CheckCircle2, TrendingDown, User } from "lucide-react";
import WaveBackground from "@/components/home/WaveBackground";
import soproLogo from "@/assets/sopro-logo.webp";

/**
 * Rota apenas para preview/edição visual do selo de jornada.
 * Não exige login e não registra eventos.
 */
const JourneyBadgePreview = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden pb-32">
      <WaveBackground />
      <div className="relative mx-auto max-w-md px-5 pt-[env(safe-area-inset-top)]">
        <header className="flex items-center justify-between pt-4">
          <img src={soproLogo} alt="Sopro Neuro" className="h-10 w-auto" />
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground leading-tight">
                Bom dia, Ana!
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Seu cérebro está aprendendo<br />uma nova forma de viver.
              </p>
            </div>
            <button className="h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-[0_4px_14px_-4px_hsl(220_40%_40%/0.18)] ring-1 ring-black/[0.03]">
              <User className="h-5 w-5 text-primary" />
            </button>
          </div>
        </header>

        {/* Variante atual: liberdade (faixa integrada) */}
        <div className="mt-3 relative overflow-hidden rounded-2xl bg-[hsl(180_60%_42%/0.07)] ring-1 ring-[hsl(180_60%_42%/0.12)] px-4 py-3 flex items-center gap-3">
          <div className="flex-shrink-0 h-9 w-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider leading-tight text-accent/60">
              Jornada da Liberdade
            </span>
            <p className="text-sm font-bold text-foreground leading-tight text-balance">
              Você já é um ex-fumante
            </p>
          </div>
          <div className="absolute -right-4 -bottom-6 h-20 w-20 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
        </div>

        {/* Variante atual: redução (faixa integrada) */}
        <div className="mt-2 relative overflow-hidden rounded-2xl bg-[hsl(200_70%_45%/0.07)] ring-1 ring-[hsl(200_70%_45%/0.12)] px-4 py-3 flex items-center gap-3">
          <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider leading-tight text-primary/60">
              Jornada de Redução
            </span>
            <p className="text-sm font-bold text-foreground leading-tight text-balance">
              Você está reduzindo
            </p>
          </div>
          <div className="absolute -right-4 -bottom-6 h-20 w-20 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default JourneyBadgePreview;
