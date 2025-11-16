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
            Liberte-se do Cigarro com o Poder da Hipnose
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Um método científico de 21 dias que combina hipnose e neurociência para te ajudar a parar de fumar definitivamente
          </p>

          {/* Download buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              onClick={handleAppStore}
              className="bg-navy hover:bg-navy/90 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
            >
              <Apple className="mr-2 h-6 w-6" />
              Baixar na App Store
            </Button>
            <Button 
              size="lg" 
              onClick={handlePlayStore}
              className="bg-navy hover:bg-navy/90 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
            >
              <PlayCircle className="mr-2 h-6 w-6" />
              Baixar no Google Play
            </Button>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-accent text-accent" />
              ))}
            </div>
            <span className="font-medium">Avaliado 5 estrelas por usuários</span>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-16">
            Como Funciona
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">1. Comece sua Jornada</h3>
              <p className="text-muted-foreground">
                Baixe o app e complete um breve questionário para personalizar sua experiência
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">2. Sessões Diárias</h3>
              <p className="text-muted-foreground">
                Escute áudios de hipnose guiada e assista vídeos educativos todos os dias
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">3. Transformação</h3>
              <p className="text-muted-foreground">
                Em 21 dias, reprograme sua mente e liberte-se do vício do cigarro
              </p>
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