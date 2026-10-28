import { HOLES, type HoleIndex } from '@etg/gebeta-rules';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { HOLE_RADIUS, holeCenter } from './layout';

const SHAKE_MS = 380;

/**
 * Invisible tap targets over the holes. Playable holes glow softly; tapping any other hole gives
 * it a brief gentle shake and does nothing else.
 */
export function HoleHitAreas({
  playable,
  suggested = null,
  onTap,
}: {
  playable: ReadonlySet<HoleIndex>;
  suggested?: HoleIndex | null;
  onTap(hole: HoleIndex): void;
}) {
  const glows = useRef<(THREE.Mesh | null)[]>([]);
  const shakes = useRef<(THREE.Mesh | null)[]>([]);
  const pulse = useRef<THREE.Mesh | null>(null);
  const shakeStart = useRef<number[]>(Array(HOLES).fill(-Infinity));

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    glows.current.forEach((g) => {
      if (g) (g.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.25 * Math.sin(t * 3);
    });
    if (pulse.current) {
      const p = (t * 0.9) % 1;
      pulse.current.scale.setScalar(1 + p * 0.45);
      (pulse.current.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - p);
    }
    shakes.current.forEach((s, hole) => {
      if (!s) return;
      const age = (performance.now() - shakeStart.current[hole]!) / SHAKE_MS;
      s.visible = age < 1;
      if (!s.visible) return;
      s.position.x = holeCenter(hole)[0] + Math.sin(age * Math.PI * 6) * 0.04 * (1 - age);
      (s.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - age);
    });
  });

  const tap = (hole: HoleIndex) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (playable.has(hole)) onTap(hole);
    else shakeStart.current[hole] = performance.now();
  };

  return (
    <>
      {suggested !== null && playable.has(suggested) && (
        // A ring that keeps rippling outward from the suggested hole.
        <mesh
          ref={pulse}
          rotation-x={-Math.PI / 2}
          position={[holeCenter(suggested)[0], 0.04, holeCenter(suggested)[2]]}
        >
          <ringGeometry args={[HOLE_RADIUS * 1.15, HOLE_RADIUS * 1.32, 48]} />
          <meshBasicMaterial color="#fff3c4" transparent opacity={0.8} depthWrite={false} />
        </mesh>
      )}
      {Array.from({ length: HOLES }, (_, hole) => {
        const [cx, , cz] = holeCenter(hole);
        return (
          <group key={hole}>
            <mesh
              position={[cx, 0.05, cz]}
              onPointerDown={tap(hole)}
              onPointerOver={() => (document.body.style.cursor = playable.has(hole) ? 'pointer' : 'default')}
              onPointerOut={() => (document.body.style.cursor = 'default')}
            >
              <cylinderGeometry args={[HOLE_RADIUS * 1.15, HOLE_RADIUS * 1.15, 0.45, 20]} />
              <meshBasicMaterial visible={false} />
            </mesh>
            {playable.has(hole) && (
              <mesh ref={(m) => void (glows.current[hole] = m)} rotation-x={-Math.PI / 2} position={[cx, 0.035, cz]}>
                <ringGeometry args={[HOLE_RADIUS * 1.05, HOLE_RADIUS * 1.24, 48]} />
                <meshBasicMaterial color="#ffd27a" transparent opacity={0.5} depthWrite={false} />
              </mesh>
            )}
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
