import React, { useRef, useEffect, useCallback, useState } from 'react';
import PlayerControls from './PlayerControls';
import VideoUrlInput from './VideoUrlInput';

interface VideoPlayerProps {
  videoUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (t: number) => void;
  onVideoChange: (url: string) => void;
  onDurationChange?: (duration: number) => void;
  onTimeUpdate?: (t: number) => void;
  onReady?: () => void;
}

type Platform = 'youtube' | 'vk' | 'rutube' | null;

function detectPlatform(url: string): Platform {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vk.com') || url.includes('vkvideo.ru')) return 'vk';
  if (url.includes('rutube.ru')) return 'rutube';
  return null;
}

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || '';
}

function buildVkEmbedUrl(url: string): string {
  const match = url.match(/video(-?\d+_\d+)/);
  if (match) {
    const [oid, id] = match[1].split('_');
    return `http://localhost:5000/api/proxy/vk-video?oid=${oid}&id=${id}`;
  }
  return url;
}

function buildRutubeEmbedUrl(url: string): string {
  const match = url.match(/rutube\.ru\/(?:video\/|play\/embed\/)([a-zA-Z0-9]+)/);
  if (match) {
    return `http://localhost:5000/api/proxy/rutube-video?id=${match[1]}`;
  }
  return url;
}

