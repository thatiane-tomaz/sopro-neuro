import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft } from "lucide-react";
import { OnboardingData } from "@/pages/Onboarding";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface Question6Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const fearOptions = [
  "Ficar mais ansioso(a) ou irritado(a)",
  "Engordar",
  "Perder momentos de prazer ou pausa",
  "Não conseguir lidar com o estresse",
  "Sentir falta do foco ou da motivação",
  "Tentar de novo e fracassar",
  "Não tenho medo, só quero parar",
  "Outro",
];

const smokingFearsSchema = z.object({
  smokingFears: z.array(z.string().trim().max(100)).min(1, "Selecione pelo menos uma opção"),
});

const Question6 = ({ data, updateData, onNext, onPrev }: Question6Props) => {
  const { toast } = useToast();

  const handleFearToggle = (fear: string, checked: boolean) => {
    const currentFears = data.smokingFears || [];
    const updatedFears = checked
      ? [...currentFears, fear]
      : currentFears.filter(f => f !== fear);
    
    updateData({ smokingFears: updatedFears });
  };

  const handleNext = () => {
    const validation = smokingFearsSchema.safeParse({
      smokingFears: data.smokingFears,
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

  const canProceed = data.smokingFears && data.smokingFears.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Pergunta 6 de 10</span>
            <span>60%</span>
          </div>
          <Progress value={60} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="border-primary/20 shadow-wellness">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-foreground">
              Quando você pensa em parar de fumar, o que mais te preocupa?
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              É normal ter mais de um medo
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {fearOptions.map((fear, index) => (
                <Label 
                  key={index}
                  htmlFor={`fear-${index}`}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                >
                  <Checkbox
                    id={`fear-${index}`}
                    checked={data.smokingFears?.includes(fear) || false}
                    onCheckedChange={(checked) => 
                      handleFearToggle(fear, checked as boolean)
                    }
                  />
                  <span className="flex-1">
                    {fear}
                  </span>
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

export default Question6;
