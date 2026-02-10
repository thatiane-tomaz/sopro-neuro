import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { OnboardingData } from "@/pages/Onboarding";
import { onboardingQuestion1Schema } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Pergunta 1 de 6</span>
            <span>17%</span>
          </div>
          <Progress value={17} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="border-primary/20 shadow-wellness">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-foreground">
              Vamos nos conhecer melhor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="age" className="text-sm font-medium">
                  Qual é a sua idade?
                </Label>
                <Input
                  id="age"
                  type="text"
                  value={data.age}
                  onChange={handleAgeChange}
                  placeholder="Digite sua idade (18-120)"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium">
                  Como você se identifica em relação ao gênero?
                </Label>
                <RadioGroup 
                  value={data.gender} 
                  onValueChange={handleGenderSelection} 
                  className="mt-2 space-y-3"
                >
                  {genderOptions.map((option, index) => (
                    <div 
                      key={option.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors"
                    >
                      <RadioGroupItem value={option.label} id={`gender-option-${index}`} />
                      <Label htmlFor={`gender-option-${index}`} className="flex-1 cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <Button 
              onClick={handleNext} 
              disabled={!canProceed}
              className="w-full rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              Próxima
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Question1;
