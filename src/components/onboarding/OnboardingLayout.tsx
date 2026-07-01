import { ReactNode } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface OnboardingLayoutProps {
  step: number;
  total: number;
  title: ReactNode;
  subtitle?: string;
  children: ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  canProceed?: boolean;
  nextLabel?: string;
  hideNav?: boolean;
}

const OnboardingLayout = ({
  step,
  total,
  title,
  subtitle,
  children,
  onNext,
  onPrev,
  canProceed = true,
  nextLabel = "Próxima",
  hideNav = false,
}: OnboardingLayoutProps) => {
  const pct = Math.round((step / total) * 100);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col px-5 pt-10 pb-6">
      {/* Ambient background */}
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
        <div className="absolute top-1/3 -left-28 w-72 h-72 rounded-full bg-primary/15 blur-[80px]" />
        <div className="absolute -bottom-24 right-0 w-80 h-80 rounded-full bg-accent/15 blur-[80px]" />
      </div>

      {/* Progress */}
      <div className="w-full max-w-md mx-auto space-y-2 animate-fade-in">
        <div className="flex justify-between text-xs font-medium text-muted-foreground">
          <span>Passo {step} de {total}</span>
          <span>{pct}%</span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="w-full max-w-md animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div
            className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/70 p-6 sm:p-7"
            style={{ boxShadow: "0 20px 60px -20px hsl(230 40% 40% / 0.18)" }}
          >
            <div className="text-center mb-6">
              <h2 className="font-playfair text-[1.55rem] leading-[1.2] font-bold bg-gradient-to-br from-[hsl(215_40%_20%)] via-[hsl(230_55%_35%)] to-[hsl(258_70%_50%)] bg-clip-text text-transparent">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>

            <div className="space-y-5">{children}</div>

            {!hideNav && (
              <div className="flex gap-3 mt-7">
                {onPrev && (
                  <Button
                    variant="outline"
                    onClick={onPrev}
                    className="rounded-full border-white/80 bg-white/60 backdrop-blur-md hover:bg-white/90"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Voltar
                  </Button>
                )}
                {onNext && (
                  <Button
                    onClick={onNext}
                    disabled={!canProceed}
                    className="flex-1 h-12 rounded-full text-white border-0 shadow-primary group transition-smooth"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(230 75% 55%) 45%, hsl(var(--lilac)) 100%)",
                    }}
                  >
                    {nextLabel}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingLayout;