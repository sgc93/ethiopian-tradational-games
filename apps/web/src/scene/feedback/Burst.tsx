import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Vec3 } from '../layout';
import { now, useFeedback, type StampedEvent } from './feedbackStore';

const vertexShader = /* glsl */ `
  attribute vec3 aVel;
  attribute float aBirth;
  attribute float aLife;
  attribute float aSize;
  uniform float uTime;
  uniform float uDpr;
  uniform float uGravity;
  varying float vAge;
  void main() {
    float age = (uTime - aBirth) / aLife;
    vAge = age;
    if (age < 0.0 || age > 1.0) {
      gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      return;
    }
    float t = age * aLife;
    vec3 p = position + aVel * t + vec3(0.0, 0.5 * uGravity * t * t, 0.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uDpr * (1.0 - age * 0.5) * (60.0 / -mv.z);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  varying float vAge;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = (1.0 - smoothstep(0.5, 1.0, d)) * (1.0 - smoothstep(0.5, 1.0, vAge)) * uAlpha;
    gl_FragColor = vec4(uColor, a);
  }
`;

export interface BurstProps {
  /** The event that sets a burst off, and where (the cup's centre, the fire). */
  event: 'landed' | 'captured' | 'burst';
  origin(e: StampedEvent): Vec3;
  /** How far from the origin particles are born, and over how many seconds. */
  radius?: number;
  spread?: number;
  /** Particles per burst, within [min, max]. */
  count: [number, number];
  /** Seconds each particle lives. */
  life: number;
  /** Rise speed in units/s within [min, max], and the sideways speed at most. */
  up: [number, number];
  out: number;
  /** Units/s² downwards (negative) or upwards. */
  gravity: number;
  /** Size in CSS px within [min, max]. */
  size: [number, number];
  color: string;
  /** Colour multiplier (above 1 feeds the bloom) and the peak alpha. */
  brightness?: number;
  alpha?: number;
  additive?: boolean;
  capacity?: number;
}

/**
 * A pool of GPU points that bursts from a cup when an event says so: dust when a stone lands,
 * sparks when four are captured (spec §7). The pool is a ring buffer; each spawn writes the next
 * slots' birth, velocity and size, and the shader does the rest.
 */
export function Burst({ event, origin, radius = 0.35, spread = 0.05, count, life, up, out, gravity, size, color, brightness = 1, alpha = 1, additive = false, capacity = 160 }: BurstProps) {
  const { geometry, material, attrs } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const attrs = {
      position: new THREE.BufferAttribute(new Float32Array(capacity * 3), 3),
      aVel: new THREE.BufferAttribute(new Float32Array(capacity * 3), 3),
      aBirth: new THREE.BufferAttribute(new Float32Array(capacity).fill(-1e9), 1),
      aLife: new THREE.BufferAttribute(new Float32Array(capacity).fill(1), 1),
      aSize: new THREE.BufferAttribute(new Float32Array(capacity), 1),
    };
    for (const [name, attr] of Object.entries(attrs)) {
      attr.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute(name, attr);
    }
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 12);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uDpr: { value: 1 },
        uGravity: { value: gravity },
        uColor: { value: new THREE.Color(color).multiplyScalar(brightness) },
        uAlpha: { value: alpha },
      },
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    return { geometry: g, material, attrs };
  }, [capacity, gravity, color, brightness, alpha, additive]);
  const next = useRef(0);
  const seen = useRef(0);

  useFrame(({ viewport }) => {
    const t = now();
    material.uniforms.uTime!.value = t;
    material.uniforms.uDpr!.value = viewport.dpr;
    const events = useFeedback.getState().events;
    for (const e of events) {
      if (e.id <= seen.current) continue;
      seen.current = e.id;
      if (e.kind !== event) continue;
      const [ox, oy, oz] = origin(e);
      const n = count[0] + Math.floor(Math.random() * (count[1] - count[0] + 1));
      for (let k = 0; k < n; k++) {
        const i = next.current;
        next.current = (i + 1) % capacity;
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * radius;
        attrs.position.setXYZ(i, ox + r * Math.cos(a), oy, oz + r * Math.sin(a));
        const side = Math.random() * out;
        attrs.aVel.setXYZ(i, side * Math.cos(a), up[0] + Math.random() * (up[1] - up[0]), side * Math.sin(a));
        attrs.aBirth.setX(i, t + Math.random() * spread);
        attrs.aLife.setX(i, life * (0.8 + Math.random() * 0.4));
        attrs.aSize.setX(i, size[0] + Math.random() * (size[1] - size[0]));
      }
      for (const attr of Object.values(attrs)) attr.needsUpdate = true;
    }
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
