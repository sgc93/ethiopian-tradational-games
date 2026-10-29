import { useMemo } from 'react';
import * as THREE from 'three';
import { BLUEPRINT } from '../board/blueprint';
import { GROUND_Y } from '../layout';

/** A soft stadium-shaped shadow drawn into a canvas, for the minimal tier's board shadow on the mat. */
function makeShadow(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size / 2);
  ctx.filter = 'blur(10px)';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  const w = size * 0.8;
  const h = (size / 2) * 0.42;
  const x = (size - w) / 2;
  const y = (size / 2 - h) / 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

/** The board's shadow as a texture on the mat, thrown away from the fire (towards +x), for the minimal tier. */
export function BakedShadow() {
  const map = useMemo(makeShadow, []);
  const length = BLUEPRINT.body.halfLength * 2 * 1.3;
  return (
    <mesh rotation-x={-Math.PI / 2} position={[1.4, GROUND_Y + 0.06, -0.3]}>
      <planeGeometry args={[length, length / 2]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} />
    </mesh>
  );
}
