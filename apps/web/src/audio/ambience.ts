export interface Ambience {
  start(): void;
  stop(): void;
  /** Lowers the ambience bus by 6 dB over about 150 ms while stones move, and brings it back. */
  duck(on: boolean): void;
  /** The bus gain the ambience is heading for (1, or 0.5 when ducked). */
  busGain(): number;
}

const dB = (level: number) => Math.pow(10, level / 20);
const CRACKLE_LEVEL = dB(-18);
const WIND_LEVEL = dB(-26);
const CRICKET_LEVEL = dB(-30);
const DUCKED = dB(-6);

const between = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

/**
 * The fireside at night (spec §10 "Sound"), synthesized: fire crackle as band-passed noise bursts
 * every 90–400 ms, a soft breeze of low-passed noise swelling on a 9 s cycle, and sparse cricket
 * chirps in threes. Nothing is downloaded.
 */
export function createAmbience(ctx: AudioContext, out: AudioNode): Ambience {
  const bus = ctx.createGain();
  bus.gain.value = 1;
  bus.connect(out);
  let target = 1;
  let running = false;
  let timers: ReturnType<typeof setTimeout>[] = [];
  let sources: { stop(): void; disconnect(): void }[] = [];
  let noise: AudioBuffer | null = null;

  const noiseBuffer = () => {
    if (!noise) {
      noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2), ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    return noise;
  };

  const later = (ms: number, fn: () => void) => {
    const id = setTimeout(() => {
      timers = timers.filter((t) => t !== id);
      if (!running) return;
      // A suspended context (the page hidden, an iOS interruption) has a frozen clock: booking a
      // sound then would stack it on the same instant to fire with the rest on resume. Wait instead.
      if (ctx.state !== 'running') later(500, fn);
      else fn();
    }, ms);
    timers.push(id);
  };

  /** One crackle: a short noise burst through a band-pass, 30–80 ms, then the next one is booked. */
  const crackle = () => {
    const t = ctx.currentTime;
    const ms = between(30, 80);
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    src.buffer = noiseBuffer();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(between(800, 3000), t);
    filter.Q.setValueAtTime(1.5, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(CRACKLE_LEVEL * between(0.5, 1), t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    src.connect(filter).connect(gain).connect(bus);
    src.start(t);
    src.stop(t + ms / 1000 + 0.02);
    later(between(90, 400), crackle);
  };

  /** Three chirps at 4.2 kHz, then a quiet stretch of 2–6 s. */
  const crickets = () => {
    const t = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const at = t + i * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(4200, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(CRICKET_LEVEL, at + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.035);
      osc.connect(gain).connect(bus);
      osc.start(at);
      osc.stop(at + 0.05);
    }
    later(between(2000, 6000), crickets);
  };

  return {
    start() {
      if (running) return;
      running = true;
      const t = ctx.currentTime;
      // The breeze: low-passed noise, swelling and fading on a nine-second cycle.
      const wind = ctx.createBufferSource();
      const low = ctx.createBiquadFilter();
      const windGain = ctx.createGain();
      wind.buffer = noiseBuffer();
      wind.loop = true;
      low.type = 'lowpass';
      low.frequency.setValueAtTime(200, t);
      windGain.gain.setValueAtTime(WIND_LEVEL, t);
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(1 / 9, t);
      depth.gain.setValueAtTime(WIND_LEVEL * 0.6, t);
      lfo.connect(depth).connect(windGain.gain);
      wind.connect(low).connect(windGain).connect(bus);
      wind.start(t);
      lfo.start(t);
      sources = [wind, lfo];
      later(between(50, 200), crackle);
      later(between(500, 1500), crickets);
    },
    stop() {
      running = false;
      for (const id of timers) clearTimeout(id);
      timers = [];
      for (const s of sources) {
        try {
          s.stop();
          s.disconnect();
        } catch {
          /* already stopped */
        }
      }
      sources = [];
    },
    duck(on) {
      target = on ? DUCKED : 1;
      bus.gain.cancelScheduledValues(ctx.currentTime);
      bus.gain.setTargetAtTime(target, ctx.currentTime, 0.05);
    },
    busGain: () => target,
  };
}
