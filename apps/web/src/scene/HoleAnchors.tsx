import { HOLES } from '@etg/gebeta-rules';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { holeCenter } from './layout';

/** Where each hole's label sits on screen, in CSS pixels from the canvas's top-left. Updated every frame. */
export const holeScreenPositions: [number, number][] = Array.from({ length: HOLES }, () => [0, 0]);

const LABEL_HEIGHT = 0.42;

/**
 * Projects the holes to the screen each frame and moves the DOM labels marked `data-hole-label`
 * to match. One cheap overlay instead of a React root per label.
 */
export function HoleAnchors() {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    const labels = document.querySelectorAll<HTMLElement>('[data-hole-label]');
    for (let h = 0; h < HOLES; h++) {
      const [x, , z] = holeCenter(h);
      v.set(x, LABEL_HEIGHT, z).project(camera);
      const px = ((v.x + 1) / 2) * size.width;
      const py = ((1 - v.y) / 2) * size.height;
      holeScreenPositions[h] = [px, py];
      const el = labels[h];
      if (el) el.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%)`;
    }
  });
  return null;
}
