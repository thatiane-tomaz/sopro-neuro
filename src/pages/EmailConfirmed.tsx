import { CheckCircle, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import soproLogo from "@/assets/sopro-logo.png";

const EmailConfirmed = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <img 
            src={soproLogo} 
            alt="Sopro" 
            className="h-12 w-auto"
          />
        </div>

        {/* Success Card */}
        <Card className="border-primary/20 shadow-wellness overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-accent p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Email confirmado! ✨
            </h1>
          </div>
          
          <CardContent className="p-6 space-y-6">
            <p className="text-center text-muted-foreground">
              Sua conta foi verificada com sucesso. Agora você pode começar sua jornada!
            </p>

            {/* App Instructions */}
            <div className="bg-accent/10 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Volte ao app
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Abra o app Sopro e faça login com seu email e senha para continuar sua jornada.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Sopro Neuro. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default EmailConfirmed;
