export interface Ambience {
  start(): void;
  stop(): void;
  /** Lowers the ambience bus by 6 dB over about 150 ms while stones move, and brings it back. */
  duck(on: boolean): void;
  /** The bus gain the ambience is heading for (1, or 0.5 when ducked). */
  busGain(): number;
}

const dB = (level: number) => Math.pow(10, level / 20);
const WIND_LEVEL = dB(-27);
const LEAVES_LEVEL = dB(-36);
const BIRD_LEVEL = dB(-31);
const DUCKED = dB(-6);

const between = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

/**
 * The yard in daylight, synthesized: a soft breeze of low-passed noise swelling on a nine-second
 * cycle, the hiss of leaves in it, and now and then a bird: a short phrase of rising or falling
 * whistles, each bird at its own pitch. Nothing is downloaded.
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

  /** One bird's phrase: two to five short whistles that slide up or down, then a quiet stretch of 2.5 to 8 s. */
  const bird = () => {
    const t = ctx.currentTime;
    const pitch = between(2300, 4200);
    const rising = Math.random() < 0.6;
    const notes = 2 + Math.floor(Math.random() * 4);
    const gap = between(0.11, 0.19);
    const level = BIRD_LEVEL * between(0.45, 1);
    for (let i = 0; i < notes; i++) {
      const at = t + i * gap;
      const length = between(0.05, 0.09);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch * (rising ? 0.86 : 1.12), at);
      osc.frequency.exponentialRampToValueAtTime(pitch * (rising ? 1.12 : 0.86), at + length);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(level, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
      osc.connect(gain).connect(bus);
      osc.start(at);
      osc.stop(at + length + 0.02);
    }
    later(between(2500, 8000), bird);
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
      low.frequency.setValueAtTime(260, t);
      windGain.gain.setValueAtTime(WIND_LEVEL, t);
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(1 / 9, t);
      depth.gain.setValueAtTime(WIND_LEVEL * 0.6, t);
      lfo.connect(depth).connect(windGain.gain);
      wind.connect(low).connect(windGain).connect(bus);
      // The leaves: the same noise through a high band, rising and falling with the breeze.
      const leaves = ctx.createBiquadFilter();
      const leavesGain = ctx.createGain();
      const leavesDepth = ctx.createGain();
      leaves.type = 'bandpass';
      leaves.frequency.setValueAtTime(3200, t);
      leaves.Q.setValueAtTime(0.7, t);
      leavesGain.gain.setValueAtTime(LEAVES_LEVEL, t);
      leavesDepth.gain.setValueAtTime(LEAVES_LEVEL * 0.8, t);
      lfo.connect(leavesDepth).connect(leavesGain.gain);
      wind.connect(leaves).connect(leavesGain).connect(bus);
      wind.start(t);
      lfo.start(t);
      sources = [wind, lfo];
      later(between(600, 1800), bird);
      later(between(2500, 5000), bird);
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
