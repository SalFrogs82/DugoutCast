import React from 'react';
import { Radio, Mic, Sparkles, Layers } from 'lucide-react';

interface TopNavigationProps {
  activeTab: 'broadcast' | 'tracking' | 'booth_settings' | 'ai_intelligence';
  setActiveTab: (tab: 'broadcast' | 'tracking' | 'booth_settings' | 'ai_intelligence') => void;
  onOpenUpload: () => void;
  onOpenLiveVoice: () => void;
  isBroadcasting: boolean;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  onOpenLiveVoice,
  isBroadcasting,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-xl font-bold tracking-tight text-white font-display flex items-center gap-2.5"
          >
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Radio className="w-4 h-4" />
            </span>
            <span>DugoutCast AI</span>
          </a>
          <span className="text-xs text-slate-400 hidden sm:inline-block">
            Fastpitch Broadcast Engine
          </span>
        </div>

        {/* Zone 2: 4-5 clean text navigation links with subtle hover underlines */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`transition-colors relative py-1 ${
              activeTab === 'broadcast'
                ? 'text-amber-400 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            Live Broadcast
            {activeTab === 'broadcast' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`transition-colors relative py-1 ${
              activeTab === 'tracking'
                ? 'text-amber-400 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            Ball & Player Tracking
            {activeTab === 'tracking' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('booth_settings')}
            className={`transition-colors relative py-1 ${
              activeTab === 'booth_settings'
                ? 'text-amber-400 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            Commentator Styles
            {activeTab === 'booth_settings' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('ai_intelligence')}
            className={`transition-colors relative py-1 flex items-center gap-1.5 ${
              activeTab === 'ai_intelligence'
                ? 'text-amber-400 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Strategic High Thinking
            {activeTab === 'ai_intelligence' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenLiveVoice}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white transition-all flex items-center gap-2 shrink-0"
            title="Talk in real-time with the broadcast booth via Gemini 3.8 Live API"
          >
            <Mic className="w-3.5 h-3.5 text-rose-400" />
            <span>Booth Talk Live</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium transition-all shadow-sm hover:shadow-amber-500/20 flex items-center gap-1.5 shrink-0"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Load Game Video</span>
          </button>
        </div>
      </div>
    </header>
  );
};
