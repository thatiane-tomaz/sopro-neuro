import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, PlayCircle, Headphones, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MediaPlayer from '@/components/MediaPlayer';
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

const dayImages = [
  day1, day2, day3, day4, day5, day6, day7,
  day8, day9, day10, day11, day12, day13, day14,
  day15, day16, day17, day18, day19, day20, day21
];

const phases = [
  {
    id: 1,
    title: "Fase 1",
    subtitle: "Despertar Interior",
    days: [1, 2, 3, 4, 5, 6, 7]
  },
  {
    id: 2,
    title: "Fase 2", 
    subtitle: "Transformação Profunda",
    days: [8, 9, 10, 11, 12, 13, 14]
  },
  {
    id: 3,
    title: "Fase 3",
    subtitle: "Integração e Renovação",
    days: [15, 16, 17, 18, 19, 20, 21]
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [selectedMedia, setSelectedMedia] = useState<{
    title: string;
    fileUrl: string;
    contentType: 'video' | 'hypnosis';
  } | null>(null);
  const [currentDay] = useState(1);
  const { toast } = useToast();

  const getMediaUrl = (day: number, type: 'video' | 'hypnosis') => {
    const bucket = type === 'video' ? 'videos' : 'hypnosis';
    const fileName = `dia${day}.mp3`;
    return `https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/${bucket}/${fileName}`;
  };

  const getDayStatus = (day: number): 'completed' | 'current' | 'locked' => {
    if (day < currentDay) return 'completed';
    if (day === currentDay) return 'current';
    return 'locked';
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <header className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                Bem-vindo, {profile?.display_name || 'Usuário'}!
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Continue sua jornada de transformação
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-accent/20 backdrop-blur-sm border border-accent/30">
                <span className="text-accent text-xs md:text-sm font-medium">
                  {profile?.subscription_status === 'premium' ? 'Premium' : 'Free'}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                className="rounded-full hover:bg-destructive/20 hover:text-destructive h-8 w-8 md:h-9 md:w-9"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Phases with Day Carousels */}
        <div className="space-y-8">
          {phases.map((phase) => {
            const phaseHasCurrent = phase.days.includes(currentDay);
            const initialSlide = phaseHasCurrent ? phase.days.indexOf(currentDay) : 0;
            
            return (
              <div key={phase.id} className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border p-4 md:p-6 shadow-lg">
                <div className="mb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    {phase.title}
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {phase.subtitle}
                  </p>
                </div>

                <Carousel 
                  opts={{ 
                    align: "start",
                    startIndex: initialSlide,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {phase.days.map((day) => {
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
                                  : 'border-border/50 opacity-75 cursor-pointer hover:opacity-100'
                            }`}
                          >
                            <div className="relative aspect-video">
                              <img 
                                src={dayImages[day - 1]} 
                                alt={`Dia ${day}`}
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
                              <h3 className="text-lg font-semibold text-foreground mb-3">
                                Dia {day}
                              </h3>
                              
                              <div className="space-y-2">
                                <Button
                                  variant={isCurrent ? "default" : "outline"}
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() => !isLocked && setSelectedMedia({ 
                                    title: `Vídeo - Dia ${day}`,
                                    fileUrl: getMediaUrl(day, 'video'), 
                                    contentType: 'video' 
                                  })}
                                  disabled={isLocked}
                                >
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  <span className="text-sm">1. Vídeo</span>
                                </Button>
                                
                                <Button
                                  variant={isCurrent ? "default" : "outline"}
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() => !isLocked && setSelectedMedia({ 
                                    title: `Hipnose - Dia ${day}`,
                                    fileUrl: getMediaUrl(day, 'hypnosis'), 
                                    contentType: 'hypnosis' 
                                  })}
                                  disabled={isLocked}
                                >
                                  <Headphones className="h-4 w-4 mr-2" />
                                  <span className="text-sm">2. Hipnose</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  <CarouselPrevious className="hidden sm:flex -left-4 md:-left-6" />
                  <CarouselNext className="hidden sm:flex -right-4 md:-right-6" />
                </Carousel>
              </div>
            );
          })}
        </div>
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
    </div>
  );
};

export default Dashboard;
