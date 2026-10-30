import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { COIN_FONT, makeCoinFace } from './coinFaces';
import { COIN_REST_Y, coinSpin } from './coinSpin';
import { useScene } from './sceneStore';

const RADIUS = 0.9;
const THICKNESS = 0.12;

/**
 * The toss coin (spec §9 "Coin"): a real gold coin, 0.9 across, lettered አንበሳ on top and ሰው
 * underneath inside a sun-ray border. It waits flat between the rows while the toss is on, spins
 * up when `useScene.coin` is set, and stays as it landed until the next toss.
 */
export function Coin() {
  const mode = useScene((s) => s.mode);
  const group = useRef<THREE.Group>(null);
  const [faces, setFaces] = useState<{ lion: ReturnType<typeof makeCoinFace>; person: ReturnType<typeof makeCoinFace> } | null>(null);

  // The faces are lettered once the Ge’ez face is in, else the canvas would fall back to a system font.
  useEffect(() => {
    let live = true;
    const ready = typeof document !== 'undefined' && 'fonts' in document ? document.fonts.load(COIN_FONT, 'አንበሳ ሰው') : Promise.resolve();
    ready.then(
      () => live && setFaces({ lion: makeCoinFace('አንበሳ'), person: makeCoinFace('ሰው') }),
      () => live && setFaces({ lion: makeCoinFace('አንበሳ'), person: makeCoinFace('ሰው') }),
    );
    return () => {
      live = false;
    };
  }, []);

  const materials = useMemo(() => {
    const gold = { color: '#d6ae6a', metalness: 0.9, roughness: 0.3 };
    const side = new THREE.MeshPhysicalMaterial(gold);
    const top = new THREE.MeshPhysicalMaterial({ ...gold, map: faces?.lion.map ?? null, normalMap: faces?.lion.normal ?? null });
    const bottom = new THREE.MeshPhysicalMaterial({ ...gold, map: faces?.person.map ?? null, normalMap: faces?.person.normal ?? null });
    // Seen from below the bottom cap's drawing is mirrored; flip it so the word reads right once it faces up.
    if (bottom.map) {
      bottom.map.wrapS = THREE.RepeatWrapping;
      bottom.map.repeat.x = -1;
      bottom.map.offset.x = 1;
    }
    if (bottom.normalMap) {
      bottom.normalMap.wrapS = THREE.RepeatWrapping;
      bottom.normalMap.repeat.x = -1;
      bottom.normalMap.offset.x = 1;
    }
    return [side, top, bottom];
  }, [faces]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const coin = useScene.getState().coin;
    if (!coin) {
      g.position.y = COIN_REST_Y;
      g.rotation.set(0, 0, 0);
      return;
    }
    const s = coinSpin(performance.now() / 1000 - coin.startedAt, coin.lands);
    g.position.y = s.y;
    g.rotation.set(s.rx, 0, s.ry);
  });

  return (
    <group ref={group} position={[0, COIN_REST_Y, 0]} visible={mode === 'toss'}>
      <mesh material={materials} castShadow>
        <cylinderGeometry args={[RADIUS, RADIUS, THICKNESS, 64]} />
      </mesh>
    </group>
  );
}
