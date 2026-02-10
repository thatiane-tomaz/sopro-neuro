import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface CompletionScreenProps {
  onFinish: () => void;
  isSubmitting?: boolean;
}

const CompletionScreen = ({ onFinish, isSubmitting }: CompletionScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-lg font-semibold text-foreground">
            Nada do que você sente é sinal de fraqueza.
          </p>

          <p className="text-muted-foreground leading-relaxed">
            Parar de fumar envolve mente, corpo e rotina.
          </p>

          <p className="text-muted-foreground leading-relaxed">
            O <span className="font-semibold text-foreground">Sopro Neuro</span> te guia na superação dos medos e te ajuda a se sentir mais confiante para viver melhor sem o cigarro.
          </p>
        </div>

        <Button
          onClick={onFinish}
          disabled={isSubmitting}
          className="w-full rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-lg py-6"
        >
          {isSubmitting ? "Salvando..." : "Quero parar de fumar"}
        </Button>
      </div>
    </div>
  );
};

export default CompletionScreen;
