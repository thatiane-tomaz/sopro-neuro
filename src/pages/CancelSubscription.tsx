import { Link } from "react-router-dom";
import { X, Smartphone, Apple, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";

const CancelSubscription = () => {
  const platform = Capacitor.getPlatform();
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-card/95 backdrop-blur-sm relative">
        {/* Close Button */}
        <Link to="/dashboard">
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute top-4 right-4 rounded-full hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>
        </Link>

        <CardHeader className="text-center pt-8 pb-4">
          <CardTitle className="text-2xl font-bold">Cancelar Assinatura</CardTitle>
          <CardDescription className="text-base mt-2">
            Siga as instruções abaixo para gerenciar sua assinatura
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          {/* Important Notice */}
          <div className="bg-accent/10 rounded-xl p-4 border border-accent/20">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                O acesso ao conteúdo continua disponível até o <strong className="text-foreground">fim do período atual</strong> que já foi pago.
              </p>
            </div>
          </div>

          {/* iOS Instructions */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-2.5 rounded-xl">
                <Apple className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-lg">iPhone / iPad</h3>
            </div>
            
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex gap-3">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0">1</span>
                <p className="text-sm">Abra o app <strong>Ajustes</strong></p>
              </div>
              <div className="flex gap-3">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0">2</span>
                <p className="text-sm">Toque no seu <strong>nome / Apple ID</strong></p>
              </div>
              <div className="flex gap-3">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0">3</span>
                <p className="text-sm">Entre em <strong>Assinaturas</strong></p>
              </div>
              <div className="flex gap-3">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0">4</span>
                <p className="text-sm">Selecione o app <strong>Sopro</strong></p>
              </div>
              <div className="flex gap-3">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0">5</span>
                <p className="text-sm">Toque em <strong>Cancelar assinatura</strong></p>
              </div>
            </div>
          </div>

          {/* Android Instructions - Hidden on iOS to comply with App Store guidelines */}
          {!isIOS && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-2.5 rounded-xl">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Android</h3>
            </div>
            
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex gap-3">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0">1</span>
                <p className="text-sm">Abra a <strong>Google Play Store</strong></p>
              </div>
              <div className="flex gap-3">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0">2</span>
                <p className="text-sm">Toque na sua <strong>foto de perfil</strong> (canto superior direito)</p>
              </div>
              <div className="flex gap-3">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0">3</span>
                <p className="text-sm">Vá em <strong>Pagamentos e assinaturas</strong></p>
              </div>
              <div className="flex gap-3">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0">4</span>
                <p className="text-sm">Toque em <strong>Assinaturas</strong></p>
              </div>
              <div className="flex gap-3">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0">5</span>
                <p className="text-sm">Selecione o app <strong>Sopro</strong></p>
              </div>
              <div className="flex gap-3">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0">6</span>
                <p className="text-sm">Toque em <strong>Cancelar assinatura</strong></p>
              </div>
            </div>
          </div>
          )}

          {/* Back Button */}
          <Link to="/dashboard" className="block pt-2">
            <Button variant="outline" className="w-full">
              Voltar ao Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default CancelSubscription;
