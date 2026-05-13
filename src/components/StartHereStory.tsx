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
  MessageCircle,
  Lightbulb,
  HeartHandshake,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Story {
  id: number;
  title: string;
  phase?: string;
  headerIcon?: 'sparkles' | 'brain' | 'wind' | 'headphones' | 'check' | 'message';
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
      { icon: 'sparkles-special', text: 'Momento Especial\n\nApós a Fase 1, faça o ritual do **último cigarro** com a certeza de que será **mais feliz**' },
    ],
  },
  {
    id: 3,
    phase: 'Fase 2',
    title: 'Respire Livre',
    description: 'Escute hipnoses diárias que te ajudam a:',
    highlights: [
      { icon: 'check', text: 'Reencontrar equilíbrio durante os sintomas de abstinência' },
      { icon: 'check', text: 'Dissolver a ansiedade e estresse' },
      { icon: 'check', text: 'Fortalecer sua nova vida como\nex-fumante' },
    ],
  },
  {
    id: 7,
    title: 'Converse com a IA',
    description: 'Um espaço seguro, disponível 24h,\npara apoiar sua jornada:',
    headerIcon: 'message',
    highlights: [
      { icon: 'lightbulb', text: 'Tire dúvidas sobre o programa\ne os exercícios' },
      { icon: 'message-heart', text: 'Receba acolhimento em momentos de **vontade** ou **ansiedade**' },
      { icon: 'sparkles-mini', text: 'Conte como você está se sentindo e ganhe **clareza** sobre o processo' },
    ],
  },
  {
    id: 4,
    title: 'Hipnoses de Apoio',
    description: 'Muito importantes após seu último cigarro,\nestas hipnoses te ajudam a:',
    highlights: [
      { icon: 'heart', text: 'Botão SOS para manter a calma durante vontade intensa de fumar.' },
      { icon: 'check', text: 'Lidar com gatilhos específicos do\ndia a dia' },
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

const renderBoldText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
};

const getIconComponent = (iconName: string) => {
  const iconClass = "h-5 w-5 text-white";
  switch (iconName) {
    case 'brain': return <Brain className={iconClass} />;
    case 'wind': return <Wind className={iconClass} />;
    case 'heart': return <Heart className={iconClass} />;
    case 'video': return <Play className={iconClass} />;
    case 'headphones': return <Headphones className={iconClass} />;
    case 'check': return <Check className={iconClass} />;
    case 'apple': return <Sparkles className={iconClass} />;
    case 'repeat': return <RefreshCw className={iconClass} />;
    case 'armchair': return <Armchair className={iconClass} />;
    case 'clock': return <Clock className={iconClass} />;
    case 'play-circle': return <PlayCircle className={iconClass} />;
    case 'calendar': return <Calendar className={iconClass} />;
    case 'number-1': return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/30 text-[10px] font-bold text-white">1</span>;
    case 'number-2': return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/30 text-[10px] font-bold text-white">2</span>;
    default: return <Sparkles className={iconClass} />;
  }
};

interface StartHereStoryProps {
  onClose: () => void;
}

const StartHereStory = ({ onClose }: StartHereStoryProps) => {
  const [currentStory, setCurrentStory] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isAnimating, setIsAnimating] = useState(false);
  const scrollYRef = useRef(0);

  useEffect(() => {
    const scrollY = window.scrollY;
    scrollYRef.current = scrollY;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const goToStory = (newIndex: number) => {
    if (isAnimating || newIndex === currentStory) return;
    if (newIndex < 0 || newIndex >= stories.length) return;

    setIsAnimating(true);
    setDirection(newIndex > currentStory ? 'right' : 'left');
    setCurrentStory(newIndex);
    setTimeout(() => setIsAnimating(false), 400);
  };

  const nextStory = () => {
    if (currentStory < stories.length - 1) {
      goToStory(currentStory + 1);
      return;
    }
    onClose();
  };

  const prevStory = () => {
    if (currentStory > 0) {
      goToStory(currentStory - 1);
    }
  };

  const current = stories[currentStory];

  const slideAnimation = direction === 'right' 
    ? 'animate-slide-in-right' 
    : 'animate-slide-in-left';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden overscroll-none touch-none"
      style={{
        background: 'linear-gradient(160deg, hsl(200 70% 42%) 0%, hsl(200 65% 38%) 30%, hsl(180 55% 38%) 70%, hsl(180 50% 42%) 100%)'
      }}
    >
      {/* Decorative soft orbs */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/[0.05] blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-0 h-40 w-40 rounded-full bg-teal-300/[0.08] blur-2xl" />

      {/* Progress bar */}
      <div className="absolute left-0 right-0 top-0 z-10 flex gap-2 px-5 pt-[calc(env(safe-area-inset-top,8px)+16px)]">
        {stories.map((_, index) => (
          <div key={index} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white/90 transition-all duration-500 ease-out"
              style={{ width: index <= currentStory ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white/80 backdrop-blur-md transition-all hover:bg-white/25 hover:text-white active:scale-95"
        style={{ top: 'calc(env(safe-area-inset-top, 12px) + 28px)' }}
        aria-label="Fechar"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Main content area */}
      <div className="mx-auto flex h-[100dvh] w-full max-w-md flex-col px-5"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 12px) + 56px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 12px) + 20px)'
        }}
      >
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className={`mx-auto w-full max-w-sm ${slideAnimation}`}>
            {/* Phase badge */}
            {current.phase && (
              <div className="mb-4 flex justify-center">
                <span className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                  {current.phase}
                </span>
              </div>
            )}

            {/* Title with icon accent */}
            <div className={`text-center ${currentStory === 0 ? 'mb-2' : 'mb-3'}`}>
              {currentStory === 0 && (
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
              )}
              {currentStory === 1 && (
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                  <Brain className="h-7 w-7 text-white" />
                </div>
              )}
              {currentStory === 2 && (
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                  <Wind className="h-7 w-7 text-white" />
                </div>
              )}
              {currentStory === 3 && (
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                  <Headphones className="h-7 w-7 text-white" />
                </div>
              )}
              {currentStory === 4 && (
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                  <Check className="h-7 w-7 text-white" />
                </div>
              )}
              {currentStory === 5 && (
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
              )}
              <h2 className="text-xl font-bold leading-tight text-white md:text-2xl">
                {current.title}
              </h2>
            </div>

            {/* Description */}
            {current.description && (
              <p className={`text-center text-sm leading-relaxed text-white/80 md:text-base ${currentStory === 0 ? 'mb-3' : 'mb-5'}`}>
                {current.description}
              </p>
            )}

            {/* Highlights */}
            {current.highlights && (
              <div className={currentStory === 0 ? "space-y-2" : "space-y-3"}>
                {current.highlights.map((highlight, index) => {
                  const itemKey = `story-${currentStory}-item-${index}`;

                  if (highlight.icon === 'sparkles-special') {
                    return (
                      <div key={itemKey} 
                        className="flex flex-col items-center gap-2 px-2 py-3 text-center"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-sm leading-snug text-white md:text-base">
                          {highlight.text.split('\n').map((line, lineIndex) => (
                            <p key={lineIndex} className={lineIndex === 0 ? 'font-bold mb-1' : ''}>
                              {renderBoldText(line)}
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  const [title, description] = highlight.text.split('\n\n');

                  return (
                    <div key={itemKey} 
                      className={`rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/15 ${currentStory === 0 ? 'p-3' : 'p-4'}`}
                    >
                      {highlight.phase && (
                        <div className="mb-2">
                          <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">
                            {highlight.phase}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
                          {getIconComponent(highlight.icon)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold leading-snug text-white md:text-base">
                            {title.split('\n').map((line, lineIndex) => (
                              <span key={lineIndex} className="block">{line}</span>
                            ))}
                          </h3>
                          {description && (
                            <div className="mt-1.5 text-xs leading-relaxed text-white/85 md:text-sm">
                              {description.split('\n').map((line, lineIndex) => (
                                <p key={lineIndex} className="mb-1">
                                  {renderBoldText(line)}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            {current.footer && (
              <div className="mt-4 rounded-2xl bg-white/15 p-4 text-center backdrop-blur-sm ring-1 ring-white/20">
                <p className="text-sm font-medium leading-snug text-white md:text-base">
                  {renderBoldText(current.footer)}
                </p>
              </div>
            )}

            {/* Bottom spacer for scroll */}
            <div className="h-4" />
          </div>
        </div>

        {/* Bottom controls */}
        <div className="shrink-0 pt-4">
          {currentStory === stories.length - 1 && (
            <Button
              onClick={(event) => {
                event.stopPropagation();
                onClose();
              }}
              className="mb-4 w-full rounded-2xl bg-white px-8 py-5 text-base font-bold text-primary shadow-lg shadow-black/10 transition-all hover:bg-white/90 hover:shadow-xl hover:shadow-black/15 active:scale-[0.98]"
              size="lg"
            >
              Vamos Começar
            </Button>
          )}

          <div className="flex items-center justify-between px-2">
            <button
              onClick={prevStory}
              disabled={currentStory === 0}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-95 ${
                currentStory === 0
                  ? 'cursor-not-allowed bg-white/10 text-white/30'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Page indicator dots */}
            <div className="flex items-center gap-2">
              {stories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStory(index)}
                  className={`transition-all duration-300 ${
                    index === currentStory
                      ? 'h-2.5 w-6 rounded-full bg-white'
                      : 'h-2 w-2 rounded-full bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Ir para slide ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextStory}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow-md shadow-black/10 transition-all hover:bg-white/90 active:scale-95"
              aria-label="Próximo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right {
          0% { opacity: 0; transform: translateX(30px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-left {
          0% { opacity: 0; transform: translateX(-30px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default StartHereStory;
