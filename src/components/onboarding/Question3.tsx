import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OnboardingData } from "@/pages/Onboarding";
import { onboardingQuestion3Schema } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";
import OnboardingLayout from "./OnboardingLayout";

interface Question3Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const smokingTypes = [
  "Cigarro industrializado",
  "Tabaco enrolado",
  "Cigarro de palha",
  "Vape / Pod eletrônico",
  "Charuto / narguilé",
  "Outro",
];

const Question3 = ({ data, updateData, onNext, onPrev }: Question3Props) => {
  const { toast } = useToast();

  const handleTypeToggle = (type: string, checked: boolean) => {
    const currentTypes = data.smokingTypes || [];
    const updatedTypes = checked
      ? [...currentTypes, type]
      : currentTypes.filter(t => t !== type);
    
    updateData({ smokingTypes: updatedTypes });
  };

  const handleNext = () => {
    // Validate before proceeding
    const validation = onboardingQuestion3Schema.safeParse({
      smokingTypes: data.smokingTypes,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: "Erro de validação",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    onNext();
  };

  const canProceed = data.smokingTypes && data.smokingTypes.length > 0;

  return (
    <OnboardingLayout
      step={4}
      total={8}
      title="O que você costuma fumar?"
      subtitle="Selecione todos que se aplicam"
      onNext={handleNext}
      onPrev={onPrev}
      canProceed={!!canProceed}
    >
      <div className="grid gap-2">
        {smokingTypes.map((type, index) => {
          const selected = data.smokingTypes?.includes(type);
          return (
            <Label
              key={index}
              htmlFor={`smoking-type-${index}`}
              className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                selected
                  ? "bg-primary/10 border-primary/40 shadow-sm"
                  : "bg-white/60 border-white/80 hover:bg-white/90"
              }`}
            >
              <Checkbox
                id={`smoking-type-${index}`}
                checked={selected || false}
                onCheckedChange={(checked) => handleTypeToggle(type, checked as boolean)}
              />
              <span className="flex-1 text-sm">{type}</span>
            </Label>
          );
        })}
      </div>
    </OnboardingLayout>
  );
};

export default Question3;
