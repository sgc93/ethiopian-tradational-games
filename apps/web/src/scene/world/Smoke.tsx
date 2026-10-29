import { mulberry32 } from '@etg/gebeta-rules';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useScene } from '../sceneStore';
import { TIERS } from '../tiers';
import { FLAME_BASE } from './embersState';

const RISE = 3;
const DRIFT = 1.2;
const GONE_AT = 80;

function makePuff(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(120, 100, 90, 0.9)');
  g.addColorStop(0.5, 'rgba(90, 75, 70, 0.35)');
  g.addColorStop(1, 'rgba(60, 50, 48, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/** Soft, low-opacity puffs rising from the fire and drifting towards +x, gone by about 4 m up. */
export function Smoke() {
  const tier = useScene((s) => s.tier);
  const count = TIERS[tier].smoke;
  const puff = useMemo(makePuff, []);
  const sprites = useRef<THREE.Sprite[]>([]);
  const seeds = useMemo(() => {
    const rng = mulberry32(9);
    return Array.from({ length: count }, () => ({ phase: rng(), wobble: rng() * Math.PI * 2, speed: 0.8 + rng() * 0.4 }));
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    seeds.forEach((s, i) => {
      const sprite = sprites.current[i];
      if (!sprite) return;
      const life = GONE_AT / (RISE * s.speed);
      const age = ((t * s.speed) / life + s.phase) % 1;
      const y = age * GONE_AT;
      sprite.position.set(FLAME_BASE[0] + DRIFT * age * life * 0.3 + Math.sin(t * 0.5 + s.wobble) * 2, FLAME_BASE[1] + 8 + y, FLAME_BASE[2] + Math.cos(t * 0.4 + s.wobble) * 2);
      const size = 8 + age * 16;
      sprite.scale.set(size, size, 1);
      (sprite.material as THREE.SpriteMaterial).opacity = 0.18 * (1 - age) * Math.min(1, age * 6);
    });
  });

  return (
    <group>
      {seeds.map((_, i) => (
        <sprite key={i} ref={(s) => void (sprites.current[i] = s!)}>
          <spriteMaterial map={puff} transparent opacity={0} depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}
