import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronLeft } from "lucide-react";
import { OnboardingData } from "@/pages/Onboarding";

interface Question7Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const options: { value: "reducao" | "abstinencia"; label: string; description: string }[] = [
  {
    value: "reducao",
    label: "Ainda fumo e quero reduzir",
    description: "Quero quebrar hábitos e crenças até me sentir pronto(a) para parar.",
  },
  {
    value: "abstinencia",
    label: "Já parei de fumar",
    description: "Quero apoio para me manter firme sem fumar.",
  },
];

const Question7 = ({ data, updateData, onNext, onPrev }: Question7Props) => {
  const canProceed = data.journeyType === "reducao" || data.journeyType === "abstinencia";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Pergunta 10 de 10</span>
            <span>100%</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        <Card className="border-primary/20 shadow-wellness">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-foreground">
              Qual momento descreve você&nbsp;hoje?
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Isso define a jornada que vamos construir
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={data.journeyType}
              onValueChange={(v) => updateData({ journeyType: v as "reducao" | "abstinencia" })}
              className="grid gap-3"
            >
              {options.map((opt) => (
                <Label
                  key={opt.value}
                  htmlFor={`journey-${opt.value}`}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-accent/10 transition-colors cursor-pointer"
                >
                  <RadioGroupItem id={`journey-${opt.value}`} value={opt.value} className="mt-1" />
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{opt.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">{opt.description}</div>
                  </div>
                </Label>
              ))}
            </RadioGroup>

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

export default Question7;