import * as THREE from 'three';

/**
 * A tiny procedural environment for reflections on the oiled wood and the stones: night-dark,
 * with a warm glow on the fire side (−x) and a faint blue cast from above. Nothing is downloaded.
 */
export function makeEnvironment(gl: THREE.WebGLRenderer): THREE.Texture {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050403');
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(6, 16, 12),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff9a3c').multiplyScalar(2.5) }),
  );
  glow.position.set(-20, 2, -2);
  scene.add(glow);
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(40, 16, 12),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#1b2740').multiplyScalar(0.5), side: THREE.BackSide }),
  );
  sky.position.set(0, 30, 0);
  scene.add(sky);
  const pmrem = new THREE.PMREMGenerator(gl);
  const env = pmrem.fromScene(scene, 0.04).texture;
  pmrem.dispose();
  return env;
}
