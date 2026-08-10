import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import neo from "@/assets/brain/neo.png";

interface Props {
  /** Called when the animation finishes (all steps concluded). */
  onDone: () => void;
  journeyType?: "reducao" | "abstinencia" | "";
}

const STEP_MS = 1150;

const BuildingJourneyScreen = ({ onDone, journeyType }: Props) => {
  const steps = [
    "Lendo suas respostas",
    "Mapeando seus gatilhos",
    journeyType === "abstinencia"
      ? "Fortalecendo sua liberdade"
      : "Definindo seu ritmo de redução",
    "Selecionando vídeos e hipnoses",
    "Montando sua jornada personalizada",
  ];

  const [active, setActive] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach((_, i) => {
      timers.push(setTimeout(() => setActive(i + 1), STEP_MS * (i + 1)));
    });
    timers.push(setTimeout(onDone, STEP_MS * steps.length + 600));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = Math.round((active / steps.length) * 100);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6">
      {/* Background matching onboarding */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "linear-gradient(180deg, hsl(210 60% 98%) 0%, hsl(220 70% 96%) 45%, hsl(258 70% 95%) 100%)",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full bg-[hsl(258_80%_72%/0.22)] blur-[90px]" />
        <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-primary/15 blur-[80px]" />
      </div>

      {/* Neo with pulsing halo */}
      <div className="relative mb-8">
        <span className="absolute inset-0 -m-6 rounded-full bg-[hsl(var(--lilac)/0.25)] blur-2xl animate-pulse" />
        <span className="absolute inset-0 -m-2 rounded-full ring-2 ring-primary/20 animate-ping" />
        <img
          src={neo}
          alt="Neo, o cérebro do Sopro, montando sua jornada"
          className="relative w-28 h-28 object-contain drop-shadow-[0_16px_34px_hsl(258_70%_55%/0.35)] animate-pulse"
        />
      </div>

      <h1 className="text-2xl font-bold text-center text-foreground text-balance">
        Estou construindo sua jornada
      </h1>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs text-balance">
        Cada resposta sua vira uma peça do seu plano. Isso leva só alguns segundos.
      </p>

      {/* Progress */}
      <div className="mt-7 w-full max-w-sm">
        <div className="h-2 rounded-full bg-white/70 overflow-hidden shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(progress, 6)}%`,
              background:
                "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(230 75% 55%) 50%, hsl(var(--lilac)) 100%)",
            }}
          />
        </div>
        <div className="mt-1.5 text-right text-[11px] font-medium text-muted-foreground">
          {progress}%
        </div>
      </div>

      {/* Steps */}
      <ul className="mt-5 w-full max-w-sm space-y-2.5">
        {steps.map((label, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <li
              key={label}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-md transition-all duration-500 ${
                done
                  ? "bg-white/80 border-white shadow-sm"
                  : current
                    ? "bg-white/70 border-primary/25 shadow-sm"
                    : "bg-white/40 border-white/60 opacity-60"
              }`}
            >
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
                  done
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                ) : current ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </span>
              <span
                className={`text-sm text-pretty ${
                  done || current ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default BuildingJourneyScreen;