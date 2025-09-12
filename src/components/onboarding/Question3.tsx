import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  const smokingTypes = [
    { id: "cigarro-industrializado", label: "Cigarro industrializado" },
    { id: "tabaco-enrolado", label: "Tabaco enrolado" },
    { id: "cigarro-palha", label: "Cigarro de palha" },
    { id: "vape-pod", label: "Vape / Pod eletrônico" },
    { id: "charuto-nargile", label: "Charuto / narguilé" },
    { id: "outro", label: "Outro" }
  ];

  const handleTypeToggle = (typeId: string, checked: boolean) => {
    const currentTypes = data.smokingTypes || [];
    const updatedTypes = checked
      ? [...currentTypes, typeId]
      : currentTypes.filter(id => id !== typeId);
    
    updateData({ smokingTypes: updatedTypes });
  };

  const canProceed = data.smokingTypes && data.smokingTypes.length > 0;

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
              O que você costuma fumar?
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Selecione todos que se aplicam
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {smokingTypes.map((type) => (
                <div 
                  key={type.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors"
                >
                  <Checkbox
                    id={type.id}
                    checked={data.smokingTypes?.includes(type.id) || false}
                    onCheckedChange={(checked) => 
                      handleTypeToggle(type.id, checked as boolean)
                    }
                  />
                  <Label htmlFor={type.id} className="flex-1 cursor-pointer">
                    {type.label}
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