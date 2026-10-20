import { useState } from "react";
import { ArrowRight, Check, CheckCircle2, ChevronRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FocoStep {
  key: string;
  /** Nome curto do passo: "Hipnose", "Missão", "Mural". */
  label: string;
  /** Verbo de valor em destaque: "Transforme". */
  verb: string;
  /** Complemento do verbo: "seus hábitos". */
  rest: string;
  image: string;
  icon: LucideIcon;
  done: boolean;
  onClick: () => void;
  actionLabel: string;
}

interface Props {
  tituloGatilho: string;
  subtituloGatilho: string | null;
  imagemGatilho: string | null;
  focoAtualNumero: number;
  totalFocos: number;
  focosConcluidos: number;
  onOpenJornada: () => void;
  steps: FocoStep[];
}

/**
 * Card do foco atual: o método (fixo) em cima, o gatilho do momento em
 * destaque e os passos numerados que levam ao próximo conteúdo pendente.
 */
export default function FocoAtualCard({
  tituloGatilho,
  subtituloGatilho,
  imagemGatilho,
  focoAtualNumero,
  totalFocos,
  focosConcluidos,
  onOpenJornada,
  steps,
}: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const nextStep = steps.find((s) => !s.done);
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section className="mt-3 rounded-3xl bg-card/80 p-3.5 shadow-primary ring-1 ring-border/40 backdrop-blur-md">
      <h1 className="whitespace-nowrap text-[clamp(15px,4.4vw,17px)] font-bold leading-tight tracking-tight text-[hsl(var(--electric-blue))]">
        Método Sopro para Enfraquecer o Vício
      </h1>

      {/* Gatilho atual + entrada para a jornada completa */}
      <div className="mt-3 overflow-hidden rounded-2xl bg-[hsl(var(--lilac-soft)/0.7)] ring-1 ring-[hsl(var(--lilac)/0.15)]">
        <div className="flex items-center gap-3 p-2.5">
          {imagemGatilho && !imgFailed && (
            <img
              src={imagemGatilho}
              alt=""
              onError={() => setImgFailed(true)}
              className="h-12 w-12 flex-shrink-0 rounded-xl object-cover"
              draggable={false}
            />
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--lilac))]">
              {totalFocos > 0 ? `Gatilho ${focoAtualNumero} de ${totalFocos}` : "Gatilho atual"}
            </p>
            <p className="text-balance text-sm font-bold leading-snug text-foreground">{tituloGatilho}</p>
            {subtituloGatilho && (
              <p className="mt-0.5 text-balance text-xs leading-snug text-muted-foreground">{subtituloGatilho}</p>
            )}
          </div>
        </div>
        {totalFocos > 0 && (
          <button
            type="button"
            onClick={onOpenJornada}
            className="flex w-full items-center gap-3 border-t border-[hsl(var(--lilac)/0.15)] px-2.5 py-2 text-left transition-colors active:bg-[hsl(var(--lilac)/0.1)]"
          >
            <div className="flex flex-1 gap-1" aria-hidden>
              {Array.from({ length: totalFocos }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i === focoAtualNumero - 1
                      ? "bg-[hsl(var(--electric-blue))]"
                      : i < focosConcluidos
                        ? "bg-[hsl(var(--lilac))]"
                        : "bg-[hsl(var(--lilac)/0.2)]"
                  }`}
                />
              ))}
            </div>
            <span className="inline-flex flex-shrink-0 items-center text-xs font-semibold text-[hsl(var(--electric-blue))]">
              Ver sua jornada
              <ChevronRight className="h-4 w-4" />
            </span>
          </button>
        )}
      </div>

      {/* Passos do método */}
      <div className="mt-4 flex items-start" aria-label="Passos do método">
        {steps.map((step, index) => {
          const isCurrent = nextStep?.key === step.key;
          return (
            <div key={step.key} className="relative flex min-w-0 flex-1 items-start">
              <button
                type="button"
                onClick={step.onClick}
                aria-label={`Passo ${index + 1}: ${step.label}. ${step.verb} ${step.rest}`}
                className="flex min-w-0 flex-1 flex-col items-center rounded-2xl text-center transition-transform active:scale-95"
              >
                <span
                  className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isCurrent
                      ? "bg-gradient-to-r from-[hsl(var(--electric-blue))] to-[hsl(var(--lilac))] text-primary-foreground"
                      : "bg-[hsl(var(--lilac-soft))] text-[hsl(var(--lilac))]"
                  }`}
                >
                  {step.done && <Check className="h-3 w-3" strokeWidth={3} />}
                  Passo {index + 1}: {step.label}
                </span>
                <div className="relative mt-1.5 flex h-[72px] w-[72px] items-center justify-center">
                  <img
                    src={step.image}
                    alt=""
                    style={{ clipPath: "circle(33% at 50% 50%)" }}
                    className={`h-[104px] w-[104px] max-w-none object-contain ${step.done && !isCurrent ? "opacity-70" : ""}`}
                    draggable={false}
                  />
                </div>
                <span className="mt-1 max-w-[7rem] text-balance text-[11px] leading-tight text-muted-foreground">
                  <span className="font-semibold text-foreground">{step.verb}</span> {step.rest}
                </span>
              </button>
              {index < steps.length - 1 && (
                <ArrowRight
                  className="pointer-events-none absolute right-0 top-[3.6rem] h-4 w-4 -translate-y-1/2 translate-x-1/2 text-[hsl(var(--lilac)/0.55)]"
                  strokeWidth={2.5}
                />
              )}
            </div>
          );
        })}
      </div>

      {nextStep ? (
        <Button
          type="button"
          onClick={nextStep.onClick}
          className="mt-4 h-12 w-full rounded-full bg-gradient-to-r from-[hsl(var(--electric-blue))] to-[hsl(var(--lilac))] text-sm font-bold text-primary-foreground shadow-wellness"
        >
          <nextStep.icon className="mr-2 h-5 w-5" />
          <span className="text-balance">{nextStep.actionLabel}</span>
          <ChevronRight className="ml-1 h-5 w-5" />
        </Button>
      ) : (
        <div className="mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-[hsl(var(--lilac-soft))] font-semibold text-[hsl(var(--lilac))]">
          <CheckCircle2 className="h-5 w-5" />
          Foco concluído
        </div>
      )}

      {steps.length > 0 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="flex gap-1" aria-hidden>
            {steps.map((s) => (
              <span
                key={s.key}
                className={`h-1.5 w-5 rounded-full ${s.done ? "bg-[hsl(var(--lilac))]" : "bg-[hsl(var(--lilac)/0.2)]"}`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {doneCount} de {steps.length} passos concluídos
          </p>
        </div>
      )}
    </section>
  );
}
