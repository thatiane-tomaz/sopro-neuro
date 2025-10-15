import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { usePhases } from '@/hooks/usePhases';
import { useDailyContent } from '@/hooks/useDailyContent';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, PlayCircle, Headphones, Lock, Crown, Settings, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MediaPlayer from '@/components/MediaPlayer';
import StartHereStory from '@/components/StartHereStory';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import day1 from '@/assets/day-1.jpg';
import day2 from '@/assets/day-2.jpg';
import day3 from '@/assets/day-3.jpg';
import day4 from '@/assets/day-4.jpg';
import day5 from '@/assets/day-5.jpg';
import day6 from '@/assets/day-6.jpg';
import day7 from '@/assets/day-7.jpg';
import day8 from '@/assets/day-8.jpg';
import day9 from '@/assets/day-9.jpg';
import day10 from '@/assets/day-10.jpg';
import day11 from '@/assets/day-11.jpg';
import day12 from '@/assets/day-12.jpg';
import day13 from '@/assets/day-13.jpg';
import day14 from '@/assets/day-14.jpg';
import day15 from '@/assets/day-15.jpg';
import day16 from '@/assets/day-16.jpg';
import day17 from '@/assets/day-17.jpg';
import day18 from '@/assets/day-18.jpg';
import day19 from '@/assets/day-19.jpg';
import day20 from '@/assets/day-20.jpg';
import day21 from '@/assets/day-21.jpg';
import soproLogo from '@/assets/sopro-logo.png';

