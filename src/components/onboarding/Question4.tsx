import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, CheckCircle } from "lucide-react";
import { OnboardingData } from "@/pages/Onboarding";

interface Question4Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onFinish: () => void;
  onPrev: () => void;
}

const Question4 = ({ data, updateData, onFinish, onPrev }: Question4Props) => {
  const challenges = [
    { id: "ansiedade", label: "Ansiedade e nervosismo" },
    { id: "habitos", label: "Quebrar hábitos rotineiros" },
    { id: "social", label: "Situações sociais" },
    { id: "stress", label: "Momentos de estresse" },
    { id: "concentracao", label: "Dificuldade de concentração" },
    { id: "peso", label: "Medo de ganhar peso" },
    { id: "abstinencia", label: "Sintomas de abstinência" },
    { id: "tedio", label: "Momentos de tédio" }
  ];

  const handleChallengeToggle = (challengeId: string, checked: boolean) => {
    const currentChallenges = data.challenges || [];
    const updatedChallenges = checked
      ? [...currentChallenges, challengeId]
      : currentChallenges.filter(id => id !== challengeId);
    
    updateData({ challenges: updatedChallenges });
  };

  const canProceed = data.challenges && data.challenges.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Pergunta 4 de 4</span>
            <span>100%</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="border-primary/20 shadow-wellness">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-foreground">
              Quais são seus maiores desafios para parar de fumar?
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Selecione todos que se aplicam
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {challenges.map((challenge) => (
                <div 
                  key={challenge.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors"
                >
                  <Checkbox
                    id={challenge.id}
                    checked={data.challenges?.includes(challenge.id) || false}
                    onCheckedChange={(checked) => 
                      handleChallengeToggle(challenge.id, checked as boolean)
                    }
                  />
                  <Label htmlFor={challenge.id} className="flex-1 cursor-pointer">
                    {challenge.label}
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
                onClick={onFinish} 
                disabled={!canProceed}
                className="flex-1 rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
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