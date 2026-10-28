import { mulberry32, TOTAL_STONES } from '@etg/gebeta-rules';
import { useFrame } from '@react-three/fiber';
import { useMemo, type MutableRefObject } from 'react';
import * as THREE from 'three';
import type { Vec3 } from './layout';
import { makePebbleGeometries, PEBBLE_COLOURS } from './pebbles';

const SHAPES = 6;
const PER_SHAPE = TOTAL_STONES / SHAPES;

/**
 * The 48 pebbles, drawn as one instanced mesh per pebble shape. Each frame they are placed at
 * `positions.current[id]`, so animation only has to move those vectors.
 */
export function Stones({ positions }: { positions: MutableRefObject<Vec3[]> }) {
  const meshes = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({ roughness: 0.72, metalness: 0 });
    return makePebbleGeometries(SHAPES, 3).map((g) => {
      const mesh = new THREE.InstancedMesh(g, material, PER_SHAPE);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false; // instances move far from the shape's own bounds
      return mesh;
    });
  }, []);

  const stones = useMemo(
    () =>
      Array.from({ length: TOTAL_STONES }, (_, id) => {
        const rng = mulberry32(id + 11);
        const color = new THREE.Color(PEBBLE_COLOURS[Math.floor(rng() * PEBBLE_COLOURS.length)]!);
        const turn = new THREE.Euler(rng() * 0.6 - 0.3, rng() * Math.PI * 2, rng() * 0.6 - 0.3);
        const stone = {
          mesh: meshes[id % SHAPES]!,
          index: Math.floor(id / SHAPES),
          rotation: new THREE.Quaternion().setFromEuler(turn),
          scale: new THREE.Vector3().setScalar(0.85 + rng() * 0.3),
        };
        stone.mesh.setColorAt(stone.index, color);
        return stone;
      }),
    [meshes],
  );

  const m = useMemo(() => new THREE.Matrix4(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    stones.forEach((s, id) => {
      const at = positions.current[id];
      if (!at) return;
      s.mesh.setMatrixAt(s.index, m.compose(p.set(...at), s.rotation, s.scale));
    });
    for (const mesh of meshes) mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      {meshes.map((mesh, i) => (
        <primitive key={i} object={mesh} />
      ))}
    </>
  );
}
