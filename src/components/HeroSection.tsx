import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Heart, Brain } from "lucide-react";
import heroImage from "@/assets/hero-sopro.jpg";
import soproLogo from "@/assets/sopro-logo.png";
const HeroSection = () => {
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Header with Login Button */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="container mx-auto flex justify-end">
          <Link to="/login">
            <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20">
              Entrar
            </Button>
          </Link>
        </div>
      </div>

      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `url(${heroImage})`
    }}>
        <div className="absolute inset-0 bg-gradient-primary opacity-85"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="animate-fade-in">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center mb-8">
            <img src={soproLogo} alt="Sopro" className="h-16 md:h-20 animate-float" />
          </div>

          {/* Main headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 max-w-4xl mx-auto leading-tight">
            Conheça seu corpo e mente e
            <span className="text-accent"> pare de fumar </span>
            com mais facilidade
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Usando métodos de <span className="font-semibold text-white">neurociência e hipnose</span>
          </p>

          {/* Journey highlight */}
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-8 py-4 mb-12 border border-white/20">
            <Sparkles className="w-6 h-6 text-accent mr-3" />
            <span className="text-white text-lg md:text-xl font-medium">Caminho simples e claro de 21 dias</span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/login">
              <Button variant="hero" size="lg" className="group">
                Comece sua transformação
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="transformation" size="lg">
                Saiba como funciona
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-12 text-white/70">
            
            
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-accent/20 rounded-full animate-float"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-secondary/20 rounded-full animate-breathe"></div>
    </section>;
};
export default HeroSection;