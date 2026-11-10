import { mulberry32 } from '@etg/gebeta-rules';
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { GROUND_Y } from '../layout';

const COUNT = 26;
const NEAR = 650;
const FAR = 1300;

export interface TreePlacement {
  x: number;
  z: number;
  variant: number;
  height: number;
}

/** The trees that stand in the yard itself, near enough to frame the board: the two that shade it and one by the house. */
export const YARD_TREES: TreePlacement[] = [
  { x: -150, z: -235, variant: 2, height: 175 },
  { x: -330, z: -120, variant: 0, height: 200 },
  { x: -520, z: -300, variant: 1, height: 130 },
  { x: 560, z: -300, variant: 3, height: 150 },
];

/** Where the far trees stand: on a loose ring 30 to 65 m out, acacia and eucalyptus of 4 to 7 m. */
export function treePlacements(count: number, seed: number): TreePlacement[] {
  const rng = mulberry32(seed);
  const out: TreePlacement[] = [];
  while (out.length < count) {
    const a = rng() * Math.PI * 2;
    const r = NEAR + rng() * (FAR - NEAR);
    out.push({ x: r * Math.cos(a), z: r * Math.sin(a), variant: Math.floor(rng() * 4), height: 80 + rng() * 60 });
  }
  return out;
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vTone;
  #include <fog_pars_vertex>
  void main() {
    vUv = uv;
    vec3 p = position;
    // A slight sway, growing with height, as if the whole crown leans in the breeze.
    float sway = sin(uTime * 0.5 + instanceMatrix[3].x * 0.01) * 0.02 * uv.y * uv.y;
    p.x += sway;
    vTone = fract(instanceMatrix[3].x * 0.013 + instanceMatrix[3].z * 0.007);
    vec4 worldPosition = modelMatrix * instanceMatrix * vec4(p, 1.0);
    vec4 mvPosition = viewMatrix * worldPosition;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform float uVariant;
  varying vec2 vUv;
  varying float vTone;
  #include <fog_pars_fragment>
  void main() {
    vec4 s = texture2D(uAtlas, vec2((vUv.x + uVariant) / 4.0, vUv.y));
    if (s.a < 0.5) discard;
    // The cut-out is a silhouette; it is coloured here: bark below, leaves above, lit from the
    // upper left where the sun is, each tree a little greener or greyer than the next.
    vec3 bark = vec3(0.045, 0.026, 0.015);
    vec3 leafDark = mix(vec3(0.016, 0.04, 0.008), vec3(0.03, 0.045, 0.018), vTone);
    vec3 leafLit = mix(vec3(0.12, 0.19, 0.03), vec3(0.17, 0.2, 0.07), vTone);
    float crown = smoothstep(0.3, 0.5, vUv.y);
    float lit = clamp(0.5 + (vUv.y - 0.55) * 1.3 - (vUv.x - 0.5) * 0.8, 0.0, 1.0);
    vec3 colour = mix(bark, mix(leafDark, leafLit, lit), crown);
    gl_FragColor = vec4(colour, 1.0);
    #include <fog_fragment>
  }
`;

/** Acacia and eucalyptus round the yard and out towards the hills: cut-outs coloured for daylight, swaying a little. */
export function Trees() {
  const atlas = useTexture('/textures/trees-color.webp');
  atlas.flipY = true;
  const placements = useMemo(() => [...YARD_TREES, ...treePlacements(COUNT, 17)], []);
  const materials = useMemo(
    () =>
      [0, 1, 2, 3].map(
        (variant) =>
          new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uAtlas: { value: atlas }, uVariant: { value: variant } }]),
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
        m.compose(new THREE.Vector3(p.x, GROUND_Y, p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(p.height * 0.9, p.height, 1));
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
