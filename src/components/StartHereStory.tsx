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
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const storyDuration = 5000; // 5 seconds per story

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentStory < stories.length - 1) {
            setCurrentStory((curr) => curr + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + (100 / (storyDuration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentStory, isPaused, onClose]);

  const nextStory = () => {
    if (currentStory < stories.length - 1) {
      setCurrentStory((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentStory > 0) {
      setCurrentStory((prev) => prev - 1);
      setProgress(0);
    }
  };

  const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const middle = rect.width / 2;

    if (clickX < middle) {
      prevStory();
    } else {
      nextStory();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{
                width: index < currentStory ? '100%' : index === currentStory ? `${progress}%` : '0%',
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
      <div
        className="relative w-full max-w-md h-full md:h-[90vh] md:rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent cursor-pointer"
        onClick={handleAreaClick}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
          <div className="animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {stories[currentStory].title}
            </h2>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed whitespace-pre-line">
              {stories[currentStory].description}
            </p>
          </div>

          {/* Navigation hint on first story */}
          {currentStory === 0 && (
            <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-8 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                <span>Voltar</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Avançar</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
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
              Começar Dia 1
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartHereStory;
