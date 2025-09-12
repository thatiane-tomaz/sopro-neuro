import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { OnboardingData } from "@/pages/Onboarding";

interface Question1Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const Question1 = ({ data, updateData, onNext }: Question1Props) => {
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
            <span>Pergunta 1 de 4</span>
            <span>25%</span>
          </div>
          <Progress value={25} className="h-2" />
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
                  <RadioGroupItem value="menos-de-5" id="menos-de-5" />
                  <Label htmlFor="menos-de-5" className="flex-1 cursor-pointer">
                    Menos de 5 cigarros por dia
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                  <RadioGroupItem value="5-10" id="5-10" />
                  <Label htmlFor="5-10" className="flex-1 cursor-pointer">
                    5 a 10 cigarros por dia
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                  <RadioGroupItem value="10-20" id="10-20" />
                  <Label htmlFor="10-20" className="flex-1 cursor-pointer">
                    10 a 20 cigarros por dia
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                  <RadioGroupItem value="mais-de-20" id="mais-de-20" />
                  <Label htmlFor="mais-de-20" className="flex-1 cursor-pointer">
                    Mais de 20 cigarros por dia
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <Button 
              onClick={onNext} 
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