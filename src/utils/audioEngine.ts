/**
 * DugoutCast Audio Engine
 * Combines Web Audio API spatial acoustics, crowd ambiance, bat crack,
 * glove pop, organ stings, and Gemini TTS / Speech Synthesis for broadcast realism.
 */

class DugoutAudioEngine {
  private ctx: AudioContext | null = null;
  private crowdGainNode: GainNode | null = null;
  private crowdFilter: BiquadFilterNode | null = null;
  private crowdNoiseSource: AudioBufferSourceNode | null = null;
  private isCrowdPlaying = false;
  private masterGain: GainNode | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;

  private initContext() {
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
          this.masterGain.connect(this.ctx.destination);
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('AudioContext init non-fatal:', e);
    }
  }

  // 1. Crack of the composite softball bat
  public playBatCrack(volume = 0.9) {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;
      
      // High-pitched explosive transient (composite carbon fiber snap)
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.05);

      oscGain.gain.setValueAtTime(volume * 0.9, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.09);

      // Resonant white noise burst
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.025));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2600, now);
      noiseFilter.Q.setValueAtTime(3.5, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(volume * 1.1, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(now);
      noise.stop(now + 0.13);
    } catch (e) {
      console.warn('Bat crack sound non-fatal:', e);
    }
  }

  // 2. Leather glove catch pop (thud of 12-inch softball pocket)
  public playGloveCatch(volume = 0.7) {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.07);

      gain.gain.setValueAtTime(volume * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      console.warn('Glove catch sound non-fatal:', e);
    }
  }

  // 3. Stadium crowd roar and cheering
  public playCrowdRoar(duration = 2.5, intensity = 0.8) {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;
      const safeDuration = Math.max(0.5, Math.min(6.0, duration));
      const bufferSize = Math.floor(this.ctx.sampleRate * safeDuration);
      const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
      
      // Stereo pink noise for crowd rumble
      for (let c = 0; c < 2; c++) {
        const data = buffer.getChannelData(c);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          data[i] = (b0 + b1 + b2) * 0.25;
        }
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.linearRampToValueAtTime(1800, now + 0.4);
      filter.frequency.linearRampToValueAtTime(700, now + safeDuration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(intensity * 0.7, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + safeDuration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + safeDuration);
    } catch (e) {
      console.warn('Crowd roar non-fatal:', e);
    }
  }

  // 4. Background stadium murmur loop
  public startAmbientCrowd(level = 0.15) {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isCrowdPlaying) return;

    const length = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      let last = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    }

    this.crowdNoiseSource = this.ctx.createBufferSource();
    this.crowdNoiseSource.buffer = buffer;
    this.crowdNoiseSource.loop = true;

    this.crowdFilter = this.ctx.createBiquadFilter();
    this.crowdFilter.type = 'bandpass';
    this.crowdFilter.frequency.value = 800;
    this.crowdFilter.Q.value = 1.0;

    this.crowdGainNode = this.ctx.createGain();
    this.crowdGainNode.gain.setValueAtTime(level, this.ctx.currentTime);

    this.crowdNoiseSource.connect(this.crowdFilter);
    this.crowdFilter.connect(this.crowdGainNode);
    this.crowdGainNode.connect(this.masterGain);

    this.crowdNoiseSource.start();
    this.isCrowdPlaying = true;
  }

  public setCrowdLevel(level: number) {
    if (this.crowdGainNode && this.ctx) {
      this.crowdGainNode.gain.setTargetAtTime(Math.max(0, Math.min(1, level)), this.ctx.currentTime, 0.1);
    }
  }

  public stopAmbientCrowd() {
    if (this.crowdNoiseSource) {
      try {
        this.crowdNoiseSource.stop();
        this.crowdNoiseSource.disconnect();
      } catch {}
      this.crowdNoiseSource = null;
      this.isCrowdPlaying = false;
    }
  }

  // 5. Classic Ballpark Organ sting ("Charge!" or celebratory fanfare)
  public playOrganFanfare() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    // F - A - C - F arpeggio then high F sustain ("Charge!")
    const notes = [
      { f: 349.23, t: 0.0, d: 0.12 },
      { f: 440.00, t: 0.12, d: 0.12 },
      { f: 523.25, t: 0.24, d: 0.12 },
      { f: 698.46, t: 0.36, d: 0.45 },
    ];

    notes.forEach((note) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, now + note.t);

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now + note.t);

      gain.gain.setValueAtTime(0.01, now + note.t);
      gain.gain.linearRampToValueAtTime(0.18, now + note.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + note.t);
      osc.stop(now + note.t + note.d);
    });
  }

  // 6. Play base64 WAV audio (from Gemini TTS)
  public async playBase64Audio(base64Wav: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.currentAudioElement) {
          this.currentAudioElement.pause();
          this.currentAudioElement = null;
        }

        const audio = new Audio(`data:audio/wav;base64,${base64Wav}`);
        this.currentAudioElement = audio;

        audio.onended = () => {
          this.currentAudioElement = null;
          resolve();
        };

        audio.onerror = (e) => {
          this.currentAudioElement = null;
          reject(e);
        };

        audio.play().catch(reject);
      } catch (err) {
        reject(err);
      }
    });
  }

  // 7. High-quality browser SpeechSynthesis fallback
  public speakFallback(
    text: string,
    options?: { pitch?: number; rate?: number; speaker?: 'play_by_play' | 'color_analyst' | 'dugout_reporter' }
  ): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
          resolve();
          return;
        }

        const cleanText = (text || '')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
          .replace(/[<>{}[\]]/g, '')
          .trim();

        if (!cleanText) {
          resolve();
          return;
        }

        try {
          window.speechSynthesis.cancel();
        } catch {}

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.pitch = Math.max(0.5, Math.min(2.0, options?.pitch ?? (options?.speaker === 'color_analyst' ? 1.25 : options?.speaker === 'dugout_reporter' ? 1.15 : 1.05)));
        utterance.rate = Math.max(0.5, Math.min(2.0, options?.rate ?? (options?.speaker === 'play_by_play' ? 1.15 : 1.0)));

        try {
          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            if (options?.speaker === 'color_analyst') {
              const femaleVoice = voices.find(v => v.lang && v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Zira') || v.name.includes('Google UK English Female')));
              if (femaleVoice) utterance.voice = femaleVoice;
            } else {
              const maleVoice = voices.find(v => v.lang && v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('David') || v.name.includes('Google US English')));
              if (maleVoice) utterance.voice = maleVoice;
            }
          }
        } catch {}

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);
      } catch {
        resolve();
      }
    });
  }

  public stopAllSpeech() {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const dugoutAudio = new DugoutAudioEngine();
