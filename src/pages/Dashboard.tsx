import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Route, CheckCircle, Lock, Crown, Headphones } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useDailyTexts } from "@/hooks/useDailyTexts";
import { ContentAccessWrapper } from "@/components/upgrade/UpgradeCard";
import UpgradeCard from "@/components/upgrade/UpgradeCard";
import MediaPlayer from "@/components/MediaPlayer";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import videoCalmMan from "@/assets/video-calm-man-dark.jpg";
import hypnosisWomanHeadphones from "@/assets/hypnosis-woman-headphones.jpg";
import soproLogo from "@/assets/sopro-logo.png";

const Dashboard = () => {
  const [currentWeek] = useState(1);
  const [currentDay] = useState(1);
  const [showTimeline, setShowTimeline] = useState(false);
  const [completedToday] = useState({
    video: false,
    hypnosis: false
  });
  const [selectedMedia, setSelectedMedia] = useState<{
    title: string;
    description?: string;
    fileUrl?: string;
    contentType: 'video' | 'hypnosis';
  } | null>(null);

  // Função para gerar URL do arquivo no Supabase Storage
  const getMediaUrl = (day: number, type: 'video' | 'hypnosis') => {
    const bucketName = type === 'video' ? 'videos' : 'hypnosis';
    const fileName = type === 'video' ? `video_${day}.mp4` : `hipnose_${day}.mp3`;
    return `${supabase.storage.from(bucketName).getPublicUrl(fileName).data.publicUrl}`;
  };
  
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, isFree, isPremium } = useUserProfile();
  const { texts, loading: textsLoading } = useDailyTexts(currentDay);

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (authLoading || profileLoading || textsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  const weekData = {
    1: {
      title: "Quebrando Crenças e Aprendendo",
      subtitle: "Continue fumando enquanto aprende",
      video: {
        title: "Neurociência do Vício",
        duration: "5 min"
      },
      hypnosis: {
        title: "Desconstruindo Mitos",
        duration: "10 min"
      }
    },
    2: {
      title: "O Momento de Parar",
      subtitle: "Hipnoses para enfrentar a abstinência",
      video: {
        title: "Preparação Mental",
        duration: "4 min"
      },
      hypnosis: {
        title: "Relaxamento Profundo",
        duration: "8 min"
      }
    },
    3: {
      title: "Novos Hábitos Saudáveis",
      subtitle: "Reprogramando seu estilo de vida",
      video: {
        title: "Atividade Física",
        duration: "6 min"
      },
      hypnosis: {
        title: "Motivação para Saúde",
        duration: "12 min"
      }
    }
  };

  const currentWeekData = weekData[currentWeek as keyof typeof weekData];

  if (showTimeline) {
    const phases = [
      {
        id: 1,
        title: "Fase 1",
        subtitle: "Quebrando Crenças e Aprendendo",
        description: "Continue fumando enquanto aprende sobre o vício e quebra crenças limitantes.",
        days: [1, 2, 3, 4, 5, 6, 7]
      },
      {
        id: 2,
        title: "Fase 2", 
        subtitle: "O Momento de Parar",
        description: "Hipnoses e técnicas para enfrentar a abstinência e o processo de parar.",
        days: [8, 9, 10, 11, 12, 13, 14]
      },
      {
        id: 3,
        title: "Fase 3",
        subtitle: "Novos Hábitos Saudáveis", 
        description: "Reprogramando seu estilo de vida com novos hábitos e rotinas saudáveis.",
        days: [15, 16, 17, 18, 19, 20, 21]
      }
    ];

    const getDayStatus = (day: number) => {
      if (day < currentDay) return 'completed';
      if (day === currentDay) return 'current';
      return 'locked';
    };

    const getDayTitle = (day: number) => {
      const titles = {
        // Fase 1: Quebrando Crenças e Aprendendo
        1: "Preparação Mental",
        2: "Entendendo o Vício", 
        3: "Quebrando Padrões",
        4: "Identificando Gatilhos",
        5: "Neurociência do Tabaco",
        6: "Mitos e Verdades",
        7: "Motivação Interna",
        
        // Fase 2: O Momento de Parar
        8: "Dia da Decisão",
        9: "Primeiras 24h",
        10: "Enfrentando a Abstinência",
        11: "Controle da Ansiedade",
        12: "Resistindo às Tentações",
        13: "Fortalecendo a Mente",
        14: "Primeira Semana Livre",
        
        // Fase 3: Novos Hábitos Saudáveis
        15: "Construindo Rotinas",
        16: "Exercícios e Movimento",
        17: "Alimentação Consciente",
        18: "Relacionamentos Saudáveis",
        19: "Gerenciando o Estresse",
        20: "Autoestima e Confiança",
        21: "Consolidação e Futuro"
      };
      return titles[day as keyof typeof titles] || `Dia ${day}`;
    };

    const getDayDescription = (day: number) => {
      const descriptions = {
        // Fase 1
        1: "Prepare sua mente para a jornada de transformação que está começando.",
        2: "Compreenda como funciona o vício e por que é difícil parar de fumar.",
        3: "Identifique e quebre os padrões automáticos que te fazem fumar.",
        4: "Reconheça os gatilhos emocionais e situacionais que levam ao cigarro.",
        5: "Entenda o que acontece no seu cérebro quando você fuma.",
        6: "Desconstrua mitos sobre o cigarro e enxergue a realidade.",
        7: "Encontre sua motivação verdadeira para parar de fumar.",
        
        // Fase 2
        8: "O momento chegou! Técnicas para tomar a decisão definitiva.",
        9: "Estratégias para superar as primeiras 24 horas sem cigarro.",
        10: "Aprenda a lidar com os sintomas físicos da abstinência.",
        11: "Técnicas de respiração e relaxamento para controlar a ansiedade.",
        12: "Fortaleça sua resistência contra as tentações e recaídas.",
        13: "Desenvolva força mental e determinação para continuar.",
        14: "Celebre sua primeira semana livre do cigarro.",
        
        // Fase 3
        15: "Estabeleça novas rotinas saudáveis em seu dia a dia.",
        16: "Incorpore atividades físicas para fortalecer corpo e mente.",
        17: "Desenvolva uma relação saudável com a comida e nutrição.",
        18: "Melhore seus relacionamentos e comunicação interpessoal.",
        19: "Aprenda técnicas avançadas de gerenciamento do estresse.",
        20: "Construa uma autoestima sólida e confiança em si mesmo.",
        21: "Consolide sua nova identidade e planeje seu futuro livre."
      };
      return descriptions[day as keyof typeof descriptions] || "Descrição do dia será carregada em breve.";
    };

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card/50 backdrop-blur-sm sticky top-0 z-50 border-b">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setShowTimeline(false)} className="p-2">
                ← Voltar
              </Button>
              <h1 className="text-lg font-semibold text-foreground">Caminho do Processo</h1>
              <div className="w-10"></div>
            </div>
          </div>
        </header>

        {/* Process Path Content */}
        <main className="px-4 py-6 space-y-8">
          {phases.map((phase) => (
            <div key={phase.id} className="space-y-4">
              {/* Phase Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    phase.id <= Math.ceil(currentDay / 7) 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {phase.id}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">{phase.title}</h2>
                    <p className="text-sm font-medium text-primary">{phase.subtitle}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed ml-11">
                  {phase.description}
                </p>
              </div>

              {/* Days Grid */}
              <div className="grid gap-4 ml-11">
                {phase.days.map((day) => {
                  const status = getDayStatus(day);
                  const isAccessible = status === 'completed' || status === 'current';
                  
                  return (
                    <Card key={day} className={`transition-all duration-200 ${
                      status === 'locked' ? 'opacity-50' : 'hover:shadow-md'
                    }`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Day Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                status === 'completed' ? 'bg-secondary text-secondary-foreground' :
                                status === 'current' ? 'bg-primary text-primary-foreground' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {day}
                              </div>
                              <div>
                                <h3 className="font-medium text-foreground">{getDayTitle(day)}</h3>
                                <p className="text-xs text-muted-foreground">Dia {day}</p>
                              </div>
                            </div>
                            {status === 'completed' && <CheckCircle className="h-4 w-4 text-secondary" />}
                            {status === 'locked' && <Lock className="h-4 w-4 text-muted-foreground" />}
                          </div>

                          {/* Day Description */}
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {getDayDescription(day)}
                          </p>

                          {/* Action Buttons */}
                          {isAccessible && (
                            <div className="flex gap-2 pt-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 h-8 text-xs"
                                onClick={() => {
                                  setShowTimeline(false);
                                  setSelectedMedia({
                                    title: `Vídeo - ${getDayTitle(day)}`,
                                    fileUrl: getMediaUrl(day, 'video'),
                                    contentType: 'video'
                                  });
                                }}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Vídeo
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 h-8 text-xs"
                                onClick={() => {
                                  setShowTimeline(false);
                                  setSelectedMedia({
                                    title: `Hipnose - ${getDayTitle(day)}`,
                                    fileUrl: getMediaUrl(day, 'hypnosis'),
                                    contentType: 'hypnosis'
                                  });
                                }}
                              >
                                <div className="w-3 h-3 rounded-full bg-accent mr-1" />
                                Hipnose
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-sm sticky top-0 z-50 border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={soproLogo} alt="Sopro" className="h-8" />
              {isFree && (
                <Badge variant="secondary" className="text-xs self-center">
                  Acesso Gratuito
                </Badge>
              )}
              {isPremium && (
                <Badge className="text-xs bg-accent self-center">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowTimeline(true)}>
              <Route className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">

        {/* Week Overview */}
        <div className="bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/15 rounded-3xl p-6 border border-primary/30">
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <div className="space-y-3 flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1">
                  <span className="text-xs font-medium text-primary">Fase {currentWeek}</span>
                  <span className="h-1 w-1 rounded-full bg-primary/40" />
                  <span className="text-xs font-medium text-primary">Dia {currentDay}/7</span>
                </div>
                {/* Segmented progress - clean and subtle */}
                <div className="flex items-center gap-1.5" aria-label={`Progresso do dia: ${currentDay} de 7`}>
                  {[...Array(7)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 w-6 rounded-full transition-colors ${
                        i < currentDay ? 'bg-primary' : 'bg-muted'
                      }`} 
                    />
                  ))}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowTimeline(true)} 
                className="rounded-full bg-accent/20 backdrop-blur-sm border border-accent/30 text-accent-foreground hover:bg-accent/30 flex-shrink-0 px-2 text-xs"
              >
                <Route className="h-3 w-3 mr-1" />
                <span>Processo</span>
              </Button>
            </div>
            
            {/* Fase Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {texts.fase_descricao || "Carregando descrição da fase..."}
            </p>
          </div>
        </div>

        {/* Daily Activities Card */}
        <div className="bg-gradient-to-br from-card/80 via-card to-card/90 rounded-3xl p-6 border border-border/50 shadow-lg">
          <div className="space-y-6">
            {/* Dia Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">Sua Conquista de Hoje</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {texts.dia_descricao || "Carregando atividades do dia..."}
              </p>
            </div>
            
            {/* Video Card */}
            <ContentAccessWrapper day={currentDay} contentType="video" contentId={`video_week_${currentWeek}_day_${currentDay}`}>
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-sm rounded-2xl border border-primary/20 overflow-hidden">
                {/* Video Image - Larger */}
                <div className="relative w-full h-40 overflow-hidden cursor-pointer group"
                     onClick={() => setSelectedMedia({
                       title: 'Vídeo de Preparação',
                       description: undefined,
                       fileUrl: getMediaUrl(currentDay, 'video'),
                       contentType: 'video'
                     })}>
                  <img 
                    src={videoCalmMan} 
                    alt="Vídeo de Preparação" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="h-6 w-6 text-primary fill-primary ml-1" />
                    </div>
                  </div>
                </div>
                
                {/* Bottom Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                       <h3 className="text-sm font-medium text-foreground mb-1">
                        Vídeo de Preparação
                       </h3>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {texts.video_duracao ? `${texts.video_duracao} min` : '3 min'}
                        </span>
                      </div>
                    </div>
                    
                    {completedToday.video ? (
                      <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-secondary" />
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        className="rounded-full px-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                         onClick={() => setSelectedMedia({
                          title: 'Vídeo de Preparação',
                          description: undefined,
                          fileUrl: getMediaUrl(currentDay, 'video'),
                          contentType: 'video'
                        })}
                      >
                        Assistir
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </ContentAccessWrapper>

            {/* Hypnosis Card */}
            <ContentAccessWrapper day={currentDay} contentType="hypnosis" contentId={`hypnosis_week_${currentWeek}_day_${currentDay}`}>
              <div className="bg-gradient-to-r from-accent/10 to-accent/5 backdrop-blur-sm rounded-2xl border border-accent/20 overflow-hidden">
                {/* Hypnosis Image - Larger */}
                <div className="relative w-full h-40 overflow-hidden cursor-pointer group"
                     onClick={() => setSelectedMedia({
                       title: 'Hipnose Terapêutica',
                       description: undefined,
                       fileUrl: getMediaUrl(currentDay, 'hypnosis'),
                       contentType: 'hypnosis'
                     })}>
                  <img 
                    src={hypnosisWomanHeadphones} 
                    alt="Hipnose Terapêutica" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Headphones className="h-6 w-6 text-accent" />
                    </div>
                  </div>
                </div>
                
                {/* Bottom Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-foreground mb-1">
                        Hipnose Terapêutica
                      </h3>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {texts.hipnose_duracao ? `${texts.hipnose_duracao} min` : '10 min'}
                        </span>
                      </div>
                    </div>
                    
                    {completedToday.hypnosis ? (
                      <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-secondary" />
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-full px-4 border-accent/30 hover:bg-accent/10"
                        onClick={() => setSelectedMedia({
                          title: 'Hipnose Terapêutica',
                          description: undefined,
                          fileUrl: getMediaUrl(currentDay, 'hypnosis'),
                          contentType: 'hypnosis'
                        })}
                      >
                        Ouvir
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </ContentAccessWrapper>
            
            {/* Completion Message */}
            {completedToday.video && completedToday.hypnosis && (
              <div className="bg-gradient-to-r from-secondary/20 to-primary/20 rounded-2xl p-4 border border-secondary/30 text-center">
                <p className="text-foreground font-medium">🎉 Parabéns, você completou a conquista de Hoje</p>
              </div>
            )}
          </div>
        </div>

        {/* Free Trial Message for Free Users */}
        {isFree && (
          <div className="bg-gradient-to-r from-accent/10 to-primary/10 backdrop-blur-sm rounded-2xl p-6 border border-accent/30 text-center">
            <p className="text-foreground font-medium">
              Você tem 2 dias liberados para experimentar. Aproveite cada momento!
            </p>
          </div>
        )}

        {/* Upgrade Card for Free Users - Moved to bottom */}
        {isFree && (
          <UpgradeCard onUpgrade={() => console.log('Upgrade clicked')} />
        )}
      </main>

      {/* Media Player Modal */}
      {selectedMedia && (
        <MediaPlayer
          title={selectedMedia.title}
          description={selectedMedia.description}
          fileUrl={selectedMedia.fileUrl}
          contentType={selectedMedia.contentType}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;