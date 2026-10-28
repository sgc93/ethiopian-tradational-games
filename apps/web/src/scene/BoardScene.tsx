import { initialOwners, legalMoves, newRound, type HoleIndex } from '@etg/gebeta-rules';
import { useEffect, useMemo, useRef } from 'react';
import type { Session } from '../game/session';
import type { Settings } from '../state/settings';
import { CameraRig } from './CameraRig';
import { useBoardView } from './boardView';
import { Earth } from './Earth';
import { HoleAnchors } from './HoleAnchors';
import { HoleHitAreas } from './HoleHitAreas';
import { HoleMarkers } from './HoleMarkers';
import { handSlot, pileSlot, stoneSlot, type Vec3 } from './layout';
import { StoneTracker, type StoneLocation } from './stoneTracker';
import { Stones } from './Stones';

export function locationToPosition(loc: StoneLocation): Vec3 {
  switch (loc.kind) {
    case 'hole':
      return stoneSlot(loc.hole, loc.slot);
    case 'hand':
      return handSlot(loc.hole, loc.index);
    case 'pile':
      return pileSlot(loc.player, loc.index);
  }
}

const IDLE_ROUND = newRound(initialOwners(), 0);

interface Props {
  session: Session | null;
  settings: Settings;
  onHoleTap(hole: HoleIndex): void;
  onAnimationDone(turnId: number): void;
}

/** The board, its stones and the camera. Without a session it shows a fresh board at rest. */
export function BoardScene({ session, settings, onHoleTap, onAnimationDone }: Props) {
  const round = session?.match.round ?? IDLE_ROUND;
  const tracker = useMemo(() => new StoneTracker(round), [round]);
  const positions = useRef<Vec3[]>([]);
  positions.current = useMemo(() => tracker.locations().map(locationToPosition), [tracker]);
  useEffect(() => useBoardView.setState({ counts: tracker.holeCounts() }), [tracker]);

  // Until the sowing animation exists, the board jumps straight to the new position.
  useEffect(() => {
    if (session?.phase === 'animating') onAnimationDone(session.turnId);
  }, [session?.phase, session?.turnId, onAnimationDone]);

  const playable = useMemo(() => {
    if (!session || session.phase !== 'awaiting-move' || session.paused) return new Set<HoleIndex>();
    if (session.humanSeat !== null && round.toMove !== session.humanSeat) return new Set<HoleIndex>();
    return new Set(legalMoves(round));
  }, [session, round]);

  const seat = session?.humanSeat ?? (settings.fixedCamera ? 0 : round.toMove);

  return (
    <>
      <color attach="background" args={['#24140d']} />
      <hemisphereLight args={['#ffe9cc', '#5a3522', 1.5]} />
      <directionalLight
        position={[4, 8, 3]}
        intensity={3.2}
        color="#ffd9a8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0004}
      />
      <Earth />
      <Stones positions={positions} />
      <HoleMarkers owners={round.owners} />
      <HoleHitAreas playable={playable} onTap={onHoleTap} />
      <HoleAnchors />
      <CameraRig seat={seat} />
    </>
  );
}
