import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Brain, Wind, Heart, Sparkles, Headphones, CigaretteOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Story {
  id: number;
  title: string;
  highlights?: { icon: string; text: string; isPhase?: boolean }[];
  description?: string;
  footer?: string;
  showCigaretteBreak?: boolean;
}

const stories: Story[] = [
  {
    id: 1,
    title: "2 Fases de 7 Dias",
    description: "Uma jornada completa de 14 dias dividida em:",
    highlights: [
      { icon: "brain", text: "Fase 1: Despertar Interior", isPhase: true },
      { icon: "wind", text: "Fase 2: Transformação Profunda", isPhase: true }
    ],
    showCigaretteBreak: true
  },
  {
    id: 2,
    title: "Fase 1: Despertar Interior",
    description: "Você vai dissolver as crenças que te fazem sentir que está perdendo algo.",
    highlights: [
      { icon: "video", text: "Nessa fase, você entende — de forma leve e racional — que o cigarro nunca ofereceu bem-estar real." }
    ]
  },
  {
    id: 3,
    title: "Fase 2: Transformação Profunda",
    description: "Aqui, você vai treinar o corpo a voltar ao seu ritmo natural, diminuir a ansiedade em minutos e criar uma nova sensação de controle.",
    highlights: [
      { icon: "video", text: "1 vídeo explicativo com neurociência, biologia e psicologia" },
      { icon: "headphones", text: "1 hipnose reforçando esses conceitos" }
    ]
  },
  {
    id: 4,
    title: "Hipnoses de Apoio & Hábitos",
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
    title: "Por Que Parar de Uma Vez?",
    description: "Parar de fumar de uma vez aumenta suas chances de sucesso:",
    highlights: [
      { icon: "check", text: "Diminui o tempo total que você sentirá os sintomas de abstinência" },
      { icon: "check", text: "Evita passar por múltiplos ciclos de abstinência que acontecem ao reduzir gradualmente" },
      { icon: "check", text: "Remove completamente o cigarro da sua rotina desde o início" }
    ],
    footer: "O método científico comprova: parar de uma vez é mais eficaz"
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
              {currentStory === 0 ? (
                <>
                  2 Fases de <span className="bg-white/20 px-2 rounded">14 dias</span>
                </>
              ) : (
                stories[currentStory].title
              )}
            </h2>
            
            {stories[currentStory].description && (
              <p className="text-lg text-white/90 mb-6">
                {stories[currentStory].description}
              </p>
            )}

            {stories[currentStory].highlights && (
              <div className="space-y-4 text-left">
                {stories[currentStory].highlights.map((highlight, index) => (
                  <div key={index}>
                    <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
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
                      <div className="flex-1">
                        {highlight.isPhase && (
                          <div className="font-semibold text-white mb-1 bg-white/10 px-2 py-1 rounded inline-block">
                            {highlight.text}
                          </div>
                        )}
                        {!highlight.isPhase && (
                          <p className="text-white/95 text-base leading-relaxed">
                            {highlight.text}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Cigarro quebrado entre as fases */}
                    {currentStory === 0 && index === 0 && (
                      <div className="flex items-center justify-center gap-2 my-4 text-white/80">
                        <CigaretteOff className="w-6 h-6" />
                        <span className="text-sm font-medium">Fume o último cigarro</span>
                      </div>
                    )}
                  </div>
                ))}
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
