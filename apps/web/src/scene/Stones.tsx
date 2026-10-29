import { mulberry32, TOTAL_STONES } from '@etg/gebeta-rules';
import { useFrame } from '@react-three/fiber';
import { useMemo, type MutableRefObject } from 'react';
import * as THREE from 'three';
import type { Vec3 } from './layout';
import { makePebbleGeometries, PEBBLE_COLOURS } from './pebbles';

const SHAPES = 6;
const PER_SHAPE = TOTAL_STONES / SHAPES;

interface StonePose {
  rotation: THREE.Quaternion;
  scale: THREE.Vector3;
}

/** Each stone's fixed tilt and size, from its id alone. */
function stonePose(id: number): StonePose & { colour: THREE.Color } {
  const rng = mulberry32(id + 11);
  const colour = new THREE.Color(PEBBLE_COLOURS[Math.floor(rng() * PEBBLE_COLOURS.length)]!);
  const turn = new THREE.Euler(rng() * 0.6 - 0.3, rng() * Math.PI * 2, rng() * 0.6 - 0.3);
  return {
    colour,
    rotation: new THREE.Quaternion().setFromEuler(turn),
    scale: new THREE.Vector3().setScalar(0.85 + rng() * 0.3),
  };
}

const poses = Array.from({ length: TOTAL_STONES }, (_, id) => stonePose(id));
const tmp = new THREE.Vector3();

/** Instance matrices for `count` stones; ids without a position get `null` and are not drawn. */
export function stoneMatrices(positions: readonly (Vec3 | undefined)[], count: number): (THREE.Matrix4 | null)[] {
  return Array.from({ length: count }, (_, id) => {
    const at = positions[id];
    if (!at) return null;
    const pose = poses[id] ?? stonePose(id);
    return new THREE.Matrix4().compose(tmp.set(...at), pose.rotation, pose.scale);
  });
}

/**
 * The 48 pebbles, drawn as one instanced mesh per pebble shape. Each frame they are placed at
 * `positions.current[id]`, so animation only has to move those vectors.
 */
export function Stones({ positions }: { positions: MutableRefObject<Vec3[]> }) {
  const meshes = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0 });
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
      poses.map((pose, id) => {
        const stone = { mesh: meshes[id % SHAPES]!, index: Math.floor(id / SHAPES) };
        stone.mesh.setColorAt(stone.index, pose.colour);
        return stone;
      }),
    [meshes],
  );

  const hidden = useMemo(() => new THREE.Matrix4().makeScale(0, 0, 0), []);
  useFrame(() => {
    const matrices = stoneMatrices(positions.current, TOTAL_STONES);
    stones.forEach((s, id) => s.mesh.setMatrixAt(s.index, matrices[id] ?? hidden));
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
