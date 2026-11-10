import { createAmbience, type Ambience } from './ambience';

export interface Sfx {
  drop(countAfter: number): void;
  pickup(count: number): void;
  capture(): void;
  /** The coin: a whoosh as it goes up, a metallic ring as it lands. */
  coinWhoosh(): void;
  coinRing(): void;
  /** A soft wooden tick for buttons. */
  tick(): void;
  /** The yard's ambience (breeze, leaves, birds); it follows the Sound setting. */
  ambience(on: boolean): void;
  /** Lowers the ambience while stones move. */
  duck(on: boolean): void;
  setEnabled(on: boolean): void;
  /** Starts or resumes audio; call from a user gesture (iOS will not play sound before one). */
  unlock(): void;
}

function defaultContext(): AudioContext | null {
  const Ctor = typeof window !== 'undefined' ? window.AudioContext : undefined;
  return Ctor ? new Ctor() : null;
}

/**
 * Stone sounds made with the Web Audio API, so there are no sound files to download or license:
 * a soft earthy thump when a stone lands, a rattle when stones are lifted, a fuller thump for a capture.
 */
export function createSfx(makeContext: () => AudioContext | null = defaultContext): Sfx {
  let ctx: AudioContext | null = null;
  let tried = false;
  let enabled = true;
  let noise: AudioBuffer | null = null;
  let ambience: Ambience | null = null;
  let ambienceWanted = false;
  let ducked = false;

  const ready = (): AudioContext | null => (enabled && ctx && ctx.state === 'running' ? ctx : null);

  /** Starts the ambience when it is wanted, allowed, possible and the page is in view; stops it otherwise. */
  const settleAmbience = () => {
    const c = ready();
    const hidden = typeof document !== 'undefined' && document.hidden;
    if (ambienceWanted && c && !hidden) {
      if (!ambience) ambience = createAmbience(c, c.destination);
      ambience.start();
      ambience.duck(ducked);
    } else ambience?.stop();
  };

  // Switching apps or tabs: the fire falls silent, and crackles again when the page is back.
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', settleAmbience);

  const noiseBuffer = (c: AudioContext) => {
    if (!noise) {
      noise = c.createBuffer(1, Math.floor(c.sampleRate * 0.2), c.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    return noise;
  };

  /** A sine that falls in pitch with a fast decay: the body of a stone hitting earth. */
  const thump = (c: AudioContext, at: number, from: number, to: number, ms: number, level: number) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(from, at);
    osc.frequency.exponentialRampToValueAtTime(to, at + ms / 1000);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(level, at + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + ms / 1000);
    osc.connect(gain).connect(c.destination);
    osc.start(at);
    osc.stop(at + ms / 1000 + 0.02);
  };

  /** A short band-passed noise burst: the grit of the stone and soil. */
  const grit = (c: AudioContext, at: number, freq: number, ms: number, level: number) => {
    const src = c.createBufferSource();
    const filter = c.createBiquadFilter();
    const gain = c.createGain();
    src.buffer = noiseBuffer(c);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, at);
    filter.Q.setValueAtTime(1.2, at);
    gain.gain.setValueAtTime(level, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + ms / 1000);
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(at);
    src.stop(at + ms / 1000 + 0.02);
  };

  const vary = (base: number, spread: number) => base + (Math.random() - 0.5) * spread;

  return {
    drop(countAfter) {
      const c = ready();
      if (!c) return;
      const t = c.currentTime;
      // A stone landing on others sounds a little higher and drier than one landing on earth.
      const from = vary(countAfter > 1 ? 185 : 150, 25);
      thump(c, t, from, from * 0.5, 80, 0.32);
      grit(c, t, vary(countAfter > 1 ? 1600 : 1000, 300), 45, countAfter > 1 ? 0.12 : 0.07);
    },
    pickup(count) {
      const c = ready();
      if (!c) return;
      for (let i = 0; i < Math.min(count, 6); i++) grit(c, c.currentTime + i * 0.025, vary(2600, 600), 25, 0.05);
    },
    capture() {
      const c = ready();
      if (!c) return;
      const t = c.currentTime;
      thump(c, t, 120, 60, 160, 0.4);
      thump(c, t + 0.03, 175, 90, 120, 0.22);
      grit(c, t, 1200, 90, 0.12);
    },
    coinWhoosh() {
      const c = ready();
      if (!c) return;
      const t = c.currentTime;
      // Noise through a band-pass that sweeps up as the coin rises.
      const src = c.createBufferSource();
      const filter = c.createBiquadFilter();
      const gain = c.createGain();
      src.buffer = noiseBuffer(c);
      src.loop = true;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, t);
      filter.frequency.exponentialRampToValueAtTime(2400, t + 0.4);
      filter.Q.setValueAtTime(2, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      src.connect(filter).connect(gain).connect(c.destination);
      src.start(t);
      src.stop(t + 0.42);
    },
    coinRing() {
      const c = ready();
      if (!c) return;
      const t = c.currentTime;
      // Three partials, a touch out of tune with each other, dying away over 0.9 s.
      for (const [hz, level] of [
        [2100 * 1.002, 0.12],
        [3300 * 0.998, 0.08],
        [5600 * 1.003, 0.05],
      ] as const) {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(hz, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(level, t + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        osc.connect(gain).connect(c.destination);
        osc.start(t);
        osc.stop(t + 0.95);
      }
    },
    tick() {
      const c = ready();
      if (!c) return;
      const t = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(700, t + 0.025);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    },
    ambience(on) {
      ambienceWanted = on;
      settleAmbience();
    },
    duck(on) {
      ducked = on;
      ambience?.duck(on);
    },
    setEnabled(on) {
      enabled = on;
      settleAmbience();
    },
    unlock() {
      if (!tried) {
        tried = true;
        try {
          ctx = makeContext();
        } catch {
          ctx = null;
        }
      }
      if (ctx && ctx.state !== 'running') void ctx.resume().then(settleAmbience, () => {});
      else settleAmbience();
    },
  };
}
