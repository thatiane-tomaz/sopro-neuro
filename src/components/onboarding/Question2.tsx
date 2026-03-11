import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft } from "lucide-react";
import { OnboardingData } from "@/pages/Onboarding";
import { onboardingQuestion2Schema } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";

interface Question2Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const frequencyOptions = [
  "Várias vezes ao dia (mais de 10x)",
  "Todos os dias, algumas vezes (5–10x)",
  "Todos os dias, mas menos (menos de 5x)",
  "Só em alguns dias da semana",
  "Raramente, mas ainda não consegui parar",
];

const Question2 = ({ data, updateData, onNext, onPrev }: Question2Props) => {
  const { toast } = useToast();

  const handleSelection = (value: string) => {
    updateData({ smokingFrequency: value });
  };

  const handleNext = () => {
    // Validate before proceeding
    const validation = onboardingQuestion2Schema.safeParse({
      smokingFrequency: data.smokingFrequency,
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

  const canProceed = data.smokingFrequency !== "";

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
              Hoje, como o cigarro aparece na sua rotina?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup 
              value={data.smokingFrequency} 
              onValueChange={handleSelection}
              className="space-y-4"
            >
              {frequencyOptions.map((option, index) => (
                <Label
                  key={index}
                  htmlFor={`frequency-option-${index}`}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                >
                  <RadioGroupItem 
                    value={option} 
                    id={`frequency-option-${index}`} 
                  />
                  <span className="flex-1">
                    {option}
                  </span>
                </Label>
              ))}
            </RadioGroup>

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
