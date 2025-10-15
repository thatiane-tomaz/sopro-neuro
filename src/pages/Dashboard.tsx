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
            
            {!isAdmin && profile?.subscription_status === 'free' && (
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
            // Phase 1 is completed if:
            // - Admin simulating day 8+ (phase 1 has 7 days)
            // - OR user actually completed day 7
            const phase1LastDay = 7;
            const isPhase1Completed = isPhase1 && (
              (isAdmin && currentDay >= 8) || 
              isDayCompleted(phase1LastDay)
            );
            
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
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`px-3 py-1 rounded-lg ${isPhase1Completed ? 'bg-muted/50' : 'bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20'}`}>
                          <p className={`text-xs font-black uppercase tracking-wider ${isPhase1Completed ? 'text-muted-foreground' : 'text-primary'}`}>
                            Fase {phase.phase_number}
                          </p>
                        </div>
                        {isPhase1Completed && (
                          <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold">
                            ✓ Concluído
                          </Badge>
                        )}
                      </div>
                      <h2 className={`text-2xl md:text-4xl font-black tracking-tight ${
                        isPhase1Completed 
                          ? 'text-muted-foreground' 
                          : 'bg-gradient-to-r from-purple-800 via-purple-600 to-pink-600 dark:from-purple-400 dark:via-purple-300 dark:to-pink-400 bg-clip-text text-transparent'
                      }`}>
                        {phase.title}
                      </h2>
                      {(!isPhase1Completed || isPhase1Expanded) && (
                        <p className={`text-sm md:text-base ${isPhase1Completed ? 'text-muted-foreground/80' : 'text-muted-foreground'}`}>
                          {phase.subtitle}
                        </p>
                      )}
                      {isPhase1Completed && isPhase1Expanded && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Clique para minimizar
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

                {(!isPhase1Completed || (isPhase1Completed && isPhase1Expanded)) && (

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
                            className={`group relative overflow-hidden rounded-3xl transition-all duration-500 ${
                              isLocked 
                                ? 'opacity-40 cursor-not-allowed bg-gradient-to-br from-muted/20 to-muted/5 border-2 border-dashed border-muted' 
                                : isCurrent
                                  ? 'cursor-pointer hover:scale-[1.02] hover:-translate-y-2 shadow-2xl hover:shadow-accent/30 bg-white dark:bg-card border-2 border-accent/30'
                                  : 'cursor-pointer hover:scale-[1.01] hover:-translate-y-1 shadow-lg hover:shadow-xl bg-white dark:bg-card/80 border border-border/40'
                            }`}
                            style={{
                              transform: isCurrent ? 'perspective(1000px)' : undefined,
                            }}
                          >
                            {/* Badge Dia Atual - Redesenhado */}
                            {isCurrent && (
                              <div className="absolute -top-2 -right-2 z-20">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 rounded-full blur-md opacity-70 animate-pulse"></div>
                                  <div className="relative bg-gradient-to-r from-purple-700 via-purple-600 to-pink-600 text-white text-[11px] font-black px-4 py-2 rounded-full shadow-xl uppercase tracking-wide">
                                    Agora
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Imagem com overlay gradiente */}
                            <div className="relative aspect-[16/10] overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 z-10"></div>
                              <img 
                                src={dayImages[day - 1]} 
                                alt={dayContent.title}
                                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
                              />
                              
                              {/* Número do dia - Grande e destacado */}
                              <div className="absolute top-4 left-4 z-20">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-white dark:bg-black blur-xl opacity-50"></div>
                                  <div className="relative bg-white/95 dark:bg-black/95 backdrop-blur-sm w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl border border-white/20">
                                    <span className="text-2xl font-black bg-gradient-to-br from-purple-700 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                      {day}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Indicador de conclusão - Moderno */}
                              {isCompleted && (
                                <div className="absolute top-4 right-4 z-20">
                                  <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500 blur-md opacity-60 animate-pulse"></div>
                                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl">
                                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Overlay de bloqueio - Redesenhado */}
                              {isLocked && (
                                <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-muted/95 backdrop-blur-2xl flex items-center justify-center z-30">
                                  <div className="text-center transform -translate-y-2">
                                    <div className="relative mb-3">
                                      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/20 blur-2xl"></div>
                                      <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center shadow-2xl border border-muted">
                                        {needsUpgrade ? (
                                          <Crown className="h-10 w-10 text-accent drop-shadow-lg" />
                                        ) : (
                                          <Lock className="h-10 w-10 text-muted-foreground/60 drop-shadow-lg" />
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-sm font-bold text-foreground/80 tracking-wide">
                                      {needsUpgrade ? 'Premium' : 'Em Breve'}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Conteúdo do card */}
                            <div className={`p-6 ${isLocked ? 'pointer-events-none' : ''}`}>
                              {/* Título com gradiente roxo mais intenso */}
                              <h3 className="text-xl font-black mb-5 leading-tight tracking-tight">
                                <span className="bg-gradient-to-r from-purple-800 via-purple-700 to-purple-900 dark:from-purple-400 dark:via-purple-300 dark:to-purple-500 bg-clip-text text-transparent">
                                  {dayContent.title}
                                </span>
                              </h3>
                              
                              {/* Botões de ação - Modernos com ícones maiores */}
                              <div className="flex gap-3">
                                <Button
                                  variant="outline"
                                  className={`flex-1 h-12 rounded-xl font-bold transition-all duration-300 ${
                                    !isLocked 
                                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900 dark:hover:to-blue-800 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 shadow-lg shadow-blue-200/50 dark:shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-300/50 dark:hover:shadow-blue-800/50 hover:scale-105' 
                                      : 'opacity-50'
                                  }`}
                                  onClick={() => {
                                    if (!isLocked || isAdmin) {
                                      handleMediaOpen(day, 'video');
                                    }
                                  }}
                                  disabled={isLocked && !isAdmin}
                                >
                                  <PlayCircle className="h-5 w-5 mr-2" />
                                  <div className="flex flex-col items-start">
                                    <span className="text-sm font-bold">Vídeo</span>
                                    {dayContent.video_minutes && (
                                      <span className="text-[10px] opacity-70">
                                        {dayContent.video_minutes}min
                                      </span>
                                    )}
                                  </div>
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  className={`flex-1 h-12 rounded-xl font-bold transition-all duration-300 ${
                                    !isLocked 
                                      ? 'bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900 dark:hover:to-purple-800 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 shadow-lg shadow-purple-200/50 dark:shadow-purple-900/50 hover:shadow-xl hover:shadow-purple-300/50 dark:hover:shadow-purple-800/50 hover:scale-105' 
                                      : 'opacity-50'
                                  }`}
                                  onClick={() => !isLocked && handleMediaOpen(day, 'hypnosis')}
                                  disabled={isLocked}
                                >
                                  <Headphones className="h-5 w-5 mr-2" />
                                  <div className="flex flex-col items-start">
                                    <span className="text-sm font-bold">Hipnose</span>
                                    {dayContent.hypnosis_minutes && (
                                      <span className="text-[10px] opacity-70">
                                        {dayContent.hypnosis_minutes}min
                                      </span>
                                    )}
                                  </div>
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
        {!isAdmin && profile?.subscription_status === 'free' && (
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
