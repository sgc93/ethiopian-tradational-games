import { HOLES, type HoleIndex } from '@etg/gebeta-rules';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useFeedback } from './feedback/feedbackStore';
import { HOLE_RADIUS, holeCenter } from './layout';

const SHAKE_MS = 380;

/**
 * Invisible tap targets over the holes. They tell the feedback store which cup is under the
 * pointer or pressed (the rings in `CupRings` answer); tapping a cup that cannot be played gives
 * it a brief gentle shake and does nothing else.
 */
export function HoleHitAreas({ playable, onTap }: { playable: ReadonlySet<HoleIndex>; onTap(hole: HoleIndex): void }) {
  const shakes = useRef<(THREE.Mesh | null)[]>([]);
  const shakeStart = useRef<number[]>(Array(HOLES).fill(-Infinity));

  useFrame(() => {
    shakes.current.forEach((s, hole) => {
      if (!s) return;
      const age = (performance.now() - shakeStart.current[hole]!) / SHAKE_MS;
      s.visible = age < 1;
      if (!s.visible) return;
      s.position.x = holeCenter(hole)[0] + Math.sin(age * Math.PI * 6) * 0.04 * (1 - age);
      (s.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - age);
    });
  });

  const feedback = useFeedback.getState();
  const down = (hole: HoleIndex) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (playable.has(hole)) {
      feedback.setPress(hole);
      onTap(hole);
    } else shakeStart.current[hole] = performance.now();
  };
  const release = () => feedback.setPress(null);

  return (
    <>
      {Array.from({ length: HOLES }, (_, hole) => {
        const [cx, , cz] = holeCenter(hole);
        return (
          <group key={hole}>
            <mesh
              position={[cx, 0.05, cz]}
              onPointerDown={down(hole)}
              onPointerUp={release}
              onPointerOver={() => {
                document.body.style.cursor = playable.has(hole) ? 'pointer' : 'default';
                feedback.setHover(playable.has(hole) ? hole : null);
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'default';
                feedback.setHover(null);
                release();
              }}
            >
              <cylinderGeometry args={[HOLE_RADIUS * 1.15, HOLE_RADIUS * 1.15, 0.45, 20]} />
              <meshBasicMaterial visible={false} />
            </mesh>
            <mesh
              ref={(m) => void (shakes.current[hole] = m)}
              rotation-x={-Math.PI / 2}
              position={[cx, 0.04, cz]}
              visible={false}
            >
              <ringGeometry args={[HOLE_RADIUS * 1.02, HOLE_RADIUS * 1.12, 48]} />
              <meshBasicMaterial color="#f4e7d1" transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}
