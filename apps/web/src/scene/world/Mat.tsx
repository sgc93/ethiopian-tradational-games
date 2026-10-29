import { useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { GROUND_Y } from '../layout';

/** The mat's plan: an oval 1.1 × 0.65 m. */
export const MAT_RADII = { x: 11, z: 6.5 };
const THICKNESS = 0.04;

/** A 1-D fringe: alternating strands and gaps, as an alpha texture along the ring's width. */
function makeFringe(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 8;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 256, 8);
  ctx.fillStyle = '#fff';
  for (let x = 0; x < 256; x += 4) ctx.fillRect(x, 0, 2, 8);
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(24, 1);
  return t;
}

/** The woven grass mat the board rests on, with a frayed fringe round its edge. */
export function Mat() {
  const tex = useTexture({ map: '/textures/mat-color.webp', normalMap: '/textures/mat-normal.webp' });
  useMemo(() => {
    for (const t of Object.values(tex)) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(6, 4);
      t.anisotropy = 4;
    }
    tex.map.colorSpace = THREE.SRGBColorSpace;
  }, [tex]);
  const fringe = useMemo(makeFringe, []);
  return (
    <group position-y={GROUND_Y}>
      <mesh rotation-x={-Math.PI / 2} position-y={THICKNESS} scale={[MAT_RADII.x, MAT_RADII.z, 1]} receiveShadow>
        <circleGeometry args={[1, 64]} />
        <meshStandardMaterial map={tex.map} normalMap={tex.normalMap} roughness={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={THICKNESS * 0.5} scale={[MAT_RADII.x, MAT_RADII.z, 1]}>
        <ringGeometry args={[1, 1.06, 96]} />
        <meshStandardMaterial color="#b89a62" alphaMap={fringe} transparent alphaTest={0.5} roughness={1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
