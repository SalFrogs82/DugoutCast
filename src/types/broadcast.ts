export interface GameSituation {
  teams: string;
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
  inning: string; // e.g. "Top 7th"
  outs: number;
  count: string; // e.g. "0 - 0"
  pitcher: string;
  batter: string;
  pitchCount: number;
  runnersOn: { first: boolean; second: boolean; third: boolean };
}

export interface BallPoint {
  time: number; // in seconds
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
  elevation?: number; // for 3D simulated depth
  speedMph?: number;
}

export interface PlayerBounding {
  role: 'pitcher' | 'batter' | 'catcher' | 'umpire' | 'shortstop' | 'second_base' | 'runner';
  label: string;
  x: number; // percentage
  y: number; // percentage
  w: number;
  h: number;
  status?: string;
}

export interface CommentaryLine {
  id: string;
  timestamp: string; // "00:04"
  timeSeconds: number;
  speaker: 'play_by_play' | 'color_analyst' | 'dugout_reporter';
  speakerName: string;
  callText: string;
  emotion: 'anticipation' | 'electric' | 'celebration' | 'analytical' | 'tense';
  crowdEnergy: number; // 0 - 100
  soundEffect?: 'bat_crack' | 'glove_pop' | 'cheer' | 'organ';
  audioBase64?: string;
  isCustomGenerated?: boolean;
}

export interface GameClipScenario {
  id: string;
  title: string;
  league: string;
  situation: GameSituation;
  durationSeconds: number;
  thumbnailUrl: string;
  description: string;
  pitchDetails: {
    type: 'Riseball' | 'Dropball' | 'Screwball' | 'Curveball' | 'Changeup';
    speedMph: number;
    spinRpm: number;
    breakInches: number;
  };
  hitDetails: {
    contactType: 'Sharp Grounder' | 'Line Drive' | 'Deep Fly Ball' | 'Swinging Strikeout';
    exitVelocityMph: number;
    launchAngleDeg: number;
    direction: string;
    result: string;
  };
  trackingKeyframes: {
    time: number;
    ball: BallPoint;
    players: PlayerBounding[];
    eventNote?: string;
  }[];
  defaultScript: CommentaryLine[];
  deepThinkingInsight: {
    tacticalContext: string;
    pitchSelectionReasoning: string;
    batterTendency: string;
    defensiveExecution: string;
    broadcastAngle: string;
  };
}

export interface CommentatorPersonality {
  id: string;
  name: string;
  badge: string;
  description: string;
  leadVoice: 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  colorVoice: 'Kore' | 'Puck' | 'Zephyr';
  tempoMultiplier: number;
  excitementBoost: number;
  sampleCall: string;
}