const dayImages = [
  day1, day2, day3, day4, day5, day6, day7,
  day8, day9, day10, day11, day12, day13, day14,
  day15, day16, day17, day18, day19, day20, day21
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { data: phases, isLoading: phasesLoading } = usePhases();
  const { data: dailyContent, isLoading: contentLoading } = useDailyContent();
  const [selectedMedia, setSelectedMedia] = useState<{
    title: string;
    fileUrl: string;
    contentType: 'video' | 'hypnosis';
  } | null>(null);
  const [showStartHere, setShowStartHere] = useState(false);
  const [isPhase1Expanded, setIsPhase1Expanded] = useState(false);
  const { toast } = useToast();

  console.log('Dashboard render:', { user, authLoading, profileLoading, profile });

  // Calculate current day - for now use day 1, can be enhanced later with user progress tracking
  const currentDay = 8; // Temporarily set to 8 for preview

  // Group daily content by phases
  const phaseGroups = useMemo(() => {
    if (!phases || !dailyContent) return [];
    
    return phases.map(phase => {
      const startDay = (phase.phase_number - 1) * 7 + 1;
      const endDay = phase.phase_number * 7;
      const phaseDays = dailyContent.filter(
        content => content.day_number >= startDay && content.day_number <= endDay
      );
      
      return {
        ...phase,
        days: phaseDays
      };
    });
  }, [phases, dailyContent]);

  const getMediaUrl = (day: number, type: 'video' | 'hypnosis') => {
    const bucket = type === 'video' ? 'videos' : 'hypnosis';
    const fileName = type === 'video' ? `video_${day}.mp4` : `hipnose_${day}.mp3`;
    return `https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/${bucket}/${fileName}`;
  };

  const getDayStatus = (day: number): 'completed' | 'current' | 'locked' => {
    if (day < currentDay) return 'completed';
    if (day === currentDay) return 'current';
    return 'locked';
  };

  if (authLoading || profileLoading || phasesLoading || contentLoading) {
    console.log('Loading state:', { authLoading, profileLoading });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('No user, redirecting to login');
    navigate('/login');
    return null;
  }

  console.log('Rendering dashboard content');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <header className="bg-card/50 backdrop-blur-sm sticky top-0 z-50 border-b mb-6">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={soproLogo} alt="Sopro" className="h-8" />
                {profile?.subscription_status === 'free' && (
                  <>
                    <Badge variant="secondary" className="text-xs">
                      Acesso Gratuito - 2 Dias
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs h-7 gap-1 border-accent text-accent hover:bg-accent hover:text-white"
                    >
                      <Crown className="w-3 h-3" />
                      Upgrade
                    </Button>
                  </>
                )}
                {profile?.subscription_status === 'premium' && (
                  <Badge className="text-xs bg-accent">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {currentDay > 1 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowStartHere(true)}
                    title="Informações"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/settings')}
                  title="Configurações"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Welcome Message */}
        <div className="mb-8">
          {dailyContent && dailyContent[currentDay - 1] && (
            <h2 className="text-2xl md:text-3xl font-bold text-primary">
              {dailyContent[currentDay - 1].welcome_title || 'Continue a sua jornada!'}
            </h2>
          )}
        </div>

        {/* Start Here Section - Only Day 1 */}
        {currentDay < 8 && (
          <div className="mb-8">
            <div 
              className="relative overflow-hidden rounded-xl border-2 border-primary shadow-lg shadow-primary/20 cursor-pointer hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary/5 to-accent/5 p-4"
              onClick={() => setShowStartHere(true)}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground flex-1">
                  Entenda como funciona sua jornada de 21 dias
                </p>
                
                <Button 
                  variant="default"
                  className="shadow-lg flex-shrink-0"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Comece aqui
                </Button>
              </div>
            </div>
          </div>
        )}


        {/* Trigger Hypnosis Section - Shows from Day 8 onwards */}
        {currentDay >= 8 && (
          <div className="mb-8">
            <div 
              className="rounded-xl bg-card/50 backdrop-blur-sm border border-border p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onClick={() => navigate('/triggers')}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                    <Headphones className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                    Hipnoses para Gatilhos
                  </h3>
                </div>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                >
                  Acessar →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Phases with Day Carousels */}
        <div className="space-y-8">
          {phaseGroups.map((phase) => {
            const isPhase1 = phase.phase_number === 1;
            const isPhase1Completed = currentDay >= 8 && isPhase1;
            
            return (
              <div key={phase.id} className={`rounded-2xl bg-card/50 backdrop-blur-sm border border-border shadow-lg transition-all duration-300 ${
                isPhase1Completed ? 'p-4' : 'p-4 md:p-6'
              }`}>
                <div 
                  className={`mb-4 ${isPhase1Completed ? 'cursor-pointer hover:bg-accent/10 rounded-lg p-2 -m-2 transition-colors' : ''}`}
                  onClick={() => {
                    if (isPhase1Completed) {
                      setIsPhase1Expanded(!isPhase1Expanded);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-primary mb-1">
                          Fase {phase.phase_number}
                        </p>
                        {isPhase1Completed && (
                          <Badge className="bg-green-500/20 text-green-700 border-green-500/30 text-xs">
                            Concluído
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-foreground">
                        {phase.title}
                      </h2>
                      {!isPhase1Completed && (
                        <p className="text-sm md:text-base text-muted-foreground">
                          {phase.subtitle}
                        </p>
                      )}
                      {isPhase1Completed && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Clique para {isPhase1Expanded ? 'minimizar' : 'reassistir os vídeos'}
                        </p>
                      )}
                    </div>
                    {isPhase1Completed && (
                      <div className={`transition-transform duration-300 ${isPhase1Expanded ? 'rotate-180' : ''}`}>
                        <svg 
                          className="w-6 h-6 text-primary" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {(!isPhase1Completed || isPhase1Expanded) && (

                <Carousel 
                  opts={{ 
                    align: "center",
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {phase.days.map((dayContent) => {
                      const day = dayContent.day_number;
                      const status = getDayStatus(day);
                      const isLocked = status === 'locked';
                      const isCompleted = status === 'completed';
                      const isCurrent = status === 'current';

                      return (
                        <CarouselItem key={day} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                          <div 
                            className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
                              isLocked 
                                ? 'opacity-50 cursor-not-allowed border-border/50' 
                                : isCurrent
                                  ? 'border-primary shadow-lg shadow-primary/20 cursor-pointer hover:shadow-xl'
                                  : 'border-border/50 opacity-60 cursor-pointer hover:opacity-80'
                            }`}
                          >
                            <div className="relative aspect-video">
                              <img 
                                src={dayImages[day - 1]} 
                                alt={dayContent.title}
                                className="w-full h-full object-cover"
                              />
                              {isLocked && (
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                                      <Lock className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">Bloqueado</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className={`p-4 ${isLocked ? 'pointer-events-none' : ''}`}>
                              <p className="text-xs font-semibold text-primary mb-1">
                                Dia {day}
                              </p>
                              <h3 className="text-base font-semibold text-foreground mb-3">
                                {dayContent.title}
                              </h3>
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`flex-1 justify-center ${
                                    !isLocked 
                                      ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' 
                                      : ''
                                  }`}
                                  onClick={() => !isLocked && setSelectedMedia({ 
                                    title: `${dayContent.title} - Vídeo`,
                                    fileUrl: getMediaUrl(day, 'video'), 
                                    contentType: 'video' 
                                  })}
                                  disabled={isLocked}
                                >
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  <span className="text-sm">
                                    Vídeo
                                    {dayContent.video_minutes && (
                                      <span className="text-xs opacity-70 ml-1">
                                        {dayContent.video_minutes}min
                                      </span>
                                    )}
                                  </span>
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`flex-1 justify-center ${
                                    !isLocked 
                                      ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200' 
                                      : ''
                                  }`}
                                  onClick={() => !isLocked && setSelectedMedia({ 
                                    title: `${dayContent.title} - Hipnose`,
                                    fileUrl: getMediaUrl(day, 'hypnosis'), 
                                    contentType: 'hypnosis' 
                                  })}
                                  disabled={isLocked}
                                >
                                  <Headphones className="h-4 w-4 mr-2" />
                                  <span className="text-sm">
                                    Hipnose
                                    {dayContent.hypnosis_minutes && (
                                      <span className="text-xs opacity-70 ml-1">
                                        {dayContent.hypnosis_minutes}min
                                      </span>
                                    )}
                                  </span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  <CarouselPrevious className="-left-4 md:-left-6 bg-white/80 hover:bg-white border-primary/20 text-primary shadow-lg" />
                  <CarouselNext className="-right-4 md:-right-6 bg-white/80 hover:bg-white border-primary/20 text-primary shadow-lg" />
                </Carousel>
                )}
              </div>
            );
          })}
        </div>

        {/* Premium Upgrade CTA - Bottom */}
        {profile?.subscription_status === 'free' && (
          <div className="mt-12 mb-8">
            <div 
              className="relative overflow-hidden rounded-2xl border-2 border-accent shadow-2xl shadow-accent/30 cursor-pointer hover:shadow-accent/40 transition-all duration-300 bg-gradient-to-br from-accent/10 via-primary/5 to-accent/5 p-8"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                    <Crown className="h-6 w-6 text-accent" />
                    <h3 className="text-2xl font-bold text-foreground">
                      Desbloqueie os 21 Dias Completos
                    </h3>
                  </div>
                  <p className="text-base text-muted-foreground mb-2">
                    Você tem acesso gratuito a 2 dias.
                  </p>
                  <p className="text-base text-muted-foreground mb-2">
                    Desbloqueie a jornada completa para parar de fumar de vez.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ✓ 21 dias de conteúdo exclusivo • ✓ Vídeos + Hipnoses • ✓ Suporte completo
                  </p>
                </div>
                
                <Button 
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-white shadow-lg flex-shrink-0 text-base px-8 py-6"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Seja Premium Agora
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media Player */}
      {selectedMedia && (
        <MediaPlayer
          title={selectedMedia.title}
          fileUrl={selectedMedia.fileUrl}
          contentType={selectedMedia.contentType}
          onClose={() => setSelectedMedia(null)}
        />
      )}

      {/* Start Here Story */}
      {showStartHere && (
        <StartHereStory onClose={() => setShowStartHere(false)} />
      )}
    </div>
  );
};

export default Dashboard;
