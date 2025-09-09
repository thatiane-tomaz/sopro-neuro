import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Calendar, CheckCircle, Lock } from "lucide-react";

const Dashboard = () => {
  const [currentWeek] = useState(1);
  const [currentDay] = useState(3);
  const [showTimeline, setShowTimeline] = useState(false);
  const [completedToday] = useState({ video: false, hypnosis: false });

  const weekData = {
    1: {
      title: "Quebrando Crenças e Aprendendo",
      subtitle: "Continue fumando enquanto aprende",
      video: { title: "Neurociência do Vício", duration: "5 min" },
      hypnosis: { title: "Desconstruindo Mitos", duration: "10 min" }
    },
    2: {
      title: "O Momento de Parar",
      subtitle: "Hipnoses para enfrentar a abstinência",
      video: { title: "Preparação Mental", duration: "4 min" },
      hypnosis: { title: "Relaxamento Profundo", duration: "8 min" }
    },
    3: {
      title: "Novos Hábitos Saudáveis",
      subtitle: "Reprogramando seu estilo de vida",
      video: { title: "Atividade Física", duration: "6 min" },
      hypnosis: { title: "Motivação para Saúde", duration: "12 min" }
    }
  };

  const currentWeekData = weekData[currentWeek as keyof typeof weekData];
  const progressPercentage = (currentDay / 7) * 100;

  if (showTimeline) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card/50 backdrop-blur-sm sticky top-0 z-50 border-b">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setShowTimeline(false)}
                className="p-2"
              >
                ← Voltar
              </Button>
              <h1 className="text-lg font-semibold text-foreground">Linha do Tempo</h1>
              <div className="w-10"></div>
            </div>
          </div>
        </header>

        {/* Timeline Content */}
        <main className="px-4 py-6 space-y-6">
          {Object.entries(weekData).map(([week, data]) => (
            <Card key={week} className={`${parseInt(week) > currentWeek ? 'opacity-50' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Semana {week}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{data.title}</p>
                  </div>
                  {parseInt(week) > currentWeek ? (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <Play className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Vídeo Educacional</span>
                    </div>
                    <Badge variant="secondary">{data.video.duration}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <div className="h-4 w-4 rounded-full bg-accent" />
                      <span className="text-sm font-medium">Hipnose</span>
                    </div>
                    <Badge variant="secondary">{data.hypnosis.duration}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-primary rounded-md"></div>
              <h1 className="text-lg font-bold text-foreground">Sopro</h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowTimeline(true)}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Week Overview */}
        <div className="bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/15 rounded-3xl p-6 border border-primary/30">
          <div className="space-y-4">
            {/* Current Week Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold text-foreground">
                    Semana {currentWeek}
                  </h2>
                  <Badge variant="outline" className="bg-primary/20 border-primary/30 text-primary">
                    Dia {currentDay}/7
                  </Badge>
                </div>
                <Progress value={progressPercentage} className="h-3 w-32" />
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowTimeline(true)}
                className="rounded-full bg-accent/20 backdrop-blur-sm border border-accent/30 text-accent-foreground hover:bg-accent/30"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Ver timeline
              </Button>
            </div>
            
            {/* Week Description */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">
                {currentWeekData.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentWeek === 1 
                  ? "Nesta semana você vai aprender como a nicotina age no corpo e na mente. Os vídeos e hipnoses vão ajudar a quebrar as falsas crenças sobre o cigarro e aumentar sua confiança para mudar. Você pode continuar fumando nesta fase."
                  : currentWeekData.subtitle
                }
              </p>
            </div>
          </div>
        </div>


        {/* Daily Activities */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-foreground flex items-center">
            <span className="mr-2">🎯</span>
            Suas atividades hoje
          </h3>
          
          {/* Video Card */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-sm rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center shadow-lg">
                  <Play className="h-5 w-5 text-white fill-white" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground text-base">
                    {currentWeekData.video.title}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {currentWeekData.video.duration}
                    </span>
                  </div>
                </div>
              </div>
              {completedToday.video ? (
                <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-secondary" />
                </div>
              ) : (
                <Button size="sm" className="rounded-full px-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                  Assistir
                </Button>
              )}
            </div>
          </div>

          {/* Hypnosis Card */}
          <div className="bg-gradient-to-r from-accent/10 to-accent/5 backdrop-blur-sm rounded-2xl p-4 border border-accent/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent via-accent/90 to-secondary flex items-center justify-center shadow-lg">
                  <div className="w-6 h-6 rounded-full bg-white" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground text-base">
                    {currentWeekData.hypnosis.title}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {currentWeekData.hypnosis.duration}
                    </span>
                  </div>
                </div>
              </div>
              {completedToday.hypnosis ? (
                <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-secondary" />
                </div>
              ) : (
                <Button size="sm" variant="outline" className="rounded-full px-6 border-accent/30 hover:bg-accent/10">
                  Ouvir
                </Button>
              )}
            </div>
          </div>
        </div>


        <Button 
          className="w-full h-14 rounded-2xl text-base font-medium bg-gradient-to-r from-secondary via-accent to-primary hover:from-secondary/90 hover:via-accent/90 hover:to-primary/90 shadow-lg" 
          disabled={!(completedToday.video && completedToday.hypnosis)}
        >
          {completedToday.video && completedToday.hypnosis ? 
            "✅ Finalizar Dia" : 
            "Complete as atividades para finalizar"
          }
        </Button>
      </main>
    </div>
  );
};

export default Dashboard;