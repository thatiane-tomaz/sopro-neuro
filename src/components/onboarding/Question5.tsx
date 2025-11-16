import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { OnboardingData } from "@/pages/Onboarding";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useState } from "react";

interface Question5Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onFinish: () => void;
  onPrev: () => void;
}

const weeklyCostSchema = z.object({
  weeklyCost: z.string()
    .trim()
    .nonempty({ message: "Por favor, informe quanto você gasta por semana" })
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num >= 0 && num <= 10000;
    }, { message: "Digite um valor válido entre R$ 0,00 e R$ 10.000,00" })
});

const Question5 = ({ data, updateData, onFinish, onPrev }: Question5Props) => {
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState(data.weeklyCost || "");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and comma
    const sanitized = value.replace(/[^\d,]/g, '');
    setInputValue(sanitized);
    updateData({ weeklyCost: sanitized });
  };

  const handleFinish = () => {
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

    onFinish();
  };

  const canProceed = inputValue.trim() !== "";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Pergunta 5 de 5</span>
            <span>100%</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="border-primary/20 shadow-wellness">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-foreground">
              Quanto você gasta para fumar?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="weeklyCost" className="text-sm font-medium">
                  Quanto você gasta por semana para fumar?
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    R$
                  </span>
                  <Input
                    id="weeklyCost"
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="pl-12 pr-12 text-center text-lg font-medium"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    ,00
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Digite o valor sem centavos
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onPrev}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleFinish}
                disabled={!canProceed}
                className="flex-1"
              >
                Finalizar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Question5;
