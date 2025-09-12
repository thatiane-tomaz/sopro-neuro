import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft } from "lucide-react";
import { OnboardingData } from "@/pages/Onboarding";

interface Question2Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const Question2 = ({ data, updateData, onNext, onPrev }: Question2Props) => {
  const handleSelection = (value: string) => {
    updateData({ smokingFrequency: value });
  };

  const canProceed = data.smokingFrequency !== "";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Pergunta 2 de 4</span>
            <span>50%</span>
          </div>
          <Progress value={50} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="border-primary/20 shadow-wellness">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-foreground">
              Com que frequência você fuma atualmente?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={data.smokingFrequency} onValueChange={handleSelection}>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                  <RadioGroupItem value="mais-de-5-dia" id="mais-de-5-dia" />
                  <Label htmlFor="mais-de-5-dia" className="flex-1 cursor-pointer">
                    Mais de 5 vezes por dia
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                  <RadioGroupItem value="menos-de-5-dia" id="menos-de-5-dia" />
                  <Label htmlFor="menos-de-5-dia" className="flex-1 cursor-pointer">
                    Menos de 5 vezes por dia
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                  <RadioGroupItem value="menos-de-5-semana" id="menos-de-5-semana" />
                  <Label htmlFor="menos-de-5-semana" className="flex-1 cursor-pointer">
                    Menos de 5 vezes por semana
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                  <RadioGroupItem value="raramente" id="raramente" />
                  <Label htmlFor="raramente" className="flex-1 cursor-pointer">
                    Raramente
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                  <RadioGroupItem value="abstinencia" id="abstinencia" />
                  <Label htmlFor="abstinencia" className="flex-1 cursor-pointer">
                    Estou em abstinência no momento
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

export default Question2;