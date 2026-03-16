import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useJourneyTracking } from '@/hooks/useJourneyTracking';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useToast } from '@/hooks/use-toast';
import { usePhases } from '@/hooks/usePhases';
import { useDailyContent } from '@/hooks/useDailyContent';
import { useTriggersContent } from '@/hooks/useTriggersContent';
import { useOnboardingData } from '@/hooks/useOnboardingData';
import { useSubscription } from '@/hooks/useSubscription';
import { useIsNativeIOS } from '@/hooks/useIsNativeIOS';
import { supabase } from '@/integrations/supabase/client';
import { initializePushNotifications } from '@/services/pushNotifications';
import { useSosHypnosis } from '@/hooks/useSosHypnosis';
import { LogOut, PlayCircle, Headphones, Lock, Crown, Sparkles, Info, MoreVertical, User, Shield, ListTodo, Layers, Play, Coins, CreditCard, ExternalLink, Trash2, XCircle, PartyPopper, HelpCircle } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MediaPlayer from '@/components/MediaPlayer';
import StartHereStory from '@/components/StartHereStory';
import { FeedbackSection } from '@/components/FeedbackSection';
import { SubscriptionButton } from '@/components/upgrade/SubscriptionButton';
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
    isDayTimeLocked,
    getDayProgress,
    getDayCompletionTime,
    getTimeUntilNextUnlock,
    startTracking,
    updateProgress,
    isLoading: trackingLoading 
  } = useJourneyTracking();
  const { data: phases, isLoading: phasesLoading } = usePhases();
  const { data: dailyContent, isLoading: contentLoading } = useDailyContent();
  const { data: triggers, isLoading: triggersLoading } = useTriggersContent();
  const { data: onboardingData } = useOnboardingData();
  const { isPremium, isExpired, daysRemaining, loading: subscriptionLoading } = useSubscription();
  const isNativeIOS = useIsNativeIOS();
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
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);
  const [showDay14Congrats, setShowDay14Congrats] = useState(false);
  const [, setCountdownTick] = useState(0); // Forces re-render for countdown updates
  const { getSosHypnosis } = useSosHypnosis();
  const { toast } = useToast();

  // Countdown timer effect - triggers re-render every minute to update countdown displays
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownTick(tick => tick + 1);
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  console.log('Dashboard render:', { user, authLoading, profileLoading, profile, isAdmin });

  // Calculate current day based on user progress
  const actualDay = getCurrentDay();
  const currentDay: number = actualDay;
  
  console.log('Current day from tracking:', { actualDay, currentDay });

  // Calculate savings for phase 2+ (from day 8+)
  const calculateSavings = useMemo(() => {
    try {
      if (!onboardingData?.weekly_cost || currentDay < 8) return null;
      
      // Days in phase 2: currentDay - 7 (since phase 2 starts on day 8)
      const daysInPhase2 = currentDay - 7;
      if (daysInPhase2 <= 0) return null;
      
      const weeklyCostStr = String(onboardingData.weekly_cost || '0');
      const weeklyCostNum = parseFloat(weeklyCostStr.replace(',', '.'));
      
      // Validate the number
      if (!isFinite(weeklyCostNum) || isNaN(weeklyCostNum) || weeklyCostNum <= 0) return null;
      
      const dailyCost = weeklyCostNum / 7;
      const totalSaved = Math.ceil(dailyCost * daysInPhase2);
      
      // Extra validation for resulting numbers
      if (!isFinite(totalSaved) || isNaN(totalSaved)) return null;
      
      return {
        current: totalSaved,
        sixMonths: Math.ceil(weeklyCostNum * 26),
        oneYear: Math.ceil(weeklyCostNum * 52)
      };
    } catch (error) {
      console.error('Error calculating savings:', error);
      return null;
    }
  }, [onboardingData?.weekly_cost, currentDay]);

  // Group daily content by phases - memoized with stable dependencies
  const phaseGroups = useMemo(() => {
    if (!phases || !dailyContent || !Array.isArray(phases) || !Array.isArray(dailyContent)) return [];
    if (phases.length === 0 || dailyContent.length === 0) return [];
    
    try {
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
    } catch (error) {
      console.error('Error grouping phases:', error);
      return [];
    }
  }, [phases, dailyContent]);

  const getMediaUrl = (day: number, type: 'video' | 'hypnosis') => {
    const bucket = type === 'video' ? 'videos' : 'hypnosis';
    // Days 1-7 use .mp3 (lowercase), days 8+ use .MP3 (uppercase) in storage
    const hypnosisExt = day >= 8 ? 'MP3' : 'mp3';
    const fileName = type === 'video' ? `video_${day}.mp4` : `hipnose_${day}.${hypnosisExt}`;
    return `https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/${bucket}/${fileName}`;
  };

  const getDayStatus = (day: number): 'completed' | 'current' | 'locked' | 'subscription_locked' | 'time_locked' => {
    // Admins have full access to all days, phases, and content
    if (isAdmin) {
      if (isDayCompleted(day)) return 'completed';
      if (day < currentDay) return 'completed';
      return 'current';
    }

    // First check subscription access
    const hasSubAccess = hasAccessToDay(day);
    
    if (!hasSubAccess) {
      return 'subscription_locked';
    }
    
    // Check if day is completed
    if (isDayCompleted(day)) {
      return 'completed';
    }
    
    // IMPORTANT: Past days should ALWAYS be accessible, even if tracking data is inconsistent
    if (day < currentDay) {
      return 'completed';
    }
    
    // Check if day is time-locked (6h wait after previous day)
    if (isDayTimeLocked(day)) {
      return 'time_locked';
    }
    
    // Now check if this is the current day (only if not time-locked)
    if (day === currentDay) {
      return 'current';
    }
    
    return 'locked';
  };

  const handleMediaOpen = (day: number, type: 'video' | 'hypnosis') => {
    // Admins can open all media for testing
    if (!isAdmin) {
      // Check if subscription is expired
      if (isExpired) {
        setShowExpiredDialog(true);
        return;
      }
      
      const status = getDayStatus(day);
      if (status === 'locked' || status === 'subscription_locked') {
        toast({
          title: "Conteúdo bloqueado",
          description: status === 'subscription_locked' 
            ? (isNativeIOS ? "Este conteúdo requer acesso premium" : "Faça upgrade para acessar este conteúdo")
            : "Complete o dia anterior para desbloquear",
          variant: "destructive"
        });
        return;
      }
    }
    
    const interactionType = `${type === 'video' ? 'video' : 'hipnose'}_dia_${day}`;
    
    // IMPORTANT: Open the media player IMMEDIATELY (synchronously) to preserve
    // the user gesture context on mobile browsers. Without this, audio/video
    // loading is blocked by the browser's autoplay policy.
    setSelectedMedia({
      title: dailyContent?.find(d => d.day_number === day)?.title || `Dia ${day}`,
      fileUrl: getMediaUrl(day, type),
      contentType: type,
      day,
      interactionType
    });
    
    // Start tracking in the background (non-blocking)
    startTracking({ interactionType }).then(trackingResult => {
      if (trackingResult?.id) {
        setCurrentTrackingId(trackingResult.id);
      }
    }).catch(error => {
      console.error('Error starting tracking:', error);
    });
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
      
      // Check if this completes day 14 (both video and hypnosis)
      if (selectedMedia?.day === 14) {
        // Small delay to allow tracking to update
        setTimeout(() => {
          if (isDayCompleted(14)) {
            setShowDay14Congrats(true);
          }
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (!user) return;
    
    let isMounted = true;

    const initApp = async () => {
      try {
        // Initialize push notifications safely
        await initializePushNotifications();
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
      
      if (!isMounted) return;
      
      // Clean up any leftover checkout URL params
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('checkout') || urlParams.has('session_id')) {
          window.history.replaceState({}, '', '/dashboard');
        }
      } catch (error) {
        // Silently ignore
      }
    };

    initApp();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Expired dialog is now shown only when user tries to play content

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
    return <Navigate to="/login" replace />;
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
        <header className="bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-sm mb-6 rounded-b-xl">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <img src={soproLogo} alt="Sopro" className="h-8 w-auto object-contain" />
              
              <div className="flex items-center gap-2">
                {isPremium && daysRemaining > 0 && (
                  <Badge className="text-xs bg-accent whitespace-nowrap">
                    <Crown className="w-3 h-3 mr-1" />
                    {daysRemaining} dias
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
                    <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <User className="h-4 w-4 mr-2" />
                      Conta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/cancel-subscription')}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar Assinatura
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/faq')}>
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Ajuda / FAQ
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate('/onboarding')}>
                        <ListTodo className="h-4 w-4 mr-2" />
                        Questionário
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate('/delete-account')} className="text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Conta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
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
              className="relative overflow-hidden rounded-xl shadow-lg shadow-primary/20 cursor-pointer hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary/5 to-accent/5 p-4 touch-manipulation"
              onClick={() => setShowStartHere(true)}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground flex-1">
                  Entenda como funciona sua jornada de 14 dias
                </p>
                
                <Button 
                  variant="default"
                  className="shadow-lg flex-shrink-0 pointer-events-none"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Comece aqui
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Motivational Message for Day 8+ */}
        {currentDay >= 8 && dailyContent && (
          <div className="mb-6 space-y-4">
            {/* Welcome Title */}
            {dailyContent.find(d => d.day_number === currentDay)?.welcome_title && (
              <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-navy font-medium text-center leading-relaxed whitespace-pre-line">
                  {dailyContent.find(d => d.day_number === currentDay)?.welcome_title}
                </p>
              </div>
            )}
            
            {/* Savings Display */}
            {calculateSavings !== null && (
              <div className="bg-gradient-to-r from-accent/5 via-primary/5 to-accent/5 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-navy/70 text-center flex items-center justify-center gap-2">
                  <Coins className="w-4 h-4 text-navy" />
                  Você já economizou cerca de <span className="font-semibold text-navy text-base">R${calculateSavings.current}</span>
                </p>
                
                {/* Savings Projection */}
                <div className="flex items-center justify-center gap-4 mt-3 pt-3">
                  <div className="text-center">
                    <p className="text-xs text-navy/60">Em 6 meses</p>
                    <p className="text-sm font-semibold text-navy">R${calculateSavings.sixMonths}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-navy/60">Em 1 ano</p>
                    <p className="text-sm font-semibold text-navy">R${calculateSavings.oneYear}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}




        {/* Phases with Day Carousels */}
        <div className="space-y-8">
          {Array.isArray(phaseGroups) && phaseGroups.length > 0 && phaseGroups.map((phase) => {
            // Safety check for phase data
            if (!phase || !Array.isArray(phase.days)) return null;
            
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
              <div key={phase.id} className={`rounded-2xl bg-card/50 backdrop-blur-sm border-0 shadow-lg transition-all duration-300 ${
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
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${isPhase1Completed ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                          Fase {phase.phase_number}
                        </span>
                        
                        {/* Progress Indicators */}
                        <div className="flex items-center gap-2">
                          {/* Dots */
                          <div className="flex gap-1">
                            {phase.days.map((day, idx) => {
                              // For admins, all days are completed
                              const isCompleted = isAdmin || day.day_number < currentDay || isDayCompleted(day.day_number);
                              const isCurrent = !isAdmin && day.day_number === currentDay;
                              return (
                                <div
                                  key={day.id}
                                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                    isCompleted 
                                      ? 'bg-primary scale-110' 
                                      : isCurrent
                                      ? 'bg-purple-500 scale-110'
                                      : 'bg-muted-foreground/20'
                                  }`}
                                  title={`Dia ${day.day_number}${isCompleted ? ' - Concluído' : isCurrent ? ' - Atual' : ''}`}
                                />
                              );
                            })}
                          </div>
                          
                          {/* Count - for admins always show 7/7 */}
                          <span className={`text-xs font-medium ${isPhase1Completed ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                            {isAdmin ? '7' : phase.days.filter(day => day.day_number <= currentDay || isDayCompleted(day.day_number)).length}/{phase.days.length} dias
                          </span>
                        </div>
                        
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
                    startIndex: phase.days.findIndex(d => d.day_number === currentDay),
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {phase.days.map((dayContent, index) => {
                      const day = dayContent.day_number;
                      const status = getDayStatus(day);
                      const isLocked = status === 'locked' || status === 'subscription_locked' || status === 'time_locked';
                      const needsUpgrade = status === 'subscription_locked';
                      const isTimeLocked = status === 'time_locked';
                      const isCompleted = status === 'completed';
                      const isCurrent = status === 'current';
                      const isFirstInPhase = index === 0;
                      const isLastInPhase = index === phase.days.length - 1;

                      return (
                        <CarouselItem key={day} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                          <div 
                            className={`group relative overflow-hidden rounded-2xl border-0 transition-all duration-300 ${
                              isLocked 
                                ? 'opacity-50 cursor-not-allowed bg-card/30 shadow-sm' 
                                : isCurrent
                                  ? 'shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-accent/5 to-primary/5'
                                  : 'shadow-md cursor-pointer hover:shadow-lg hover:-translate-y-0.5 bg-card/50 backdrop-blur-sm'
                            }`}
                          >
                            <div className="relative aspect-video overflow-hidden">
                              <img 
                                src={`${dayImages[day - 1]}?v=2`} 
                                alt={dayContent.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              {isLocked && (
                                <div className="absolute inset-0 bg-background/70 backdrop-blur-md flex items-center justify-center">
                                  <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-lg">
                                    <Lock className="h-7 w-7 text-muted-foreground" />
                                  </div>
                                </div>
                              )}
                              {!isAdmin && isCurrent && (
                                <div className="absolute top-3 right-3">
                                  <div className="bg-accent text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                                    Atual
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className={`p-5 ${isLocked ? 'pointer-events-none' : ''}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                                  {day}
                                </span>
                                <h3 className="text-base font-semibold text-navy dark:text-primary-light leading-tight tracking-tight flex-1">
                                  {dayContent.title}
                                </h3>
                              </div>
                              
                              <div className={`flex gap-2 ${phase.phase_number === 2 ? 'justify-center' : ''}`}>
                                {/* Show video button only if NOT Phase 2 */}
                                {phase.phase_number !== 2 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                  className={`flex-1 justify-center min-h-[44px] ${
                                    !isLocked 
                                      ? 'bg-sky-50 hover:bg-sky-100 text-sky-600 border-sky-200' 
                                      : ''
                                  }`}
                                    onClick={() => {
                                      if (!isLocked || isAdmin) {
                                        handleMediaOpen(day, 'video');
                                      }
                                    }}
                                    disabled={isLocked && !isAdmin}
                                  >
                                    <PlayCircle className="h-3.5 w-3.5 mr-1.5" />
                                    <span className="text-xs">
                                      Vídeo
                                      {dayContent.video_minutes && (
                                        <span className="text-[10px] opacity-70 ml-1">
                                          {dayContent.video_minutes}min
                                        </span>
                                      )}
                                    </span>
                                  </Button>
                                )}
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`${phase.phase_number === 2 ? 'w-auto px-6' : 'flex-1'} justify-center min-h-[44px] ${
                                    !isLocked 
                                      ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200' 
                                      : ''
                                  }`}
                                  onClick={() => {
                                    if (!isLocked || isAdmin) {
                                      handleMediaOpen(day, 'hypnosis');
                                    }
                                  }}
                                  disabled={isLocked && !isAdmin}
                                >
                                  <Headphones className="h-3.5 w-3.5 mr-1.5" />
                                  <span className="text-xs">
                                    Hipnose
                                    {dayContent.hypnosis_minutes && (
                                      <span className="text-[10px] opacity-70 ml-1">
                                        {dayContent.hypnosis_minutes}min
                                      </span>
                                    )}
                                  </span>
                                </Button>
                              </div>
                              
                              {/* Progress Message - for current day (in progress) or completed day with countdown */}
                              {(() => {
                                const videoProgress = getDayProgress(day, 'video');
                                const hypnosisProgress = getDayProgress(day, 'hypnosis');
                                const videoCompleted = videoProgress.completed;
                                const hypnosisCompleted = hypnosisProgress.completed;
                                const hasStarted = videoProgress.started || hypnosisProgress.started;
                                const bothCompleted = videoCompleted && hypnosisCompleted;
                                
                                // For Phase 2, only hypnosis is required
                                const isPhase2 = phase.phase_number === 2;
                                const allRequired = isPhase2 ? hypnosisCompleted : bothCompleted;
                                
                                // Calculate countdown for THIS specific completed day
                                // Show on completed days where the NEXT day is still time-locked
                                if (isCompleted && day < 21) {
                                  const completionTime = getDayCompletionTime(day);
                                  
                                  if (completionTime) {
                                    const unlockTime = new Date(completionTime.getTime() + 6 * 60 * 60 * 1000);
                                    const msRemaining = unlockTime.getTime() - Date.now();
                                    
                                    if (msRemaining > 0) {
                                      const hours = Math.floor(msRemaining / (1000 * 60 * 60));
                                      const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
                                      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                                      
                                      return (
                                        <div className="mt-3 text-center h-5">
                                          <p className="text-xs text-primary font-medium">
                                            Próximo dia em {timeStr}
                                          </p>
                                        </div>
                                      );
                                    }
                                  }
                                }
                                
                                // Show progress message for current day
                                if (isCurrent && !isLocked) {
                                  if (hasStarted && !allRequired) {
                                    return (
                                      <div className="mt-3 text-center h-5">
                                        <p className="text-xs text-muted-foreground">
                                          {isPhase2 
                                            ? "Finalize a hipnose para avançar"
                                            : "Finalize o vídeo e a hipnose para avançar"
                                          }
                                        </p>
                                      </div>
                                    );
                                  }
                                }
                                
                                // Show "Concluído" for completed days
                                if (isCompleted) {
                                  return (
                                    <div className="mt-3 text-center h-5">
                                      <p className="text-xs text-primary font-medium">Concluído</p>
                                    </div>
                                  );
                                }
                                
                                // Placeholder to maintain consistent card height
                                return <div className="mt-3 h-5" />;
                              })()}
                            </div>
                          </div>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  {phase.days.length > 1 && (
                    <>
                      <CarouselPrevious className="-left-4 md:-left-6 bg-white/80 hover:bg-white border-primary/20 text-primary shadow-lg" />
                      <CarouselNext className="-right-4 md:-right-6 bg-white/80 hover:bg-white border-primary/20 text-primary shadow-lg" />
                    </>
                  )}
                </Carousel>
                )}
              </div>
            );
          })}
        </div>

        {/* SOS Button - Inside card matching phase containers */}
        {(currentDay >= 8 || isAdmin) && (
          <div className="mt-8 rounded-2xl bg-card/50 backdrop-blur-sm border-0 shadow-lg p-4 md:p-6">
            <div 
              className="flex items-center gap-4 cursor-pointer touch-manipulation"
              onClick={() => {
                const sos = getSosHypnosis();
                setSelectedMedia({
                  title: sos.title,
                  fileUrl: sos.fileUrl,
                  contentType: 'hypnosis',
                });
              }}
            >
              <button
                className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/30 border-0 flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-900/40 active:scale-95 transition-all duration-200 shadow-md touch-manipulation flex-shrink-0"
              >
                <span className="text-rose-400 font-bold text-lg select-none">SOS</span>
              </button>
              <div>
                <h4 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">A vontade está forte?</h4>
                <p className="text-muted-foreground text-sm">
                  Toque no botão<br />e acalme seu cérebro em minutos.
                </p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.isArray(triggers) && triggers.filter(t => t.section === 'initial').map((trigger) => (
                    <Card
                      key={trigger.id}
                      className="overflow-hidden border-0 bg-accent/30 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer touch-manipulation"
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
                  {currentDay < 8 && (
                    <p className="text-sm font-semibold text-accent mb-2">
                      Ficará disponível após finalizar a Fase 1
                    </p>
                  )}
                  <h3 className="text-lg font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-2">Controle dos Gatilhos</h3>
                  <p className="text-sm text-muted-foreground">
                    Hipnoses rápidas para estabilizar a mente e o corpo após parar de fumar
                  </p>
                </div>
                
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${currentDay < 8 ? 'opacity-50' : ''}`}>
                  {Array.isArray(triggers) && triggers.filter(t => t.section === 'post_cigarette').map((trigger) => (
                    <Card
                      key={trigger.id}
                      className={`overflow-hidden border-0 bg-accent/30 backdrop-blur-sm shadow-md transition-all duration-300 group touch-manipulation ${
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
          onClose={() => {
            setSelectedMedia(null);
            setCurrentTrackingId(null); // Clean up tracking ID when closing
          }}
          onProgress={handleMediaProgress}
          onComplete={handleMediaComplete}
        />
      )}

      {/* Start Here Story */}
      {showStartHere && (
        <StartHereStory onClose={() => setShowStartHere(false)} />
      )}

      {/* Expired Subscription Dialog */}
      <AlertDialog open={showExpiredDialog} onOpenChange={setShowExpiredDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <Crown className="w-12 h-12 text-accent" />
            </div>
            <AlertDialogTitle className="text-center">
              Sua assinatura expirou
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Seu acesso premium expirou. Renove sua assinatura para continuar acessando todo o conteúdo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction 
              onClick={() => {
                setShowExpiredDialog(false);
                navigate('/paywall');
              }}
              className="w-full bg-accent hover:bg-accent/90"
            >
              Renovar assinatura
            </AlertDialogAction>
            <Button 
              onClick={() => setShowExpiredDialog(false)}
              className="w-full"
              variant="outline"
            >
              Fechar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Day 14 Completion Congratulations Dialog */}
      <AlertDialog open={showDay14Congrats} onOpenChange={setShowDay14Congrats}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 animate-ping bg-accent/30 rounded-full" />
                <div className="relative bg-gradient-to-br from-accent to-primary p-4 rounded-full">
                  <PartyPopper className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
            <AlertDialogTitle className="text-center text-2xl">
              🎉 Parabéns!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-3">
              <p className="text-base">
                Você completou os <strong>14 dias de conteúdo</strong> da sua jornada de transformação!
              </p>
              <p>
                Este é um marco incrível. Continue praticando as técnicas aprendidas e acompanhando seu progresso.
              </p>
              <div className="bg-muted/50 rounded-lg p-3 mt-4">
                <p className="text-xs text-muted-foreground">
                  💡 Lembre-se: sua assinatura é recorrente.{' '}
                  <button 
                    onClick={() => {
                      setShowDay14Congrats(false);
                      navigate('/cancel-subscription');
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    Veja como gerenciar sua assinatura aqui
                  </button>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setShowDay14Congrats(false)}
              className="w-full bg-accent hover:bg-accent/90"
            >
              Continuar minha jornada
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
