import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useJourneyTracking } from '@/hooks/useJourneyTracking';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useToast } from '@/hooks/use-toast';
import { usePhases } from '@/hooks/usePhases';
import { useDailyContent } from '@/hooks/useDailyContent';
import { useTriggersContent } from '@/hooks/useTriggersContent';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, PlayCircle, Headphones, Lock, Crown, Sparkles, Info, MoreVertical, User, Shield, ListTodo, Layers, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const { profile, loading: profileLoading, hasAccessToDay, upgradeRequired } = useUserProfile();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { 
    getCurrentDay, 
    isDayCompleted, 
    getTimeUntilNextUnlock,
    startTracking,
    updateProgress,
    isLoading: trackingLoading 
  } = useJourneyTracking();
  const { data: phases, isLoading: phasesLoading } = usePhases();
  const { data: dailyContent, isLoading: contentLoading } = useDailyContent();
  const { data: triggers, isLoading: triggersLoading } = useTriggersContent();
  const [selectedMedia, setSelectedMedia] = useState<{
    title: string;
    fileUrl: string;
    contentType: 'video' | 'hypnosis';
    day?: number;
    interactionType?: string;
  } | null>(null);
  const [currentTrackingId, setCurrentTrackingId] = useState<string | null>(null);
  const [showStartHere, setShowStartHere] = useState(false);
  const [isPhase1Expanded, setIsPhase1Expanded] = useState(false);
  const { toast } = useToast();

  console.log('Dashboard render:', { user, authLoading, profileLoading, profile, isAdmin });

  // Calculate current day based on user progress
  // Admins can see simulated day (change this value to test different days)
  const adminSimulatedDay = 8; // Change this to test different days
  const actualDay = isAdmin ? adminSimulatedDay : getCurrentDay();
  const currentDay: number = (!isAdmin && profile?.subscription_status === 'free') 
    ? Math.min(actualDay, 2) 
    : actualDay;
  
  console.log('Current day from tracking:', { actualDay, currentDay, isFree: profile?.subscription_status === 'free', isAdmin, adminSimulatedDay });

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

  const getDayStatus = (day: number): 'completed' | 'current' | 'locked' | 'subscription_locked' => {
    // First check subscription access
    const hasSubAccess = isAdmin || hasAccessToDay(day);
    
    if (!hasSubAccess) {
      return 'subscription_locked';
    }
    
    // Then check progress-based access
    if (isDayCompleted(day)) {
      return 'completed';
    }
    
    if (day === currentDay) {
      return 'current';
    }
    
    if (day < currentDay) {
      return 'completed';
    }
    
    return 'locked';
  };

  const handleMediaOpen = (day: number, type: 'video' | 'hypnosis') => {
    // Admins can open all media for testing
    if (!isAdmin) {
      const status = getDayStatus(day);
      if (status === 'locked' || status === 'subscription_locked') {
        toast({
          title: "Conteúdo bloqueado",
          description: status === 'subscription_locked' 
            ? "Faça upgrade para acessar este conteúdo"
            : "Complete o dia anterior para desbloquear",
          variant: "destructive"
        });
        return;
      }
    }
    
    const interactionType = `${type === 'video' ? 'video' : 'hipnose'}_dia_${day}`;
    
    setSelectedMedia({
      title: `${dailyContent?.find(d => d.day_number === day)?.title} - ${type === 'video' ? 'Vídeo' : 'Hipnose'}`,
      fileUrl: getMediaUrl(day, type),
      contentType: type,
      day,
      interactionType
    });

    // Start tracking
    startTracking({ interactionType });
  };

  const handleMediaProgress = (percentage: number) => {
    if (currentTrackingId) {
      updateProgress({
        trackingId: currentTrackingId,
        progressPercentage: percentage,
        finished: percentage >= 98
      });
    }
  };

  const handleMediaComplete = () => {
    if (currentTrackingId) {
      updateProgress({
        trackingId: currentTrackingId,
        progressPercentage: 100,
        finished: true
      });
      
      toast({
        title: "Progresso salvo!",
        description: "Seu progresso foi registrado com sucesso."
      });
    }
  };

  if (authLoading || profileLoading || phasesLoading || contentLoading || triggersLoading || trackingLoading || adminLoading) {
    console.log('Loading state:', { authLoading, profileLoading, trackingLoading, adminLoading });
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
            <div className="flex items-center justify-between mb-3">
              <img src={soproLogo} alt="Sopro" className="h-8" />
              
              <div className="flex items-center gap-2">
                {profile?.subscription_status === 'premium' && (
                  <Badge className="text-xs bg-accent whitespace-nowrap">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowStartHere(true)}
                  title="Informações"
                >
                  <Info className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      title="Menu"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <User className="h-4 w-4 mr-2" />
                      Conta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Shield className="h-4 w-4 mr-2" />
                      Segurança
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {profile?.subscription_status === 'free' && (
              <>
                <div className="border-t mb-3" />
                <div className="flex items-center gap-2 bg-accent/5 rounded-lg px-3 py-2 border border-accent/20">
                  <Badge variant="secondary" className="text-xs whitespace-nowrap">
                    Período Gratuito - 2 Dias
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-7 gap-1 border-accent text-accent hover:bg-accent hover:text-white ml-auto"
                    onClick={() => {
                      toast({
                        title: "Upgrade Premium",
                        description: "Acesse todos os 14 dias da jornada!"
                      });
                    }}
                  >
                    <Crown className="w-3 h-3" />
                    Upgrade
                  </Button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Tabs Navigation */}
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="daily">
              <ListTodo className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger value="support">
              <Layers className="h-5 w-5" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-0">{/* Daily Tasks Tab */}

        {currentDay === 1 && (
          <div className="mb-8">
            <div 
              className="relative overflow-hidden rounded-xl border-2 border-primary shadow-lg shadow-primary/20 cursor-pointer hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary/5 to-accent/5 p-4"
              onClick={() => setShowStartHere(true)}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground flex-1">
                  Entenda como funciona sua jornada de 14 dias
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



        {/* Phases with Day Carousels */}
        <div className="space-y-8">
          {phaseGroups.map((phase) => {
            const isPhase1 = phase.phase_number === 1;
            // Phase 1 is only completed if user actually completed all 7 days
            const phase1LastDay = 7;
            const isPhase1Completed = isPhase1 && isDayCompleted(phase1LastDay);
            
            return (
              <div key={phase.id} className={`rounded-2xl bg-card/50 backdrop-blur-sm border border-border shadow-lg transition-all duration-300 ${
                isPhase1Completed ? 'p-4 opacity-70' : 'p-4 md:p-6'
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
                        <p className={`text-sm font-semibold mb-1 ${isPhase1Completed ? 'text-muted-foreground' : 'text-primary'}`}>
                          Fase {phase.phase_number}
                        </p>
                        {isPhase1Completed && (
                          <Badge className="bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30 text-xs">
                            Concluído
                          </Badge>
                        )}
                      </div>
                      <h2 className={`text-xl md:text-2xl font-bold ${
                        isPhase1Completed 
                          ? 'text-muted-foreground' 
                          : 'bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent'
                      }`}>
                        {phase.title}
                      </h2>
                      <p className={`text-sm md:text-base ${isPhase1Completed ? 'text-muted-foreground/80' : 'text-muted-foreground'}`}>
                        {phase.subtitle}
                      </p>
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
                      const isLocked = status === 'locked' || status === 'subscription_locked';
                      const needsUpgrade = status === 'subscription_locked';
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
                                      {needsUpgrade ? (
                                        <Crown className="h-6 w-6 text-accent" />
                                      ) : (
                                        <Lock className="h-6 w-6 text-muted-foreground" />
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {needsUpgrade ? 'Premium' : 'Bloqueado'}
                                    </p>
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
                                  onClick={() => {
                                    if (!isLocked || isAdmin) {
                                      handleMediaOpen(day, 'video');
                                    }
                                  }}
                                  disabled={isLocked && !isAdmin}
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
                                  onClick={() => !isLocked && handleMediaOpen(day, 'hypnosis')}
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
                      Desbloqueie os 14 Dias Completos
                    </h3>
                  </div>
                  <p className="text-base text-muted-foreground mb-2">
                    Você está no período gratuito com acesso a 2 dias.
                  </p>
                  <p className="text-base text-muted-foreground">
                    Faça upgrade e desbloqueie a jornada completa para parar de fumar de vez.
                  </p>
                </div>
                
                <Button 
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-white shadow-lg flex-shrink-0 text-base px-8 py-6"
                  onClick={() => {
                    toast({
                      title: "Upgrade Premium",
                      description: "Complete sua jornada de 14 dias!"
                    });
                  }}
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Seja Premium Agora
                </Button>
              </div>
            </div>
          </div>
        )}

        </TabsContent>

          <TabsContent value="support" className="mt-0">
            {/* Support Hypnosis Tab */}
            <div className="space-y-6">
              {/* Seção 1 - Sempre disponível */}
              <div>
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground">
                    Apoio para quando precisar
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {triggers?.filter(t => t.section === 'initial').map((trigger) => (
                    <Card
                      key={trigger.id}
                      className="overflow-hidden border-border bg-accent/30 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group cursor-pointer"
                      onClick={() =>
                        setSelectedMedia({
                          title: trigger.title,
                          fileUrl: `https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis/${trigger.file_name}`,
                          contentType: 'hypnosis',
                        })
                      }
                    >
                      <div className="p-3">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Headphones className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                            {trigger.title}
                          </h3>
                        </div>
                        
                        <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2 leading-tight">
                          {trigger.description}
                        </p>

                        <div className="flex items-center justify-between text-[11px]">
                          {trigger.duration_minutes && (
                            <span className="font-medium text-muted-foreground">
                              {trigger.duration_minutes}min
                            </span>
                          )}
                          <div className="flex items-center text-primary ml-auto font-medium">
                            <Play className="h-3 w-3 mr-0.5" />
                            Ouvir
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Seção 2 - Pós último cigarro */}
              <div>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-foreground">Pós Último Cigarro</h3>
                    {currentDay < 8 && (
                      <Badge variant="secondary" className="text-xs">
                        <Lock className="w-3 h-3 mr-1" />
                        Em breve
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Hipnoses especiais para o momento após parar completamente
                  </p>
                </div>
                
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${currentDay < 8 ? 'opacity-50' : ''}`}>
                  {triggers?.filter(t => t.section === 'post_cigarette').map((trigger) => (
                    <Card
                      key={trigger.id}
                      className={`overflow-hidden border-border bg-accent/30 backdrop-blur-sm transition-all duration-300 group ${
                        currentDay >= 8 ? 'hover:shadow-lg cursor-pointer' : 'cursor-not-allowed'
                      }`}
                      onClick={() => {
                        if (currentDay >= 8) {
                          setSelectedMedia({
                            title: trigger.title,
                            fileUrl: `https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis/${trigger.file_name}`,
                            contentType: 'hypnosis',
                          });
                        }
                      }}
                    >
                      <div className="p-3 relative">
                        {currentDay < 8 && (
                          <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Headphones className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                            {trigger.title}
                          </h3>
                        </div>
                        
                        <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2 leading-tight">
                          {trigger.description}
                        </p>

                        <div className="flex items-center justify-between text-[11px]">
                          {trigger.duration_minutes && (
                            <span className="font-medium text-muted-foreground">
                              {trigger.duration_minutes}min
                            </span>
                          )}
                          <div className="flex items-center text-primary ml-auto font-medium">
                            <Play className="h-3 w-3 mr-0.5" />
                            Ouvir
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Tips Section */}
              <Card className="bg-primary/5 border-primary/20 p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  💡 Dicas para melhor resultado
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Use fones de ouvido para melhor imersão</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Encontre um local tranquilo onde não será interrompido</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Ouça quantas vezes precisar durante o dia</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Identifique seus gatilhos principais e tenha os áudios sempre disponíveis</span>
                  </li>
                </ul>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Media Player */}
      {selectedMedia && (
        <MediaPlayer
          title={selectedMedia.title}
          fileUrl={selectedMedia.fileUrl}
          contentType={selectedMedia.contentType}
          interactionType={selectedMedia.interactionType}
          onClose={() => setSelectedMedia(null)}
          onProgress={handleMediaProgress}
          onComplete={handleMediaComplete}
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
