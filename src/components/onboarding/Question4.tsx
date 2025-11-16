import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, CheckCircle } from "lucide-react";
import { OnboardingData } from "@/pages/Onboarding";
import { onboardingQuestion4Schema } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";

interface Question4Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const Question4 = ({ data, updateData, onNext, onPrev }: Question4Props) => {
  const { toast } = useToast();

  const reasons = [
    { id: "estresse-ansiedade", label: "Para aliviar estresse ou ansiedade" },
    { id: "relaxar-pausa", label: "Para relaxar em momentos de pausa" },
    { id: "habito-automatico", label: "Por hábito automático, sem perceber" },
    { id: "socializar", label: "Para socializar (com amigos, colegas, família)" },
    { id: "concentracao", label: "Para se sentir mais concentrado(a)" },
    { id: "prazer", label: "Por prazer (sabor/sensação)" }
  ];

  const handleReasonToggle = (reasonId: string, checked: boolean) => {
    const currentReasons = data.smokingReasons || [];
    const updatedReasons = checked
      ? [...currentReasons, reasonId]
      : currentReasons.filter(id => id !== reasonId);
    
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

    onNext();
  };

  const canProceed = data.smokingReasons && data.smokingReasons.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Pergunta 4 de 5</span>
            <span>80%</span>
          </div>
          <Progress value={80} className="h-2" />
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
              {reasons.map((reason) => (
                <div 
                  key={reason.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors"
                >
                  <Checkbox
                    id={reason.id}
                    checked={data.smokingReasons?.includes(reason.id) || false}
                    onCheckedChange={(checked) => 
                      handleReasonToggle(reason.id, checked as boolean)
                    }
                  />
                  <Label htmlFor={reason.id} className="flex-1 cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
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
                Próximo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Question4;
