import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GROUND_Y } from '../layout';
import { SunBlob } from './sun';
import { BASKET, BRAZIER, CUP, JEBENA, lathe } from './latheProfiles';

/** Where each stands on the ground (x, z): behind the board as the home view sees it, clear of the play view. */
const COFFEE: [number, number] = [-9, -30];
const TRAY: [number, number] = [-1, -33];
const BASKET_AT: [number, number] = [36, -27];

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
    if (coals.current) coals.current.emissiveIntensity = 0.9 * (0.8 + 0.2 * Math.sin(2.1 * t));
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
      <SunBlob at={[COFFEE[0], COFFEE[1]]} radius={2.6} height={7} />
      <SunBlob at={[TRAY[0], TRAY[1]]} radius={3.3} height={0.8} opacity={0.4} />
      <group position={[COFFEE[0], GROUND_Y, COFFEE[1]]}>
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
      <group position={[TRAY[0], GROUND_Y, TRAY[1]]}>
        <mesh position-y={0.15} receiveShadow castShadow>
          <cylinderGeometry args={[3.2, 3.2, 0.3, 24]} />
          <meshStandardMaterial color="#3a2414" roughness={0.8} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} geometry={cup} position={[1.8 * Math.cos(a), 0.3, 1.8 * Math.sin(a)]} castShadow>
              <meshPhysicalMaterial color="#d9cfbf" roughness={0.3} clearcoat={0.5} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/** The basket's dyed coils: straw, with bands of red, green and black and a row of diamonds, wrapped round it. */
function makeWeave(): THREE.CanvasTexture {
  const w = 256;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#c9a25c';
  ctx.fillRect(0, 0, w, h);
  const band = (y: number, height: number, colour: string) => {
    ctx.fillStyle = colour;
    ctx.fillRect(0, y, w, height);
  };
  band(40, 14, '#8a2a1c');
  band(58, 5, '#2a1c14');
  band(96, 30, '#8a2a1c');
  band(170, 5, '#2a1c14');
  band(180, 14, '#3f5a2c');
  ctx.fillStyle = '#e6c98a';
  for (let x = 0; x < w; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x + 16, 99);
    ctx.lineTo(x + 28, 111);
    ctx.lineTo(x + 16, 123);
    ctx.lineTo(x + 4, 111);
    ctx.fill();
  }
  // The coils themselves: fine dark lines across.
  ctx.fillStyle = 'rgba(60, 40, 20, 0.22)';
  for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 1.5);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(3, 1);
  return t;
}

function Basket() {
  const body = useMemo(() => lathe(BASKET, 28), []);
  const weave = useMemo(makeWeave, []);
  return (
    <>
      <SunBlob at={[BASKET_AT[0], BASKET_AT[1]]} radius={5} height={8} />
      <mesh geometry={body} position={[BASKET_AT[0], GROUND_Y, BASKET_AT[1]]} scale={1.1} castShadow receiveShadow>
        <meshStandardMaterial map={weave} roughness={0.9} />
      </mesh>
    </>
  );
}

/** The things of the yard, set out beyond the board where the home view finds them: the coffee corner and the woven basket-table. */
export function Props() {
  return (
    <group>
      <CoffeeCorner />
      <Basket />
    </group>
  );
}
