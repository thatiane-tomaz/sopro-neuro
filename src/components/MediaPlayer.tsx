import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, X } from 'lucide-react';

interface MediaPlayerProps {
  title: string;
  description?: string;
  fileUrl?: string;
  contentType: 'video' | 'hypnosis';
  onClose: () => void;
}

const MediaPlayer = ({ title, description, fileUrl, contentType, onClose }: MediaPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implementar controle real de mídia
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          
          <div className="bg-muted rounded-lg p-8 text-center">
            {contentType === 'video' ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary flex items-center justify-center">
                  <Play className="h-8 w-8 text-white" />
                </div>
                <p className="text-muted-foreground">
                  Player de vídeo será implementado aqui
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-accent flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-white" />
                </div>
                <p className="text-muted-foreground">
                  Player de áudio será implementado aqui
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <Button onClick={handlePlayPause} className="px-8">
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {contentType === 'video' ? 'Assistir' : 'Ouvir'}
                </>
              )}
            </Button>
          </div>

          {fileUrl && (
            <p className="text-xs text-muted-foreground text-center">
              URL: {fileUrl}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaPlayer;