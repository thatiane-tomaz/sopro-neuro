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
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const updateTime = () => setCurrentTime(media.currentTime);
    const updateDuration = () => setDuration(media.duration);

    media.addEventListener('timeupdate', updateTime);
    media.addEventListener('loadedmetadata', updateDuration);
    media.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      media.removeEventListener('timeupdate', updateTime);
      media.removeEventListener('loadedmetadata', updateDuration);
      media.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, []);

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
          
          <div className="bg-muted rounded-lg overflow-hidden">
            {contentType === 'video' ? (
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                className="w-full h-auto max-h-96"
                controls
                src={fileUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                Seu navegador não suporta vídeo HTML5.
              </video>
            ) : (
              <div className="p-8">
                <audio
                  ref={mediaRef as React.RefObject<HTMLAudioElement>}
                  className="w-full"
                  controls
                  src={fileUrl}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                >
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