import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingData } from "@/pages/Onboarding";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import OnboardingLayout from "./OnboardingLayout";

interface Question2Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const cigarettesSchema = z.object({
  cigarettesPerDay: z
    .string()
    .trim()
    .nonempty({ message: "Informe quantos cigarros você fuma por dia" })
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 0 && num <= 200;
    }, { message: "Digite um número válido entre 0 e 200" }),
  vapesPerMonth: z
    .string()
    .trim()
    .nonempty({ message: "Informe quantos vapes você usa por mês" })
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 0 && num <= 200;
    }, { message: "Digite um número válido entre 0 e 200" }),
});

const Question2 = ({ data, updateData, onNext, onPrev }: Question2Props) => {
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/\D/g, "");
    updateData({ cigarettesPerDay: sanitized });
  };

  const handleVapesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/\D/g, "");
    updateData({ vapesPerMonth: sanitized });
  };

  const handleNext = () => {
    const validation = cigarettesSchema.safeParse({
      cigarettesPerDay: data.cigarettesPerDay,
      vapesPerMonth: data.vapesPerMonth,
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

  const canProceed =
    (data.cigarettesPerDay ?? "").trim() !== "" &&
    (data.vapesPerMonth ?? "").trim() !== "";

  return (
    <OnboardingLayout
      step={2}
      total={8}
      title="Quanto você consome?"
      subtitle="Use 0 caso não consuma"
      onNext={handleNext}
      onPrev={onPrev}
      canProceed={canProceed}
    >
      <div>
        <Label htmlFor="cigarettesPerDay" className="text-sm font-medium text-foreground/80">
          Cigarros por dia
        </Label>
        <Input
          id="cigarettesPerDay"
          type="number"
          inputMode="numeric"
          min={0}
          max={200}
          value={data.cigarettesPerDay ?? ""}
          onChange={handleChange}
          placeholder="Ex: 10"
          className="mt-2 h-12 rounded-xl bg-white/80 border-white text-center text-lg font-medium"
        />
      </div>

      <div>
        <Label htmlFor="vapesPerMonth" className="text-sm font-medium text-foreground/80">
          Vapes por mês
        </Label>
        <Input
          id="vapesPerMonth"
          type="number"
          inputMode="numeric"
          min={0}
          max={200}
          value={data.vapesPerMonth ?? ""}
          onChange={handleVapesChange}
          placeholder="Ex: 2"
          className="mt-2 h-12 rounded-xl bg-white/80 border-white text-center text-lg font-medium"
        />
      </div>
    </OnboardingLayout>
  );
};

export default Question2;
