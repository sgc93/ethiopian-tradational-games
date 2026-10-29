import * as THREE from 'three';

export interface BoardTextures {
  map: THREE.Texture;
  normal: THREE.Texture;
  rough: THREE.Texture;
  band: THREE.Texture;
}

/** A radial darkening for the inside of the bowls, worn by hands: lightest at the rim, darkest at the bottom. */
function bowlOcclusion(size = 64): THREE.Texture {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x / (size - 1) - 0.5, y / (size - 1) - 0.5) * 2;
      const v = Math.round(255 * (0.55 + 0.45 * Math.min(1, d)));
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(data, size, size);
  t.needsUpdate = true;
  return t;
}

/**
 * The board's three materials, in the body's group order: wood (top and feet), the sides with
 * the carved band, and the bowls. Wanza wood with a light hand-rubbed oil finish.
 */
export function woodMaterial(tex: BoardTextures): [THREE.MeshPhysicalMaterial, THREE.MeshPhysicalMaterial, THREE.MeshStandardMaterial] {
  const wood = new THREE.MeshPhysicalMaterial({
    map: tex.map,
    normalMap: tex.normal,
    normalScale: new THREE.Vector2(0.6, 0.6),
    roughnessMap: tex.rough,
    roughness: 0.55,
    metalness: 0,
    clearcoat: 0.25,
    clearcoatRoughness: 0.35,
  });
  const sides = wood.clone();
  sides.normalMap = tex.band;
  sides.normalScale.set(1, 1);
  const bowls = new THREE.MeshStandardMaterial({
    map: tex.map,
    color: new THREE.Color('#cccccc'),
    roughness: 0.45,
    metalness: 0,
    aoMap: bowlOcclusion(),
    aoMapIntensity: 1,
  });
  return [wood, sides, bowls];
}
