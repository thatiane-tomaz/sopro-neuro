import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Heart, Brain } from "lucide-react";
import heroImage from "@/assets/hero-sopro.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-primary opacity-85"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="animate-fade-in">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center mb-8">
            <Sparkles className="w-12 h-12 text-accent mr-4 animate-float" />
            <h1 className="text-5xl md:text-7xl font-bold text-white">
              Sopro
            </h1>
          </div>

          {/* Main headline */}
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 max-w-4xl mx-auto leading-tight">
            Transforme sua vida e
            <span className="text-accent"> pare de fumar </span>
            definitivamente
          </h2>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Usando métodos cientificamente comprovados: hipnose, neurociência e educação personalizada
          </p>

          {/* Features highlights */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
              <Brain className="w-5 h-5 text-accent mr-2" />
              <span className="text-white font-medium">Neurociência</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
              <Sparkles className="w-5 h-5 text-accent mr-2" />
              <span className="text-white font-medium">Hipnose</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
              <Heart className="w-5 h-5 text-accent mr-2" />
              <span className="text-white font-medium">Educação</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/login">
              <Button variant="hero" size="lg" className="group">
                Comece sua transformação
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="transformation" size="lg">
              Saiba como funciona
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-12 text-white/70">
            <p className="text-sm mb-2">Mais de 10.000 pessoas já transformaram suas vidas</p>
            <div className="flex justify-center items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Sparkles key={i} className="w-4 h-4 text-accent fill-current" />
              ))}
              <span className="ml-2 text-sm">4.9/5 de satisfação</span>
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