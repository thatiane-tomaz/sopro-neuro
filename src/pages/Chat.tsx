import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import WaveBackground from "@/components/home/WaveBackground";

export default function Chat() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <WaveBackground />

      <div className="mx-auto max-w-md px-5 pt-[env(safe-area-inset-top)] animate-page-in">
        <header className="flex items-center gap-3 pt-4">
          <button
            onClick={() => navigate("/dashboard")}
            aria-label="Voltar"
            className="h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-[0_4px_14px_-4px_hsl(220_40%_40%/0.18)] ring-1 ring-black/[0.03]"
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] bg-clip-text text-transparent">
            Conversar com a IA
          </h1>
        </header>

        <div className="mt-16 text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] flex items-center justify-center shadow-[0_14px_40px_-12px_hsl(258_70%_45%/0.45)]">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-foreground">Em breve</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Aqui você vai poder conversar com a sua IA do Sopro Neuro —
            tirar dúvidas, pedir apoio em momentos de vontade de fumar e
            receber orientações personalizadas para a sua jornada.
          </p>
        </div>
      </div>
    </div>
  );
}