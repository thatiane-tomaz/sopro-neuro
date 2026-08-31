import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Play, Pause, X, Headphones, Sofa, BellOff, BatteryCharging, Loader2, RotateCcw, RotateCw } from 'lucide-react';
import { useScrollLock } from '@/hooks/useScrollLock';


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
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(contentType === 'video');

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
    onCloseWithProgressRef.current = onCloseWithProgress;
  }, [onProgress, onComplete, onCloseWithProgress]);

  // Lock background scroll while the player modal is open
  useScrollLock(true);

  // Handle close: save final progress before closing
  const handleClose = useCallback(() => {
    const media = mediaRef.current;
    if (media && media.duration > 0 && isFinite(media.duration)) {
      const finalPercentage = Math.floor((media.currentTime / media.duration) * 100);
      console.log(`[MediaPlayer] Closing with progress: ${finalPercentage}%`);
      if (onCloseWithProgressRef.current && finalPercentage > 0) {
        onCloseWithProgressRef.current(finalPercentage);
      }
    }
    // Stop playback and leave any fullscreen state so we return straight to the app
    try {
      media?.pause();
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      if (media && 'webkitExitFullscreen' in media) {
        (media as any).webkitExitFullscreen?.();
      }
    } catch {}
    onClose();
  }, [onClose]);


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
      if (isMounted && isFinite(media.duration) && !isNaN(media.duration)) {
        setDuration(media.duration);
      }
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
        setHasStartedPlaying(true);
        setError(null);
        retryCountRef.current = 0;
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
        return;
      }

      setError(null);
      media.playbackRate = 1;

      // iOS/Safari requires play() to happen synchronously inside the user gesture.
      // Trigger load if needed, but do not wait for canplay before calling play().
      if (media.readyState === 0 || media.networkState === 0) {
        console.log('Priming media.load() before immediate play() for iOS/Safari');
        media.load();
      }

      const playPromise = media.play();
      if (playPromise) {
        await playPromise;
      }
      // State will be updated by playing event handler
    } catch (error: any) {
      console.error('Error playing media:', {
        name: error?.name,
        message: error?.message,
        readyState: media.readyState,
        networkState: media.networkState,
        src: media.currentSrc || media.src,
      });

      if (error?.name !== 'AbortError') {
        setError('Erro ao reproduzir mídia. Verifique sua conexão e tente novamente.');
      }
      setIsPlaying(false);
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 && isFinite(duration) ? (currentTime / duration) * 100 : 0;

  const handleSeek = (value: number) => {
    const media = mediaRef.current;
    if (!media || !duration || !isFinite(duration)) return;
    media.currentTime = Math.min(Math.max(value, 0), duration);
    setCurrentTime(media.currentTime);
  };

  const skip = (seconds: number) => {
    const media = mediaRef.current;
    if (!media) return;
    handleSeek(media.currentTime + seconds);
  };

  /* ---------------------------- HYPNOSIS LAYOUT ---------------------------- */
  if (contentType === 'hypnosis') {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden animate-in fade-in-0 duration-300">
        {/* Immersive backdrop */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 50% 0%, hsl(258 75% 32%) 0%, hsl(240 70% 18%) 45%, hsl(230 60% 9%) 100%)',
          }}
        />
        {/* Soft aurora blobs */}
        <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-[hsl(258_85%_65%/0.35)] blur-3xl animate-pulse-glow" />
        <div className="pointer-events-none absolute bottom-0 -right-20 h-80 w-80 rounded-full bg-[hsl(190_85%_55%/0.22)] blur-3xl animate-pulse-glow" />

        <div className="relative flex h-full flex-col px-6 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),24px)]">
          {/* Top bar */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Hipnose
              </p>
              <h2 className="mt-1 text-xl font-bold leading-tight text-white text-balance">
                {title}
              </h2>
            </div>
            <button
              onClick={handleClose}
              aria-label="Fechar"
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15 backdrop-blur transition active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Breathing orb */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              <span
                className={`absolute h-56 w-56 rounded-full bg-white/[0.06] ${isPlaying ? 'animate-breathe' : ''}`}
              />
              <span
                className={`absolute h-44 w-44 rounded-full bg-white/[0.09] ${isPlaying ? 'animate-breathe' : ''}`}
                style={{ animationDelay: '0.6s' }}
              />
              <button
                onClick={handlePlayPause}
                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
                className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-md shadow-[0_20px_60px_-15px_hsl(258_90%_60%/0.7)] transition active:scale-95"
              >
                {isPlaying ? (
                  <Pause className="h-11 w-11 text-white" fill="currentColor" />
                ) : (
                  <Play className="ml-1 h-11 w-11 text-white" fill="currentColor" />
                )}
              </button>
            </div>

            <p className="mt-8 text-sm text-white/60 text-balance text-center">
              {isPlaying
                ? 'Respire fundo e apenas escute.'
                : hasStartedPlaying
                  ? 'Pausado. Toque para continuar.'
                  : 'Toque para começar sua sessão.'}
            </p>
          </div>

          {/* Progress + controls */}
          <div className="mt-4">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={1}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              aria-label="Progresso da hipnose"
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-white outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
              style={{
                background: `linear-gradient(to right, hsl(0 0% 100% / 0.9) ${progressPercentage}%, hsl(0 0% 100% / 0.15) ${progressPercentage}%)`,
              }}
            />
            <div className="mt-2 flex items-center justify-between text-[11px] font-medium tabular-nums text-white/60">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => skip(-15)}
                className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/85 ring-1 ring-white/15 backdrop-blur transition active:scale-95"
              >
                <RotateCcw className="h-3.5 w-3.5" /> 15s
              </button>
              <button
                onClick={() => skip(15)}
                className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/85 ring-1 ring-white/15 backdrop-blur transition active:scale-95"
              >
                15s <RotateCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Tips */}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {[
                { icon: Headphones, label: 'Fones de ouvido' },
                { icon: Sofa, label: 'Deite-se' },
                { icon: BellOff, label: 'Não perturbe' },
                { icon: BatteryCharging, label: 'Sem economia de bateria' },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1.5 text-[11px] text-white/65 ring-1 ring-white/10"
                >
                  <Icon className="h-3 w-3" /> {label}
                </span>
              ))}
            </div>

            {error && (
              <p className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-center text-xs text-white/85 ring-1 ring-white/15">
                {error}
              </p>
            )}
            {!fileUrl && (
              <p className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-center text-xs text-white/85 ring-1 ring-white/15">
                Arquivo não encontrado no storage
              </p>
            )}
          </div>
        </div>

        <audio
          ref={mediaRef as React.RefObject<HTMLAudioElement>}
          className="sr-only"
          preload="auto"
          autoPlay
          controlsList="nodownload noplaybackrate"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onContextMenu={(e) => e.preventDefault()}
          onError={(e) => {
            const err = e.currentTarget.error;
            console.error('Audio inline error:', { code: err?.code, message: err?.message, src: e.currentTarget.currentSrc });
          }}
          onLoadStart={() => console.log('Audio load started:', fileUrl)}
        >
          {fileUrl && <source src={fileUrl} type="audio/mpeg" />}
        </audio>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black">
      <div className="relative flex h-full w-full flex-col overflow-hidden animate-in fade-in-0 duration-200">
        {/* Header overlay */}
        <div className="absolute left-0 right-0 top-0 z-10 bg-gradient-to-b from-black/70 to-transparent px-4 pb-6 pt-[max(env(safe-area-inset-top),12px)]">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Vídeo</p>
              <h2 className="mt-0.5 text-base font-semibold leading-tight text-white text-balance">{title}</h2>
            </div>
            <button
              onClick={handleClose}
              aria-label="Fechar"
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white/90 ring-1 ring-white/15 backdrop-blur transition active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          className="relative flex h-full w-full flex-1 items-center justify-center bg-black"
          onContextMenu={(e) => e.preventDefault()}
        >
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            className="h-full w-full object-contain"
            controls
            preload="auto"
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            autoPlay
            playsInline
            onPlay={() => {
              setIsPlaying(true);
              setHasStartedPlaying(true);
            }}
            onPlaying={() => setIsBuffering(false)}
            onCanPlay={() => setIsBuffering(false)}
            onWaiting={() => setIsBuffering(true)}
            onPause={() => setIsPlaying(false)}
            onContextMenu={(e) => e.preventDefault()}
            onError={(e) => {
              const err = e.currentTarget.error;
              console.error('Video inline error:', { code: err?.code, message: err?.message, src: e.currentTarget.currentSrc });
            }}
            onLoadStart={() => {
              setIsBuffering(true);
              console.log('Video load started:', fileUrl);
            }}
          >
            {fileUrl && <source src={fileUrl} type="video/mp4" />}
            Seu navegador não suporta vídeo HTML5.
          </video>

          {isBuffering && !error && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
              <Loader2 className="h-9 w-9 animate-spin text-white/90" />
              <p className="text-xs font-medium text-white/80">Carregando vídeo...</p>
            </div>
          )}

          {(error || !fileUrl) && (
            <div className="absolute inset-x-6 bottom-24 rounded-2xl bg-white/10 px-4 py-3 text-center text-xs text-white/90 ring-1 ring-white/15 backdrop-blur">
              {error || 'Arquivo não encontrado no storage'}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};


export default MediaPlayer;
