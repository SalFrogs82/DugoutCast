import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  Sliders,
  Sparkles,
  Maximize2,
  Compass,
} from 'lucide-react';
import { GameClipScenario, CommentaryLine } from '../types/broadcast';
import { dugoutAudio } from '../utils/audioEngine';

interface VideoTrackingPlayerProps {
  scenario: GameClipScenario;
  activeCommentary: CommentaryLine | null;
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  customVideoFile: File | null;
  customVideoUrl: string | null;
  onTimeUpdate?: (time: number) => void;
  onPlayTriggered?: () => void;
}

export const VideoTrackingPlayer: React.FC<VideoTrackingPlayerProps> = ({
  scenario,
  activeCommentary,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  isMuted,
  setIsMuted,
  customVideoUrl,
  onTimeUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // HUD Overlay Toggles
  const [showBallTrail, setShowBallTrail] = useState(true);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [showStrikeZone, setShowStrikeZone] = useState(true);
  const [showScorebug, setShowScorebug] = useState(true);
  const [showTelemetry, setShowTelemetry] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);

  // Animation frame loop
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Sound effects triggered timestamps to avoid repeat firings
  const triggeredSoundsRef = useRef<Set<string>>(new Set());

  // Handle Play/Pause
  const togglePlay = () => {
    if (!isPlaying) {
      if (!isMuted) {
        dugoutAudio.startAmbientCrowd(0.18);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentTime(0);
    triggeredSoundsRef.current.clear();
    if (videoElementRef.current) {
      videoElementRef.current.currentTime = 0;
    }
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  // Sync with HTML5 video if custom video provided
  useEffect(() => {
    const video = videoElementRef.current;
    if (!video || !customVideoUrl) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, customVideoUrl]);

  // Audio mute sync
  useEffect(() => {
    if (isMuted) {
      dugoutAudio.stopAmbientCrowd();
      dugoutAudio.stopAllSpeech();
    } else if (isPlaying) {
      dugoutAudio.startAmbientCrowd(0.18);
    }
  }, [isMuted, isPlaying]);

  // Canvas Drawing Engine
  const drawCanvas = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
      // 1. Draw Field / Stadium Background
      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.45);
      skyGrad.addColorStop(0, '#536573');
      skyGrad.addColorStop(1, '#8fa0aa');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height * 0.45);

      // Distant Trees & Stadium Outfield Fence
      ctx.fillStyle = '#263b28';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.45);
      for (let x = 0; x <= width; x += 30) {
        const treeH = Math.sin(x * 0.02) * 14 + (height * 0.38);
        ctx.lineTo(x, treeH);
      }
      ctx.lineTo(width, height * 0.45);
      ctx.fill();

      // Chainlink / Black Outfield Fence Line
      ctx.fillStyle = '#1e2820';
      ctx.fillRect(0, height * 0.44, width, 4);

      // Outfield Grass
      const grassGrad = ctx.createLinearGradient(0, height * 0.45, 0, height * 0.6);
      grassGrad.addColorStop(0, '#4a6b32');
      grassGrad.addColorStop(1, '#3b5825');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, height * 0.45, width, height * 0.15);

      // Infield Dirt Arc (Clay softball dirt)
      const dirtGrad = ctx.createLinearGradient(0, height * 0.52, 0, height);
      dirtGrad.addColorStop(0, '#8c7059');
      dirtGrad.addColorStop(0.5, '#7b604a');
      dirtGrad.addColorStop(1, '#654e3a');
      ctx.fillStyle = dirtGrad;
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height * 0.8, width * 0.75, height * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pitcher's Circle (8-foot radius softball circle)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(width * 0.48, height * 0.57, width * 0.12, height * 0.05, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Pitching Rubber
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(width * 0.47, height * 0.565, width * 0.022, 3);

      // Backstop Netting simulated lines (subtle diagonal grid)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1;
      for (let x = -width; x < width * 2; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + height * 0.6, height);
        ctx.stroke();
      }

      // 2. Animate Players & Ball based on scenario keyframes
      const keyframes = scenario.trackingKeyframes;
      // Find current or interpolated keyframe
      let activeFrame = keyframes[0];
      for (let i = 0; i < keyframes.length; i++) {
        if (time >= keyframes[i].time) {
          activeFrame = keyframes[i];
        }
      }

      // Check sound effect triggers based on keyframe events
      if (!isMuted) {
        if (time >= 5.5 && time <= 6.0 && !triggeredSoundsRef.current.has('bat_crack')) {
          dugoutAudio.playBatCrack(1.0);
          dugoutAudio.playCrowdRoar(3.0, 0.95);
          triggeredSoundsRef.current.add('bat_crack');
        }
        if (time >= 9.4 && time <= 10.0 && !triggeredSoundsRef.current.has('glove_pop')) {
          dugoutAudio.playGloveCatch(0.7);
          triggeredSoundsRef.current.add('glove_pop');
        }
        if (time >= 12.0 && !triggeredSoundsRef.current.has('safe_cheer')) {
          dugoutAudio.playCrowdRoar(2.5, 0.85);
          triggeredSoundsRef.current.add('safe_cheer');
        }
      }

      // Draw Fielders & Players
      activeFrame.players.forEach((p) => {
        const px = (p.x / 100) * width;
        const py = (p.y / 100) * height;
        const pw = (p.w / 100) * width;
        const ph = (p.h / 100) * height;

        // Player Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(px + pw / 2, py + ph, pw * 0.6, ph * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Render Pitcher (A. Clincy #89 in dark uniform)
        if (p.role === 'pitcher') {
          // Uniform
          ctx.fillStyle = '#1c1f24';
          ctx.beginPath();
          ctx.roundRect(px, py + ph * 0.25, pw, ph * 0.5, 3);
          ctx.fill();

          // White pants
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(px + pw * 0.15, py + ph * 0.7, pw * 0.3, ph * 0.3);
          ctx.fillRect(px + pw * 0.55, py + ph * 0.7, pw * 0.3, ph * 0.3);

          // Head & Helmet
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(px + pw / 2, py + ph * 0.15, pw * 0.32, 0, Math.PI * 2);
          ctx.fill();

          // Windmill arm animation if pitching
          if (time >= 2 && time <= 4.8) {
            const armAngle = ((time - 2) / 2.8) * Math.PI * 2;
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(px + pw / 2, py + ph * 0.35);
            ctx.lineTo(
              px + pw / 2 + Math.cos(armAngle) * (pw * 0.9),
              py + ph * 0.35 + Math.sin(armAngle) * (pw * 0.9)
            );
            ctx.stroke();
          }
        }

        // Render Batter (N. Vasquez #3 in Red Jersey, White Helmet)
        else if (p.role === 'batter') {
          // Red jersey
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.roundRect(px, py + ph * 0.25, pw, ph * 0.5, 3);
          ctx.fill();

          // White pants
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(px + pw * 0.15, py + ph * 0.7, pw * 0.3, ph * 0.3);
          ctx.fillRect(px + pw * 0.55, py + ph * 0.7, pw * 0.3, ph * 0.3);

          // White batting helmet
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(px + pw / 2, py + ph * 0.14, pw * 0.34, 0, Math.PI * 2);
          ctx.fill();

          // Bat angle
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          if (time < 5.0) {
            // Cocked bat
            ctx.moveTo(px + pw * 0.7, py + ph * 0.25);
            ctx.lineTo(px + pw * 1.3, py - ph * 0.1);
          } else if (time >= 5.0 && time <= 6.2) {
            // Level swing follow-through
            ctx.moveTo(px + pw * 0.2, py + ph * 0.4);
            ctx.lineTo(px - pw * 0.6, py + ph * 0.3);
          }
          ctx.stroke();
        }

        // Render Catcher (squatting behind home plate)
        else if (p.role === 'catcher') {
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.roundRect(px, py + ph * 0.2, pw, ph * 0.6, 4);
          ctx.fill();
          // Catcher skull helmet
          ctx.fillStyle = '#e11d48';
          ctx.beginPath();
          ctx.arc(px + pw / 2, py + ph * 0.18, pw * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }

        // Render Home Plate Umpire (navy blue shirt, chest protector, black cap)
        else if (p.role === 'umpire') {
          ctx.fillStyle = '#1e3a5f';
          ctx.beginPath();
          ctx.roundRect(px, py + ph * 0.15, pw, ph * 0.55, 4);
          ctx.fill();
          // Grey trousers
          ctx.fillStyle = '#475569';
          ctx.fillRect(px + pw * 0.2, py + ph * 0.7, pw * 0.28, ph * 0.3);
          ctx.fillRect(px + pw * 0.52, py + ph * 0.7, pw * 0.28, ph * 0.3);
          // Face mask
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(px + pw * 0.45, py + ph * 0.12, pw * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }

        // Other fielders (shortstop, runner)
        else {
          ctx.fillStyle = p.role === 'runner' ? '#dc2626' : '#1c1f24';
          ctx.beginPath();
          ctx.roundRect(px, py + ph * 0.2, pw, ph * 0.5, 3);
          ctx.fill();
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(px + pw * 0.15, py + ph * 0.68, pw * 0.3, ph * 0.32);
          ctx.fillRect(px + pw * 0.55, py + ph * 0.68, pw * 0.3, ph * 0.32);
        }

        // Bounding Box HUD & Player Labels
        if (showBoundingBoxes) {
          ctx.strokeStyle =
            p.role === 'pitcher'
              ? '#38bdf8'
              : p.role === 'batter'
              ? '#f59e0b'
              : p.role === 'shortstop'
              ? '#10b981'
              : 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 2]);
          ctx.strokeRect(px - 2, py - 2, pw + 4, ph + 4);
          ctx.setLineDash([]);

          // Corner brackets
          const cl = 5;
          ctx.strokeStyle = ctx.strokeStyle;
          ctx.lineWidth = 2;
          ctx.beginPath();
          // Top-left
          ctx.moveTo(px - 4, py + cl);
          ctx.lineTo(px - 4, py - 4);
          ctx.lineTo(px + cl, py - 4);
          // Top-right
          ctx.moveTo(px + pw + 4 - cl, py - 4);
          ctx.lineTo(px + pw + 4, py - 4);
          ctx.lineTo(px + pw + 4, py + cl);
          ctx.stroke();

          // Label
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(px - 2, py - 18, ctx.measureText(p.label).width + 8, 14);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(p.label, px + 2, py - 7);
        }
      });

      // 3. Draw Strike Zone Grid HUD
      if (showStrikeZone) {
        const szX = width * 0.66;
        const szY = height * 0.54;
        const szW = width * 0.08;
        const szH = height * 0.14;

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(szX, szY, szW, szH);

        // 3x3 Grid
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
        ctx.beginPath();
        // Verticals
        ctx.moveTo(szX + szW / 3, szY);
        ctx.lineTo(szX + szW / 3, szY + szH);
        ctx.moveTo(szX + (szW * 2) / 3, szY);
        ctx.lineTo(szX + (szW * 2) / 3, szY + szH);
        // Horizontals
        ctx.moveTo(szX, szY + szH / 3);
        ctx.lineTo(szX + szW, szY + szH / 3);
        ctx.moveTo(szX, szY + (szH * 2) / 3);
        ctx.lineTo(szX + szW, szY + (szH * 2) / 3);
        ctx.stroke();

        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('STRIKE ZONE', szX, szY - 5);
      }

      // 4. Optic Yellow Softball Trajectory Arc & Ball
      const ball = activeFrame.ball;
      const bx = (ball.x / 100) * width;
      const by = (ball.y / 100) * height;

      // Draw Ball Trail Arc
      if (showBallTrail && time > 2) {
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        keyframes.forEach((kf, idx) => {
          if (kf.time <= time && kf.time >= 2) {
            const tx = (kf.ball.x / 100) * width;
            const ty = (kf.ball.y / 100) * height;
            if (idx === 0) ctx.moveTo(tx, ty);
            else ctx.lineTo(tx, ty);
          }
        });
        ctx.stroke();
      }

      // Draw Optic Yellow Softball with Red Seams
      const ballRadius = Math.max(3, 4 + Math.sin(time) * 1);
      // Glowing aura
      const aura = ctx.createRadialGradient(bx, by, 1, bx, by, ballRadius * 2.5);
      aura.addColorStop(0, 'rgba(250, 204, 21, 0.9)');
      aura.addColorStop(0.5, 'rgba(234, 179, 8, 0.4)');
      aura.addColorStop(1, 'rgba(234, 179, 8, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(bx, by, ballRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Ball Core
      ctx.fillStyle = '#ccff00'; // Optic softball neon yellow
      ctx.beginPath();
      ctx.arc(bx, by, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      // Red Stitches
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bx, by, ballRadius * 0.75, 0.4, 2.7);
      ctx.stroke();

      // Telemetry Bubble near ball
      if (showTelemetry && (ball.speedMph ?? 0) > 0) {
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        const speedText = `${ball.speedMph?.toFixed(1)} MPH`;
        const tw = ctx.measureText(speedText).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(bx + 8, by - 16, tw + 8, 16);
        ctx.fillStyle = '#facc15';
        ctx.fillText(speedText, bx + 12, by - 4);
      }

      // 5. Authentic GameChanger Broadcast Scorebug Overlay
      if (showScorebug) {
        const hudW = Math.min(width * 0.9, 320);
        const hudH = 120;
        const hudX = (width - hudW) / 2;
        const hudY = 16;

        // Background Glass Panel
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(hudX, hudY, hudW, hudH, 12);
        ctx.fill();
        ctx.stroke();

        // GameChanger Top Header
        ctx.font = 'bold 9px "Outfit", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('GAMECHANGER LIVE STREAM', hudX + hudW / 2, hudY + 16);

        // Inning, Diamond Bases, Count
        ctx.textAlign = 'left';
        ctx.font = 'bold 12px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(scenario.situation.inning, hudX + 16, hudY + 36);

        // Diamond Bases Mini-Graphic
        const dX = hudX + hudW / 2;
        const dY = hudY + 32;
        const bSize = 6;
        // 2nd base
        ctx.fillStyle = scenario.situation.runnersOn.second ? '#f59e0b' : '#334155';
        ctx.beginPath();
        ctx.moveTo(dX, dY - bSize);
        ctx.lineTo(dX + bSize, dY);
        ctx.lineTo(dX, dY + bSize);
        ctx.lineTo(dX - bSize, dY);
        ctx.fill();
        // 1st base
        ctx.fillStyle = scenario.situation.runnersOn.first ? '#f59e0b' : '#334155';
        ctx.beginPath();
        ctx.moveTo(dX + bSize * 1.5, dY);
        ctx.lineTo(dX + bSize * 2.5, dY + bSize);
        ctx.lineTo(dX + bSize * 1.5, dY + bSize * 2);
        ctx.lineTo(dX + bSize * 0.5, dY + bSize);
        ctx.fill();
        // 3rd base
        ctx.fillStyle = scenario.situation.runnersOn.third ? '#f59e0b' : '#334155';
        ctx.beginPath();
        ctx.moveTo(dX - bSize * 1.5, dY);
        ctx.lineTo(dX - bSize * 0.5, dY + bSize);
        ctx.lineTo(dX - bSize * 1.5, dY + bSize * 2);
        ctx.lineTo(dX - bSize * 2.5, dY + bSize);
        ctx.fill();

        // Count Text
        ctx.textAlign = 'right';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(scenario.situation.count, hudX + hudW - 16, hudY + 36);

        // Divider
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(hudX + 12, hudY + 46);
        ctx.lineTo(hudX + hudW - 12, hudY + 46);
        ctx.stroke();

        // Teams & Score
        ctx.textAlign = 'left';
        ctx.font = 'bold 11px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        // Away
        ctx.fillText(scenario.situation.awayTeam, hudX + 16, hudY + 64);
        ctx.font = 'bold 18px "Outfit", sans-serif';
        ctx.fillText(String(scenario.situation.awayScore), hudX + 115, hudY + 68);

        // Home
        ctx.font = 'bold 18px "Outfit", sans-serif';
        ctx.fillText(String(scenario.situation.homeScore), hudX + 185, hudY + 68);
        ctx.font = 'bold 11px "Outfit", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(scenario.situation.homeTeam, hudX + hudW - 16, hudY + 64);

        // Sub-bar: Batter vs Pitcher stats
        ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
        ctx.fillRect(hudX + 6, hudY + 84, hudW - 12, 28);

        ctx.textAlign = 'left';
        ctx.font = '10px "Outfit", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(scenario.situation.batter, hudX + 12, hudY + 102);

        ctx.textAlign = 'right';
        ctx.fillText(scenario.situation.pitcher, hudX + hudW - 12, hudY + 102);
      }
    },
    [
      scenario,
      showBallTrail,
      showBoundingBoxes,
      showStrikeZone,
      showScorebug,
      showTelemetry,
      isMuted,
    ]
  );

  // Main Render Animation Frame
  useEffect(() => {
    let animId: number;

    const render = (timestamp: number) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
      const delta = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + delta * playbackSpeed;
          if (next >= scenario.durationSeconds) {
            setIsPlaying(false);
            return scenario.durationSeconds;
          }
          if (onTimeUpdate) onTimeUpdate(next);
          return next;
        });
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawCanvas(ctx, canvas.width, canvas.height, currentTime);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      lastTimestampRef.current = null;
    };
  }, [isPlaying, playbackSpeed, scenario.durationSeconds, currentTime, drawCanvas, onTimeUpdate, setCurrentTime, setIsPlaying]);

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Video Viewport Header */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-semibold text-white font-display tracking-tight">
            {scenario.title}
          </h2>
          <span className="text-xs text-slate-400 hidden lg:inline">
            · {scenario.league}
          </span>
        </div>

        {/* HUD Quick Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowBallTrail(!showBallTrail)}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              showBallTrail
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Optic Yellow Ball Trajectory Tracer"
          >
            Tracer
          </button>
          <button
            onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              showBoundingBoxes
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Computer Vision Player Bounding Boxes"
          >
            Tracking Box
          </button>
          <button
            onClick={() => setShowStrikeZone(!showStrikeZone)}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              showStrikeZone
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle 3D Strike Zone Grid"
          >
            Strike Zone
          </button>
          <button
            onClick={() => setShowScorebug(!showScorebug)}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              showScorebug
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle GameChanger Scorebug Overlay"
          >
            Scorebug
          </button>
        </div>
      </div>

      {/* Main Video Screen Container */}
      <div
        ref={containerRef}
        className="relative aspect-video bg-black flex items-center justify-center overflow-hidden select-none"
      >
        {customVideoUrl ? (
          <video
            ref={videoElementRef}
            src={customVideoUrl}
            className="w-full h-full object-contain"
            muted={isMuted}
            playsInline
            onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
          />
        ) : (
          <canvas
            ref={canvasRef}
            width={960}
            height={540}
            className="w-full h-full object-contain"
          />
        )}

        {/* Live "ON AIR" Badge */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-2.5 py-1 rounded bg-rose-600/90 text-white font-bold text-xs tracking-wider uppercase backdrop-blur-sm shadow-md">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>ON AIR</span>
        </div>

        {/* Ball Telemetry Card in Top Right */}
        {showTelemetry && (
          <div className="absolute top-4 right-4 z-20 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 text-xs font-mono space-y-1">
            <div className="flex justify-between gap-4 text-slate-400">
              <span>PITCH:</span>
              <span className="text-amber-400 font-bold">{scenario.pitchDetails.type}</span>
            </div>
            <div className="flex justify-between gap-4 text-slate-400">
              <span>RELEASE VELO:</span>
              <span className="text-white tabular-nums">{scenario.pitchDetails.speedMph} MPH</span>
            </div>
            <div className="flex justify-between gap-4 text-slate-400">
              <span>EXIT VELO:</span>
              <span className="text-emerald-400 tabular-nums">{scenario.hitDetails.exitVelocityMph} MPH</span>
            </div>
          </div>
        )}

        {/* Real-Time Closed Captions / Teleprompter Banner */}
        {showCaptions && activeCommentary && (
          <div className="absolute bottom-6 left-6 right-6 z-20 pointer-events-none">
            <div className="max-w-3xl mx-auto bg-slate-950/90 backdrop-blur-md border border-amber-500/40 rounded-xl px-5 py-3 shadow-2xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {activeCommentary.speakerName} · {activeCommentary.speaker === 'play_by_play' ? 'Play-by-Play' : 'Color Analyst'}
                </span>
                <span className="text-xs text-slate-400 font-mono ml-auto">
                  {activeCommentary.timestamp}
                </span>
              </div>
              <p className="text-base sm:text-lg font-medium text-white tracking-wide leading-relaxed">
                "{activeCommentary.callText}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scrubbable Timeline Bar */}
      <div className="px-4 pt-3 pb-2 bg-slate-950/90 border-t border-slate-800">
        <div className="relative w-full h-2.5 bg-slate-800 rounded-full cursor-pointer group mb-2.5">
          <div
            className="absolute top-0 bottom-0 left-0 bg-amber-500 rounded-full transition-all"
            style={{ width: `${(currentTime / scenario.durationSeconds) * 100}%` }}
          />

          {/* Keyframe Flags along timeline */}
          {scenario.trackingKeyframes.map((kf, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-1 bg-white/40 hover:bg-amber-400 transition-colors"
              style={{ left: `${(kf.time / scenario.durationSeconds) * 100}%` }}
              title={kf.eventNote}
            />
          ))}

          <input
            type="range"
            min={0}
            max={scenario.durationSeconds}
            step={0.1}
            value={currentTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setCurrentTime(val);
              if (videoElementRef.current) {
                videoElementRef.current.currentTime = val;
              }
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>

        {/* Player Controls Bar */}
        <div className="flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold transition-all shadow-md"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
            </button>

            <button
              onClick={handleRestart}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Replay Delivery"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Time Stamp */}
            <div className="text-xs font-mono text-slate-400 tabular-nums">
              <span className="text-white font-semibold">{currentTime.toFixed(1)}s</span> / {scenario.durationSeconds.toFixed(1)}s
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-md text-xs font-mono">
              {[0.5, 1.0, 1.5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    playbackSpeed === speed
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Effects Trigger Buttons */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => dugoutAudio.playBatCrack()}
                className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Test Composite Bat Crack Sound"
              >
                Bat Crack
              </button>
              <button
                onClick={() => dugoutAudio.playCrowdRoar(2.5, 0.9)}
                className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Test Stadium Crowd Roar"
              >
                Crowd Roar
              </button>
              <button
                onClick={() => dugoutAudio.playOrganFanfare()}
                className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Play Ballpark Organ Sting"
              >
                Organ
              </button>
            </div>

            {/* Mute Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
