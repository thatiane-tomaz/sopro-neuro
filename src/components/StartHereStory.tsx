import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Story {
  id: number;
  title: string;
  description: string;
  icon?: string;
}

const stories: Story[] = [
  {
    id: 1,
    title: "Bem-vindo ao Sopro! 🌟",
    description: "Este é um programa de 21 dias para você se libertar do cigarro através da hipnose e neurociência.",
  },
  {
    id: 2,
    title: "Como funciona? 📱",
    description: "Todos os dias você terá acesso a um vídeo educativo e uma sessão de hipnose para te ajudar nessa jornada.",
  },
  {
    id: 3,
    title: "Vídeo Diário (15 min) 🎬",
    description: "Cada dia tem um vídeo com informações importantes sobre como o cérebro funciona e técnicas para lidar com a dependência.",
  },
  {
    id: 4,
    title: "Hipnose Guiada (20 min) 🎧",
    description: "Depois do vídeo, você fará uma sessão de hipnose. Use fones de ouvido e escolha um lugar tranquilo.",
  },
  {
    id: 5,
    title: "Compromisso Diário 💪",
    description: "A transformação acontece com consistência. Faça o vídeo e a hipnose todos os dias, de preferência no mesmo horário.",
  },
  {
    id: 6,
    title: "3 Fases de 7 dias 🎯",
    description: "Fase 1: Despertar Interior\nFase 2: Transformação Profunda\nFase 3: Integração e Renovação",
  },
  {
    id: 7,
    title: "Vamos começar! 🚀",
    description: "Agora você está pronto para iniciar sua jornada. Assista ao vídeo do Dia 1 e depois faça a hipnose. Você consegue!",
  },
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
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
          <div className="animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {stories[currentStory].title}
            </h2>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed whitespace-pre-line">
              {stories[currentStory].description}
            </p>
          </div>


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
              Começar Dia 1
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartHereStory;
