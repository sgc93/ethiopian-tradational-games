import { useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { BLUEPRINT } from './board/blueprint';
import type { BoardTextures } from './board/woodMaterial';

const BOARD_FILES = {
  map: '/textures/wood-color.webp',
  end: '/textures/endgrain-color.webp',
  band: '/textures/band-normal.webp',
  bandHeight: '/textures/band-height.webp',
};

/**
 * The board's textures, loaded once: the long grain and the end grain, which the wood's shader
 * lays through the block itself, and the carved band's normals and height, which repeat round
 * the side on its uvs.
 */
export function useBoardTextures(): BoardTextures {
  const tex = useTexture(BOARD_FILES) as Record<keyof typeof BOARD_FILES, THREE.Texture>;
  return useMemo(() => {
    for (const t of Object.values(tex)) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
    }
    tex.map.colorSpace = THREE.SRGBColorSpace;
    tex.end.colorSpace = THREE.SRGBColorSpace;
    // The end grain's rings are about its centre and do not tile: mirror it rather than cut it.
    tex.end.wrapS = tex.end.wrapT = THREE.MirroredRepeatWrapping;
    tex.band.repeat.set(BLUEPRINT.band.repeats, 1);
    tex.bandHeight.repeat.set(BLUEPRINT.band.repeats, 1);
    return tex;
  }, [tex]);
}
