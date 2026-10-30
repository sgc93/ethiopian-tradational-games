import { HOLES, type Player } from '@etg/gebeta-rules';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { HOLE_RADIUS, holeCenter } from '../layout';
import { useScene } from '../sceneStore';

/** Player A's cups wear a gold rim inlay, player B's a silver-blue one (spec §7 "Ownership"). */
export const OWNER_TINT = ['#d6ae6a', '#b9cfee'] as const;
const TINTS = OWNER_TINT.map((c) => new THREE.Color(c));
const CHANGE_S = 0.9;
const PLAY_OPACITY = 0.25;
const REVEAL_OPACITY = 0.9;
/** At the end of a round the inlays are drawn in sequence, one cup every 0.6 s. */
const REVEAL_STEP_S = 0.6;
const REVEAL_RAMP_S = 0.3;

/**
 * The rim inlays showing who owns each cup: faint during play, drawn up bright one by one at the
 * end of a round; a cup that changes hands blends to its new colour over 0.9 s.
 */
export function Inlays({ owners }: { owners: readonly Player[] }) {
  const geometry = useMemo(() => new THREE.RingGeometry(HOLE_RADIUS + 0.01, HOLE_RADIUS + 0.06, 48), []);
  const previous = useRef<Player[]>([...owners]);
  const from = useRef<Player[]>([...owners]);
  const changedAt = useRef<number[]>(Array(HOLES).fill(-Infinity));
  const materials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const reveal = useRef<{ mode: string; at: number }>({ mode: 'home', at: -Infinity });

  useLayoutEffect(() => {
    const t = performance.now() / 1000;
    owners.forEach((o, h) => {
      if (o !== previous.current[h]) {
        from.current[h] = previous.current[h]!;
        changedAt.current[h] = t;
      }
    });
    previous.current = [...owners];
  }, [owners]);

  useFrame((_, delta) => {
    const t = performance.now() / 1000;
    const mode = useScene.getState().mode;
    if (mode !== reveal.current.mode) reveal.current = { mode, at: t };
    const revealing = mode === 'round-end';
    for (let h = 0; h < HOLES; h++) {
      const m = materials.current[h];
      if (!m) continue;
      const age = Math.min(1, (t - changedAt.current[h]!) / CHANGE_S);
      m.color.copy(TINTS[from.current[h]!]!).lerp(TINTS[owners[h]!]!, age);
      let target = PLAY_OPACITY;
      if (revealing) {
        const since = t - reveal.current.at - h * REVEAL_STEP_S;
        if (since > 0) target = PLAY_OPACITY + (REVEAL_OPACITY - PLAY_OPACITY) * Math.min(1, since / REVEAL_RAMP_S);
      }
      m.opacity += (target - m.opacity) * Math.min(1, delta * 8);
    }
  });

  return (
    <>
      {owners.map((owner, hole) => {
        const [x, , z] = holeCenter(hole);
        return (
          <mesh key={hole} geometry={geometry} rotation-x={-Math.PI / 2} position={[x, 0.01, z]}>
            <meshBasicMaterial
              ref={(m) => void (materials.current[hole] = m)}
              color={OWNER_TINT[owner]}
              transparent
              opacity={PLAY_OPACITY}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </>
  );
}
