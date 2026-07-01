import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { OnboardingData } from "@/pages/Onboarding";
import { onboardingQuestion1Schema } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";
import OnboardingLayout from "./OnboardingLayout";

interface Question1Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const genderOptions = [
  { id: "feminine", label: "Feminino" },
  { id: "masculine", label: "Masculino" },
  { id: "non-binary", label: "Não-binárie" },
  { id: "prefer-not-to-say", label: "Prefiro não responder" },
];

const Question1 = ({ data, updateData, onNext }: Question1Props) => {
  const { toast } = useToast();

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateData({ age: e.target.value });
  };

  const handleGenderSelection = (label: string) => {
    updateData({ gender: label });
  };

  const handleNext = () => {
    // Validate before proceeding
    const validation = onboardingQuestion1Schema.safeParse({
      age: data.age,
      gender: data.gender,
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

  const canProceed = data.age !== "" && data.gender !== "";

  return (
    <OnboardingLayout
      step={1}
      total={8}
      title="Vamos nos conhecer melhor"
      subtitle="Poucas informações para começar"
      onNext={handleNext}
      canProceed={canProceed}
    >
      <div>
        <Label htmlFor="age" className="text-sm font-medium text-foreground/80">
          Qual é a sua idade?
        </Label>
        <Input
          id="age"
          type="text"
          value={data.age}
          onChange={handleAgeChange}
          placeholder="Ex: 32"
          className="mt-2 h-12 rounded-xl bg-white/80 border-white text-center text-lg font-medium"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-foreground/80">
          Como você se identifica?
        </Label>
        <RadioGroup
          value={data.gender}
          onValueChange={handleGenderSelection}
          className="mt-2 grid gap-2"
        >
          {genderOptions.map((option, index) => {
            const selected = data.gender === option.label;
            return (
              <Label
                key={option.id}
                htmlFor={`gender-option-${index}`}
                className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  selected
                    ? "bg-primary/10 border-primary/40 shadow-sm"
                    : "bg-white/60 border-white/80 hover:bg-white/90"
                }`}
              >
                <RadioGroupItem value={option.label} id={`gender-option-${index}`} />
                <span className="flex-1 text-sm">{option.label}</span>
              </Label>
            );
          })}
        </RadioGroup>
      </div>
    </OnboardingLayout>
  );
};

export default Question1;
