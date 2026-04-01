import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, X, Headphones, Volume2, Sofa, VolumeX, BellOff, BatteryCharging } from 'lucide-react';
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
  onCloseWithProgress?: (percentage: number) => void;
}

const MediaPlayer = ({ 
  title, 
  description, 
  fileUrl, 
  contentType, 
  interactionType,
  onClose,
  onProgress,
  onComplete,
  onCloseWithProgress
}: MediaPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  
  // Store callbacks in refs to avoid dependency issues
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);
  const onCloseWithProgressRef = useRef(onCloseWithProgress);
  
  // Throttle progress updates to prevent excessive database calls
  const lastProgressUpdateRef = useRef<number>(0);
  const lastReportedPercentageRef = useRef<number>(0);
  
  // Retry logic for network errors - silent recovery, user never sees error during retries
  const retryCountRef = useRef(0);
  const maxRetries = 10;
  const savedTimeRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    onProgressRef.current = onProgress;
    onCompleteRef.current = onComplete;
  }, [onProgress, onComplete]);

  console.log('MediaPlayer opened with:', { title, fileUrl, contentType, interactionType });
  
  // Handle visibility change (screen lock, app backgrounding)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const media = mediaRef.current;
      if (!media) return;
      
      if (document.hidden) {
        // App went to background - try to keep audio playing for hypnosis
        console.log('App backgrounded, media playing:', !media.paused);
      } else {
        // App came back to foreground - sync UI state
        console.log('App foregrounded, media playing:', !media.paused);
        setIsPlaying(!media.paused);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    let isMounted = true;

    // Force playback rate to 1x and prevent changes
    const enforcePlaybackRate = () => {
      if (media.playbackRate !== 1) {
        media.playbackRate = 1;
      }
    };

    const updateTime = () => {
      if (!isMounted) return;
      
      try {
        const currentMediaTime = media.currentTime;
        // Save time for recovery
        if (currentMediaTime > 0) savedTimeRef.current = currentMediaTime;
        const mediaDuration = media.duration;
        
        setCurrentTime(currentMediaTime);
        
        if (mediaDuration > 0 && isFinite(mediaDuration)) {
          const percentage = Math.floor((currentMediaTime / mediaDuration) * 100);
          const now = Date.now();
          
          // Throttle progress updates: only update if 3+ seconds passed AND percentage changed by 2+
          const timeSinceLastUpdate = now - lastProgressUpdateRef.current;
          const percentageChange = Math.abs(percentage - lastReportedPercentageRef.current);
          
          if (onProgressRef.current && (timeSinceLastUpdate >= 3000 && percentageChange >= 2)) {
            lastProgressUpdateRef.current = now;
            lastReportedPercentageRef.current = percentage;
            onProgressRef.current(percentage);
          }
          
          // Completion check - trigger at 85% to match DB trigger
          if (percentage >= 85 && !hasCompleted && onCompleteRef.current) {
            setHasCompleted(true);
            onCompleteRef.current();
          }
        }
      } catch (error) {
        console.error('Error in updateTime:', error);
      }
    };
    
    const updateDuration = () => {
      if (isMounted) setDuration(media.duration);
    };
    
    const handleError = (e: Event) => {
      const mediaEl = e.target as HTMLMediaElement;
      const mediaError = mediaEl?.error;
      console.error('Media error details:', {
        code: mediaError?.code,
        message: mediaError?.message,
        networkState: mediaEl?.networkState,
        readyState: mediaEl?.readyState,
        src: mediaEl?.currentSrc || mediaEl?.src,
        retryCount: retryCountRef.current,
      });
      if (!isMounted) return;
      
      // Silent auto-retry - user never sees error during retries
      // This is critical for hypnosis sessions where interruption ruins the experience
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const delay = Math.min(1000 * retryCountRef.current, 5000);
        console.log(`Silent retry ${retryCountRef.current}/${maxRetries} in ${delay}ms from ${savedTimeRef.current}s`);
        
        // Clear any previous retry timeout
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        
        retryTimeoutRef.current = setTimeout(() => {
          if (!isMounted || !media) return;
          const resumeTime = savedTimeRef.current;
          media.load();
          media.addEventListener('canplay', function onRetryCanPlay() {
            media.removeEventListener('canplay', onRetryCanPlay);
            if (resumeTime > 0) media.currentTime = resumeTime;
            media.play().catch(err => console.error('Retry play failed:', err));
          }, { once: true });
        }, delay);
      } else {
        // Only show error after all retries exhausted
        setError('Erro de conexão. Feche e abra novamente para continuar.');
      }
    };
    
    const handleLoadStart = () => {
      console.log('Media load started for:', fileUrl);
      if (isMounted) {
        setError(null);
        // Ensure playback rate is 1x on load
        media.playbackRate = 1;
      }
    };
    
    const handleCanPlay = () => {
      console.log('Media can play');
      // Ensure playback rate is 1x when ready
      media.playbackRate = 1;
    };
    
    const handleEnded = () => {
      if (!isMounted) return;
      setIsPlaying(false);
      if (!hasCompleted && onCompleteRef.current) {
        setHasCompleted(true);
        onCompleteRef.current();
      }
    };
    
    // Handle stalling (network issues, buffering)
    const handleStalled = () => {
      console.log('Media stalled - waiting for data');
    };
    
    const handleWaiting = () => {
      console.log('Media waiting for data');
    };
    
    // Handle when media resumes after stalling
    const handlePlaying = () => {
      if (isMounted) {
        console.log('Media resumed playing');
        setIsPlaying(true);
        setError(null); // Clear any previous error on successful playback
        retryCountRef.current = 0; // Reset retry counter on success
      }
    };
    
    // Handle unexpected pause (e.g., audio interruption on mobile)
    const handlePause = () => {
      if (isMounted) {
        console.log('Media paused');
        setIsPlaying(false);
      }
    };

    media.addEventListener('timeupdate', updateTime);
    media.addEventListener('loadedmetadata', updateDuration);
    media.addEventListener('ended', handleEnded);
    media.addEventListener('error', handleError);
    media.addEventListener('loadstart', handleLoadStart);
    media.addEventListener('canplay', handleCanPlay);
    media.addEventListener('ratechange', enforcePlaybackRate);
    media.addEventListener('stalled', handleStalled);
    media.addEventListener('waiting', handleWaiting);
    media.addEventListener('playing', handlePlaying);
    media.addEventListener('pause', handlePause);

    // Initial enforcement
    media.playbackRate = 1;

    return () => {
      isMounted = false;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      media.removeEventListener('timeupdate', updateTime);
      media.removeEventListener('loadedmetadata', updateDuration);
      media.removeEventListener('ended', handleEnded);
      media.removeEventListener('error', handleError);
      media.removeEventListener('loadstart', handleLoadStart);
      media.removeEventListener('canplay', handleCanPlay);
      media.removeEventListener('ratechange', enforcePlaybackRate);
      media.removeEventListener('stalled', handleStalled);
      media.removeEventListener('waiting', handleWaiting);
      media.removeEventListener('playing', handlePlaying);
      media.removeEventListener('pause', handlePause);
    };
  }, [fileUrl, hasCompleted]);

  const handlePlayPause = async () => {
    const media = mediaRef.current;
    if (!media) return;

    try {
      if (isPlaying) {
        media.pause();
        // State will be updated by pause event handler
      } else {
        // Reset any previous error before attempting to play
        setError(null);
        
        // Check if media is ready to play
        if (media.readyState < 2) {
          console.log('Media not ready, waiting...');
          // Wait for media to be ready
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Timeout waiting for media'));
            }, 10000);
            
            const onCanPlay = () => {
              clearTimeout(timeout);
              media.removeEventListener('canplay', onCanPlay);
              media.removeEventListener('error', onError);
              resolve();
            };
            
            const onError = () => {
              clearTimeout(timeout);
              media.removeEventListener('canplay', onCanPlay);
              media.removeEventListener('error', onError);
              reject(new Error('Media load error'));
            };
            
            media.addEventListener('canplay', onCanPlay);
            media.addEventListener('error', onError);
          });
        }
        
        await media.play();
        // State will be updated by playing event handler
      }
    } catch (error: any) {
      console.error('Error playing media:', error);
      // Don't show error for AbortError (user interrupted)
      if (error?.name !== 'AbortError') {
        setError('Erro ao reproduzir mídia. Verifique sua conexão e tente novamente.');
      }
      setIsPlaying(false);
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
                : 'bg-navy/10 dark:bg-navy/30'
            }`}>
              {contentType === 'video' ? (
                <Play className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              ) : (
                <Headphones className="h-5 w-5 text-navy dark:text-navy-foreground" />
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
              className="rounded-full hover:bg-primary/10 text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px]"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Tips for hypnosis */}
          {contentType === 'hypnosis' && (
            <div className="bg-navy/5 dark:bg-navy/20 p-4 rounded-2xl border border-navy/10 dark:border-navy/30">
              <p className="text-sm font-medium text-navy dark:text-navy-foreground mb-3 flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Dicas para melhor experiência
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-white/60 dark:bg-white/5 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-navy/10 dark:bg-navy/30 flex items-center justify-center flex-shrink-0">
                    <Sofa className="h-4 w-4 text-navy dark:text-navy-foreground" />
                  </div>
                  <span className="text-sm text-navy/80 dark:text-navy-foreground/80">Deite-se ou sente-se confortavelmente</span>
                </div>
                <div className="flex items-center gap-3 bg-white/60 dark:bg-white/5 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-navy/10 dark:bg-navy/30 flex items-center justify-center flex-shrink-0">
                    <Headphones className="h-4 w-4 text-navy dark:text-navy-foreground" />
                  </div>
                  <span className="text-sm text-navy/80 dark:text-navy-foreground/80">Local silencioso + fones de ouvido</span>
                </div>
                <div className="flex items-center gap-3 bg-white/60 dark:bg-white/5 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-navy/10 dark:bg-navy/30 flex items-center justify-center flex-shrink-0">
                    <BellOff className="h-4 w-4 text-navy dark:text-navy-foreground" />
                  </div>
                  <span className="text-sm text-navy/80 dark:text-navy-foreground/80">Ative o modo "Não Perturbe"</span>
                </div>
                <div className="flex items-center gap-3 bg-white/60 dark:bg-white/5 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-navy/10 dark:bg-navy/30 flex items-center justify-center flex-shrink-0">
                    <BatteryCharging className="h-4 w-4 text-navy dark:text-navy-foreground" />
                  </div>
                  <span className="text-sm text-navy/80 dark:text-navy-foreground/80">Desative o modo "Economia de Bateria"</span>
                </div>
              </div>
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
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onContextMenu={(e) => e.preventDefault()}
                onError={(e) => {
                  const err = e.currentTarget.error;
                  console.error('Video inline error:', { code: err?.code, message: err?.message, src: e.currentTarget.currentSrc });
                  // Don't set error here - let the useEffect handleError manage retries
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
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onContextMenu={(e) => e.preventDefault()}
                  onError={(e) => {
                    const err = e.currentTarget.error;
                    console.error('Audio inline error:', { code: err?.code, message: err?.message, src: e.currentTarget.currentSrc });
                    // Don't set error here - let the useEffect handleError manage retries
                    // setError will only be shown after all retries fail
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
                          ? 'bg-navy hover:bg-navy/90 scale-90' 
                          : 'bg-gradient-to-br from-navy/90 to-navy hover:from-navy hover:to-navy/80 hover:scale-110'
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
                  <div className="p-4 bg-gradient-to-r from-navy/5 dark:from-navy/20 to-background">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-muted-foreground w-12 text-right">
                        {formatTime(currentTime)}
                      </span>
                      <div className="flex-1 h-2 bg-navy/10 dark:bg-navy/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-navy/80 to-navy rounded-full transition-all duration-300"
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
