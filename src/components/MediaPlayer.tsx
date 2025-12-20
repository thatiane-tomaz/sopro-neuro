import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, X, Headphones, Volume2 } from 'lucide-react';
import hypnosisImage from '@/assets/hypnosis-relaxed-man.jpg';

interface MediaPlayerProps {
  title: string;
  description?: string;
  fileUrl?: string;
  contentType: 'video' | 'hypnosis';
  interactionType?: string;
  onClose: () => void;
  onProgress?: (percentage: number) => void;
  onComplete?: () => void;
}

const MediaPlayer = ({ 
  title, 
  description, 
  fileUrl, 
  contentType, 
  interactionType,
  onClose,
  onProgress,
  onComplete 
}: MediaPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  console.log('MediaPlayer opened with:', { title, fileUrl, contentType, interactionType });

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    // Force playback rate to 1x and prevent changes
    const enforcePlaybackRate = () => {
      if (media.playbackRate !== 1) {
        media.playbackRate = 1;
      }
    };

    const updateTime = () => {
      setCurrentTime(media.currentTime);
      
      if (media.duration > 0) {
        const percentage = Math.floor((media.currentTime / media.duration) * 100);
        if (onProgress) {
          onProgress(percentage);
        }
        
        if (percentage >= 98 && onComplete) {
          onComplete();
        }
      }
    };
    
    const updateDuration = () => setDuration(media.duration);
    const handleError = (e: Event) => {
      console.error('Media error:', e);
      setError('Erro ao carregar o arquivo. Verifique se o arquivo existe no storage.');
    };
    const handleLoadStart = () => {
      console.log('Media load started for:', fileUrl);
      setError(null);
      // Ensure playback rate is 1x on load
      media.playbackRate = 1;
    };
    const handleCanPlay = () => {
      console.log('Media can play');
      // Ensure playback rate is 1x when ready
      media.playbackRate = 1;
    };
    const handleEnded = () => {
      setIsPlaying(false);
      if (onComplete) {
        onComplete();
      }
    };

    media.addEventListener('timeupdate', updateTime);
    media.addEventListener('loadedmetadata', updateDuration);
    media.addEventListener('ended', handleEnded);
    media.addEventListener('error', handleError);
    media.addEventListener('loadstart', handleLoadStart);
    media.addEventListener('canplay', handleCanPlay);
    media.addEventListener('ratechange', enforcePlaybackRate);

    // Initial enforcement
    media.playbackRate = 1;

    return () => {
      media.removeEventListener('timeupdate', updateTime);
      media.removeEventListener('loadedmetadata', updateDuration);
      media.removeEventListener('ended', handleEnded);
      media.removeEventListener('error', handleError);
      media.removeEventListener('loadstart', handleLoadStart);
      media.removeEventListener('canplay', handleCanPlay);
      media.removeEventListener('ratechange', enforcePlaybackRate);
    };
  }, [fileUrl, onProgress, onComplete]);

  const handlePlayPause = async () => {
    const media = mediaRef.current;
    if (!media) return;

    try {
      if (isPlaying) {
        media.pause();
        setIsPlaying(false);
      } else {
        await media.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing media:', error);
      setError('Erro ao reproduzir mídia. Tente novamente.');
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-gradient-to-br from-background via-background to-primary/5 rounded-3xl shadow-2xl shadow-primary/20 overflow-hidden border border-primary/10">
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              contentType === 'video' 
                ? 'bg-sky-100 dark:bg-sky-900/30' 
                : 'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              {contentType === 'video' ? (
                <Play className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              ) : (
                <Headphones className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              <p className="text-xs text-muted-foreground">
                {contentType === 'video' ? 'Vídeo' : 'Hipnose'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-primary/10 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Tips for hypnosis */}
          {contentType === 'hypnosis' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-200/50 dark:border-blue-800/30">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Dicas para melhor experiência
              </p>
              <ul className="text-sm text-blue-600/80 dark:text-blue-400/80 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium flex-shrink-0">1</span>
                  Utilize fones de ouvido
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium flex-shrink-0">2</span>
                  Deite-se ou sente-se confortavelmente
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium flex-shrink-0">3</span>
                  Escolha um local silencioso
                </li>
              </ul>
            </div>
          )}

          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 rounded-2xl p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {!fileUrl && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30 rounded-2xl p-4">
              <p className="text-sm text-amber-600 dark:text-amber-400">Arquivo não encontrado no storage</p>
            </div>
          )}
          
          {/* Media Player */}
          <div 
            className="rounded-2xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 border border-primary/5"
            onContextMenu={(e) => e.preventDefault()}
          >
            {contentType === 'video' ? (
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                className="w-full h-auto max-h-96"
                controls
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                crossOrigin="anonymous"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onContextMenu={(e) => e.preventDefault()}
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
              <div className="relative" onContextMenu={(e) => e.preventDefault()}>
                <audio
                  ref={mediaRef as React.RefObject<HTMLAudioElement>}
                  className="hidden"
                  controlsList="nodownload noplaybackrate"
                  crossOrigin="anonymous"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onContextMenu={(e) => e.preventDefault()}
                  onError={(e) => {
                    console.error('Audio error details:', e.currentTarget.error);
                    setError(`Erro no áudio: ${e.currentTarget.error?.message || 'Falha ao carregar'}`);
                  }}
                  onLoadStart={() => console.log('Audio load started:', fileUrl)}
                >
                  {fileUrl && <source src={fileUrl} type="audio/mpeg" />}
                  Seu navegador não suporta áudio HTML5.
                </audio>
                
                {/* Audio Player Visual */}
                <div className="relative aspect-video w-full" onContextMenu={(e) => e.preventDefault()}>
                  <img 
                    src={hypnosisImage} 
                    alt="Homem relaxando com fones de ouvido" 
                    className="w-full h-full object-cover select-none pointer-events-none"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-navy/20 to-transparent" />
                  
                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button 
                      onClick={handlePlayPause} 
                      size="lg"
                      className={`rounded-full w-20 h-20 shadow-2xl transition-all duration-300 ${
                        isPlaying 
                          ? 'bg-blue-600 hover:bg-blue-700 scale-90' 
                          : 'bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 hover:scale-110'
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="h-10 w-10 text-white" />
                      ) : (
                        <Play className="h-10 w-10 text-white ml-1" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                {duration > 0 && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 dark:from-blue-900/20 to-background">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-muted-foreground w-12 text-right">
                        {formatTime(currentTime)}
                      </span>
                      <div className="flex-1 h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground w-12">
                        {formatTime(duration)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;
