import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, X, Volume2 } from 'lucide-react';

interface MediaPlayerProps {
  title: string;
  description?: string;
  fileUrl?: string;
  contentType: 'video' | 'hypnosis';
  onClose: () => void;
}

const MediaPlayer = ({ title, description, fileUrl, contentType, onClose }: MediaPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  console.log('MediaPlayer opened with:', { title, fileUrl, contentType });

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const updateTime = () => setCurrentTime(media.currentTime);
    const updateDuration = () => setDuration(media.duration);
    const handleError = (e: Event) => {
      console.error('Media error:', e);
      setError('Erro ao carregar o arquivo. Verifique se o arquivo existe no storage.');
    };
    const handleLoadStart = () => {
      console.log('Media load started for:', fileUrl);
      setError(null);
    };
    const handleCanPlay = () => {
      console.log('Media can play');
    };

    media.addEventListener('timeupdate', updateTime);
    media.addEventListener('loadedmetadata', updateDuration);
    media.addEventListener('ended', () => setIsPlaying(false));
    media.addEventListener('error', handleError);
    media.addEventListener('loadstart', handleLoadStart);
    media.addEventListener('canplay', handleCanPlay);

    return () => {
      media.removeEventListener('timeupdate', updateTime);
      media.removeEventListener('loadedmetadata', updateDuration);
      media.removeEventListener('ended', () => setIsPlaying(false));
      media.removeEventListener('error', handleError);
      media.removeEventListener('loadstart', handleLoadStart);
      media.removeEventListener('canplay', handleCanPlay);
    };
  }, [fileUrl]);

  const handlePlayPause = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
          
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!fileUrl && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
              <p className="text-sm text-warning">Arquivo não encontrado no storage</p>
            </div>
          )}
          
          <div className="bg-muted rounded-lg overflow-hidden">
            {contentType === 'video' ? (
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                className="w-full h-auto max-h-96"
                controls
                crossOrigin="anonymous"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={(e) => {
                  console.error('Video error details:', e.currentTarget.error);
                  setError(`Erro no vídeo: ${e.currentTarget.error?.message || 'Falha ao carregar'}`);
                }}
                onLoadStart={() => console.log('Video load started:', fileUrl)}
              >
                {fileUrl && <source src={fileUrl} type="video/mp4" />}
                Seu navegador não suporta vídeo HTML5.
              </video>
            ) : (
              <div className="p-8">
                <audio
                  ref={mediaRef as React.RefObject<HTMLAudioElement>}
                  className="w-full"
                  controls
                  crossOrigin="anonymous"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={(e) => {
                    console.error('Audio error details:', e.currentTarget.error);
                    setError(`Erro no áudio: ${e.currentTarget.error?.message || 'Falha ao carregar'}`);
                  }}
                  onLoadStart={() => console.log('Audio load started:', fileUrl)}
                >
                  {fileUrl && <source src={fileUrl} type="audio/mpeg" />}
                  Seu navegador não suporta áudio HTML5.
                </audio>
                <div className="mt-4 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-accent flex items-center justify-center mb-4">
                    <Volume2 className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {duration > 0 && (
                      <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {fileUrl && <span>URL: {fileUrl}</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-4">
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