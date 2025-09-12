import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft } from "lucide-react";
import { OnboardingData } from "@/pages/Onboarding";

interface Question3Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const Question3 = ({ data, updateData, onNext, onPrev }: Question3Props) => {
  const handleSelection = (value: string) => {
    updateData({ previousAttempts: value });
  };

  const canProceed = data.previousAttempts !== "";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Pergunta 3 de 4</span>
            <span>75%</span>
          </div>
          <Progress value={75} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="border-primary/20 shadow-wellness">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-foreground">
              Você já tentou parar de fumar antes?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={data.previousAttempts} onValueChange={handleSelection}>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                  <RadioGroupItem value="nunca" id="nunca" />
                  <Label htmlFor="nunca" className="flex-1 cursor-pointer">
                    Nunca tentei antes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                  <RadioGroupItem value="1-vez" id="1-vez" />
                  <Label htmlFor="1-vez" className="flex-1 cursor-pointer">
                    Tentei 1 vez
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                  <RadioGroupItem value="2-3-vezes" id="2-3-vezes" />
                  <Label htmlFor="2-3-vezes" className="flex-1 cursor-pointer">
                    Tentei 2-3 vezes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                  <RadioGroupItem value="muitas-vezes" id="muitas-vezes" />
                  <Label htmlFor="muitas-vezes" className="flex-1 cursor-pointer">
                    Tentei muitas vezes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                  <RadioGroupItem value="prefiro-nao-dizer" id="prefiro-nao-dizer" />
                  <Label htmlFor="prefiro-nao-dizer" className="flex-1 cursor-pointer">
                    Prefiro não dizer
                  </Label>
                </div>
              </div>
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
                onClick={onNext} 
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