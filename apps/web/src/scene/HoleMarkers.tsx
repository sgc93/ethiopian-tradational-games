import { HOLES, type Player } from '@etg/gebeta-rules';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { HOLE_RADIUS, holeCenter } from './layout';

export const OWNER_TINT = ['#e0a85a', '#2f3a46'] as const;
const MARKER_COLOUR = ['#efe6d6', '#3a332e'] as const;
// A marks with a small triangle of pale pebbles, B with a short line of dark ones,
// so ownership never depends on colour alone.
const MARKER_OFFSETS: Record<Player, [number, number][]> = {
  0: [
    [-0.05, 0],
    [0.05, 0],
    [0, 0.07],
  ],
  1: [
    [-0.07, 0],
    [0, 0],
    [0.07, 0],
  ],
};
const CHANGE_MS = 900;
const TINTS = OWNER_TINT.map((c) => new THREE.Color(c));

/**
 * Shows who owns each hole: a tinted rim and marker pebbles on the owner's side. When a hole
 * changes hands its rim shifts colour, a ring pulses outward and the new markers grow in.
 */
export function HoleMarkers({ owners }: { owners: readonly Player[] }) {
  const pebble = useMemo(() => new THREE.SphereGeometry(0.028, 8, 6).scale(1, 0.6, 0.9), []);
  const previous = useRef<Player[]>([...owners]);
  const from = useRef<Player[]>([...owners]);
  const changedAt = useRef<number[]>(Array(HOLES).fill(-Infinity));
  const rims = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const markers = useRef<(THREE.Group | null)[]>([]);
  const pulses = useRef<(THREE.Mesh | null)[]>([]);

  useLayoutEffect(() => {
    const now = performance.now();
    owners.forEach((o, h) => {
      if (o !== previous.current[h]) {
        from.current[h] = previous.current[h]!;
        changedAt.current[h] = now;
      }
    });
    previous.current = [...owners];
  }, [owners]);

  useFrame(() => {
    const now = performance.now();
    for (let h = 0; h < HOLES; h++) {
      const age = Math.min(1, (now - changedAt.current[h]!) / CHANGE_MS);
      rims.current[h]?.color.copy(TINTS[from.current[h]!]!).lerp(TINTS[owners[h]!]!, age);
      const grow = age < 1 ? 1 - (1 - age) ** 3 : 1;
      markers.current[h]?.scale.setScalar(Math.max(0.001, grow));
      const pulse = pulses.current[h];
      if (pulse) {
        pulse.visible = age < 1;
        pulse.scale.setScalar(1 + age * 0.5);
        (pulse.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - age);
      }
    }
  });

  return (
    <>
      {owners.map((owner, hole) => {
        const [cx, , cz] = holeCenter(hole);
        const side = owner === 0 ? 1 : -1; // A sits at +z, B at −z
        const mz = cz + side * (HOLE_RADIUS + 0.17);
        return (
          <group key={hole}>
            <mesh rotation-x={-Math.PI / 2} position={[cx, 0.03, cz]}>
              <ringGeometry args={[HOLE_RADIUS + 0.01, HOLE_RADIUS + 0.06, 48]} />
              <meshBasicMaterial
                ref={(m) => void (rims.current[hole] = m)}
                color={OWNER_TINT[owner]}
                transparent
                opacity={0.5}
                depthWrite={false}
              />
            </mesh>
            <mesh
              ref={(m) => void (pulses.current[hole] = m)}
              rotation-x={-Math.PI / 2}
              position={[cx, 0.032, cz]}
              visible={false}
            >
              <ringGeometry args={[HOLE_RADIUS + 0.04, HOLE_RADIUS + 0.1, 48]} />
              <meshBasicMaterial color="#ffd27a" transparent opacity={0} depthWrite={false} />
            </mesh>
            <group ref={(g) => void (markers.current[hole] = g)} position={[cx, 0.02, mz]}>
              {MARKER_OFFSETS[owner].map(([dx, dz], i) => (
                <mesh key={i} geometry={pebble} position={[dx, 0, side * dz]} castShadow>
                  <meshStandardMaterial color={MARKER_COLOUR[owner]} roughness={0.8} />
                </mesh>
              ))}
            </group>
          </group>
        );
      })}
    </>
  );
}
