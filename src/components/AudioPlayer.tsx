import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Gauge,
  Sliders,
  Sparkles,
  Music,
  Share2,
  Check,
} from 'lucide-react';

interface AudioPlayerProps {
  audioBase64: string;
  mimeType: string;
  voiceName: string;
  textSnippet: string;
  initialSpeed?: number;
  onDownload?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioBase64,
  mimeType,
  voiceName,
  textSnippet,
  initialSpeed = 1.0,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(initialSpeed);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Sync initial speed if provided
  useEffect(() => {
    if (initialSpeed) {
      setPlaybackSpeed(initialSpeed);
      if (audioRef.current) {
        audioRef.current.playbackRate = initialSpeed;
      }
    }
  }, [initialSpeed]);

  // Audio source URL
  const audioSrc = React.useMemo(() => {
    if (!audioBase64) return '';
    return `data:${mimeType || 'audio/wav'};base64,${audioBase64}`;
  }, [audioBase64, mimeType]);

  // Initialize Audio & Canvas Analyser
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      audio.playbackRate = playbackSpeed;
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioSrc, playbackSpeed]);

  // Setup Web Audio API Analyser for real-time waveform visualization
  const setupWebAudio = () => {
    if (audioContextRef.current || !audioRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch (e) {
      console.warn('Web Audio API not fully available or already bound, using fallback visualizer', e);
    }
  };

  // Canvas visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = 48;
      const barWidth = (width / barCount) - 2;

      let dataArray: Uint8Array | null = null;
      if (analyserRef.current && isPlaying) {
        dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray as any);
      }

      phase += 0.08;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;
        if (isPlaying) {
          if (dataArray && dataArray.length > 0) {
            const dataIndex = Math.floor((i / barCount) * dataArray.length);
            const value = dataArray[dataIndex] || 0;
            barHeight = Math.max(4, (value / 255) * (height * 0.85));
          } else {
            // Simulated lively wave
            const sin1 = Math.sin(phase + i * 0.25);
            const sin2 = Math.cos(phase * 0.8 + i * 0.4);
            const norm = (sin1 + sin2 + 2) / 4;
            barHeight = Math.max(4, norm * height * 0.75);
          }
        } else {
          // Subtle idle static wave
          const wave = Math.sin(i * 0.3) * 0.5 + 0.5;
          barHeight = 4 + wave * 6;
        }

        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        // Gradient based on playing state
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPlaying) {
          gradient.addColorStop(0, '#38bdf8'); // sky-400
          gradient.addColorStop(0.5, '#818cf8'); // indigo-400
          gradient.addColorStop(1, '#c084fc'); // purple-400
        } else {
          gradient.addColorStop(0, '#334155');
          gradient.addColorStop(1, '#475569');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    setupWebAudio();

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Playback error:', err);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioRef.current.muted = nextMute;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val === 0) setIsMuted(true);
      else if (isMuted) setIsMuted(false);
    }
  };

  const handleDownload = () => {
    if (!audioBase64) return;
    const link = document.createElement('a');
    link.href = audioSrc;
    link.download = `amharic-voice-${voiceName}-${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyText = () => {
    if (!textSnippet) return;
    navigator.clipboard.writeText(textSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        loop={isLooping}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Subtle background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                የድምፅ ማጫወቻ ({voiceName})
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                24kHz Hi-Fi
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1 max-w-xs sm:max-w-md">
              {textSnippet || 'የተዘጋጀ የአማርኛ ንባብ'}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleCopyText}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
            title="ጽሑፉን ኮፒ አድርግ"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            title="ድምፁን አውርድ (.WAV)"
          >
            <Download className="w-4 h-4" />
            <span>አውርድ (WAV)</span>
          </button>
        </div>
      </div>

      {/* Waveform Canvas */}
      <div className="relative w-full h-18 sm:h-22 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-2 mb-4 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={80}
          className="w-full h-full block"
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 backdrop-blur-[1px] pointer-events-none">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              ለማዳመጥ Play የሚለውን ይጫኑ
            </span>
          </div>
        )}
      </div>

      {/* Seekbar & Time */}
      <div className="space-y-1 mb-4">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.05"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
        />
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Player Main Controls Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Play / Pause / Reset Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
              }
            }}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
            title="ከመጀመሪያው ጀምር"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
            title={isPlaying ? 'አቁም (Pause)' : 'አጫውት (Play)'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isLooping
                ? 'bg-purple-600/30 text-purple-300 border-purple-500/50'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
            title="ደጋግመህ አጫውት (Loop)"
          >
            ድግግሞሽ (Loop)
          </button>
        </div>

        {/* Real-time Playback Speed Pills */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-2xl border border-slate-800">
          <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5 hidden sm:block" />
          {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
            <button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                playbackSpeed === speed
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Volume slider */}
        <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={toggleMute}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-slate-300" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 sm:w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
