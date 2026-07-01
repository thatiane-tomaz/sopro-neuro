import { Button } from "@/components/ui/button";
import { Compass, Clock, Sparkles, ArrowRight } from "lucide-react";

interface IntroScreenProps {
  onNext: () => void;
}

const IntroScreen = ({ onNext }: IntroScreenProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden">
      {/* Decorative ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-primary/8 blur-[80px]" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-accent/8 blur-[70px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
        {/* Large animated icon */}
        <div className="mb-10 animate-pulse-glow">
          <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow rotate-3">
            <Compass className="w-14 h-14 text-white -rotate-3" />
          </div>
        </div>

        {/* Title with strong hierarchy */}
        <div className="text-center mb-5 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <h1 className="font-playfair text-[2rem] font-bold text-foreground leading-[1.15] tracking-tight">
            Cada pessoa tem uma história com o cigarro.
          </h1>
        </div>

        {/* Subtitle */}
        <p
          className="text-center text-muted-foreground text-[15px] leading-relaxed mb-10 max-w-[17rem] animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          Queremos entender a sua para criar uma jornada personalizada que aumente suas chances de se libertar.
        </p>

        {/* Benefit rows as modern chips */}
        <div className="w-full space-y-3 mb-10 animate-fade-in" style={{ animationDelay: "0.45s" }}>
          <div className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-white/50 backdrop-blur-md border border-white/40 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Leva só 3 minutos</span>
          </div>
          <div className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-white/50 backdrop-blur-md border border-white/40 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <span className="text-sm font-semibold text-foreground">Cada resposta molda o seu programa</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="w-full animate-fade-in" style={{ animationDelay: "0.6s" }}>
          <Button
            onClick={onNext}
            className="w-full h-14 text-base font-semibold rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-primary transition-smooth group"
          >
            Vamos começar
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IntroScreen;
