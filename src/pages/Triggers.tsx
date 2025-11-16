import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Headphones, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MediaPlayer from '@/components/MediaPlayer';
import { useTriggersContent } from '@/hooks/useTriggersContent';

const Triggers = () => {
  const navigate = useNavigate();
  const { data: triggers, isLoading } = useTriggersContent();
  const [selectedMedia, setSelectedMedia] = useState<{
    title: string;
    fileUrl: string;
    contentType: 'hypnosis';
  } | null>(null);

  const getMediaUrl = (fileName: string) => {
    return `https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis/${fileName}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>

          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Seus primeiros dias de liberdade</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Apoio para Ex-Fumantes
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Ferramentas de suporte imediato para quando você sentir vontade de fumar. 
              Use quantas vezes precisar durante sua transformação.
            </p>
          </div>

          <Card className="bg-gradient-to-br from-primary/5 via-card/50 to-card/30 backdrop-blur-sm border-primary/20 p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Headphones className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-2">Seu Kit de Emergência Emocional</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nos primeiros dias sem cigarro, é normal sentir vontade ou enfrentar situações desafiadoras. 
                  Estas hipnoses são seu apoio instantâneo - escute sempre que precisar se fortalecer ou acalmar um momento de tensão.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Triggers Grid */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">Ferramentas Disponíveis</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Escolha a hipnose que melhor se encaixa no seu momento atual
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {triggers?.map((trigger, index) => (
            <Card
              key={trigger.id}
              className="overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-accent/20 backdrop-blur-sm hover:shadow-2xl hover:border-primary/30 transition-all duration-500 group relative"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
              
              <div className="p-6 relative">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300 shadow-md">
                    <Headphones className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {trigger.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {trigger.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/30">
                  {trigger.duration_minutes && (
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-sm font-semibold text-foreground">
                        {trigger.duration_minutes} minutos
                      </span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="ml-auto bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 hover:border-primary transition-all duration-300 shadow-sm hover:shadow-md"
                    onClick={() =>
                      setSelectedMedia({
                        title: trigger.title,
                        fileUrl: getMediaUrl(trigger.file_name),
                        contentType: 'hypnosis',
                      })
                    }
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar agora
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tips Section */}
        <Card className="mt-10 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-primary/30 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <span className="text-2xl">💪</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              Maximize Seus Resultados
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-lg">🎧</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Use fones de ouvido</h4>
                <p className="text-sm text-muted-foreground">Para melhor imersão e eficácia</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-lg">🔄</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Repita sem limites</h4>
                <p className="text-sm text-muted-foreground">Ouça quantas vezes precisar ao longo do dia</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-lg">🧘</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Ambiente tranquilo</h4>
                <p className="text-sm text-muted-foreground">Busque um local onde não será interrompido</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-lg">⚡</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Ação imediata</h4>
                <p className="text-sm text-muted-foreground">Ao sentir vontade, não espere - escute agora</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30">
            <p className="text-sm text-foreground/90 leading-relaxed">
              <span className="font-bold">Lembre-se:</span> Cada momento de vontade que você supera te fortalece. 
              Estas ferramentas estão aqui para te apoiar em cada passo da sua jornada como ex-fumante.
            </p>
          </div>
        </Card>
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

export default Triggers;
