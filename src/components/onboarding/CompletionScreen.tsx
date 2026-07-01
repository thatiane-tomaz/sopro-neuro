import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import brainImg from "@/assets/brain-user.png";

interface CompletionScreenProps {
  onFinish: () => void;
  isSubmitting?: boolean;
}

const CompletionScreen = ({ onFinish, isSubmitting }: CompletionScreenProps) => {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center px-6 pt-10 pb-6">
      {/* Ambient background */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "linear-gradient(180deg, hsl(210 60% 98%) 0%, hsl(220 70% 96%) 40%, hsl(258 70% 94%) 100%)",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full bg-[hsl(258_80%_70%/0.28)] blur-[90px]" />
        <div className="absolute top-1/3 -left-24 w-72 h-72 rounded-full bg-primary/20 blur-[80px]" />
        <div className="absolute bottom-10 -right-24 w-80 h-80 rounded-full bg-accent/20 blur-[80px]" />
      </div>

      {/* Brain hero */}
      <div className="relative z-10 flex flex-col items-center shrink-0 animate-fade-in">
        <div className="relative w-[240px] h-[240px] flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, hsl(258 85% 72% / 0.55), hsl(200 80% 65% / 0.25) 45%, transparent 70%)",
              filter: "blur(6px)",
            }}
            aria-hidden
          />
          <div className="absolute inset-6 rounded-full border border-[hsl(258_70%_75%/0.4)]" aria-hidden />
          <img
            src={brainImg}
            alt=""
            aria-hidden
            className="relative w-[240px] h-[240px] object-contain animate-pulse-glow drop-shadow-[0_20px_40px_hsl(258_60%_45%/0.35)]"
          />
        </div>

        <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/60 shadow-sm text-xs font-semibold text-primary animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Sparkles className="w-3.5 h-3.5" />
          Jornada pronta
        </span>
      </div>

      {/* Copy + CTA */}
      <div className="relative z-10 flex-1 flex flex-col items-center w-full max-w-sm">
        <div className="flex-1 flex flex-col justify-center items-center w-full text-center">
          <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h1 className="font-playfair text-[1.75rem] font-bold leading-[1.2] tracking-tight bg-gradient-to-br from-[hsl(215_40%_20%)] via-[hsl(230_55%_35%)] to-[hsl(258_70%_50%)] bg-clip-text text-transparent">
              Nada do que você sente é sinal de fraqueza.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              Parar de fumar envolve mente, corpo e rotina.
              <br />
              O <span className="font-semibold text-foreground">Sopro Neuro</span>{" "}
              te guia com confiança para viver melhor sem o cigarro.
            </p>
          </div>
        </div>

        <div className="w-full animate-fade-in mb-2" style={{ animationDelay: "0.5s" }}>
          <Button
            onClick={onFinish}
            disabled={isSubmitting}
            className="w-full h-14 text-base font-semibold rounded-full text-white border-0 shadow-primary group transition-smooth"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(230 75% 55%) 45%, hsl(var(--lilac)) 100%)",
            }}
          >
            {isSubmitting ? "Salvando..." : "Quero parar de fumar"}
            {!isSubmitting && (
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompletionScreen;
