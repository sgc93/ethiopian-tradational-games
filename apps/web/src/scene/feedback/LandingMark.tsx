import { type HoleIndex, type RoundState } from '@etg/gebeta-rules';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { firstLapEnd } from '../../game/view';
import { HOLE_RADIUS, holeCenter } from '../layout';
import { useFeedback } from './feedbackStore';

const BONE = new THREE.Color('#fff1cf').multiplyScalar(1.5);

/**
 * Where a move would go: while the pointer (or the keyboard's focus) is on a cup that can be
 * played, the cup its hand of stones will run out in is marked with a pale ring and a small
 * bone diamond hovering over it. It shows the first lap only; whether the hand is picked up
 * again from there is for the player to read.
 */
export function LandingMark({ round, playable }: { round: RoundState | null; playable: ReadonlySet<HoleIndex> }) {
  const hover = useFeedback((s) => s.hover);
  const target = round && hover !== null && playable.has(hover) ? firstLapEnd(round, hover) : null;
  const ring = useMemo(() => new THREE.RingGeometry(HOLE_RADIUS * 0.84, HOLE_RADIUS * 0.9, 48), []);
  const diamond = useRef<THREE.Mesh>(null);
  const ringMesh = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (diamond.current) {
      diamond.current.position.y = 0.95 + 0.07 * Math.sin(t * 3.2);
      diamond.current.rotation.y = t * 1.6;
    }
    if (ringMesh.current) (ringMesh.current.material as THREE.MeshBasicMaterial).opacity = 0.6 + 0.25 * Math.sin(t * 3.2);
  });

  if (target === null) return null;
  const [x, , z] = holeCenter(target);
  return (
    <group position={[x, 0, z]}>
      <mesh ref={ringMesh} geometry={ring} rotation-x={-Math.PI / 2} position-y={0.013}>
        <meshBasicMaterial color={BONE} transparent opacity={0.7} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={diamond} position-y={0.95} scale={[0.14, 0.22, 0.14]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#f3e3bd" emissive="#f3e3bd" emissiveIntensity={0.55} roughness={0.35} />
      </mesh>
    </group>
  );
}
