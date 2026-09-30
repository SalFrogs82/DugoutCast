import React from 'react';
import {
  Mic,
  Radio,
  Volume2,
  Award,
  Sparkles,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { CommentatorPersonality } from '../types/broadcast';

interface BroadcastTeamShowcaseProps {
  leadAvatarUrl: string;
  colorAvatarUrl: string;
  activePersonality: CommentatorPersonality;
  onTestDualBooth: () => void;
  isTestingDualBooth: boolean;
}

export const BroadcastTeamShowcase: React.FC<BroadcastTeamShowcaseProps> = ({
  leadAvatarUrl,
  colorAvatarUrl,
  activePersonality,
  onTestDualBooth,
  isTestingDualBooth,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white font-display">
            On-Air Broadcast Team
          </h3>
        </div>
        <button
          onClick={onTestDualBooth}
          disabled={isTestingDualBooth}
          className="px-3 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{isTestingDualBooth ? 'Generating Banter...' : 'Play Booth Banter'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Lead Play-by-Play Announcer */}
        <div className="flex items-center gap-3.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700 relative">
            <img
              src={leadAvatarUrl}
              alt="Dan Miller"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 bg-amber-500/90 text-slate-950 text-[9px] font-bold text-center">
              PBP
            </div>
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white font-display truncate">
              Dan Miller
            </h4>
            <div className="text-[11px] text-amber-400 font-medium truncate">
              Lead Play-by-Play Broadcaster
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              Voice: {activePersonality.leadVoice} · High Energy Pacing
            </p>
          </div>
        </div>

        {/* Color Analyst */}
        <div className="flex items-center gap-3.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700 relative">
            <img
              src={colorAvatarUrl}
              alt="Jessica Vance"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 bg-sky-500/90 text-white text-[9px] font-bold text-center">
              ANALYST
            </div>
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white font-display truncate">
              Jessica Vance
            </h4>
            <div className="text-[11px] text-sky-400 font-medium truncate">
              Former WCWS Champion & Color Analyst
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              Voice: {activePersonality.colorVoice} · Spin & Pitch Mechanics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
