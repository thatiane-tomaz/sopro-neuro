import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Brain, Wind, Heart, Sparkles, Headphones, Check, RefreshCw, Armchair, Clock, PlayCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Story {
  id: number;
  title: string;
  phase?: string;
  highlights?: { icon: string; text: string; phase?: string }[];
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
        phase: "Fase 1",
        text: "Transformando Crenças\n\n• Dissolva **crenças** que te prendem ao cigarro\n• Entenda que o cigarro **nunca ofereceu bem-estar** real"
      },
      { 
        icon: "sparkles-special", 
        text: "Após a Fase 1\nfaça o ritual do último cigarro"
      },
      { 
        icon: "wind", 
        phase: "Fase 2",
        text: "Respire Livre\n\n• Treine o corpo a voltar ao **ritmo natural**\n• Diminua a **ansiedade** em minutos\n• Crie nova sensação de **controle**"
      }
    ]
  },
  {
    id: 2,
    phase: "Fase 1",
    title: "Transformando Crenças",
    description: "Em cada dia você terá:",
    highlights: [
      { icon: "number-1", text: "Vídeo\n\nExplica, de forma rápida e científica, que fumar não traz benefícios reais." },
      { icon: "number-1", text: "Hipnose\n\nConsolida no subconsciente a nova forma de ver o cigarro." }
    ],
    footer: "Ao final desta fase, você fumará seu último cigarro **mais confiante** de que **será mais feliz**"
  },
  {
    id: 3,
    phase: "Fase 2",
    title: "Respire Livre",
    description: "Escute hipnoses diárias que te ajudam a:",
    highlights: [
      { icon: "check", text: "Reencontrar equilíbrio durante os sintomas de abstinência" },
      { icon: "check", text: "Dissolver a ansiedade" },
      { icon: "check", text: "Fortalecer sua nova vida como ex-fumante" }
    ]
  },
  {
    id: 4,
    title: "Hipnoses de Apoio",
    description: "Disponíveis após completar a Fase 1, estas hipnoses te ajudam a:",
    highlights: [
      { icon: "heart", text: "Manter a calma e o relaxamento" },
      { icon: "check", text: "Lidar com gatilhos específicos do dia a dia" },
      { icon: "apple", text: "Criar hábitos saudáveis para substituir o cigarro" }
    ]
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
    title: "Dicas importantes",
    highlights: [
      { icon: "play-circle", text: "Em cada dia, assista ao vídeo e, logo em seguida, escute a hipnose" },
      { icon: "calendar", text: "Faça o conteúdo diariamente ou, no máximo, a cada 2 dias" },
      { icon: "headphones", text: "Durante a hipnose use fones de ouvido" },
      { icon: "clock", text: "O conteúdo de cada dia é liberado 6h após concluir o dia anterior" },
      { icon: "armchair", text: "Sente-se ou deite-se em um lugar sem interrupções onde possa se soltar completamente" },
      { icon: "repeat", text: "A repetição de conceitos é importante para criar novas conexões cerebrais" }
    ]
  }
];

interface StartHereStoryProps {
  onClose: () => void;
}

