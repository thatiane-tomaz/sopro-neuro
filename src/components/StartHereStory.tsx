import { useEffect, useRef, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Brain,
  Wind,
  Heart,
  Sparkles,
  Headphones,
  Check,
  RefreshCw,
  Armchair,
  Clock,
  PlayCircle,
  Calendar,
} from 'lucide-react';
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
    title: '2 Fases de 7 Dias',
    description: 'Uma jornada completa de 14 dias dividida em:',
    highlights: [
      {
        icon: 'brain',
        phase: 'Fase 1',
        text: 'Transformando Crenças\n\n• Dissolva **crenças** que te prendem ao cigarro\n• Entenda que o cigarro **nunca ofereceu bem-estar** real',
      },
      {
        icon: 'sparkles-special',
        text: 'Após a Fase 1\nfaça o ritual do último cigarro',
      },
      {
        icon: 'wind',
        phase: 'Fase 2',
        text: 'Respire Livre\n\n• Treine o corpo a voltar ao **ritmo natural**\n• Diminua a **ansiedade** em minutos\n• Crie nova sensação de **controle**',
      },
    ],
  },
  {
    id: 2,
    phase: 'Fase 1',
    title: 'Transformando Crenças',
    description: 'Em cada dia você terá:',
    highlights: [
      { icon: 'number-1', text: 'Vídeo\n\nExplica, de forma rápida e científica, que fumar não traz benefícios reais.' },
      { icon: 'number-1', text: 'Hipnose\n\nConsolida no subconsciente a nova forma de ver o cigarro.' },
    ],
    footer: 'Ao final desta fase, você fumará seu último cigarro **mais confiante** de que **será mais feliz**',
  },
  {
    id: 3,
    phase: 'Fase 2',
    title: 'Respire Livre',
    description: 'Escute hipnoses diárias que te ajudam a:',
    highlights: [
      { icon: 'check', text: 'Reencontrar equilíbrio durante os sintomas de abstinência' },
      { icon: 'check', text: 'Dissolver a ansiedade' },
      { icon: 'check', text: 'Fortalecer sua nova vida como ex-fumante' },
    ],
  },
  {
    id: 4,
    title: 'Hipnoses de Apoio',
    description: 'Disponíveis após completar a Fase 1, estas hipnoses te ajudam a:',
    highlights: [
      { icon: 'heart', text: 'Manter a calma e o relaxamento' },
      { icon: 'check', text: 'Lidar com gatilhos específicos do dia a dia' },
      { icon: 'apple', text: 'Criar hábitos saudáveis para substituir o cigarro' },
    ],
  },
  {
    id: 5,
    title: 'Parar de uma vez é mais eficaz',
    description: 'A ciência comprova:',
    highlights: [
      { icon: 'check', text: 'Evita passar por múltiplos ciclos de abstinência que acontecem ao reduzir gradualmente' },
      { icon: 'check', text: 'Diminui o tempo total que você sentirá os sintomas de abstinência' },
      { icon: 'check', text: 'Evita que você aumente o quanto fuma sem perceber' },
      { icon: 'check', text: 'Remove completamente o cigarro da sua rotina desde o início' },
    ],
  },
  {
    id: 6,
    title: 'Dicas importantes',
    highlights: [
      { icon: 'play-circle', text: 'Em cada dia, assista ao vídeo e, logo em seguida, escute a hipnose' },
      { icon: 'calendar', text: 'Faça o conteúdo diariamente ou, no máximo, a cada 2 dias' },
      { icon: 'headphones', text: 'Durante a hipnose use fones de ouvido' },
      { icon: 'clock', text: 'O conteúdo de cada dia é liberado 6h após concluir o dia anterior' },
      { icon: 'armchair', text: 'Sente-se ou deite-se em um lugar sem interrupções onde possa se soltar completamente' },
      { icon: 'repeat', text: 'A repetição de conceitos é importante para criar novas conexões cerebrais' },
    ],
  },
];

interface StartHereStoryProps {
  onClose: () => void;
}

const renderBoldText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
};

