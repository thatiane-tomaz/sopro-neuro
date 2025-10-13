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
    title: "3 Fases de 7 Dias",
    description: "Fase 1: Quebrando crenças para entender que você não está perdendo nada ao parar de fumar.\n\nFase 2: Técnicas respiratórias para atravessar a abstinência com calma e foco.\n\nFase 3: Reforçando hábitos saudáveis que sustentam a decisão de parar de fumar.",
  },
  {
    id: 2,
    title: "Fase 1: Quebrando Crenças",
    description: "Em cada dia você irá trabalhar uma crença assistindo 1 vídeo explicativo com conceitos de neurociência, biologia e psicologia e ouvindo 1 hipnose reforçando esses conceitos.\n\nMenos de 15 minutos por dia.",
  },
  {
    id: 3,
    title: "Fase 2: Técnicas Respiratórias",
    description: "Você irá aprender técnicas respiratórias de relaxamento que te ajudam a dissolver a ansiedade e reencontrar equilíbrio durante os sintomas de abstinência.",
  },
  {
    id: 4,
    title: "Fase 3: Hábitos Saudáveis",
    description: "Esta fase é sobre reforçar hábitos saudáveis, como melhorar a alimentação, aproveitar momentos com outras pessoas e praticar exercícios físicos.",
  },
  {
    id: 5,
    title: "Pronto para Começar?",
    description: "A repetição de conceitos é importante para criar novas conexões cerebrais.\n\nDurante a hipnose use fones de ouvido, sente-se ou deite-se em um lugar sem interrupções.",
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