// Helper function to render text with **bold** markers
const renderBoldText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

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
      {/* Progress indicators - respect safe area */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10" style={{ paddingTop: 'calc(env(safe-area-inset-top, 8px) + 8px)' }}>
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
        className="absolute right-4 z-20 text-white/80 hover:text-white transition-colors p-3"
        style={{ top: 'calc(env(safe-area-inset-top, 12px) + 24px)' }}
        aria-label="Fechar"
      >
        <X className="h-7 w-7" />
      </button>

      {/* Story content */}
      <div className="relative w-full max-w-md h-full md:h-[90vh] md:rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent">
        <div className="h-full overflow-y-auto px-5 text-center flex flex-col" style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 44px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 12px) + 20px)' }}>
          <div className="animate-fade-in max-w-lg w-full mx-auto my-auto">
            {/* Story-level phase badge */}
            {stories[currentStory].phase && (
              <div className="flex justify-center mb-2">
                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {stories[currentStory].phase}
                </span>
              </div>
            )}
            
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
              {stories[currentStory].title}
            </h2>
            
            {stories[currentStory].description && (
              <p className="text-base text-white/90 mb-4">
                {stories[currentStory].description}
              </p>
            )}

            {stories[currentStory].highlights && (
              <div className="space-y-3 text-left" key={`highlights-${currentStory}`}>
                {stories[currentStory].highlights.map((highlight, index) => {
                  const itemKey = `story-${currentStory}-item-${index}`;
                  // Special case for sparkles-special - render without card
                  if (highlight.icon === 'sparkles-special') {
                    return (
                      <div key={itemKey} className="flex flex-col items-center gap-2 py-3">
                        <Sparkles className="w-8 h-8 text-white" />
                        <div className="text-white font-semibold text-base text-center">
                          {highlight.text.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  
                  // Extract title and description from text (separated by \n\n)
                  const parts = highlight.text.split('\n\n');
                  const title = parts[0];
                  const description = parts[1];
                  
                  return (
                    <div key={itemKey} className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                      {/* Phase badge */}
                      {highlight.phase && (
                        <div className="mb-1.5">
                          <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            {highlight.phase}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-2.5 mb-1.5">
                        <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                          {highlight.icon === 'brain' && <Brain className="w-5 h-5 text-white" />}
                          {highlight.icon === 'wind' && <Wind className="w-5 h-5 text-white" />}
                          {highlight.icon === 'heart' && <Heart className="w-5 h-5 text-white" />}
                          {highlight.icon === 'video' && <Play className="w-5 h-5 text-white" />}
                          {highlight.icon === 'headphones' && <Headphones className="w-5 h-5 text-white" />}
                          {highlight.icon === 'check' && <Check className="w-5 h-5 text-white" />}
                          {highlight.icon === 'apple' && <Sparkles className="w-5 h-5 text-white" />}
                          {highlight.icon === 'repeat' && <RefreshCw className="w-5 h-5 text-white" />}
                          {highlight.icon === 'armchair' && <Armchair className="w-5 h-5 text-white" />}
                          {highlight.icon === 'clock' && <Clock className="w-5 h-5 text-white" />}
                          {highlight.icon === 'play-circle' && <PlayCircle className="w-5 h-5 text-white" />}
                          {highlight.icon === 'calendar' && <Calendar className="w-5 h-5 text-white" />}
                          {highlight.icon === 'number-1' && <span className="w-5 h-5 bg-white/30 rounded-full flex items-center justify-center text-white font-bold text-xs">1</span>}
                          {highlight.icon === 'number-2' && <span className="w-5 h-5 bg-white/30 rounded-full flex items-center justify-center text-white font-bold text-xs">2</span>}
                        </div>
                        <h3 className="text-white font-bold text-base flex-1 leading-snug">
                          {title}
                        </h3>
                      </div>
                      {description && (
                        <div className="text-white/90 text-sm leading-relaxed ml-8">
                          {description.split('\n').map((line, i) => (
                            <p key={i} className="mb-0.5">
                              {renderBoldText(line)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {stories[currentStory].footer && (
              <div className="mt-4 bg-white/15 backdrop-blur-sm rounded-lg p-3 text-center">
                <p className="text-base text-white font-medium leading-relaxed">
                  {renderBoldText(stories[currentStory].footer)}
                </p>
              </div>
            )}

            {/* Start button on last story */}
            {currentStory === stories.length - 1 && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="mt-5 bg-white text-primary hover:bg-white/90 font-semibold px-8 py-5 text-base"
                size="lg"
              >
                Vamos Começar
              </Button>
            )}

            {/* Navigation arrows */}
            <div className="mt-5 flex justify-center gap-8 pb-2">
              <button
                onClick={prevStory}
                disabled={currentStory === 0}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  currentStory === 0
                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                aria-label="Anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                onClick={nextStory}
                className="w-12 h-12 rounded-full bg-white/30 text-white hover:bg-white/40 flex items-center justify-center transition-all"
                aria-label="Próximo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartHereStory;
