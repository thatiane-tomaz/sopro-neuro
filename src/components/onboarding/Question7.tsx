import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { OnboardingData } from "@/pages/Onboarding";
import OnboardingLayout from "./OnboardingLayout";

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
    <OnboardingLayout
      step={8}
      total={8}
      title="Qual momento descreve você hoje?"
      subtitle="Isso define a jornada que vamos construir"
      onNext={onNext}
      onPrev={onPrev}
      canProceed={canProceed}
    >
      <RadioGroup
        value={data.journeyType}
        onValueChange={(v) => updateData({ journeyType: v as "reducao" | "abstinencia" })}
        className="grid gap-3"
      >
        {options.map((opt) => {
          const selected = data.journeyType === opt.value;
          return (
            <Label
              key={opt.value}
              htmlFor={`journey-${opt.value}`}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                selected
                  ? "bg-primary/10 border-primary/40 shadow-sm"
                  : "bg-white/60 border-white/80 hover:bg-white/90"
              }`}
            >
              <RadioGroupItem id={`journey-${opt.value}`} value={opt.value} className="mt-1" />
              <div className="flex-1">
                <div className="font-semibold text-foreground text-sm">{opt.label}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.description}</div>
              </div>
            </Label>
          );
        })}
      </RadioGroup>
    </OnboardingLayout>
  );
};

export default Question7;