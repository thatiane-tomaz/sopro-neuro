import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import WaveBackground from "@/components/home/WaveBackground";
import { Button } from "@/components/ui/button";
import { useBrainSparks, type BrainLevel } from "@/hooks/useBrainSparks";
import lv1Active from "@/assets/brain/brain-lv1-active.png";
import lv2Active from "@/assets/brain/brain-lv2-active.png";
import lv3Active from "@/assets/brain/brain-lv3-active.png";
import lv4Active from "@/assets/brain/brain-lv4-active.png";
import lv5Active from "@/assets/brain/brain-lv5-active.png";

const LEVEL_IMAGES: Record<BrainLevel, string> = {
  1: lv1Active,
  2: lv2Active,
  3: lv3Active,
  4: lv4Active,
  5: lv5Active,
};

const EVENTS: Array<{ label: string; sparks: string; hint?: string }> = [
  { label: "Assistir um vídeo", sparks: "+5" },
  { label: "Ouvir uma hipnose", sparks: "+5" },
  { label: "Concluir uma missão", sparks: "+5", hint: "+10 ao compartilhar no mural" },
  { label: "Conversar com o Neo no chat", sparks: "+10", hint: "1x por dia" },
  { label: "Postar no mural", sparks: "+10" },
  { label: "Usar a Hipnose SOS", sparks: "+10" },
  { label: "Entrar no app todo dia", sparks: "+10", hint: "+20 ao completar 7 dias seguidos" },
];

export default function BrainEvolution() {
  const navigate = useNavigate();
  const { sparks, level, streak, ranges } = useBrainSparks();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <WaveBackground />
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6 pb-16">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur px-3 py-1 ring-1 ring-[hsl(258_70%_88%)]">
            <Sparkles className="h-3 w-3 text-[hsl(258_65%_52%)]" />
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[hsl(258_60%_45%)]">
              Evolução do Neo
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] bg-clip-text text-transparent text-balance">
            O Neo evolui com você
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            Cada ação sua vira Sparks.
            <br />
            Quanto mais você se cuida, mais forte e brilhante o Neo fica.
          </p>
        </div>

        {/* Current status */}
        <div className="mt-6 rounded-2xl bg-white/85 backdrop-blur p-5 shadow-[0_10px_30px_-15px_hsl(258_70%_45%/0.4)] ring-1 ring-[hsl(258_70%_92%)]">
          <div className="flex items-center gap-4">
            <img src={LEVEL_IMAGES[level]} alt="" className="w-24 h-24 object-contain" />
            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-[hsl(258_60%_45%)] whitespace-nowrap">
                Nível {level}
              </div>
              <div className="mt-1 text-2xl font-bold text-foreground">
                {sparks} <span className="text-sm font-semibold text-muted-foreground">Sparks</span>
              </div>
              {streak > 0 && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {streak} dias seguidos
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Levels */}
        <h2 className="mt-8 mb-3 text-sm font-bold text-foreground/80">Os 5 níveis</h2>
        <div className="grid grid-cols-1 gap-2">
          {([1, 2, 3, 4, 5] as BrainLevel[]).map((lv) => {
            const range = ranges[lv];
            const rangeLabel = range.max ? `${range.min} a ${range.max}` : `${range.min}+`;
            const isCurrent = lv === level;
            return (
              <div
                key={lv}
                className={`flex items-center gap-3 rounded-xl p-3 ring-1 ${
                  isCurrent
                    ? "bg-gradient-to-r from-[hsl(258_70%_96%)] to-white ring-[hsl(258_70%_75%)]"
                    : "bg-white/70 ring-[hsl(258_30%_92%)]"
                }`}
              >
                <img src={LEVEL_IMAGES[lv]} alt="" className="w-14 h-14 object-contain" />
                <div className="flex-1">
                  <div className="text-sm font-bold text-foreground">
                    Nível {lv}
                  </div>
                  <div className="text-xs text-muted-foreground">{rangeLabel} Sparks</div>
                </div>
                {isCurrent && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(258_60%_45%)]">
                    Você
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* How to earn */}
        <h2 className="mt-8 mb-3 text-sm font-bold text-foreground/80">Como ganhar Sparks</h2>
        <div className="rounded-2xl bg-white/85 backdrop-blur ring-1 ring-[hsl(258_30%_92%)] overflow-hidden">
          {EVENTS.map((ev, i) => (
            <div
              key={ev.label}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${
                i > 0 ? "border-t border-[hsl(258_30%_94%)]" : ""
              }`}
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground text-pretty">{ev.label}</div>
                {ev.hint && <div className="text-[11px] text-muted-foreground">{ev.hint}</div>}
              </div>
              <span className="text-sm font-bold text-[hsl(258_65%_52%)]">{ev.sparks}</span>
            </div>
          ))}
        </div>

        <Button className="mt-8 w-full" onClick={() => navigate("/dashboard")}>
          Voltar para a jornada
        </Button>
      </div>
    </div>
  );
}