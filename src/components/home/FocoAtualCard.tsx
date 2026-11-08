import { useThemeImage } from "@/hooks/useThemeImage";
import { ArrowRight, Check, CheckCircle2, ChevronRight, Info, type LucideIcon } from "lucide-react";
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
  /** Nome da imagem do tema (habitos_jornada.imagem_nome). */
  imagemGatilho: string | null;
  focoAtualNumero: number;
  totalFocos: number;
  focosConcluidos: number;
  onOpenJornada: () => void;
  /** Abre a tela que explica o método; sem ela, a entrada não aparece. */
  onOpenMetodo?: () => void;
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
  onOpenMetodo,
  steps,
}: Props) {
  const img = useThemeImage(imagemGatilho, 128);
  const nextStep = steps.find((s) => !s.done);
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section className="app-surface mt-3 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-x-2">
        <h1 className="text-balance text-lg font-bold leading-tight text-electric-blue">
          Método Sopro Neuro
        </h1>
        {onOpenMetodo && (
          <Button
            variant="ghost"
            type="button"
            onClick={onOpenMetodo}
            className="h-11 shrink-0 gap-1 rounded-full px-1 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <Info className="h-4 w-4" />
            Como funciona
          </Button>
        )}
      </div>
      <p className="mt-1 text-pretty text-sm font-medium leading-snug text-muted-foreground">
        Enfraqueça o que te faz fumar.
      </p>

      {/* Gatilho atual + entrada para a jornada completa */}
      <div className="mt-3 overflow-hidden rounded-2xl bg-lilac-soft/60 ring-1 ring-lilac/15">
        <div className="flex items-center justify-between gap-2 px-3 pt-2">
          <p className="text-sm font-medium text-muted-foreground">Recomendado para hoje</p>
          <Button variant="ghost" type="button" onClick={onOpenJornada} className="h-11 shrink-0 gap-0 rounded-full px-1 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground">
            Ver jornada
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-3 px-3 pb-3">
          {img.src && !img.failed && (
            <img
              src={img.src}
              alt=""
              onError={img.onError}
              className="h-12 w-12 flex-shrink-0 rounded-xl object-cover"
              draggable={false}
            />
          )}
          <div className="min-w-0 flex-1">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {totalFocos > 0 ? `Gatilho ${focoAtualNumero} de ${totalFocos}` : "Gatilho atual"}
              </p>
            </div>
            <p className="mt-0.5 text-balance text-base font-bold leading-snug text-foreground">{tituloGatilho}</p>
            {subtituloGatilho && (
              <p className="mt-0.5 text-pretty text-sm font-medium leading-snug text-muted-foreground">{subtituloGatilho}</p>
            )}
          </div>
        </div>
<div className="px-2.5 pb-3">
      {/* Passos do método */}
      <div className="mt-1 flex items-start border-t border-lilac/15 px-1 pt-3 pb-0" aria-label="Passos do método">
        {steps.map((step, index) => {
          const isCurrent = nextStep?.key === step.key;
          return (
            <div key={step.key} className="relative flex min-w-0 flex-1 items-start">
              <Button
                variant="ghost"
                type="button"
                onClick={step.onClick}
                aria-label={`${index + 1}. ${step.label}. ${step.verb} ${step.rest}`}
                aria-current={isCurrent ? "step" : undefined}
                className="h-auto min-w-0 flex-1 flex-col items-center gap-0 whitespace-normal rounded-2xl p-0 text-center hover:bg-surface-raised/50 hover:text-foreground active:scale-95"
              >
                <span
                  className={`flex flex-col items-center leading-tight ${
                    isCurrent ? "text-electric-blue" : "text-foreground"
                  }`}
                >
                  <span className="whitespace-nowrap text-sm font-bold">
                    <span className="font-medium text-muted-foreground">{index + 1}.</span> {step.label}
                  </span>
                </span>
                <div className="relative mt-1.5 flex h-[72px] w-[72px] items-center justify-center">
                  <img
                    src={step.image}
                    alt=""
                    style={{ clipPath: "circle(33% at 50% 50%)" }}
                    className={`h-[104px] w-[104px] max-w-none object-contain ${step.done && !isCurrent ? "opacity-70" : ""}`}
                    draggable={false}
                  />
                  {step.done && (
                    <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-lilac text-primary-foreground ring-2 ring-lilac-soft">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <span className="mt-1 max-w-[7.5rem] text-balance text-[13px] font-medium leading-tight text-muted-foreground">
                  {step.verb}
                </span>
              </Button>
              {index < steps.length - 1 && (
                <ArrowRight
                  className="pointer-events-none absolute right-0 top-[4.6rem] h-4 w-4 -translate-y-1/2 translate-x-1/2 text-lilac/40"
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
          className="mt-4 h-12 w-full rounded-full bg-gradient-method text-sm font-semibold text-primary-foreground shadow-wellness"
        >
          <nextStep.icon className="mr-2 h-5 w-5" />
          <span className="text-balance">Fazer {nextStep.label}</span>
          <ChevronRight className="ml-1 h-5 w-5" />
        </Button>
      ) : (
        <div className="mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-lilac-soft font-semibold text-lilac">
          <CheckCircle2 className="h-5 w-5" />
          Foco concluído
        </div>
      )}

      {steps.length > 0 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            {doneCount} de {steps.length} passos concluídos
          </p>
        </div>
      )}
</div>
      </div>
    </section>
  );
}
