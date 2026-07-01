import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Clock, Sparkles } from "lucide-react";

interface IntroScreenProps {
  onNext: () => void;
}

const IntroScreen = ({ onNext }: IntroScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-primary/20 shadow-wellness">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-2xl text-foreground">
              Cada cérebro fuma por um motivo diferente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 text-muted-foreground text-[15px] leading-relaxed">
              <p>
                O hábito de fumar se instala no seu cérebro de um jeito único —
                ligado às suas emoções, rotinas e gatilhos.
              </p>
              <p>
                As próximas perguntas nos ajudam a entender o <span className="text-foreground font-medium">seu</span> mapa
                para montar uma jornada feita sob medida para você.
              </p>
              <div className="flex items-center gap-2 text-sm text-primary font-medium pt-1">
                <Clock className="w-4 h-4" />
                Leva só 3 minutos
              </div>
              <div className="flex items-center gap-2 text-sm text-accent font-medium">
                <Sparkles className="w-4 h-4" />
                Cada resposta molda o seu programa
              </div>
            </div>

            <Button
              onClick={onNext}
              className="w-full rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              Vamos começar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IntroScreen;