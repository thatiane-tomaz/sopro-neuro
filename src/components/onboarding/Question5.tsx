import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingData } from "@/pages/Onboarding";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useState } from "react";
import OnboardingLayout from "./OnboardingLayout";

interface Question5Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

// Se passar de 999, assume que a pessoa digitou com centavos (ex.: "5500" = R$ 55,00)
const normalizeWeeklyCost = (n: number): number =>
  Number.isFinite(n) && n > 999 ? Math.round(n / 100) : n;

const weeklyCostSchema = z.object({
  weeklyCost: z.string()
    .trim()
    .nonempty({ message: "Por favor, informe quanto você gasta por semana" })
    .refine((val) => {
      const num = normalizeWeeklyCost(parseFloat(val.replace(',', '.')));
      return !isNaN(num) && num >= 0 && num <= 999;
    }, { message: "Digite um valor válido entre R$ 0 e R$ 999" })
});

const Question5 = ({ data, updateData, onNext, onPrev }: Question5Props) => {
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState(data.weeklyCost || "");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and comma
    const sanitized = value.replace(/[^\d,]/g, '');
    setInputValue(sanitized);
    updateData({ weeklyCost: sanitized });
  };

  const handleNext = () => {
    const validation = weeklyCostSchema.safeParse({
      weeklyCost: inputValue
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

    const normalized = normalizeWeeklyCost(parseFloat(inputValue.replace(',', '.')));
    const finalValue = String(normalized);
    setInputValue(finalValue);
    updateData({ weeklyCost: finalValue });

    onNext();
  };

  const canProceed = inputValue.trim() !== "";

  return (
    <OnboardingLayout
      step={3}
      total={8}
      title="Quanto você gasta por semana para fumar?"
      onNext={handleNext}
      onPrev={onPrev}
      canProceed={canProceed}
    >
      <div>
        <Label htmlFor="weeklyCost" className="text-sm font-medium text-foreground/80">
          Valor semanal com cigarros/vapes
        </Label>
        <div className="relative mt-2">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            R$
          </span>
          <Input
            id="weeklyCost"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="0"
            className="pl-14 pr-14 h-14 rounded-xl bg-white/80 border-white text-center text-2xl font-semibold"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            ,00
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Digite o valor sem centavos
        </p>
      </div>
    </OnboardingLayout>
  );
};

export default Question5;
