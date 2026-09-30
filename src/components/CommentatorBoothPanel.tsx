import React, { useState } from 'react';
import {
  Mic,
  Sliders,
  Sparkles,
  Volume2,
  Zap,
  Play,
  CheckCircle,
  Flame,
  Radio,
} from 'lucide-react';
import { CommentatorPersonality, CommentaryLine } from '../types/broadcast';
import { dugoutAudio } from '../utils/audioEngine';
import { safeFetchJson } from '../utils/api';

interface CommentatorBoothPanelProps {
  personalities: CommentatorPersonality[];
  selectedPersonality: CommentatorPersonality;
  onSelectPersonality: (p: CommentatorPersonality) => void;
  commentaryTimeline: CommentaryLine[];
  onAddCommentaryLine: (line: CommentaryLine) => void;
  onFastGenerateCall: () => void;
  isGeneratingFastCall: boolean;
  selectedVoice: string;
  setSelectedVoice: (v: string) => void;
  tempo: number;
  setTempo: (t: number) => void;
  excitementLevel: number;
  setExcitementLevel: (e: number) => void;
  crowdVolume: number;
  setCrowdVolume: (v: number) => void;
}

export const CommentatorBoothPanel: React.FC<CommentatorBoothPanelProps> = ({
  personalities,
  selectedPersonality,
  onSelectPersonality,
  commentaryTimeline,
  onAddCommentaryLine,
  onFastGenerateCall,
  isGeneratingFastCall,
  selectedVoice,
  setSelectedVoice,
  tempo,
  setTempo,
  excitementLevel,
  setExcitementLevel,
  crowdVolume,
  setCrowdVolume,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [customCallInput, setCustomCallInput] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Play a specific line using Gemini TTS or Web Speech fallback
  const handlePlayLine = async (line: CommentaryLine) => {
    setIsPlayingAudio(true);
    try {
      if (line.soundEffect === 'bat_crack') dugoutAudio.playBatCrack();
      if (line.soundEffect === 'cheer') dugoutAudio.playCrowdRoar(2.5, 0.9);

      if (line.audioBase64) {
        await dugoutAudio.playBase64Audio(line.audioBase64);
      } else {
        // Request backend Gemini 3.8 TTS
        setIsSynthesizing(true);
        const res = await safeFetchJson<any>('/api/generate-tts', {
          method: 'POST',
          body: JSON.stringify({
            text: line.callText,
            voiceName: selectedVoice,
            styleDescription: `${selectedPersonality.name}, excitement level ${excitementLevel}`,
          }),
        });
        setIsSynthesizing(false);

        if (res.data?.success && res.data?.audioBase64) {
          line.audioBase64 = res.data.audioBase64;
          await dugoutAudio.playBase64Audio(res.data.audioBase64);
        } else {
          // Instant Web Speech fallback
          await dugoutAudio.speakFallback(line.callText, {
            rate: tempo,
            pitch: excitementLevel > 1.2 ? 1.2 : 1.0,
            speaker: line.speaker,
          });
        }
      }
    } catch {
      await dugoutAudio.speakFallback(line.callText, { rate: tempo });
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleCustomSpeak = async () => {
    if (!customCallInput.trim()) return;
    const newLine: CommentaryLine = {
      id: `custom_${Date.now()}`,
      timestamp: 'LIVE',
      timeSeconds: 0,
      speaker: 'play_by_play',
      speakerName: selectedPersonality.leadVoice,
      callText: customCallInput,
      emotion: 'electric',
      crowdEnergy: 80,
      isCustomGenerated: true,
    };
    onAddCommentaryLine(newLine);
    setCustomCallInput('');
    handlePlayLine(newLine);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
      {/* Booth Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white font-display">
              Broadcast Booth & Announcer Persona
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure commentator personalities, delivery cadence, and dual-speaker booth audio.
          </p>
        </div>

        {/* Rapid Generation Button using gemini-3.1-flash-lite */}
        <button
          onClick={onFastGenerateCall}
          disabled={isGeneratingFastCall}
          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
          title="Generates instant low-latency line using gemini-3.1-flash-lite"
        >
          <Zap className="w-3.5 h-3.5 fill-slate-950" />
          <span>{isGeneratingFastCall ? 'Generating Line...' : 'Flash Live Call'}</span>
        </button>
      </div>

      {/* Commentator Persona Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Broadcast Announcer Style
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {personalities.map((p) => {
            const isSelected = selectedPersonality.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPersonality(p)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-amber-500/80 bg-amber-500/10 shadow-sm'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white font-display">
                    {p.name}
                  </span>
                  {isSelected && (
                    <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </div>
                <div className="text-[11px] text-amber-400/90 font-medium mb-1">
                  {p.badge}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Tuning Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs">
        {/* Prebuilt Voice Name */}
        <div className="space-y-1.5">
          <label className="text-slate-400 font-medium">Gemini 3.8 Voice</label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-400"
          >
            <option value="Puck">Puck (Energetic Lead TV)</option>
            <option value="Charon">Charon (Deep Analytical)</option>
            <option value="Kore">Kore (Articulate Female Color)</option>
            <option value="Fenrir">Fenrir (Loud Passionate Homer)</option>
            <option value="Zephyr">Zephyr (Smooth Radio Cadence)</option>
          </select>
        </div>

        {/* Pacing / Tempo */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Delivery Tempo:</span>
            <span className="text-white font-mono">{tempo.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min={0.8}
            max={1.4}
            step={0.05}
            value={tempo}
            onChange={(e) => setTempo(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Excitement Multiplier */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Excitement Level:</span>
            <span className="text-amber-400 font-mono flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
              {excitementLevel.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={0.8}
            max={1.8}
            step={0.1}
            value={excitementLevel}
            onChange={(e) => setExcitementLevel(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Manual Custom Line Prompter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Live Prompter Overrule (Type any line for immediate on-air broadcast)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customCallInput}
            onChange={(e) => setCustomCallInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomSpeak()}
            placeholder="e.g. Swung on and belted deep to the left field corner!"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            onClick={handleCustomSpeak}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Call Live</span>
          </button>
        </div>
      </div>

      {/* Play-by-Play Timeline Log */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Scripted Play Calls
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            {commentaryTimeline.length} cue points
          </span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {commentaryTimeline.map((line) => (
            <div
              key={line.id}
              className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 flex items-start justify-between gap-3 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                    {line.timestamp}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {line.speakerName}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    · {line.speaker === 'play_by_play' ? 'Play-by-Play' : 'Color Analyst'}
                  </span>
                  {line.soundEffect && (
                    <span className="text-[10px] text-amber-400/80 italic">
                      [{line.soundEffect}]
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "{line.callText}"
                </p>
              </div>

              <button
                onClick={() => handlePlayLine(line)}
                disabled={isPlayingAudio || isSynthesizing}
                className="p-2 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-all shrink-0"
                title="Play Audio Call"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
