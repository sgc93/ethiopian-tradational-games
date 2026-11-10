import { useMemo } from 'react';
import * as THREE from 'three';
import { GROUND_Y } from '../layout';

/** Where the sun stands: high, in front and to the left of the near player. */
export const SUN_POSITION: [number, number, number] = [-7, 14, 9];
export const SUN_DIRECTION = new THREE.Vector3(...SUN_POSITION).normalize();

/** Along the ground, where the shadow of a point one unit up falls: away from the sun. */
const SHADOW_PER_HEIGHT: [number, number] = [-SUN_POSITION[0] / SUN_POSITION[1], -SUN_POSITION[2] / SUN_POSITION[1]];
const SHADOW_TURN = Math.atan2(-SHADOW_PER_HEIGHT[1], SHADOW_PER_HEIGHT[0]);

let blobTexture: THREE.Texture | null = null;
function blob(): THREE.Texture {
  if (blobTexture) return blobTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(34, 24, 30, 0.95)');
  g.addColorStop(0.55, 'rgba(34, 24, 30, 0.6)');
  g.addColorStop(1, 'rgba(34, 24, 30, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  blobTexture = new THREE.CanvasTexture(canvas);
  return blobTexture;
}

/**
 * The shadow of something standing outside the sun's shadow map (the map covers only the board):
 * a soft dark oval on the ground, drawn out away from the sun by the thing's height.
 */
export function SunBlob({ at, radius, height, opacity = 0.5 }: { at: [number, number]; radius: number; height: number; opacity?: number }) {
  const map = useMemo(blob, []);
  const reach = Math.hypot(...SHADOW_PER_HEIGHT) * height;
  const cx = at[0] + (SHADOW_PER_HEIGHT[0] * height) / 2;
  const cz = at[1] + (SHADOW_PER_HEIGHT[1] * height) / 2;
  return (
    <mesh position={[cx, GROUND_Y + 0.06, cz]} rotation={[-Math.PI / 2, 0, SHADOW_TURN]} renderOrder={1}>
      <planeGeometry args={[(radius + reach / 2) * 2.5, radius * 2.5]} />
      <meshBasicMaterial map={map} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
