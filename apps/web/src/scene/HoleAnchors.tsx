import { HOLES } from '@etg/gebeta-rules';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { urlOptions } from '../urlOptions';
import { holeCenter } from './layout';

/** Where each hole's label sits on screen, in CSS pixels from the canvas's top-left. Updated every frame. */
export const holeScreenPositions: [number, number][] = Array.from({ length: HOLES }, () => [0, 0]);
/** Where each hole's centre is on screen, in CSS pixels. */
const holeCentres: [number, number][] = Array.from({ length: HOLES }, () => [0, 0]);

// The end-to-end layout test checks every hole is on screen; it only exists in test runs.
if (urlOptions.speed === 'skip' && typeof window !== 'undefined') {
  Object.assign(window, { __gebetaHolePositions: () => holeCentres.map((p) => [...p]) });
}

const LABEL_HEIGHT = 0.42;

/**
 * Projects the holes to the screen each frame and moves the DOM labels marked `data-hole-label`
 * to match. One cheap overlay instead of a React root per label.
 */
export function HoleAnchors() {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    const labels = document.querySelectorAll<HTMLElement>('[data-hole-label]');
    const project = (x: number, y: number, z: number): [number, number] => {
      v.set(x, y, z).project(camera);
      return [((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height];
    };
    for (let h = 0; h < HOLES; h++) {
      const [x, , z] = holeCenter(h);
      holeCentres[h] = project(x, 0, z);
      const [px, py] = (holeScreenPositions[h] = project(x, LABEL_HEIGHT, z));
      const el = labels[h];
      if (el) el.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%)`;
    }
  });
  return null;
}
