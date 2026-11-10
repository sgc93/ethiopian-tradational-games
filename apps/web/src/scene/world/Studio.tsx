import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BLUEPRINT } from '../board/blueprint';
import { GROUND_Y } from '../layout';
import { shadowRadius } from '../postPlan';
import { useScene } from '../sceneStore';
import { TIERS } from '../tiers';

/** The backdrop's colour: the warm paper-beige of the board's reference photograph (image 01). */
export const BACKDROP = '#d9c6a7';

/** Where the daylight comes from: above, in front and to the left of the near player, as in the reference. */
export const KEY_POSITION: [number, number, number] = [-7, 14, 9];
const KEY_INTENSITY = 2.8;
const SKY_INTENSITY = 0.85;
const ENVIRONMENT_INTENSITY = 0.55;

/** Soft, even studio light to reflect in the oiled wood and the stones. Nothing is downloaded. */
function Environment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    pmrem.dispose();
    room.dispose();
    scene.environment = env;
    scene.environmentIntensity = ENVIRONMENT_INTENSITY;
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** A soft pool of shade under the board, drawn once: what the feet and the body keep off the floor. */
function makeContactShade(): THREE.CanvasTexture {
  const w = 512;
  const h = 192;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);
  ctx.filter = 'blur(14px)';
  ctx.fillStyle = 'rgba(40, 24, 10, 0.9)';
  const bw = w * 0.74;
  const bh = h * 0.42;
  ctx.beginPath();
  ctx.roundRect((w - bw) / 2, (h - bh) / 2, bw, bh, bh / 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

/**
 * The board's setting for now: a plain daylight studio, as in the reference photographs. A warm
 * seamless backdrop, one soft key light with a shadow, the sky's fill, and a pool of contact
 * shade under the board. The fireside world of the Teret spec (`Lights`, `Hearth`, `Hut` and the
 * rest of this folder) is not mounted while the board itself is being got right.
 */
export function Studio() {
  const shadowMap = useScene((s) => TIERS[s.tier].shadowMap);
  const shade = useMemo(makeContactShade, []);
  const length = BLUEPRINT.body.halfLength * 2;
  const width = BLUEPRINT.body.halfWidth * 2;
  return (
    <>
      <color attach="background" args={[BACKDROP]} />
      <Environment />
      <hemisphereLight args={['#fff6e6', '#b9a380', SKY_INTENSITY]} />
      <directionalLight
        position={KEY_POSITION}
        color="#fff3df"
        intensity={KEY_INTENSITY}
        castShadow={shadowMap > 0}
        shadow-mapSize={[shadowMap || 512, shadowMap || 512]}
        shadow-radius={shadowRadius(shadowMap || 512) * 1.6}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={1}
        shadow-camera-far={45}
      />
      {/* The floor shows only the shadow that falls on it, so the backdrop stays seamless. */}
      {shadowMap > 0 && (
        <mesh rotation-x={-Math.PI / 2} position={[0, GROUND_Y, 0]} receiveShadow>
          <planeGeometry args={[80, 80]} />
          <shadowMaterial color="#3a2410" opacity={0.3} />
        </mesh>
      )}
      <mesh rotation-x={-Math.PI / 2} position={[0, GROUND_Y + 0.01, 0]}>
        <planeGeometry args={[length * 1.35, width * 2.4]} />
        <meshBasicMaterial map={shade} transparent opacity={shadowMap > 0 ? 0.42 : 0.6} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  );
}
