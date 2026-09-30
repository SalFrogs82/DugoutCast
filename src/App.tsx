import React, { useState, useEffect } from 'react';
import { TopNavigation } from './components/TopNavigation';
import { VideoTrackingPlayer } from './components/VideoTrackingPlayer';
import { CommentatorBoothPanel } from './components/CommentatorBoothPanel';
import { BroadcastTeamShowcase } from './components/BroadcastTeamShowcase';
import { TrackingTelemetryDashboard } from './components/TrackingTelemetryDashboard';
import { DeepThinkingAnalysisModal } from './components/DeepThinkingAnalysisModal';
import { LiveVoiceBoothModal } from './components/LiveVoiceBoothModal';
import { VideoUploadModal } from './components/VideoUploadModal';
import { GAME_SCENARIOS, COMMENTATOR_PERSONALITIES } from './data/mockScenarios';
import { GameClipScenario, CommentatorPersonality, CommentaryLine } from './types/broadcast';
import { dugoutAudio } from './utils/audioEngine';
import { safeFetchJson } from './utils/api';
import {
  Sparkles,
  Zap,
  Radio,
  Sliders,
  Play,
  Volume2,
  Share2,
  Download,
  Info,
} from 'lucide-react';

export default function App() {
  // Navigation & Active View
  const [activeTab, setActiveTab] = useState<'broadcast' | 'tracking' | 'booth_settings' | 'ai_intelligence'>('broadcast');

  // Scenario & Video State
  const [currentScenario, setCurrentScenario] = useState<GameClipScenario>(GAME_SCENARIOS[0]);
  const [customVideoFile, setCustomVideoFile] = useState<File | null>(null);
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);

  // Playback State
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Commentator & Audio State
  const [selectedPersonality, setSelectedPersonality] = useState<CommentatorPersonality>(COMMENTATOR_PERSONALITIES[0]);
  const [selectedVoice, setSelectedVoice] = useState<string>(COMMENTATOR_PERSONALITIES[0].leadVoice);
  const [tempo, setTempo] = useState<number>(1.1);
  const [excitementLevel, setExcitementLevel] = useState<number>(1.2);
  const [crowdVolume, setCrowdVolume] = useState<number>(0.5);

  // Active Commentary Lines
  const [commentaryTimeline, setCommentaryTimeline] = useState<CommentaryLine[]>(GAME_SCENARIOS[0].defaultScript);
  const [activeCommentaryLine, setActiveCommentaryLine] = useState<CommentaryLine | null>(null);

  // AI & Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isThinkingModalOpen, setIsThinkingModalOpen] = useState<boolean>(false);
  const [isLiveVoiceModalOpen, setIsLiveVoiceModalOpen] = useState<boolean>(false);

  // Deep Analysis & Fast Call Loading
  const [isAnalyzingDeep, setIsAnalyzingDeep] = useState<boolean>(false);
  const [deepAnalysisResult, setDeepAnalysisResult] = useState<any>(null);
  const [isGeneratingFastCall, setIsGeneratingFastCall] = useState<boolean>(false);
  const [isTestingDualBooth, setIsTestingDualBooth] = useState<boolean>(false);

  // Image Assets generated
  const leadAvatar = '/src/assets/images/analyst_headshot_lead_1790761042221.jpg';
  const colorAvatar = '/src/assets/images/analyst_headshot_color_1790761052099.jpg';

  // Synchronize active commentary line based on video time
  useEffect(() => {
    let currentLine: CommentaryLine | null = null;
    for (let i = 0; i < commentaryTimeline.length; i++) {
      if (currentTime >= commentaryTimeline[i].timeSeconds) {
        currentLine = commentaryTimeline[i];
      }
    }
    setActiveCommentaryLine(currentLine);
  }, [currentTime, commentaryTimeline]);

  // Handle Scenario Switch
  const handleSelectScenario = (scenario: GameClipScenario) => {
    setCurrentScenario(scenario);
    setCommentaryTimeline(scenario.defaultScript);
    setCurrentTime(0);
    setIsPlaying(false);
    setCustomVideoFile(null);
    setCustomVideoUrl(null);
  };

  // Handle Custom Video Upload
  const handleUploadCustomVideo = async (file: File, url: string, extractedFrames: string[]) => {
    setCustomVideoFile(file);
    setCustomVideoUrl(url);
    setCurrentTime(0);
    setIsPlaying(false);

    // Call Gemini 3.1 Pro to analyze the custom video frames
    if (extractedFrames.length > 0) {
      setIsAnalyzingDeep(true);
      try {
        const res = await safeFetchJson<any>('/api/analyze-video', {
          method: 'POST',
          body: JSON.stringify({
            videoFrames: extractedFrames,
            gameMetadata: {
              teams: file.name.replace(/\.[^/.]+$/, ''),
              situation: 'Softball Game Footage Uploaded',
            },
            commentatorStyle: selectedPersonality.name,
          }),
        });
        if (res.data?.success && res.data?.analysis) {
          setDeepAnalysisResult(res.data);
          if (Array.isArray(res.data.analysis.commentaryEvents) && res.data.analysis.commentaryEvents.length > 0) {
            const mappedScript: CommentaryLine[] = res.data.analysis.commentaryEvents.map((evt: any, idx: number) => ({
              id: `evt_${idx}`,
              timestamp: evt.timestamp || `00:0${idx * 2}`,
              timeSeconds: evt.timeSeconds || idx * 2.5,
              speaker: evt.speaker || 'play_by_play',
              speakerName: evt.speaker === 'color_analyst' ? 'Jessica Vance' : 'Dan Miller',
              callText: evt.callText,
              emotion: evt.emotion || 'electric',
              crowdEnergy: evt.crowdEnergy || 75,
              soundEffect: idx === 1 ? 'bat_crack' : idx === 2 ? 'cheer' : undefined,
            }));
            setCommentaryTimeline(mappedScript);
          }
        }
      } catch (err) {
        console.warn('Analysis completed with fallback:', err);
      } finally {
        setIsAnalyzingDeep(false);
      }
    }
  };

  // Rapid Live Call Generation with gemini-3.1-flash-lite
  const handleFastGenerateCall = async () => {
    setIsGeneratingFastCall(true);
    const fallbackCall = "Vasquez drives a sharp bounding ball up the middle past second base—SAFE at first!";
    try {
      const res = await safeFetchJson<{ success: boolean; commentaryLine: string }>(
        '/api/fast-commentary',
        {
          method: 'POST',
          body: JSON.stringify({
            currentEvent: 'Vasquez hustling to 2nd, throw bounces, safe call!',
            snapshotDescription: 'Top 7th, 2-2 tie game leadoff runner safe',
            commentatorStyle: selectedPersonality.name,
            previousCall: activeCommentaryLine?.callText || '',
          }),
        },
        { success: true, commentaryLine: fallbackCall }
      );

      const callText = res.data?.commentaryLine || fallbackCall;
      const newLine: CommentaryLine = {
        id: `fast_${Date.now()}`,
        timestamp: `00:${Math.floor(currentTime).toString().padStart(2, '0')}`,
        timeSeconds: currentTime,
        speaker: 'play_by_play',
        speakerName: selectedPersonality.leadVoice === 'Puck' ? 'Dan Miller' : selectedPersonality.name,
        callText: callText,
        emotion: 'electric',
        crowdEnergy: 90,
        soundEffect: 'cheer',
        isCustomGenerated: true,
      };

      setCommentaryTimeline((prev) => [...prev, newLine]);
      dugoutAudio.playCrowdRoar(2.0, 0.85);

      // Speak aloud
      dugoutAudio.speakFallback(callText, {
        rate: tempo,
        pitch: 1.15,
        speaker: 'play_by_play',
      });
    } catch (err) {
      console.warn('Fast commentary fallback active:', err);
      const newLine: CommentaryLine = {
        id: `fast_${Date.now()}`,
        timestamp: `00:${Math.floor(currentTime).toString().padStart(2, '0')}`,
        timeSeconds: currentTime,
        speaker: 'play_by_play',
        speakerName: 'Dan Miller',
        callText: fallbackCall,
        emotion: 'electric',
        crowdEnergy: 90,
        soundEffect: 'cheer',
        isCustomGenerated: true,
      };
      setCommentaryTimeline((prev) => [...prev, newLine]);
      dugoutAudio.playCrowdRoar(2.0, 0.85);
      dugoutAudio.speakFallback(fallbackCall, { rate: tempo, pitch: 1.15, speaker: 'play_by_play' });
    } finally {
      setIsGeneratingFastCall(false);
    }
  };

  // Trigger Deep Thinking Analysis with gemini-3.1-pro-preview
  const handleTriggerDeepThinking = async () => {
    setIsAnalyzingDeep(true);
    setIsThinkingModalOpen(true);
    try {
      const res = await safeFetchJson<any>('/api/analyze-video', {
        method: 'POST',
        body: JSON.stringify({
          gameMetadata: currentScenario.situation,
          commentatorStyle: selectedPersonality.name,
        }),
      });
      if (res.data?.success) {
        setDeepAnalysisResult(res.data);
      }
    } catch (err) {
      console.warn('Deep thinking analysis notice:', err);
    } finally {
      setIsAnalyzingDeep(false);
    }
  };

  // Test Dual Booth Banter with gemini-3.5-flash
  const handleTestDualBooth = async () => {
    setIsTestingDualBooth(true);
    try {
      const res = await safeFetchJson<any>('/api/broadcast-script', {
        method: 'POST',
        body: JSON.stringify({
          playSummary: 'N. Vasquez leadoff infield single to short in the 7th inning of a 2-2 game',
          gameSituation: `${currentScenario.situation.inning}, ${currentScenario.situation.awayTeam} vs ${currentScenario.situation.homeTeam}`,
          style: selectedPersonality.name,
        }),
      });

      if (res.data?.success && res.data?.script?.dialogue?.length > 0) {
        const d1 = res.data.script.dialogue[0];
        const d2 = res.data.script.dialogue[1];

        if (d1) {
          await dugoutAudio.speakFallback(d1.text, { speaker: 'play_by_play', rate: 1.1 });
        }
        if (d2) {
          await dugoutAudio.speakFallback(d2.text, { speaker: 'color_analyst', rate: 1.05 });
        }
      } else {
        await dugoutAudio.speakFallback('Vasquez puts it in play, hustle pays off big time!', { speaker: 'play_by_play' });
        await dugoutAudio.speakFallback('And Dan, notice how she stayed inside that high riseball—classic situational hitting!', { speaker: 'color_analyst' });
      }
    } catch (err) {
      console.warn('Booth test notice:', err);
    } finally {
      setIsTestingDualBooth(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar adhering to Top Bar Contract */}
      <TopNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenLiveVoice={() => setIsLiveVoiceModalOpen(true)}
        isBroadcasting={isPlaying}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Editorial Sub-Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-900">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
              {currentScenario.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>Fastpitch Softball Broadcast</span>
              <span>·</span>
              <span className="text-amber-400 font-medium">{currentScenario.situation.inning}</span>
              <span>·</span>
              <span>Count: {currentScenario.situation.count}</span>
              <span>·</span>
              <span className="text-slate-300">Style: {selectedPersonality.name}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerDeepThinking}
              className="px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-amber-300 flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Thinking Mode (Pro)</span>
            </button>

            <button
              onClick={handleFastGenerateCall}
              disabled={isGeneratingFastCall}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>{isGeneratingFastCall ? 'Calling...' : 'Flash Play Call'}</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Live Broadcast (Default Primary View) */}
        {activeTab === 'broadcast' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Columns: Video Player & Computer Vision Tracking HUD */}
            <div className="lg:col-span-8 space-y-6">
              <VideoTrackingPlayer
                scenario={currentScenario}
                activeCommentary={activeCommentaryLine}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                playbackSpeed={playbackSpeed}
                setPlaybackSpeed={setPlaybackSpeed}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                customVideoFile={customVideoFile}
                customVideoUrl={customVideoUrl}
              />

              {/* On-Air Broadcast Team Banner */}
              <BroadcastTeamShowcase
                leadAvatarUrl={leadAvatar}
                colorAvatarUrl={colorAvatar}
                activePersonality={selectedPersonality}
                onTestDualBooth={handleTestDualBooth}
                isTestingDualBooth={isTestingDualBooth}
              />
            </div>

            {/* Right 4 Columns: Announcer Booth Tuning & Live Call Log */}
            <div className="lg:col-span-4 space-y-6">
              <CommentatorBoothPanel
                personalities={COMMENTATOR_PERSONALITIES}
                selectedPersonality={selectedPersonality}
                onSelectPersonality={(p) => {
                  setSelectedPersonality(p);
                  setSelectedVoice(p.leadVoice);
                  setTempo(p.tempoMultiplier);
                  setExcitementLevel(p.excitementBoost);
                }}
                commentaryTimeline={commentaryTimeline}
                onAddCommentaryLine={(line) => setCommentaryTimeline((prev) => [...prev, line])}
                onFastGenerateCall={handleFastGenerateCall}
                isGeneratingFastCall={isGeneratingFastCall}
                selectedVoice={selectedVoice}
                setSelectedVoice={setSelectedVoice}
                tempo={tempo}
                setTempo={setTempo}
                excitementLevel={excitementLevel}
                setExcitementLevel={setExcitementLevel}
                crowdVolume={crowdVolume}
                setCrowdVolume={setCrowdVolume}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Ball & Player Tracking Dashboard */}
        {activeTab === 'tracking' && (
          <div className="space-y-6">
            <VideoTrackingPlayer
              scenario={currentScenario}
              activeCommentary={activeCommentaryLine}
              currentTime={currentTime}
              setCurrentTime={setCurrentTime}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              playbackSpeed={playbackSpeed}
              setPlaybackSpeed={setPlaybackSpeed}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              customVideoFile={customVideoFile}
              customVideoUrl={customVideoUrl}
            />
            <TrackingTelemetryDashboard scenario={currentScenario} />
          </div>
        )}

        {/* Tab 3: Booth Settings & Voice Customization */}
        {activeTab === 'booth_settings' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <CommentatorBoothPanel
              personalities={COMMENTATOR_PERSONALITIES}
              selectedPersonality={selectedPersonality}
              onSelectPersonality={(p) => {
                setSelectedPersonality(p);
                setSelectedVoice(p.leadVoice);
                setTempo(p.tempoMultiplier);
                setExcitementLevel(p.excitementBoost);
              }}
              commentaryTimeline={commentaryTimeline}
              onAddCommentaryLine={(line) => setCommentaryTimeline((prev) => [...prev, line])}
              onFastGenerateCall={handleFastGenerateCall}
              isGeneratingFastCall={isGeneratingFastCall}
              selectedVoice={selectedVoice}
              setSelectedVoice={setSelectedVoice}
              tempo={tempo}
              setTempo={setTempo}
              excitementLevel={excitementLevel}
              setExcitementLevel={setExcitementLevel}
              crowdVolume={crowdVolume}
              setCrowdVolume={setCrowdVolume}
            />
            <BroadcastTeamShowcase
              leadAvatarUrl={leadAvatar}
              colorAvatarUrl={colorAvatar}
              activePersonality={selectedPersonality}
              onTestDualBooth={handleTestDualBooth}
              isTestingDualBooth={isTestingDualBooth}
            />
          </div>
        )}

        {/* Tab 4: Strategic High Thinking Intelligence */}
        {activeTab === 'ai_intelligence' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-white font-display">
                      Gemini 3.1 Pro Thinking Mode Video Intelligence
                    </h2>
                    <p className="text-xs text-slate-400">
                      Evaluates high-order tactical nuance, pitch tunneling, swing physics, and baserunning jumps.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleTriggerDeepThinking}
                  disabled={isAnalyzingDeep}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{isAnalyzingDeep ? 'Thinking...' : 'Run High Thinking Model'}</span>
                </button>
              </div>

              {/* Tactical Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Situational Count Context
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentScenario.deepThinkingInsight.tacticalContext}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                    Pitch Selection & Tunneling
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentScenario.deepThinkingInsight.pitchSelectionReasoning}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Batter Mechanical Adjustment
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentScenario.deepThinkingInsight.batterTendency}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Defensive Range & Baserunning Hustle
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentScenario.deepThinkingInsight.defensiveExecution}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <VideoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSelectScenario={handleSelectScenario}
        onUploadCustomVideo={handleUploadCustomVideo}
      />

      <DeepThinkingAnalysisModal
        isOpen={isThinkingModalOpen}
        onClose={() => setIsThinkingModalOpen(false)}
        scenario={currentScenario}
        analysisData={deepAnalysisResult}
        isAnalyzing={isAnalyzingDeep}
        onTriggerDeepAnalysis={handleTriggerDeepThinking}
      />

      <LiveVoiceBoothModal
        isOpen={isLiveVoiceModalOpen}
        onClose={() => setIsLiveVoiceModalOpen(false)}
      />
    </div>
  );
}
