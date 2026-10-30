import type { Player } from '@etg/gebeta-rules';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { STORE_RADIUS, storeCenter } from '../layout';
import { latest, now, useFeedback } from './feedbackStore';

const GLOW_S = 0.6;

/** The owner's store glows for 0.6 s as a capture lands in it (spec §7 "Captures"). */
export function StoreGlow() {
  const geometry = useMemo(() => new THREE.RingGeometry(STORE_RADIUS + 0.02, STORE_RADIUS + 0.12, 64), []);
  const materials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  useFrame(() => {
    const captured = latest(useFeedback.getState().events, 'captured');
    const age = captured ? (now() - captured.at) / GLOW_S : 2;
    for (const player of [0, 1] as Player[]) {
      const m = materials.current[player];
      if (m) m.opacity = captured && captured.by === player && age < 1 ? 0.85 * Math.sin(Math.PI * age) : 0;
    }
  });

  return (
    <>
      {([0, 1] as Player[]).map((player) => {
        const [x, , z] = storeCenter(player);
        return (
          <mesh key={player} geometry={geometry} rotation-x={-Math.PI / 2} position={[x, 0.012, z]}>
            <meshBasicMaterial
              ref={(m) => void (materials.current[player] = m)}
              color={new THREE.Color('#ffd27a').multiplyScalar(1.8)}
              transparent
              opacity={0}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </>
  );
}
