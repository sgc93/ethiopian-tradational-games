import { mulberry32 } from '@etg/gebeta-rules';
import { useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { GROUND_Y } from '../layout';
import { withLeafShade } from './leafShade';

const RADIUS = 2600;
/** One tile of the earth texture covers a metre (20 units). */
const TILES = (RADIUS * 2) / 20;
const DECALS = 300;
const DECAL_REACH = 40;

/** A small atlas of ground litter drawn in code: straw, pebbles and eucalyptus leaves, 3 tiles across. */
function makeDecalAtlas(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size * 3;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, size);
  // Straw: a few pale strokes.
  ctx.strokeStyle = '#b89a62';
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(20 + i * 12, 30 + (i % 2) * 40);
    ctx.lineTo(60 + i * 10, 90 - (i % 3) * 20);
    ctx.stroke();
  }
  // Pebbles.
  for (const [x, y, r, c] of [
    [size + 40, 50, 14, '#6f655b'],
    [size + 80, 80, 10, '#9a8f80'],
    [size + 60, 30, 8, '#5b534b'],
  ] as const) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.7, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Eucalyptus leaves: long dark ovals.
  ctx.fillStyle = '#3b4a2c';
  for (const [x, y, a] of [
    [size * 2 + 50, 60, 0.5],
    [size * 2 + 80, 70, -0.9],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(x, y, 34, 9, a, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Litter() {
  const atlas = useMemo(makeDecalAtlas, []);
  const meshes = useMemo(() => {
    const rng = mulberry32(21);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const flat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    const spin = new THREE.Quaternion();
    return [0, 1, 2].map((variant) => {
      const g = new THREE.PlaneGeometry(0.8, 0.8);
      const uv = g.getAttribute('uv');
      for (let i = 0; i < uv.count; i++) uv.setX(i, (uv.getX(i) + variant) / 3);
      const material = new THREE.MeshStandardMaterial({ map: atlas, transparent: true, alphaTest: 0.5, roughness: 1 });
      const mesh = new THREE.InstancedMesh(g, material, DECALS / 3);
      let placed = 0;
      while (placed < DECALS / 3) {
        const a = rng() * Math.PI * 2;
        const r = Math.sqrt(rng()) * DECAL_REACH;
        const x = r * Math.cos(a);
        const z = r * Math.sin(a);
        if ((x / 11.5) ** 2 + (z / 7) ** 2 <= 1) continue;
        spin.setFromEuler(new THREE.Euler(0, rng() * Math.PI * 2, 0));
        q.copy(spin).multiply(flat);
        m.compose(new THREE.Vector3(x, GROUND_Y + 0.005, z), q, new THREE.Vector3().setScalar(0.6 + rng() * 0.8));
        mesh.setMatrixAt(placed++, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.receiveShadow = true;
      return mesh;
    });
  }, [atlas]);
  return (
    <>
      {meshes.map((mesh, i) => (
        <primitive key={i} object={mesh} />
      ))}
    </>
  );
}

/** Packed red-brown earth out to the haze, under moving leaf shade, with scattered straw, pebbles and leaves near the board. */
export function Ground() {
  const tex = useTexture({ map: '/textures/earth-color.webp', normalMap: '/textures/earth-normal.webp' });
  useMemo(() => {
    for (const t of Object.values(tex)) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(TILES, TILES);
      t.anisotropy = 4;
    }
    tex.map.colorSpace = THREE.SRGBColorSpace;
  }, [tex]);
  const material = useMemo(
    () => withLeafShade(new THREE.MeshStandardMaterial({ map: tex.map, normalMap: tex.normalMap, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 1, color: new THREE.Color(1.9, 2.5, 2.4) }), 'ground'),
    [tex],
  );
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={GROUND_Y} material={material} receiveShadow>
        <circleGeometry args={[RADIUS, 64]} />
      </mesh>
      <Litter />
    </group>
  );
}
