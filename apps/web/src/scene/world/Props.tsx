import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GROUND_Y } from '../layout';
import { flicker } from './flicker';
import { BASKET, BRAZIER, CUP, JEBENA, lathe, STOOL_LEG } from './latheProfiles';

const CLAY = { color: '#2a1a12', roughness: 0.35, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.3 };

function makeSteam(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(230, 220, 210, 0.7)');
  g.addColorStop(1, 'rgba(230, 220, 210, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/** The jebena on its brazier, with steam from the spout and pulsing coals. */
function CoffeeCorner() {
  const coals = useRef<THREE.MeshStandardMaterial>(null);
  const steam = useRef<THREE.Sprite[]>([]);
  const steamMap = useMemo(makeSteam, []);
  const pot = useMemo(() => lathe(JEBENA), []);
  const brazier = useMemo(() => lathe(BRAZIER), []);
  const cup = useMemo(() => lathe(CUP, 16), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (coals.current) coals.current.emissiveIntensity = 1.2 * (0.8 + 0.2 * Math.sin(2.1 * t)) * flicker(t * 0.5);
    steam.current.forEach((s, i) => {
      if (!s) return;
      const age = ((t * 0.8) / 1.2 + i * 0.25) % 1;
      s.position.set(1.0 + Math.sin(t + i) * 0.2, 5.2 + age * 1.8, 0.2 + Math.cos(t * 0.7 + i) * 0.2);
      s.scale.setScalar(0.6 + age * 1.2);
      (s.material as THREE.SpriteMaterial).opacity = 0.35 * (1 - age);
    });
  });
  return (
    <group>
      <group position={[-20, GROUND_Y, -9]}>
        <mesh geometry={brazier} castShadow receiveShadow>
          <meshPhysicalMaterial {...CLAY} color="#3a2416" clearcoat={0.2} roughness={0.7} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={2.2}>
          <circleGeometry args={[1.5, 16]} />
          <meshStandardMaterial ref={coals} color="#2a1208" emissive="#ff7a2a" emissiveIntensity={1.2} />
        </mesh>
        <group position-y={3}>
          <mesh geometry={pot} castShadow>
            <meshPhysicalMaterial {...CLAY} />
          </mesh>
          {/* The spout: a slim cone leaning out from the belly. */}
          <mesh position={[1.4, 2.6, 0]} rotation-z={-0.9} castShadow>
            <coneGeometry args={[0.28, 2.4, 10]} />
            <meshPhysicalMaterial {...CLAY} />
          </mesh>
          {/* The handle: a half torus on the far side. */}
          <mesh position={[-1.5, 2.4, 0]} rotation-y={Math.PI / 2} castShadow>
            <torusGeometry args={[1.0, 0.16, 8, 16, Math.PI]} />
            <meshPhysicalMaterial {...CLAY} />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <sprite key={i} ref={(s) => void (steam.current[i] = s!)}>
              <spriteMaterial map={steamMap} transparent opacity={0} depthWrite={false} />
            </sprite>
          ))}
        </group>
      </group>
      {/* A tray of six small cups. */}
      <group position={[-15, GROUND_Y, -11]}>
        <mesh position-y={0.15} receiveShadow castShadow>
          <cylinderGeometry args={[3.2, 3.2, 0.3, 24]} />
          <meshStandardMaterial color="#3a2414" roughness={0.8} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} geometry={cup} position={[1.8 * Math.cos(a), 0.3, 1.8 * Math.sin(a)]} castShadow>
              <meshPhysicalMaterial color="#efe6d8" roughness={0.3} clearcoat={0.5} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/** A low carved stool with a folded white gabi on it, its tilet border repeating the board's band. */
function StoolAndGabi() {
  const leg = useMemo(() => lathe(STOOL_LEG, 12), []);
  const band = useTexture('/textures/band-normal.webp');
  useMemo(() => {
    band.wrapS = THREE.RepeatWrapping;
    band.repeat.set(6, 1);
  }, [band]);
  return (
    <group position={[-32, GROUND_Y, 10]}>
      {[
        [-2.2, -2.2],
        [2.2, -2.2],
        [-2.2, 2.2],
        [2.2, 2.2],
      ].map(([x, z], i) => (
        <mesh key={i} geometry={leg} position={[x!, 0, z!]} castShadow>
          <meshStandardMaterial color="#4a2e1a" roughness={0.8} />
        </mesh>
      ))}
      <mesh position-y={6.3} castShadow receiveShadow>
        <boxGeometry args={[6, 0.6, 6]} />
        <meshStandardMaterial color="#5a3a22" roughness={0.75} />
      </mesh>
      <group position-y={7.2}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[5, 1.2, 4]} />
          <meshStandardMaterial color="#efe6d8" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0, 2.01]}>
          <planeGeometry args={[5, 1.2]} />
          <meshStandardMaterial color="#e6c88e" roughness={0.9} normalMap={band} />
        </mesh>
      </group>
    </group>
  );
}

function Basket() {
  const body = useMemo(() => lathe(BASKET, 28), []);
  return (
    <mesh geometry={body} position={[-20, GROUND_Y, 9]} castShadow receiveShadow>
      <meshStandardMaterial color="#8a6a36" roughness={0.9} />
    </mesh>
  );
}

/** The props around the fire: the coffee corner, the stool with the gabi, and the basket. */
export function Props() {
  return (
    <group>
      <CoffeeCorner />
      <StoolAndGabi />
      <Basket />
    </group>
  );
}
