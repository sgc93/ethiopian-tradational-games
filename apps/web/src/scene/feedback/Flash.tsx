import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { HOLE_RADIUS, holeCenter } from '../layout';
import { now, useFeedback } from './feedbackStore';

const FLASH_S = 0.5;
const POOL = 4;
const RELAY = new THREE.Color('#fff1cf').multiplyScalar(1.6);
const CAPTURE = new THREE.Color('#ffd27a').multiplyScalar(2);

/** How wide (as a scale of the cup's rim) and how visible a flash is at a share `k` of its half second. */
export function flashCurve(k: number): { scale: number; opacity: number } {
  if (k < 0 || k >= 1) return { scale: 1, opacity: 0 };
  const out = 1 - Math.pow(1 - k, 3);
  return { scale: 1 + 0.55 * out, opacity: 0.9 * (1 - k) * (1 - k) };
}

/**
 * A ring that snaps outward from a cup's rim and fades in half a second: pale where a hand runs
 * out in a cup with stones and is picked up again (the relay), gold where four are captured.
 * A small pool of rings, since two can overlap.
 */
export function Flash() {
  const geometry = useMemo(() => new THREE.RingGeometry(HOLE_RADIUS * 0.96, HOLE_RADIUS * 1.08, 48), []);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const live = useRef<{ at: number; capture: boolean }[]>(Array.from({ length: POOL }, () => ({ at: -10, capture: false })));
  const next = useRef(0);
  const seen = useRef(0);

  useFrame(() => {
    const t = now();
    for (const e of useFeedback.getState().events) {
      if (e.id <= seen.current) continue;
      seen.current = e.id;
      if (e.kind !== 'relay' && e.kind !== 'captured') continue;
      const i = next.current;
      next.current = (i + 1) % POOL;
      live.current[i] = { at: e.at, capture: e.kind === 'captured' };
      const [x, , z] = holeCenter(e.hole);
      rings.current[i]?.position.set(x, 0.014, z);
    }
    live.current.forEach((f, i) => {
      const mesh = rings.current[i];
      if (!mesh) return;
      const { scale, opacity } = flashCurve((t - f.at) / FLASH_S);
      const m = mesh.material as THREE.MeshBasicMaterial;
      m.opacity = opacity;
      m.color.copy(f.capture ? CAPTURE : RELAY);
      mesh.scale.setScalar(scale);
      mesh.visible = opacity > 0;
    });
  });

  return (
    <>
      {Array.from({ length: POOL }, (_, i) => (
        <mesh key={i} ref={(m) => void (rings.current[i] = m)} geometry={geometry} rotation-x={-Math.PI / 2} visible={false}>
          <meshBasicMaterial transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}
