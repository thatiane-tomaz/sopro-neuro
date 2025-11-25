import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Smartphone, Download, Check } from "lucide-react";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listener para o evento beforeinstallprompt (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Smartphone className="w-10 h-10 text-primary" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold">Instalar Sopro</h1>
          <p className="text-muted-foreground">
            Instale o app em seu dispositivo para uma experiência completa
          </p>
        </div>

        {isIOS ? (
          <div className="space-y-4">
            <p className="text-sm font-medium">Para instalar no iOS:</p>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  1
                </span>
                <span>Toque no botão de compartilhar <span className="inline-block">⎋</span> no Safari</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  2
                </span>
                <span>Role para baixo e toque em "Adicionar à Tela de Início"</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  3
                </span>
                <span>Toque em "Adicionar" para confirmar</span>
              </li>
            </ol>
          </div>
        ) : isInstallable ? (
          <Button 
            onClick={handleInstallClick}
            className="w-full"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Instalar App
          </Button>
        ) : (
          <div className="text-center space-y-2">
            <Check className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-sm text-muted-foreground">
              App já instalado ou não disponível para instalação neste navegador
            </p>
          </div>
        )}

        <div className="pt-4 border-t">
          <a 
            href="/dashboard"
            className="text-sm text-primary hover:underline block text-center"
          >
            Continuar no navegador
          </a>
        </div>
      </Card>
    </div>
  );
};

export default Install;
