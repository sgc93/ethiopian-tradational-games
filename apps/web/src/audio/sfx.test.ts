import { expect, test, vi } from 'vitest';
import { createSfx } from './sfx';

function fakeAudioContext(state: AudioContextState = 'suspended') {
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  const node = () => ({ connect: vi.fn().mockReturnThis(), start: vi.fn(), stop: vi.fn() });
  const ctx = {
    state,
    currentTime: 0,
    sampleRate: 8000,
    destination: {},
    resume: vi.fn(async () => {
      ctx.state = 'running';
    }),
    createOscillator: vi.fn(() => ({ ...node(), type: 'sine', frequency: param() })),
    createGain: vi.fn(() => ({ ...node(), gain: param() })),
    createBiquadFilter: vi.fn(() => ({ ...node(), type: 'bandpass', frequency: param(), Q: param() })),
    createBuffer: vi.fn((_c: number, length: number) => ({ getChannelData: () => new Float32Array(length) })),
    createBufferSource: vi.fn(() => ({ ...node(), buffer: null })),
  };
  return ctx;
}

test('sfx never throws without audio, when disabled, or before unlock', () => {
  const none = createSfx(() => null);
  expect(() => {
    none.drop(1);
    none.pickup(3);
    none.capture();
    none.unlock();
  }).not.toThrow();

  const ctx = fakeAudioContext();
  const off = createSfx(() => ctx as unknown as AudioContext);
  off.setEnabled(false);
  expect(() => off.drop(1)).not.toThrow();
  off.drop(1); // before unlock, nothing plays
  expect(ctx.createOscillator).not.toHaveBeenCalled();
});

test('after unlock, a drop plays a thump and a burst of noise', async () => {
  const ctx = fakeAudioContext();
  const sfx = createSfx(() => ctx as unknown as AudioContext);
  sfx.unlock();
  await Promise.resolve();
  expect(ctx.resume).toHaveBeenCalled();
  sfx.drop(3);
  expect(ctx.createOscillator).toHaveBeenCalledTimes(1);
  expect(ctx.createBufferSource).toHaveBeenCalledTimes(1);
  sfx.setEnabled(false);
  sfx.drop(3);
  expect(ctx.createOscillator).toHaveBeenCalledTimes(1);
});
