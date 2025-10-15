import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Sparkles, Calendar, TrendingUp, Heart, Target, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import neuroscienceImage from "@/assets/neuroscience-bg.jpg";
import hypnosisImage from "@/assets/hypnosis-meditation.jpg";

const MethodsSection = () => {
  const journey = [
    {
      day: "Dias 1-7",
      title: "Despertar",
      description: "Entenda como o cigarro controla você e prepare seu corpo e mente para a mudança",
      icon: Brain,
    },
    {
      day: "Dias 8-14",
      title: "Transformação",
      description: "Reprograme seus padrões automáticos com hipnose e neurociência aplicada",
      icon: Sparkles,
    },
    {
      day: "Dias 15-21",
      title: "Liberdade",
      description: "Consolide seus novos hábitos e celebre sua nova vida sem dependência",
      icon: Heart,
    },
  ];

  const benefits = [
    {
      icon: Target,
      title: "Sem força de vontade",
      description: "Trabalhe com seu cérebro, não contra ele",
    },
    {
      icon: Heart,
      title: "Zero ansiedade",
      description: "Técnicas de relaxamento profundo diárias",
    },
    {
      icon: TrendingUp,
      title: "Resultados duradouros",
      description: "Mudança real de comportamento, não só parar temporariamente",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-secondary-light">
      <div className="container mx-auto px-4">
        {/* Como funciona */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Como funciona a jornada de <span className="text-accent">14 dias</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Cada dia tem conteúdo específico: áudios de hipnose, vídeos educativos e exercícios práticos
          </p>
        </div>

        {/* Journey Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {journey.map((phase, index) => (
            <div key={index} className="relative">
              <Card className="h-full hover:shadow-wellness transition-all duration-300 border-2 border-accent/20">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                    <phase.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-accent mb-2">{phase.day}</div>
                  <CardTitle className="text-2xl text-primary">{phase.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{phase.description}</p>
                </CardContent>
              </Card>
              {index < journey.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <ArrowRight className="w-8 h-8 text-accent/40" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Por que funciona */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-wellness mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Por que <span className="text-accent">neurociência + hipnose</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A ciência provou: mudar comportamentos exige reprogramar o cérebro, não só decidir parar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Neurociência */}
            <div className="relative rounded-2xl overflow-hidden">
              <div 
                className="h-64 bg-cover bg-center"
                style={{ backgroundImage: `url(${neuroscienceImage})` }}
              >
                <div className="absolute inset-0 bg-gradient-primary opacity-85 flex items-center justify-center">
                  <div className="text-center text-white p-6">
                    <Brain className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-3">Neurociência</h3>
                    <p className="text-white/90">
                      Entenda como seu cérebro criou o hábito e como desfazê-lo permanentemente
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hipnose */}
            <div className="relative rounded-2xl overflow-hidden">
              <div 
                className="h-64 bg-cover bg-center"
                style={{ backgroundImage: `url(${hypnosisImage})` }}
              >
                <div className="absolute inset-0 bg-gradient-transformation opacity-85 flex items-center justify-center">
                  <div className="text-center text-white p-6">
                    <Sparkles className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-3">Hipnose Clínica</h3>
                    <p className="text-white/90">
                      Acesse seu subconsciente e reprograme crenças automáticas sobre o cigarro
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex flex-col items-center text-center p-6 bg-secondary-light rounded-xl">
                <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                  <benefit.icon className="w-7 h-7 text-accent" />
                </div>
                <h4 className="text-lg font-bold text-primary mb-2">{benefit.title}</h4>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Final */}
        <div className="bg-gradient-hero rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl">
          <Calendar className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Sua jornada começa hoje
          </h3>
          <p className="text-xl text-white/95 mb-8 max-w-2xl mx-auto">
            Cada dia que passa fumando é um dia a menos de vida saudável. Dê o primeiro passo agora.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="hero" size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 px-8">
                Começar minha jornada
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          <p className="text-white/80 text-sm">
            ✨ Primeiros 2 dias grátis • Sem compromisso • Cancele quando quiser
          </p>
        </div>
      </div>
    </section>
  );
};

export default MethodsSection;