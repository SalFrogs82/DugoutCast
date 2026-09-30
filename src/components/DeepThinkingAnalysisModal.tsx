import React from 'react';
import {
  Sparkles,
  Brain,
  X,
  Target,
  Activity,
  Layers,
  CheckCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { GameClipScenario } from '../types/broadcast';

interface DeepThinkingAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: GameClipScenario;
  analysisData: any;
  isAnalyzing: boolean;
  onTriggerDeepAnalysis: () => void;
}

export const DeepThinkingAnalysisModal: React.FC<DeepThinkingAnalysisModalProps> = ({
  isOpen,
  onClose,
  scenario,
  analysisData,
  isAnalyzing,
  onTriggerDeepAnalysis,
}) => {
  if (!isOpen) return null;

  const insight = scenario.deepThinkingInsight;
  const tracking = analysisData?.analysis?.tracking || scenario.pitchDetails;
  const boothSummary = analysisData?.analysis?.boothSummary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Brain className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                <span>Gemini 3.1 Pro Thinking Mode</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ThinkingLevel.HIGH
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Deep tactical fastpitch computer vision and high-order reasoning
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Pitch Physics Telemetry Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>Pitch Type</span>
              </div>
              <div className="text-base font-bold text-white font-display">
                {tracking.pitchType || scenario.pitchDetails.type}
              </div>
              <div className="text-[10px] text-amber-400/90 font-mono mt-0.5">
                {scenario.pitchDetails.breakInches}" Vertical Break
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span>Velocity & Spin</span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {tracking.estimatedSpeedMph || scenario.pitchDetails.speedMph} MPH
              </div>
              <div className="text-[10px] text-sky-400/90 font-mono mt-0.5">
                {scenario.pitchDetails.spinRpm} RPM Backspin
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exit Velocity</span>
              </div>
              <div className="text-base font-bold text-emerald-400 font-mono">
                {tracking.exitVelocityMph || scenario.hitDetails.exitVelocityMph} MPH
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {scenario.hitDetails.launchAngleDeg}° Launch Angle
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Fielding Call</span>
              </div>
              <div className="text-sm font-bold text-white truncate font-display">
                {tracking.ruling || scenario.hitDetails.result}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {scenario.hitDetails.direction}
              </div>
            </div>
          </div>

          {/* Quota Notice if Free Tier Limit reached */}
          {analysisData?.quotaWarning && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-amber-200">
                  Gemini 3.1 Pro Free-Tier Rate Limit Detected
                </div>
                <div className="text-amber-300/80 leading-relaxed text-[11px]">
                  {analysisData.quotaWarning} DugoutCast AI automatically routed your play analysis through Gemini 3.5 Flash and the fastpitch situational analytics engine so your broadcast continues uninterrupted.
                </div>
              </div>
            </div>
          )}

          {/* Deep Thinking Breakdown Cards */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  01. Situational & Game State Pressure
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {insight.tacticalContext}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  02. Pitch Selection & Tunneling Mechanics
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {insight.pitchSelectionReasoning}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  03. Batter Approach & Swing Adjustment
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {insight.batterTendency}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  04. Defensive Shift & Baserunning Velocity
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {insight.defensiveExecution}
              </p>
            </div>

            {boothSummary && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Broadcast Producer Summary ({boothSummary.headline})
                  </h4>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {boothSummary.strategicInsight}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Engine: {analysisData?.modelUsed || 'gemini-3.1-pro-preview'} · Mode: {analysisData?.thinkingMode || 'HIGH'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onTriggerDeepAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>{isAnalyzing ? 'Thinking Deeply...' : 'Re-Analyze with Thinking'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
