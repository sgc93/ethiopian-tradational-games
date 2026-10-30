import type { HoleIndex } from '@etg/gebeta-rules';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { HOLE_RADIUS, holeCenter } from '../layout';
import { useFeedback } from './feedbackStore';
import { pressScale, ringPulse, suggestedPulse } from './pulses';

const RING_Y = 0.012;
const RING_COLOUR = new THREE.Color('#ff9a3c');

/**
 * An ember-gold ring on each playable cup's rim, pulsing 40–100% every 1.6 s; the suggested cup
 * in a lesson pulses brighter and faster; the ring brightens under the pointer and tightens by
 * 4% when pressed (spec §7 "Playable cups", "Touch and hover").
 */
export function CupRings({ playable, suggested = null }: { playable: ReadonlySet<HoleIndex>; suggested?: HoleIndex | null }) {
  const geometry = useMemo(() => new THREE.RingGeometry(HOLE_RADIUS + 0.01, HOLE_RADIUS + 0.06, 48), []);
  const rings = useRef<Map<number, THREE.Mesh>>(new Map());

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const { hover, press } = useFeedback.getState();
    rings.current.forEach((mesh, hole) => {
      const base = hole === suggested ? suggestedPulse(t) : ringPulse(t);
      const lit = hover === hole ? Math.min(1, base * 1.3) : base;
      const m = mesh.material as THREE.MeshBasicMaterial;
      m.opacity = lit;
      m.color.copy(RING_COLOUR).multiplyScalar(hover === hole ? 1.9 : 1.5);
      mesh.scale.setScalar(press === hole ? pressScale : 1);
    });
  });

  return (
    <>
      {[...playable].map((hole) => {
        const [x, , z] = holeCenter(hole);
        return (
          <mesh
            key={hole}
            ref={(m) => {
              if (m) rings.current.set(hole, m);
              else rings.current.delete(hole);
            }}
            geometry={geometry}
            rotation-x={-Math.PI / 2}
            position={[x, RING_Y, z]}
          >
            <meshBasicMaterial color={RING_COLOUR} transparent opacity={0.7} depthWrite={false} toneMapped={false} />
          </mesh>
        );
      })}
    </>
  );
}
