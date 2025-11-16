import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-8 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-12 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">Primeiros dias</span>
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Apoio Imediato
          </h1>
          
          <p className="text-muted-foreground">
            Use sempre que sentir vontade de fumar
          </p>
        </div>

        <div className="grid gap-4 mb-12">
          {triggers?.map((trigger, index) => (
            <Card
              key={trigger.id}
              className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-border/50"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-6 flex items-center gap-6">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {trigger.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {trigger.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  {trigger.duration_minutes && (
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {trigger.duration_minutes} min
                    </span>
                  )}
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() =>
                      setSelectedMedia({
                        title: trigger.title,
                        fileUrl: getMediaUrl(trigger.file_name),
                        contentType: 'hypnosis',
                      })
                    }
                  >
                    <Play className="h-4 w-4" />
                    Ouvir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="bg-muted/50 border-border/50">
          <div className="p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <span className="text-lg">🎧</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Use fones</p>
                  <p className="text-xs text-muted-foreground">Melhor experiência</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-lg">🔄</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Sem limites</p>
                  <p className="text-xs text-muted-foreground">Quantas vezes precisar</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-lg">🧘</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Local calmo</p>
                  <p className="text-xs text-muted-foreground">Sem interrupções</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-lg">⚡</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Aja agora</p>
                  <p className="text-xs text-muted-foreground">Ao sentir vontade</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

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
