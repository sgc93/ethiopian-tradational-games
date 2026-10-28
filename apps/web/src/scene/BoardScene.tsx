import { initialOwners, type HoleIndex, type Player } from '@etg/gebeta-rules';
import { useMemo, useRef, useState } from 'react';
import type { Sfx } from '../audio/sfx';
import type { Session } from '../game/session';
import { playableHoles } from '../game/view';
import type { Settings, Speed } from '../state/settings';
import { useBoardView } from './boardView';
import { CameraRig } from './CameraRig';
import { Earth } from './Earth';
import { HoleAnchors } from './HoleAnchors';
import { HoleHitAreas } from './HoleHitAreas';
import { HoleMarkers } from './HoleMarkers';
import type { Vec3 } from './layout';
import { Stones } from './Stones';
import { usePlayback } from './usePlayback';

interface Props {
  session: Session | null;
  settings: Settings;
  speed: Speed;
  sfx: Sfx;
  /** A hole to draw extra attention to (the guided game's suggestion). */
  suggested?: HoleIndex | null;
  onHoleTap(hole: HoleIndex): void;
  onAnimationDone(turnId: number): void;
}

const setCounts = (counts: number[]) => useBoardView.setState({ counts });

/** The board, its stones and the camera. Without a session it shows a fresh board at rest. */
export function BoardScene({ session, settings, speed, sfx, suggested = null, onHoleTap, onAnimationDone }: Props) {
  const positions = useRef<Vec3[]>([]);
  const [owners, setOwners] = useState<readonly Player[]>(initialOwners);
  usePlayback({ session, speed, sfx, positions, onDone: onAnimationDone, onCounts: setCounts, onOwners: setOwners });

  const round = session?.match.round;
  const playable = useMemo(() => playableHoles(session), [session]);

  const seat = session?.humanSeat ?? (settings.fixedCamera ? 0 : (round?.toMove ?? 0));

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
      <HoleMarkers owners={owners} />
      <HoleHitAreas playable={playable} suggested={suggested} onTap={onHoleTap} />
      <HoleAnchors />
      <CameraRig seat={seat} />
    </>
  );
}
