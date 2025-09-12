import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { OnboardingData } from "@/pages/Onboarding";

interface Question1Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const Question1 = ({ data, updateData, onNext }: Question1Props) => {
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateData({ age: e.target.value });
  };

  const handleGenderSelection = (value: string) => {
    updateData({ gender: value });
  };

  const canProceed = data.age !== "" && data.gender !== "";

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
                  type="number"
                  value={data.age}
                  onChange={handleAgeChange}
                  placeholder="Digite sua idade"
                  className="mt-1"
                  min="1"
                  max="120"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium">
                  Como você se identifica em relação ao gênero?
                </Label>
                <RadioGroup value={data.gender} onValueChange={handleGenderSelection} className="mt-2">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                      <RadioGroupItem value="mulher" id="mulher" />
                      <Label htmlFor="mulher" className="flex-1 cursor-pointer">
                        Mulher
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                      <RadioGroupItem value="homem" id="homem" />
                      <Label htmlFor="homem" className="flex-1 cursor-pointer">
                        Homem
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                      <RadioGroupItem value="nao-binarie" id="nao-binarie" />
                      <Label htmlFor="nao-binarie" className="flex-1 cursor-pointer">
                        Não-binárie
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                      <RadioGroupItem value="prefiro-nao-responder" id="prefiro-nao-responder" />
                      <Label htmlFor="prefiro-nao-responder" className="flex-1 cursor-pointer">
                        Prefiro não responder
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>

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