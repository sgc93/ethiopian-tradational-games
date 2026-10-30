import type { HoleIndex, Player } from '@etg/gebeta-rules';
import { create } from 'zustand';
import type { Sfx } from '../audio/sfx';
import type { Session } from '../game/session';
import type { Speed } from '../state/settings';
import { urlOptions } from '../urlOptions';
import type { Bands } from './camera/poses';
import type { Tier } from './tiers';

/** Which camera and mood the one scene shows. */
export type SceneMode = 'home' | 'play' | 'toss' | 'round-end' | 'result' | 'paused';

export type { Tier } from './tiers';

export interface SceneState {
  mode: SceneMode;
  /** Whose seat the play camera sits behind. */
  seat: Player;
  /** The interface bands as the interface measured them, or null for the defaults from the canvas height. */
  bands: Bands | null;
  tier: Tier;
  session: Session | null;
  speed: Speed;
  sfx: Sfx | null;
  suggested: HoleIndex | null;
  /** True while the camera eases between poses; the interface hides pinned labels then. */
  cameraMoving: boolean;
  /** A black cross-fade, 0–1, used in place of camera moves when motion is reduced. */
  fade: number;
  /** `never` stops the canvas drawing, while "turn your phone" covers it. */
  frameloop: 'always' | 'never';
  /** The fire's light, 0–1: black while loading, run up to 1 by the loading screen's flare. */
  flare: number;
  /** True once the world and the board are in the scene and a frame has drawn quickly again. */
  worldReady: boolean;
  /** The toss in flight: which face lands and when it was thrown (seconds on the page clock); null at rest. */
  coin: { lands: 'lion' | 'person'; startedAt: number } | null;
  onHoleTap(hole: HoleIndex): void;
  onAnimationDone(turnId: number): void;
  setMode(mode: SceneMode): void;
}

/** What the game tells the scene. Screens write it; the scene reads it. */
export const useScene = create<SceneState>((set) => ({
  mode: 'home',
  seat: 0,
  bands: null,
  tier: urlOptions.tier ?? 'mid',
  session: null,
  speed: 'normal',
  sfx: null,
  suggested: null,
  cameraMoving: false,
  fade: 0,
  frameloop: 'always',
  flare: 0,
  worldReady: false,
  coin: null,
  onHoleTap: () => {},
  onAnimationDone: () => {},
  setMode: (mode) => set({ mode }),
}));
