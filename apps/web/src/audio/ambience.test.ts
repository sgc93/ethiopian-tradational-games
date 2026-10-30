import { expect, test, vi } from 'vitest';
import { createAmbience } from './ambience';

/** A Web Audio context that records what was made and started, with the parameter methods the ambience uses. */
function fakeAudioContext() {
  const param = () => ({
    value: 1,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  });
  const counts = { started: 0, stopped: 0 };
  const node = () => ({
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
    start: vi.fn(() => void counts.started++),
    stop: vi.fn(() => void counts.stopped++),
  });
  const ctx = {
    state: 'running' as AudioContextState,
    currentTime: 0,
    sampleRate: 8000,
    destination: {},
    counts,
    createOscillator: vi.fn(() => ({ ...node(), type: 'sine', frequency: param(), detune: param() })),
    createGain: vi.fn(() => ({ ...node(), gain: param() })),
    createBiquadFilter: vi.fn(() => ({ ...node(), type: 'bandpass', frequency: param(), Q: param() })),
    createBuffer: vi.fn((_c: number, length: number) => ({ getChannelData: () => new Float32Array(length) })),
    createBufferSource: vi.fn(() => ({ ...node(), buffer: null, loop: false })),
  };
  return ctx;
}

test('ambience ducks by 6 dB and comes back', () => {
  const ctx = fakeAudioContext();
  const a = createAmbience(ctx as unknown as AudioContext, ctx.createGain() as unknown as GainNode);
  a.start();
  expect(a.busGain()).toBeCloseTo(1, 2);
  a.duck(true);
  expect(a.busGain()).toBeCloseTo(0.5, 1);
  a.duck(false);
  expect(a.busGain()).toBeCloseTo(1, 2);
});

test('ambience starts its sources once and stops them all', () => {
  vi.useFakeTimers();
  try {
    const ctx = fakeAudioContext();
    const a = createAmbience(ctx as unknown as AudioContext, ctx.createGain() as unknown as GainNode);
    a.start();
    a.start();
    const started = ctx.counts.started;
    expect(started).toBeGreaterThan(0);
    vi.advanceTimersByTime(3000); // crackle bursts and chirps are scheduled on timers
    expect(ctx.counts.started).toBeGreaterThan(started);
    a.stop();
    vi.advanceTimersByTime(10_000);
    const after = ctx.counts.started;
    vi.advanceTimersByTime(10_000);
    expect(ctx.counts.started).toBe(after); // nothing new once stopped
  } finally {
    vi.useRealTimers();
  }
});
