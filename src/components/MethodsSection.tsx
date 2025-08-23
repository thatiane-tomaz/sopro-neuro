import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Sparkles, BookOpen, Users, Zap, Heart } from "lucide-react";
import neuroscienceImage from "@/assets/neuroscience-bg.jpg";
import hypnosisImage from "@/assets/hypnosis-meditation.jpg";

const MethodsSection = () => {
  const methods = [
    {
      icon: Brain,
      title: "Neurociência",
      description: "Baseado em pesquisas sobre como o cérebro funciona e como mudar padrões de comportamento definitivamente.",
      image: neuroscienceImage,
      features: ["Rewiring cerebral", "Plasticidade neural", "Hábitos saudáveis"],
      gradient: "bg-gradient-primary"
    },
    {
      icon: Sparkles,
      title: "Hipnose Clínica",
      description: "Técnicas de hipnose terapêutica para acessar o subconsciente e reprogramar comportamentos automáticos.",
      image: hypnosisImage,
      features: ["Relaxamento profundo", "Reprogramação mental", "Redução de ansiedade"],
      gradient: "bg-gradient-wellness"
    },
    {
      icon: BookOpen,
      title: "Educação Personalizada",
      description: "Conteúdo educativo adaptado ao seu perfil, necessidades e momento na jornada de transformação.",
      image: null,
      features: ["Plano personalizado", "Acompanhamento diário", "Comunidade de apoio"],
      gradient: "bg-gradient-transformation"
    }
  ];

  const stats = [
    { icon: Users, number: "10K+", label: "Pessoas transformadas" },
    { icon: Zap, number: "95%", label: "Taxa de sucesso" },
    { icon: Heart, number: "30", label: "Dias para mudança" },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Nossa abordagem <span className="text-accent">científica</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Combinamos três métodos comprovados para garantir que você pare de fumar 
            de forma definitiva e natural, sem sofrimento ou ansiedade.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-4">
                <stat.icon className="w-8 h-8 text-accent" />
              </div>
              <div className="text-3xl font-bold text-primary mb-2">{stat.number}</div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Methods Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {methods.map((method, index) => (
            <Card key={index} className="group hover:shadow-wellness transition-all duration-300 overflow-hidden">
              {/* Image or gradient background */}
              <div className="relative h-48 overflow-hidden">
                {method.image ? (
                  <div 
                    className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundImage: `url(${method.image})` }}
                  >
                    <div className={`absolute inset-0 ${method.gradient} opacity-80`}></div>
                  </div>
                ) : (
                  <div className={`w-full h-full ${method.gradient}`}></div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <method.icon className="w-16 h-16 text-white" />
                </div>
              </div>

              <CardHeader>
                <CardTitle className="text-2xl text-primary flex items-center">
                  {method.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {method.description}
                </p>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">Benefícios:</h4>
                  <ul className="space-y-1">
                    {method.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-accent rounded-full mr-2"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-hero rounded-2xl p-8 text-white">
            <h3 className="text-3xl font-bold mb-4">
              Pronto para começar sua transformação?
            </h3>
            <p className="text-xl text-white/90 mb-6">
              Cada dia que você espera é um dia a menos de vida saudável
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-accent text-primary font-semibold px-8 py-3 rounded-lg hover:bg-accent-light transition-smooth">
                Começar agora
              </button>
              <button className="border border-white/30 text-white px-8 py-3 rounded-lg hover:bg-white/10 transition-smooth">
                Falar com especialista
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MethodsSection;