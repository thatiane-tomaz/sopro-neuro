import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, CheckCircle2, Shield } from "lucide-react";
import heroImage from "@/assets/hero-sopro.jpg";
import soproLogo from "@/assets/sopro-logo.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Header with Login Button */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="container mx-auto flex justify-end">
          <Link to="/login">
            <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20">
              Já sou membro
            </Button>
          </Link>
        </div>
      </div>

      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="absolute inset-0 bg-gradient-hero opacity-90"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="animate-fade-in">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center mb-8">
            <img src={soproLogo} alt="Sopro" className="h-16 md:h-20 w-auto object-contain animate-float" />
          </div>

          {/* Main headline - foco no problema e solução */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 max-w-4xl mx-auto leading-tight">
            Parar de fumar <span className="text-primary-foreground drop-shadow-lg">pode ser mais fácil</span> do que você imagina
          </h1>

          {/* Subtitle - como funciona */}
          <p className="text-xl md:text-2xl text-white/95 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
            Em 14 dias, com neurociência e hipnose, você entende seu corpo e mente de uma forma totalmente nova
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-12">
            <div className="flex items-center bg-white/15 backdrop-blur-sm rounded-lg px-5 py-3 border border-white/20">
              <Clock className="w-5 h-5 text-white mr-2" />
              <span className="text-white font-medium">14 dias guiados</span>
            </div>
            <div className="flex items-center bg-white/15 backdrop-blur-sm rounded-lg px-5 py-3 border border-white/20">
              <CheckCircle2 className="w-5 h-5 text-white mr-2" />
              <span className="text-white font-medium">Método científico</span>
            </div>
            <div className="flex items-center bg-white/15 backdrop-blur-sm rounded-lg px-5 py-3 border border-white/20">
              <Shield className="w-5 h-5 text-white mr-2" />
              <span className="text-white font-medium">Sem ansiedade</span>
            </div>
          </div>

          {/* CTA principal */}
          <div className="flex flex-col items-center gap-6">
            <Link to="/login" className="w-full max-w-md">
              <Button variant="hero" size="lg" className="w-full group text-lg py-6">
                Começar minha jornada de 14 dias
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            {/* Free trial - destaque maior */}
            <div className="bg-white/20 backdrop-blur-md rounded-xl px-8 py-4 border-2 border-white/40">
              <p className="text-white text-lg font-semibold">
                ✨ Primeiros 2 dias <span className="text-primary-foreground">totalmente grátis</span>
              </p>
              <p className="text-white/80 text-sm mt-1">Experimente sem compromisso</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-accent/20 rounded-full animate-float"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-secondary/20 rounded-full animate-breathe"></div>
    </section>
  );
};

export default HeroSection;