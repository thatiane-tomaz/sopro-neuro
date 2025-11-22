import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Brain, Wind, Heart, Sparkles, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Story {
  id: number;
  title: string;
  highlights?: { icon: string; text: string }[];
  description?: string;
  footer?: string;
}

const stories: Story[] = [
  {
    id: 1,
    title: "2 Fases de 7 Dias",
    description: "Uma jornada completa de 14 dias dividida em:",
    highlights: [
      { 
        icon: "brain", 
        text: "Transformando Crenças\n\nVocê vai dissolver as crenças que te fazem sentir que está perdendo algo. Nessa fase, você entende — de forma leve e racional — que o cigarro nunca ofereceu bem-estar real."
      },
      { 
        icon: "sparkles-special", 
        text: "Fume o último cigarro"
      },
      { 
        icon: "wind", 
        text: "Respire Livre\n\nAqui, você vai treinar o corpo a voltar ao seu ritmo natural, diminuir a ansiedade em minutos e criar uma nova sensação de controle."
      }
    ]
  },
  {
    id: 2,
    title: "Transformando Crenças",
    description: "Em cada dia você irá trabalhar uma crença:",
    highlights: [
      { icon: "video", text: "Vídeo\n\nExplica, de forma rápida e científica, por que o cigarro não traz benefícios reais." },
      { icon: "headphones", text: "Hipnose\n\nReforça essa compreensão e ajuda a reduzir a sensação de \"perda\"." }
    ],
    footer: "Ao final desta fase, você fumará seu último cigarro já mais confiante de que não está perdendo nada"
  },
  {
    id: 3,
    title: "Fase 2: Respire Livre",
    description: "Você irá aprender técnicas que te ajudam a:",
    highlights: [
      { icon: "check", text: "Dissolver a ansiedade" },
      { icon: "check", text: "Reencontrar equilíbrio durante os sintomas de abstinência" }
    ]
  },
  {
    id: 4,
    title: "Hipnoses de Apoio",
    description: "Disponíveis após completar a Fase 1, estas hipnoses te ajudam a:",
    highlights: [
      { icon: "brain", text: "Reforçar as novas crenças sobre o cigarro" },
      { icon: "heart", text: "Manter a calma e o relaxamento" },
      { icon: "check", text: "Lidar com gatilhos específicos do dia a dia" },
      { icon: "apple", text: "Criar hábitos saudáveis para substituir o cigarro" }
    ],
    footer: "Use sempre que sentir necessidade"
  },
  {
    id: 5,
    title: "Parar de uma vez é mais eficaz",
    description: "A ciência comprova:",
    highlights: [
      { icon: "check", text: "Evita passar por múltiplos ciclos de abstinência que acontecem ao reduzir gradualmente" },
      { icon: "check", text: "Diminui o tempo total que você sentirá os sintomas de abstinência" },
      { icon: "check", text: "Evita que você aumente o quanto fuma sem perceber" },
      { icon: "check", text: "Remove completamente o cigarro da sua rotina desde o início" }
    ]
  },
  {
    id: 6,
    title: "Pronto para Começar?",
    highlights: [
      { icon: "repeat", text: "A repetição de conceitos é importante para criar novas conexões cerebrais" },
      { icon: "headphones", text: "Durante a hipnose use fones de ouvido" },
      { icon: "armchair", text: "Sente-se ou deite-se em um lugar sem interrupções" },
      { icon: "clock", text: "Cada card é desbloqueado 6 horas depois que você finalizou o do dia anterior (assistiu 98% do vídeo e hipnose)" }
    ]
  }
];

interface StartHereStoryProps {
  onClose: () => void;
}

const StartHereStory = ({ onClose }: StartHereStoryProps) => {
  const [currentStory, setCurrentStory] = useState(0);

  const nextStory = () => {
    if (currentStory < stories.length - 1) {
      setCurrentStory((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentStory > 0) {
      setCurrentStory((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Progress indicators */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{
                width: index <= currentStory ? '100%' : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white/80 hover:text-white transition-colors"
        aria-label="Fechar"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Story content */}
      <div className="relative w-full max-w-md h-full md:h-[90vh] md:rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent">
        {/* Navigation arrows */}
        {currentStory > 0 && (
          <button
            onClick={prevStory}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-gray-400 hover:text-gray-300 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>
        )}
        
        {currentStory < stories.length - 1 && (
          <button
            onClick={nextStory}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-gray-400 hover:text-gray-300 transition-colors"
            aria-label="Próximo"
          >
            <ChevronRight className="h-10 w-10" />
          </button>
        )}
        
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
          <div className="animate-fade-in max-w-lg w-full">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              {stories[currentStory].title}
            </h2>
            
            {stories[currentStory].description && (
              <p className="text-lg text-white/90 mb-6">
                {stories[currentStory].description}
              </p>
            )}

            {stories[currentStory].highlights && (
              <div className="space-y-4 text-left">
                {stories[currentStory].highlights.map((highlight, index) => {
                  // Special case for sparkles-special - render without card
                  if (highlight.icon === 'sparkles-special') {
                    return (
                      <div key={index} className="flex flex-col items-center gap-2 py-4">
                        <Sparkles className="w-10 h-10 text-white" />
                        <p className="text-white font-semibold text-lg">
                          {highlight.text}
                        </p>
                      </div>
                    );
                  }
                  
                  // Extract title and description from text (separated by \n\n)
                  const parts = highlight.text.split('\n\n');
                  const title = parts[0];
                  const description = parts[1];
                  
                  return (
                    <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex-shrink-0 w-6 h-6 mt-0.5">
                          {highlight.icon === 'brain' && <Brain className="w-6 h-6 text-white" />}
                          {highlight.icon === 'wind' && <Wind className="w-6 h-6 text-white" />}
                          {highlight.icon === 'heart' && <Heart className="w-6 h-6 text-white" />}
                          {highlight.icon === 'video' && <Play className="w-6 h-6 text-white" />}
                          {highlight.icon === 'headphones' && <Headphones className="w-6 h-6 text-white" />}
                          {highlight.icon === 'check' && <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-sm">✓</div>}
                          {highlight.icon === 'apple' && <Sparkles className="w-6 h-6 text-white" />}
                          {highlight.icon === 'repeat' && <div className="text-2xl">🔄</div>}
                          {highlight.icon === 'armchair' && <div className="text-2xl">🛋️</div>}
                          {highlight.icon === 'clock' && <div className="text-2xl">⏰</div>}
                        </div>
                        <h3 className="text-white font-bold text-lg flex-1">
                          {title}
                        </h3>
                      </div>
                      {description && (
                        <p className="text-white/90 text-base leading-relaxed ml-9">
                          {description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {stories[currentStory].footer && (
              <p className="text-lg text-white font-semibold mt-6 bg-white/20 rounded-full px-6 py-2 inline-block">
                {stories[currentStory].footer}
              </p>
            )}

            {/* Start button on last story */}
            {currentStory === stories.length - 1 && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="mt-8 bg-white text-primary hover:bg-white/90 font-semibold px-8 py-6 text-lg"
                size="lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Vamos Começar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartHereStory;
