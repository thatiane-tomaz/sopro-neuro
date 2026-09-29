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

        {/* Variante atual: redução */}
        <div className="mt-3 flex justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 shadow-[0_4px_14px_-4px_hsl(220_40%_40%/0.18)] ring-1 ring-black/[0.03]">
            <TrendingDown className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-foreground/70 text-balance">
              Você está reduzindo
            </span>
          </div>
        </div>

        {/* Variante atual: liberdade */}
        <div className="mt-2 flex justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 shadow-[0_4px_14px_-4px_hsl(220_40%_40%/0.18)] ring-1 ring-black/[0.03]">
            <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(160_55%_45%)]" />
            <span className="text-[11px] font-semibold text-foreground/70 text-balance">
              Você já é um ex-fumante
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyBadgePreview;
