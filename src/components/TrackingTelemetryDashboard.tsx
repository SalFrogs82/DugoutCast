import React from 'react';
import {
  Activity,
  Compass,
  Crosshair,
  Gauge,
  Layers,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { GameClipScenario } from '../types/broadcast';

interface TrackingTelemetryDashboardProps {
  scenario: GameClipScenario;
}

export const TrackingTelemetryDashboard: React.FC<TrackingTelemetryDashboardProps> = ({
  scenario,
}) => {
  const pitch = scenario.pitchDetails;
  const hit = scenario.hitDetails;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white font-display">
            Computer Vision Ball & Player Telemetry
          </h3>
        </div>
        <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          CV Optics Active (60 FPS)
        </span>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium mb-1">
            Pitch Velocity
          </div>
          <div className="text-xl font-bold text-white font-mono tabular-nums">
            {pitch.speedMph} <span className="text-xs font-normal text-slate-400">MPH</span>
          </div>
          <div className="text-[10px] text-amber-400 font-medium mt-1">
            {pitch.type} ({pitch.spinRpm} RPM)
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium mb-1">
            Exit Velocity
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
            {hit.exitVelocityMph} <span className="text-xs font-normal text-slate-400">MPH</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">
            Launch: {hit.launchAngleDeg}°
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium mb-1">
            Vertical Rise
          </div>
          <div className="text-xl font-bold text-sky-400 font-mono tabular-nums">
            +{pitch.breakInches}"
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">
            Hop over bat barrel
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium mb-1">
            Play Result
          </div>
          <div className="text-xs font-bold text-white font-display truncate mt-1">
            {hit.result}
          </div>
          <div className="text-[10px] text-slate-400 font-medium truncate mt-1">
            {hit.direction}
          </div>
        </div>
      </div>

      {/* Visual Strike Zone and Field Spray Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Strike Zone Target Visualizer */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col items-center">
          <div className="text-xs font-bold text-slate-300 font-display mb-3 self-start">
            Pitch Location in Strike Zone
          </div>

          <div className="relative w-36 h-44 border-2 border-amber-500/80 rounded-md bg-slate-900/80 flex flex-col justify-between p-1">
            {/* 3x3 Grid Lines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
              <div className="border-r border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-r border-b border-white/10 bg-amber-500/10" />
              <div className="border-b border-white/10" />
              <div className="border-r border-white/10" />
              <div className="border-r border-white/10" />
              <div className="" />
            </div>

            {/* Ball Impact Point Indicator */}
            <div className="absolute top-[28%] right-[32%] w-5 h-5 rounded-full bg-[#ccff00] border-2 border-slate-950 shadow-lg flex items-center justify-center animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            </div>

            <div className="text-[9px] text-slate-400 text-center uppercase tracking-wider font-mono self-center mt-auto">
              Thigh-High Riseball
            </div>
          </div>
        </div>

        {/* Infield Shift Diagram */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
          <div className="text-xs font-bold text-slate-300 font-display mb-3">
            Defensive Positioning & Vector Path
          </div>

          <div className="relative flex-1 min-h-[140px] bg-slate-900/60 rounded-lg p-3 flex flex-col justify-between">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Second Base: In-Step</span>
              <span className="text-emerald-400 font-semibold">Shortstop: Shaded Middle</span>
            </div>

            {/* Diamond Graphic */}
            <div className="relative w-28 h-28 mx-auto my-2 border border-slate-700 rotate-45 flex items-center justify-center">
              {/* Home Plate */}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-white -translate-x-1/2 -translate-y-1/2" />
              {/* 1st Base */}
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-400 -translate-x-1/2 translate-y-1/2" />
              {/* 2nd Base */}
              <div className="absolute top-0 left-0 w-2.5 h-2.5 bg-amber-400 translate-x-1/2 translate-y-1/2" />
              {/* 3rd Base */}
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-amber-400 translate-x-1/2 -translate-y-1/2" />
              {/* Ball Trajectory Arrow */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-0.5 bg-gradient-to-r from-amber-400 to-red-500 -rotate-45" />
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center leading-normal">
              Sharp grounder drove 68.2 MPH through middle infield cutoff pocket
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
