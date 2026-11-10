import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { BLUEPRINT } from '../board/blueprint';
import { GROUND_Y } from '../layout';
import { shadowRadius } from '../postPlan';
import { useScene } from '../sceneStore';
import { TIERS } from '../tiers';
import { DaySky, HAZE } from './DaySky';
import { leafUniforms } from './leafShade';
import { Motes } from './Motes';
import { SUN_DIRECTION, SUN_POSITION } from './sun';

const SUN_INTENSITY = 3.1;
const SKY_INTENSITY = 0.95;
const ENVIRONMENT_INTENSITY = 0.6;
/** Aerial haze: about 6% at the house, half at the far trees, all of it at the horizon. */
const HAZE_DENSITY = 0.0008;

/**
 * What the oiled wood and the stones reflect: the sky itself, paling to the horizon, the warm
 * earth below and the sun as a bright patch. Built once from a few coloured shapes; nothing is
 * downloaded.
 */
function SkyReflection() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const world = new THREE.Scene();
    const dome = new THREE.SphereGeometry(50, 32, 16);
    const y = dome.getAttribute('position');
    const colours = new Float32Array(y.count * 3);
    const zenith = new THREE.Color(0.42, 0.62, 1.0);
    const horizon = new THREE.Color(1.1, 1.08, 1.0);
    const earth = new THREE.Color(0.34, 0.25, 0.17);
    const c = new THREE.Color();
    for (let i = 0; i < y.count; i++) {
      const up = y.getY(i) / 50;
      if (up >= 0) c.copy(horizon).lerp(zenith, Math.pow(up, 0.6));
      else c.copy(horizon).lerp(earth, Math.min(1, -up * 5));
      colours.set([c.r, c.g, c.b], i * 3);
    }
    dome.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    world.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const sun = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.95, 0.82).multiplyScalar(9) }));
    sun.position.copy(SUN_DIRECTION).multiplyScalar(40);
    world.add(sun);
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(world, 0.03).texture;
    pmrem.dispose();
    dome.dispose();
    scene.environment = env;
    scene.environmentIntensity = ENVIRONMENT_INTENSITY;
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** A soft pool of shade under the board, drawn once: what the feet and the body keep off the mat. */
function makeContactShade(): THREE.CanvasTexture {
  const w = 512;
  const h = 192;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);
  ctx.filter = 'blur(14px)';
  ctx.fillStyle = 'rgba(30, 20, 22, 0.9)';
  const bw = w * 0.74;
  const bh = h * 0.42;
  ctx.beginPath();
  ctx.roundRect((w - bw) / 2, (h - bh) / 2, bw, bh, bh / 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

/**
 * The daylight of a highland morning: the sun as the one hard light, with the board's shadow;
 * the sky as the fill and as the wood's reflection; haze that pales everything with distance;
 * the sky dome with its ridges; dust in the sunlight. No textures, so it never suspends.
 */
export function Daylight() {
  const tier = useScene((s) => s.tier);
  const shadowMap = TIERS[tier].shadowMap;
  const shade = useMemo(makeContactShade, []);
  const leaf = useMemo(leafUniforms, []);
  const length = BLUEPRINT.body.halfLength * 2;
  const width = BLUEPRINT.body.halfWidth * 2;
  useFrame(({ clock }) => {
    leaf.uLeafTime.value = clock.elapsedTime;
  });
  return (
    <>
      <color attach="background" args={[HAZE]} />
      <fogExp2 attach="fog" args={[HAZE, HAZE_DENSITY]} />
      <SkyReflection />
      <hemisphereLight args={['#d4e6f7', '#a98a62', SKY_INTENSITY]} />
      <directionalLight
        position={SUN_POSITION}
        color="#fff0d8"
        intensity={SUN_INTENSITY}
        castShadow={shadowMap > 0}
        shadow-mapSize={[shadowMap || 512, shadowMap || 512]}
        shadow-radius={shadowRadius(shadowMap || 512) * 1.5}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-13}
        shadow-camera-right={13}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={45}
      />
      <DaySky sun={SUN_DIRECTION} />
      <mesh rotation-x={-Math.PI / 2} position={[0, GROUND_Y + 0.07, 0]} renderOrder={1}>
        <planeGeometry args={[length * 1.35, width * 2.4]} />
        <meshBasicMaterial map={shade} transparent opacity={shadowMap > 0 ? 0.4 : 0.62} depthWrite={false} toneMapped={false} />
      </mesh>
      {tier !== 'minimal' && <Motes count={tier === 'low' ? 36 : 70} />}
    </>
  );
}
