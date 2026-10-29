import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useScene } from '../sceneStore';
import { TIERS } from '../tiers';
import { flicker, jitter } from './flicker';

/** Where the fire burns: about 1 m beyond store B's end of the board. */
export const FIRE_POSITION: [number, number, number] = [-26, 3.5, -2];
const SPOT_POSITION: [number, number, number] = [-26, 4.5, -2];
const HUT_DOOR_LIGHT: [number, number, number] = [88, 12, 0];

const FIRE_INTENSITY = 900;
const SPOT_INTENSITY = 700;
const HUT_INTENSITY = 2600;

/**
 * The scene's six lights. The fire is the key: a flickering point light for colour and a spot
 * light at the same place for one set of long, low shadows across the board. A warm fill stands
 * in for bounced firelight on the board's top, the moon rims the horns from behind, the hut's
 * doorway glows at the far end, and a faint hemisphere keeps nothing fully black.
 */
export function Lights() {
  const fire = useRef<THREE.PointLight>(null);
  const spot = useRef<THREE.SpotLight>(null);
  const hut = useRef<THREE.PointLight>(null);
  const target = useMemo(() => {
    const t = new THREE.Object3D();
    t.position.set(0, 0, 0);
    return t;
  }, []);
  const shadowMap = useScene((s) => TIERS[s.tier].shadowMap || 512);
  const shadows = useScene((s) => !TIERS[s.tier].bakedShadow);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const f = flicker(t);
    if (fire.current) {
      fire.current.intensity = FIRE_INTENSITY * f;
      const [jx, jy, jz] = jitter(t, 1);
      fire.current.position.set(FIRE_POSITION[0] + jx, FIRE_POSITION[1] + jy, FIRE_POSITION[2] + jz);
    }
    if (spot.current) spot.current.intensity = SPOT_INTENSITY * f;
    if (hut.current) hut.current.intensity = HUT_INTENSITY * (0.9 + 0.1 * Math.sin(0.7 * t));
  });

  return (
    <>
      <pointLight ref={fire} position={FIRE_POSITION} color="#ff8f3f" intensity={FIRE_INTENSITY} decay={2} />
      <spotLight
        ref={spot}
        position={SPOT_POSITION}
        color="#ff8f3f"
        intensity={SPOT_INTENSITY}
        angle={0.5}
        penumbra={0.6}
        decay={2}
        target={target}
        castShadow={shadows}
        shadow-mapSize={[shadowMap, shadowMap]}
        shadow-camera-near={10}
        shadow-camera-far={60}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      <primitive object={target} />
      <directionalLight position={[-5.5, 8, 2]} intensity={0.9} color="#ffb070" />
      <directionalLight position={[8, 20, -14]} intensity={0.4} color="#8fb4ff" />
      <pointLight ref={hut} position={HUT_DOOR_LIGHT} color="#ffb35c" intensity={HUT_INTENSITY} distance={70} decay={2} />
      <hemisphereLight args={['#1b2740', '#2a1408', 0.18]} />
    </>
  );
}
