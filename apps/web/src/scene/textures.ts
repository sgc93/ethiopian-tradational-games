import { useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { BLUEPRINT } from './board/blueprint';
import type { BoardTextures } from './board/woodMaterial';

const BOARD_FILES = {
  map: '/textures/wood-color.webp',
  normal: '/textures/wood-normal.webp',
  rough: '/textures/wood-rough.webp',
  band: '/textures/band-normal.webp',
};

/** The board's textures, loaded once and set up for the board's UVs (the band repeats round the side). */
export function useBoardTextures(): BoardTextures {
  const tex = useTexture(BOARD_FILES) as Record<keyof typeof BOARD_FILES, THREE.Texture>;
  return useMemo(() => {
    for (const t of Object.values(tex)) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 4;
    }
    tex.map.colorSpace = THREE.SRGBColorSpace;
    tex.map.repeat.set(2, 2);
    tex.normal.repeat.set(2, 2);
    tex.rough.repeat.set(2, 2);
    tex.band.repeat.set(BLUEPRINT.band.repeats, 1);
    return tex;
  }, [tex]);
}
