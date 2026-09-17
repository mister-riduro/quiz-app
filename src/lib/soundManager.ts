import { Howl } from 'howler';

export type SoundEffectKey = 'correct' | 'wrong' | 'tap' | 'pop' | 'balloon_pop' | 'victory';

type SoundListener = (isMuted: boolean, volume: number) => void;

/**
 * SoundManager: Instant tactile & gamified audio feedback system
 * Combines Howler.js for audio assets with Web Audio API frequency synthesis as a zero-crash fallback.
 */
class SoundManager {
  private howlerSounds: Map<SoundEffectKey, Howl> = new Map();
  private audioCtx: AudioContext | null = null;
  private muted: boolean = false;
  private volume: number = 0.7;
  private listeners: Set<SoundListener> = new Set();

  constructor() {
    // Attempt registering asset paths if available in project
    this.registerAssetHowler('correct', '/assets/audio/correct.mp3');
    this.registerAssetHowler('wrong', '/assets/audio/wrong.mp3');
    this.registerAssetHowler('tap', '/assets/audio/click.mp3');
    this.registerAssetHowler('pop', '/assets/audio/pop.mp3');
    this.registerAssetHowler('balloon_pop', '/assets/audio/balloon_pop.mp3');
    this.registerAssetHowler('victory', '/assets/audio/fanfare.mp3');
  }

  private registerAssetHowler(key: SoundEffectKey, src: string) {
    try {
      const sound = new Howl({
        src: [src],
        preload: false, // Lazy load asset on demand
        volume: this.volume,
        onloaderror: () => {
          // If file does not exist, silence Howler and allow Web Audio fallback
          this.howlerSounds.delete(key);
        },
      });
      this.howlerSounds.set(key, sound);
    } catch {
      // Ignore initial setup errors
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Pure Web Audio API Synthesis fallback for Duolingo-style SFX
   */
  private synthesizeSound(key: SoundEffectKey) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume, now);
    masterGain.connect(ctx.destination);

    switch (key) {
      case 'tap': {
        // Crisp tactile button click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.04);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }

      case 'pop': {
        // Cheerful bubble pop for letters and badges
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.07);
        break;
      }

      case 'correct': {
        // Uplifting Duolingo bell chime (C5 -> E5 -> G5 -> C6 arpeggio)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const noteTime = now + idx * 0.075;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0, noteTime);
          gain.gain.linearRampToValueAtTime(0.28, noteTime + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(noteTime);
          osc.stop(noteTime + 0.28);
        });
        break;
      }

      case 'wrong': {
        // Soft, non-punitive descending buzzer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }

      case 'balloon_pop': {
        // Realistic balloon pop (noise burst + resonant bandpass)
        const bufferSize = ctx.sampleRate * 0.08;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.Q.setValueAtTime(3, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        noise.start(now);
        noise.stop(now + 0.08);
        break;
      }

      case 'victory': {
        // Joyful fanfare: C5 -> G5 -> C6 with brass resonance
        const fanfareNotes = [
          { f: 523.25, t: 0, d: 0.12 },
          { f: 659.25, t: 0.12, d: 0.12 },
          { f: 783.99, t: 0.24, d: 0.12 },
          { f: 1046.5, t: 0.36, d: 0.6 },
        ];

        fanfareNotes.forEach(({ f, t, d }) => {
          const noteTime = now + t;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, noteTime);

          gain.gain.setValueAtTime(0, noteTime);
          gain.gain.linearRampToValueAtTime(0.3, noteTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + d);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(noteTime);
          osc.stop(noteTime + d);
        });
        break;
      }
    }
  }

  /**
   * Main play method
   */
  play(key: SoundEffectKey) {
    if (this.muted) return;

    const howler = this.howlerSounds.get(key);
    if (howler && howler.state() === 'loaded') {
      howler.volume(this.volume);
      howler.play();
    } else {
      // Instant synthesized sound fallback
      this.synthesizeSound(key);
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.howlerSounds.forEach((sound) => sound.volume(this.volume));
    this.notifyListeners();
  }

  getVolume(): number {
    return this.volume;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.notifyListeners();
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  subscribe(listener: SoundListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.muted, this.volume));
  }
}

export const soundManager = new SoundManager();
export default soundManager;

