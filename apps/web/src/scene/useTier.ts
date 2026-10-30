import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { urlOptions } from '../urlOptions';
import { useScene } from './sceneStore';
import { decide, readStoredTier, storeTier, type Tier } from './tiers';

const MEASURE_SECONDS = 3;
const MAX_ROUNDS = 3;

/**
 * Whether a frame counts towards the measurement: on the home screen, once the world is in and
 * drawing (the loading screen's uploads and shader compiles would skew the first round).
 */
export function probing({ done, mode, worldReady }: { done: boolean; mode: string; worldReady: boolean }): boolean {
  return !done && mode === 'home' && worldReady;
}

/**
 * Chooses the performance tier. It starts from the remembered tier (or mid), then, during the
 * first seconds of the home screen, measures the median frame time and steps the tier up or
 * down, measuring again after each step (at most three rounds). The result is remembered.
 * A `?tier=` in the address fixes the tier and measures nothing.
 */
export function useTier(): Tier {
  const tier = useScene((s) => s.tier);
  const mode = useScene((s) => s.mode);
  const probe = useRef({ samples: [] as number[], elapsed: 0, rounds: 0, done: Boolean(urlOptions.tier) });

  useEffect(() => {
    if (urlOptions.tier) return;
    const stored = readStoredTier(typeof localStorage === 'undefined' ? null : localStorage);
    if (stored) useScene.setState({ tier: stored });
  }, []);

  useFrame((_, delta) => {
    const p = probe.current;
    if (!probing({ done: p.done, mode, worldReady: useScene.getState().worldReady })) return;
    p.samples.push(delta * 1000);
    p.elapsed += delta;
    if (p.elapsed < MEASURE_SECONDS) return;
    const next = decide(tier, p.samples, typeof document === 'undefined' ? 'visible' : document.visibilityState);
    p.samples = [];
    p.elapsed = 0;
    p.rounds += 1;
    if (next === tier || p.rounds >= MAX_ROUNDS) {
      p.done = true;
      storeTier(typeof localStorage === 'undefined' ? null : localStorage, next);
    }
    if (next !== tier) useScene.setState({ tier: next });
  });

  return tier;
}
