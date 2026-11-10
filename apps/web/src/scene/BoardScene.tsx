import { initialOwners, type HoleIndex, type Player } from '@etg/gebeta-rules';
import { useMemo, useRef, useState } from 'react';
import type { Sfx } from '../audio/sfx';
import type { Session } from '../game/session';
import { playableHoles } from '../game/view';
import type { Speed } from '../state/settings';
import { Board } from './board/Board';
import { useBoardView } from './boardView';
import { CameraRig } from './CameraRig';
import { Coin } from './Coin';
import { DiscAnchors } from './DiscAnchors';
import { Feedback } from './feedback/Feedback';
import { HoleHitAreas } from './HoleHitAreas';
import type { Vec3 } from './layout';
import { useScene } from './sceneStore';
import { Stones } from './Stones';
import { TIERS } from './tiers';
import { usePlayback } from './usePlayback';

interface Props {
  session: Session | null;
  speed: Speed;
  sfx: Sfx | null;
  /** A hole to draw extra attention to (the guided game's suggestion). */
  suggested?: HoleIndex | null;
  onHoleTap(hole: HoleIndex): void;
  onAnimationDone(turnId: number): void;
}

const setCounts = (counts: number[]) => useBoardView.setState({ counts });
const silent: Sfx = { pickup() {}, drop() {}, capture() {}, coinWhoosh() {}, coinRing() {}, tick() {}, ambience() {}, duck() {}, setEnabled() {}, unlock() {} };

/** The board, its stones and the camera. Without a session it shows a fresh board at rest. */
export function BoardScene({ session, speed, sfx, suggested = null, onHoleTap, onAnimationDone }: Props) {
  const positions = useRef<Vec3[]>([]);
  const spins = useRef<number[]>([]);
  const [owners, setOwners] = useState<readonly Player[]>(initialOwners);
  usePlayback({ session, speed, sfx: sfx ?? silent, positions, spins, onDone: onAnimationDone, onCounts: setCounts, onOwners: setOwners });
  const playable = useMemo(() => playableHoles(session), [session]);
  const detail = useScene((s) => TIERS[s.tier].detail);

  return (
    <>
      <Board detail={detail} />
      <Stones positions={positions} spins={spins} />
      <Feedback owners={owners} playable={playable} suggested={suggested} />
      <HoleHitAreas playable={playable} onTap={onHoleTap} />
      <DiscAnchors />
      <Coin />
      <CameraRig />
    </>
  );
}
