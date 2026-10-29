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
  onHoleTap: () => {},
  onAnimationDone: () => {},
  setMode: (mode) => set({ mode }),
}));
