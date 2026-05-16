import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft } from "lucide-react";
import { OnboardingData } from "@/pages/Onboarding";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

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
});

const Question2 = ({ data, updateData, onNext, onPrev }: Question2Props) => {
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/\D/g, "");
    updateData({ cigarettesPerDay: sanitized });
  };

  const handleNext = () => {
    const validation = cigarettesSchema.safeParse({
      cigarettesPerDay: data.cigarettesPerDay,
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

  const canProceed = (data.cigarettesPerDay ?? "").trim() !== "";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Pergunta 2 de 6</span>
            <span>33%</span>
          </div>
          <Progress value={33} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="border-primary/20 shadow-wellness">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-foreground">
              Quantos cigarros você fuma por dia?
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Informe o número aproximado de cigarros consumidos diariamente
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="cigarettesPerDay" className="text-sm font-medium">
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
                className="mt-2 text-center text-lg font-medium"
              />
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
                onClick={handleNext} 
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

export default Question2;
