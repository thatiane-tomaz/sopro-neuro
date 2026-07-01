import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft } from "lucide-react";
import { OnboardingData } from "@/pages/Onboarding";
import { onboardingQuestion3Schema } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Pergunta 4 de 8</span>
            <span>50%</span>
          </div>
          <Progress value={50} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="border-primary/20 shadow-wellness">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-foreground">
              O que você costuma fumar?
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Selecione todos que se aplicam
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {smokingTypes.map((type, index) => (
                <Label 
                  key={index}
                  htmlFor={`smoking-type-${index}`}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                >
                  <Checkbox
                    id={`smoking-type-${index}`}
                    checked={data.smokingTypes?.includes(type) || false}
                    onCheckedChange={(checked) => 
                      handleTypeToggle(type, checked as boolean)
                    }
                  />
                  <span className="flex-1">
                    {type}
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

export default Question3;