const StartHereStory = ({ onClose }: StartHereStoryProps) => {
  const [currentStory, setCurrentStory] = useState(0);
  const [contentScale, setContentScale] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      const viewport = viewportRef.current;
      const content = contentRef.current;

      if (!viewport || !content) return;

      const availableHeight = viewport.clientHeight;
      const naturalHeight = content.scrollHeight;

      if (!availableHeight || !naturalHeight) {
        setContentScale(1);
        return;
      }

      const nextScale = naturalHeight > availableHeight
        ? Math.max(availableHeight / naturalHeight, 0.8)
        : 1;

      setContentScale(nextScale);
    };

    const animationFrame = requestAnimationFrame(() => {
      updateScale();
      requestAnimationFrame(updateScale);
    });

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => updateScale())
      : null;

    if (viewportRef.current) resizeObserver?.observe(viewportRef.current);
    if (contentRef.current) resizeObserver?.observe(contentRef.current);

    window.addEventListener('resize', updateScale);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [currentStory]);

  const nextStory = () => {
    if (currentStory < stories.length - 1) {
      setCurrentStory((prev) => prev + 1);
      return;
    }

    onClose();
  };

  const prevStory = () => {
    if (currentStory > 0) {
      setCurrentStory((prev) => prev - 1);
    }
  };

  const current = stories[currentStory];

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-primary via-primary/90 to-accent">
      <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 p-2" style={{ paddingTop: 'calc(env(safe-area-inset-top, 8px) + 8px)' }}>
        {stories.map((_, index) => (
          <div key={index} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: index <= currentStory ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={onClose}
        className="absolute right-4 z-20 p-3 text-white/80 transition-colors hover:text-white"
        style={{ top: 'calc(env(safe-area-inset-top, 12px) + 24px)' }}
        aria-label="Fechar"
      >
        <X className="h-7 w-7" />
      </button>

      <div className="mx-auto flex h-[100dvh] w-full max-w-md flex-col px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 44px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 12px) + 16px)' }}>
        <div ref={viewportRef} className="flex-1 overflow-hidden">
          <div
            ref={contentRef}
            className="mx-auto w-full max-w-lg animate-fade-in text-center"
            style={{ transform: `scale(${contentScale})`, transformOrigin: 'top center' }}
          >
            {current.phase && (
              <div className="mb-2 flex justify-center">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                  {current.phase}
                </span>
              </div>
            )}

            <h2 className="mb-2 text-lg font-bold text-white md:text-2xl">{current.title}</h2>

            {current.description && (
              <p className="mb-3 text-sm text-white/90 md:text-base">{current.description}</p>
            )}

            {current.highlights && (
              <div className="space-y-2 text-left">
                {current.highlights.map((highlight, index) => {
                  const itemKey = `story-${currentStory}-item-${index}`;

                  if (highlight.icon === 'sparkles-special') {
                    return (
                      <div key={itemKey} className="flex flex-col items-center gap-1.5 py-2 text-center">
                        <Sparkles className="h-7 w-7 text-white" />
                        <div className="text-sm font-semibold leading-snug text-white md:text-base">
                          {highlight.text.split('\n').map((line, lineIndex) => (
                            <p key={lineIndex}>{line}</p>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  const [title, description] = highlight.text.split('\n\n');

                  return (
                    <div key={itemKey} className="rounded-lg bg-white/10 p-2.5 backdrop-blur-sm">
                      {highlight.phase && (
                        <div className="mb-1">
                          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
                            {highlight.phase}
                          </span>
                        </div>
                      )}

                      <div className="mb-1 flex items-start gap-2">
                        <div className="mt-0.5 h-4 w-4 shrink-0">
                          {highlight.icon === 'brain' && <Brain className="h-4 w-4 text-white" />}
                          {highlight.icon === 'wind' && <Wind className="h-4 w-4 text-white" />}
                          {highlight.icon === 'heart' && <Heart className="h-4 w-4 text-white" />}
                          {highlight.icon === 'video' && <Play className="h-4 w-4 text-white" />}
                          {highlight.icon === 'headphones' && <Headphones className="h-4 w-4 text-white" />}
                          {highlight.icon === 'check' && <Check className="h-4 w-4 text-white" />}
                          {highlight.icon === 'apple' && <Sparkles className="h-4 w-4 text-white" />}
                          {highlight.icon === 'repeat' && <RefreshCw className="h-4 w-4 text-white" />}
                          {highlight.icon === 'armchair' && <Armchair className="h-4 w-4 text-white" />}
                          {highlight.icon === 'clock' && <Clock className="h-4 w-4 text-white" />}
                          {highlight.icon === 'play-circle' && <PlayCircle className="h-4 w-4 text-white" />}
                          {highlight.icon === 'calendar' && <Calendar className="h-4 w-4 text-white" />}
                          {highlight.icon === 'number-1' && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/30 text-[10px] font-bold text-white">1</span>
                          )}
                          {highlight.icon === 'number-2' && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/30 text-[10px] font-bold text-white">2</span>
                          )}
                        </div>

                        <h3 className="flex-1 text-sm font-bold leading-snug text-white md:text-base">{title}</h3>
                      </div>

                      {description && (
                        <div className="ml-6 text-xs leading-snug text-white/90 md:text-sm">
                          {description.split('\n').map((line, lineIndex) => (
                            <p key={lineIndex} className="mb-0.5">
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

            {current.footer && (
              <div className="mt-3 rounded-lg bg-white/15 p-2.5 text-center backdrop-blur-sm">
                <p className="text-sm font-medium leading-snug text-white md:text-base">
                  {renderBoldText(current.footer)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-3">
          {currentStory === stories.length - 1 && (
            <Button
              onClick={(event) => {
                event.stopPropagation();
                onClose();
              }}
              className="w-full bg-white px-8 py-4 text-base font-semibold text-primary hover:bg-white/90"
              size="lg"
            >
              Vamos Começar
            </Button>
          )}

          <div className={`flex justify-center gap-8 pb-1 ${currentStory === stories.length - 1 ? 'mt-3' : 'mt-1'}`}>
            <button
              onClick={prevStory}
              disabled={currentStory === 0}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                currentStory === 0
                  ? 'cursor-not-allowed bg-white/10 text-white/30'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              onClick={nextStory}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/30 text-white transition-all hover:bg-white/40"
              aria-label="Próximo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartHereStory;