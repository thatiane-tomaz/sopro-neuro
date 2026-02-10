import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft } from "lucide-react";
import { OnboardingData } from "@/pages/Onboarding";
import { onboardingQuestion4Schema } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";

interface Question4Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onFinish: () => void;
  onPrev: () => void;
}

const reasons = [
  "Para aliviar estresse ou ansiedade",
  "Para relaxar em momentos de pausa",
  "Por hábito automático, sem perceber",
  "Para socializar (com amigos, colegas, família)",
  "Para se sentir mais concentrado(a)",
  "Por prazer (sabor/sensação)",
];

const Question4 = ({ data, updateData, onFinish, onPrev }: Question4Props) => {
  const { toast } = useToast();

  const handleReasonToggle = (reason: string, checked: boolean) => {
    const currentReasons = data.smokingReasons || [];
    const updatedReasons = checked
      ? [...currentReasons, reason]
      : currentReasons.filter(r => r !== reason);
    
    updateData({ smokingReasons: updatedReasons });
  };

  const handleNext = () => {
    // Validate before proceeding
    const validation = onboardingQuestion4Schema.safeParse({
      smokingReasons: data.smokingReasons,
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

  const canProceed = data.smokingReasons && data.smokingReasons.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Pergunta 6 de 6</span>
            <span>100%</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="border-primary/20 shadow-wellness">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-foreground">
              Quais são os principais motivos pelos quais você fuma?
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Selecione todos que se aplicam
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {reasons.map((reason, index) => (
                <Label 
                  key={index}
                  htmlFor={`reason-${index}`}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                >
                  <Checkbox
                    id={`reason-${index}`}
                    checked={data.smokingReasons?.includes(reason) || false}
                    onCheckedChange={(checked) => 
                      handleReasonToggle(reason, checked as boolean)
                    }
                  />
                  <span className="flex-1">
                    {reason}
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
                Finalizar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Question4;
