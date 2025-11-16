import { Button } from "@/components/ui/button";
import { Apple, PlayCircle, Star, Brain, Headphones, TrendingUp } from "lucide-react";
import soproLogo from "@/assets/sopro-logo.png";
import heroImage from "@/assets/hero-sopro.jpg";

const Landing = () => {
  const handleAppStore = () => {
    // TODO: Replace with actual App Store URL when published
    window.open("https://apps.apple.com", "_blank");
  };

  const handlePlayStore = () => {
    // TODO: Replace with actual Play Store URL when published
    window.open("https://play.google.com", "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-hero opacity-40" />
        
        {/* Background image */}
        <div className="absolute inset-0 opacity-20">
          <img 
            src={heroImage} 
            alt="Wellness background" 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <img 
              src={soproLogo} 
              alt="Sopro" 
              className="w-32 h-32 md:w-40 md:h-40 object-contain animate-float drop-shadow-lg"
            />
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-navy mb-6 max-w-4xl mx-auto">
            Parar de fumar pode ser muito mais simples.<br />
            Descubra seu novo caminho com o Sopro.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Um método científico de 14 dias que combina <span className="text-[hsl(270,20%,65%)] font-semibold">neurociência e hipnose</span> para te ajudar a parar de fumar definitivamente
          </p>

          {/* Pricing info */}
          <p className="text-base md:text-lg text-navy font-medium mb-6">
            Teste gratuitamente e continue por apenas <span className="text-[hsl(270,20%,65%)] font-bold">R$59</span>
          </p>

          {/* Download buttons */}
          <div className="flex flex-row gap-3 justify-center items-center mb-12">
            <Button 
              size="default" 
              onClick={handleAppStore}
              className="bg-navy hover:bg-navy/90 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Apple className="mr-2 h-5 w-5" />
              App Store
            </Button>
            <Button 
              size="default" 
              onClick={handlePlayStore}
              className="bg-navy hover:bg-navy/90 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Google Play
            </Button>
          </div>

        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-16">
            Como Funciona
          </h2>

          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Fase 1 */}
              <div className="flex-1 text-center relative">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-border/50">
                  <h3 className="text-lg font-bold text-navy mb-2">Fase 1</h3>
                  <h4 className="text-base font-semibold text-navy mb-3">Quebre Crenças</h4>
                  <p className="text-sm text-muted-foreground">
                    Assista vídeos científicos que revelam a verdade sobre o cigarro e reforce com hipnoses diárias
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:block text-navy/30">
                <TrendingUp className="w-8 h-8" />
              </div>

              {/* Fase 2 */}
              <div className="flex-1 text-center relative">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Star className="w-10 h-10 text-white" />
                </div>
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-border/50">
                  <h3 className="text-lg font-bold text-navy mb-2">Fase 2</h3>
                  <h4 className="text-base font-semibold text-navy mb-3">Último Cigarro</h4>
                  <p className="text-sm text-muted-foreground">
                    Fume seu último cigarro já mais leve e decidido de que será mais feliz sem ele
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:block text-navy/30">
                <TrendingUp className="w-8 h-8" />
              </div>

              {/* Fase 3 */}
              <div className="flex-1 text-center relative">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Headphones className="w-10 h-10 text-white" />
                </div>
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-border/50">
                  <h3 className="text-lg font-bold text-navy mb-2">Fase 3</h3>
                  <h4 className="text-base font-semibold text-navy mb-3">Liberdade Total</h4>
                  <p className="text-sm text-muted-foreground">
                    Passe pela abstinência com hipnoses que te ajudam a ser mais leve durante todo o processo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-16">
            Por Que Escolher o Sopro?
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-navy mb-3">✨ Método Científico</h3>
              <p className="text-muted-foreground">
                Baseado em técnicas comprovadas de hipnose e neurociência
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-navy mb-3">🎯 Personalizado</h3>
              <p className="text-muted-foreground">
                Conteúdo adaptado ao seu perfil e necessidades específicas
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-navy mb-3">📱 Prático</h3>
              <p className="text-muted-foreground">
                Sessões curtas que cabem na sua rotina diária
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-navy mb-3">💰 Economia Garantida</h3>
              <p className="text-muted-foreground">
                Acompanhe quanto você está economizando sem gastar com cigarros
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Pronto para Mudar sua Vida?
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já se libertaram do cigarro
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={handleAppStore}
              variant="secondary"
              className="px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all"
            >
              <Apple className="mr-2 h-6 w-6" />
              Baixar na App Store
            </Button>
            <Button 
              size="lg" 
              onClick={handlePlayStore}
              variant="secondary"
              className="px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all"
            >
              <PlayCircle className="mr-2 h-6 w-6" />
              Baixar no Google Play
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card/30 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Sopro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;