const DEFAULT_DURATION = 2700;

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  isPlaying,
  currentTime,
  onPlay,
  onPause,
  onSeek,
  onVideoChange,
  onDurationChange,
  onTimeUpdate,
  onReady,
}) => {
  const playerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [platform, setPlatform] = useState<Platform>(null);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [displayTime, setDisplayTime] = useState(0);
  const timeUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPlayingRef = useRef(isPlaying);
  const prevTimeRef = useRef(currentTime);
  const currentTimeRef = useRef(currentTime);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // === YouTube ===
  const initYouTube = useCallback(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      (window as any).onYouTubeIframeAPIReady = () => initYouTube();
      return;
    }
    const videoId = extractYouTubeId(videoUrl!);
    playerRef.current = new window.YT.Player('youtube-player', {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: { controls: 0, disablekb: 1, modestbranding: 1, enablejsapi: 1 },
      events: {
        onReady: (e: any) => {
          const dur = e.target.getDuration();
          if (dur && dur > 0) {
            setDuration(dur);
            onDurationChange?.(dur);
          }
          setReady(true);
        },
        onStateChange: (e: any) => {
          if (e.data === 1 && !prevPlayingRef.current) {
            prevPlayingRef.current = true;
            onPlay();
          } else if (e.data === 2 && prevPlayingRef.current) {
            prevPlayingRef.current = false;
            onPause();
          }
        },
      },
    });
  }, [videoUrl]);

  // === Команды ===
  const sendRutubeCommand = useCallback((cmd: string, data?: any) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ from: 'syncvibe', type: cmd, time: data?.time }),
      '*'
    );
  }, []);

  const sendVkCommand = useCallback((cmd: string, data?: any) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ type: cmd, data: data || {} }),
      '*'
    );
  }, []);

  // === Слушаем сообщения ===
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (platform === 'rutube') {
          if (data.type === 'player:ready' || data.type === 'player:init') {
            setReady(true);
          }
          if (data.type === 'player:durationChange') {
            const dur = parseFloat(data.data?.duration || data.duration);
            if (dur && dur > 0 && !isNaN(dur)) {
              setDuration(dur);
              onDurationChange?.(dur);
            }
          }
          if (data.type === 'currentDuration') {
            const dur = parseFloat(data.data?.duration || data.duration);
            if (dur && dur > 0 && !isNaN(dur)) {
              setDuration(dur);
              onDurationChange?.(dur);
            }
          }
          if (data.type === 'player:currentTime') {
            const t = parseFloat(data.data?.time || data.currentTime);
            if (t != null && !isNaN(t)) {
              setDisplayTime(t);
              currentTimeRef.current = t;
            }
          }
          if (data.type === 'player:play' || data.type === 'play' || data.type === 'player:started') onPlay();
          if (data.type === 'player:pause' || data.type === 'pause' || data.type === 'player:paused') onPause();
          if (data.type === 'player:ended') onPause();
        }
        if (platform === 'vk') {
          if (data.event === 'started') {
            onPlay();
            if (data.duration && data.duration > 0) {
              setDuration(data.duration);
              onDurationChange?.(data.duration);
            }
          }
          if (data.event === 'paused') onPause();
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [platform, onPlay, onPause]);

  // === При готовности плеера применяем состояние ===
  useEffect(() => {
    if (!ready) return;
    if (isPlaying) {
      if (platform === 'youtube') playerRef.current?.playVideo();
      else if (platform === 'vk') sendVkCommand('player:play');
      else if (platform === 'rutube') sendRutubeCommand('play');
    }
    if (currentTime > 0) {
      if (platform === 'youtube') playerRef.current?.seekTo(currentTime, true);
      else if (platform === 'vk') sendVkCommand('player:seek', { time: currentTime });
      else if (platform === 'rutube') sendRutubeCommand('seekTo', { time: currentTime });
    }
    onReady?.();
  }, [ready]);

  // === Play/Pause ===
  useEffect(() => {
    if (!ready) return;
    if (isPlaying === prevPlayingRef.current) return;
    prevPlayingRef.current = isPlaying;
    if (isPlaying) {
      if (platform === 'youtube') playerRef.current?.playVideo();
      else if (platform === 'vk') sendVkCommand('player:play');
      else if (platform === 'rutube') sendRutubeCommand('play');
    } else {
      if (platform === 'youtube') playerRef.current?.pauseVideo();
      else if (platform === 'vk') sendVkCommand('player:pause');
      else if (platform === 'rutube') sendRutubeCommand('pause');
    }
  }, [isPlaying, ready]);

  // === Seek ===
  useEffect(() => {
    if (!ready) return;
    if (Math.abs(currentTime - prevTimeRef.current) < 0.3) return;
    prevTimeRef.current = currentTime;
    setDisplayTime(currentTime);
    if (platform === 'youtube') playerRef.current?.seekTo(currentTime, true);
    else if (platform === 'vk') sendVkCommand('player:seek', { time: currentTime });
    else if (platform === 'rutube') sendRutubeCommand('seekTo', { time: currentTime });
  }, [currentTime, ready]);

  // === Таймер только для отображения времени (НЕ дёргает родителя для VK/Rutube) ===
  useEffect(() => {
    if (!ready || !isPlaying) {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
        timeUpdateInterval.current = null;
      }
      return;
    }
    timeUpdateInterval.current = setInterval(() => {
      if (platform === 'youtube' && playerRef.current?.getCurrentTime) {
        const t = playerRef.current.getCurrentTime();
        if (t != null && !isNaN(t)) {
          currentTimeRef.current = t;
          setDisplayTime(t);
          onTimeUpdate?.(t);
        }
      } else if (platform === 'vk' || platform === 'rutube') {
        setDisplayTime(prev => prev + 1);
      }
    }, 1000);
    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
        timeUpdateInterval.current = null;
      }
    };
  }, [isPlaying, ready, platform]);

  // === Сброс ===
  useEffect(() => {
    setReady(false);
    setDuration(DEFAULT_DURATION);
    setDisplayTime(0);
    playerRef.current?.destroy?.();
    playerRef.current = null;
    prevTimeRef.current = 0;
    prevPlayingRef.current = false;
    currentTimeRef.current = 0;
    setPlatform(videoUrl ? detectPlatform(videoUrl) : null);
  }, [videoUrl]);

  // === Инициализация ===
  useEffect(() => {
    if (!videoUrl || !platform) return;
    if (platform === 'youtube') {
      const timer = setTimeout(initYouTube, 100);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [videoUrl, platform]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0 }}>
      <div style={{ flex: 1, background: '#000', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)', minHeight: '300px', position: 'relative', overflow: 'hidden' }}>
        {platform === 'youtube' && <div id="youtube-player" style={{ width: '100%', height: '100%' }} />}
        {(platform === 'vk' || platform === 'rutube') && videoUrl && (
          <iframe ref={iframeRef} src={platform === 'vk' ? buildVkEmbedUrl(videoUrl) : buildRutubeEmbedUrl(videoUrl)} width="100%" height="100%" frameBorder="0" allow="autoplay; encrypted-media; fullscreen" allowFullScreen style={{ border: 'none' }} />
        )}
        {!videoUrl && (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎥</div>
            <p style={{ fontSize: '1.1rem' }}>Вставьте ссылку на видео</p>
            <p style={{ fontSize: '0.8rem', marginTop: '8px', opacity: 0.6 }}>YouTube • VK Видео • Rutube</p>
          </div>
        )}
      </div>
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <PlayerControls isPlaying={isPlaying} currentTime={displayTime} duration={duration} onPlay={onPlay} onPause={onPause} onSeek={onSeek} />
        <VideoUrlInput onVideoChange={onVideoChange} />
      </div>
    </div>
  );
};

export default React.memo(VideoPlayer);