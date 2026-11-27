import { CalendarDays, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RitualPromptProps {
  onChooseDate: () => void;
  compact?: boolean;
  isReducao?: boolean;
}

export default function RitualPrompt({ onChooseDate, compact = false, isReducao = true }: RitualPromptProps) {
  return (
    <section className={compact
      ? "mt-4 text-left"
      : "mt-6 rounded-3xl bg-card/80 p-4 shadow-primary backdrop-blur-md"}>
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="h-4 w-4 shrink-0" />
        <span className="text-sm font-semibold">Ritual do último cigarro</span>
      </div>
      <h3 className={`mt-2 text-balance font-bold leading-snug text-foreground ${compact ? "text-sm" : "text-base"}`}>
        {isReducao ? "Se sente preparado para parar totalmente?" : "Quando foi seu último cigarro?"}
      </h3>
      <p className="mt-1 text-pretty text-sm font-medium leading-relaxed text-muted-foreground">
        {isReducao
          ? "Quando fizer o ritual, informe a data do seu último cigarro para marcar sua decisão de parar."
          : "Informe a data do seu último cigarro para acompanhar seus dias sem fumar."}
      </p>
      <Button
        onClick={onChooseDate}
        data-tour={compact ? "ritual-btn" : undefined}
        variant={compact ? "ghost" : "default"}
        className={compact
          ? "mt-3 h-auto min-h-11 w-full justify-center whitespace-normal rounded-full bg-primary/10 px-3 py-3 text-center text-sm font-semibold text-primary hover:bg-primary/15 hover:text-primary"
          : "mt-3 h-auto min-h-11 w-full whitespace-normal rounded-full bg-gradient-method px-3 py-3 text-sm font-bold text-primary-foreground shadow-surface"}
      >
        <CalendarDays className="h-4 w-4 shrink-0" />
        {isReducao ? "Estou pronto para parar" : "Informar data do último cigarro"}
      </Button>
    </section>
  );
}