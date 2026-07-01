import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  options: { label: string; habito: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  onNext: () => void;
  onPrev: () => void;
  step: number;
  total: number;
  allowEmpty?: boolean;
}

const HabitCheckboxQuestion = ({
  title,
  subtitle,
  options,
  selected,
  onChange,
  onNext,
  onPrev,
  step,
  total,
  allowEmpty = true,
}: Props) => {
  const toggle = (label: string, checked: boolean) => {
    const next = checked
      ? [...(selected || []), label]
      : (selected || []).filter((l) => l !== label);
    onChange(next);
  };

  const pct = Math.round((step / total) * 100);
  const canProceed = allowEmpty || (selected && selected.length > 0);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Pergunta {step} de {total}</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>

        <Card className="border-primary/20 shadow-wellness">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-foreground">{title}</CardTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3">
              {options.map((opt, i) => (
                <Label
                  key={i}
                  htmlFor={`habit-${step}-${i}`}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                >
                  <Checkbox
                    id={`habit-${step}-${i}`}
                    checked={selected?.includes(opt.label) || false}
                    onCheckedChange={(c) => toggle(opt.label, c as boolean)}
                  />
                  <span className="flex-1">{opt.label}</span>
                </Label>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onPrev}
                className="rounded-full border-primary/30 hover:bg-primary/10"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              <Button
                onClick={onNext}
                disabled={!canProceed}
                className="flex-1 rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                Próxima
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HabitCheckboxQuestion;