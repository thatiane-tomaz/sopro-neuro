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
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Hipnoses para Gatilhos
            </h1>
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-border p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Headphones className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Como usar</h3>
                <p className="text-sm text-muted-foreground">
                  Estas hipnoses podem ser usadas em momentos de desejo intenso ou antes de alguma situação que pode ser um gatilho
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Triggers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {triggers?.map((trigger) => (
            <Card
              key={trigger.id}
              className="overflow-hidden border-border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group"
            >
              <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Headphones className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {trigger.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {trigger.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  {trigger.duration_minutes && (
                    <span className="text-xs font-medium text-muted-foreground">
                      {trigger.duration_minutes} min
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() =>
                      setSelectedMedia({
                        title: trigger.title,
                        fileUrl: getMediaUrl(trigger.file_name),
                        contentType: 'hypnosis',
                      })
                    }
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Ouvir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tips Section */}
        <Card className="mt-8 bg-primary/5 border-primary/20 p-6">
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
