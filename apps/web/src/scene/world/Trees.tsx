import { mulberry32 } from '@etg/gebeta-rules';
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { GROUND_Y } from '../layout';

const COUNT = 24;
const NEAR = 400;
const FAR = 800;

/** Where each tree stands: on a loose ring, never in the strip directly behind the hut (±20° around +x). */
export function treePlacements(count: number, seed: number): { x: number; z: number; variant: number; height: number }[] {
  const rng = mulberry32(seed);
  const out: { x: number; z: number; variant: number; height: number }[] = [];
  while (out.length < count) {
    const a = rng() * Math.PI * 2;
    if (Math.abs(a) < Math.PI / 9 || Math.abs(a - Math.PI * 2) < Math.PI / 9) continue;
    const r = NEAR + rng() * (FAR - NEAR);
    out.push({ x: r * Math.cos(a), z: r * Math.sin(a), variant: Math.floor(rng() * 4), height: 200 + rng() * 200 });
  }
  return out;
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  #include <fog_pars_vertex>
  void main() {
    vUv = uv;
    vec3 p = position;
    // A slight sway, growing with height (uv.y), as if the whole tree leans in the breeze.
    float sway = sin(uTime * 0.4 + instanceMatrix[3].x * 0.01) * 0.026 * uv.y;
    p.x += sway * p.y;
    vec4 worldPosition = modelMatrix * instanceMatrix * vec4(p, 1.0);
    vec4 mvPosition = viewMatrix * worldPosition;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform float uVariant;
  uniform vec3 uColour;
  varying vec2 vUv;
  #include <fog_pars_fragment>
  void main() {
    vec4 s = texture2D(uAtlas, vec2((vUv.x + uVariant) / 4.0, vUv.y));
    if (s.a < 0.5) discard;
    gl_FragColor = vec4(uColour, 1.0);
    #include <fog_fragment>
  }
`;

/** Eucalyptus and acacia silhouettes on a ring 20–40 m out, as soft dark billboards that sway. */
export function Trees() {
  const atlas = useTexture('/textures/trees-color.webp');
  atlas.flipY = true;
  const placements = useMemo(() => treePlacements(COUNT, 17), []);
  const materials = useMemo(
    () =>
      [0, 1, 2, 3].map(
        (variant) =>
          new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: THREE.UniformsUtils.merge([
              THREE.UniformsLib.fog,
              { uTime: { value: 0 }, uAtlas: { value: atlas }, uVariant: { value: variant }, uColour: { value: new THREE.Color('#06080a') } },
            ]),
            fog: true,
            side: THREE.DoubleSide,
          }),
      ),
    [atlas],
  );
  const meshes = useMemo(() => {
    const m = new THREE.Matrix4();
    return [0, 1, 2, 3].map((variant) => {
      const mine = placements.filter((p) => p.variant === variant);
      const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), materials[variant]!, Math.max(1, mine.length));
      mine.forEach((p, i) => {
        const yaw = Math.atan2(p.x, p.z); // face the board's centre
        m.compose(new THREE.Vector3(p.x, GROUND_Y, p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(p.height * 0.8, p.height, 1));
        mesh.setMatrixAt(i, m);
      });
      mesh.count = mine.length;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = false;
      return mesh;
    });
  }, [placements, materials]);
  useFrame(({ clock }) => {
    for (const mat of materials) mat.uniforms.uTime!.value = clock.elapsedTime;
  });
  return (
    <>
      {meshes.map((mesh, i) => (
        <primitive key={i} object={mesh} />
      ))}
    </>
  );
}
