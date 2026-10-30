import { HOLES } from '@etg/gebeta-rules';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { DISCS, discAnchor } from '../ui/hud/discAnchors';
import { urlOptions } from '../urlOptions';
import { holeCenter } from './layout';
import { useScene } from './sceneStore';

/** Where each hole's centre is on screen, in CSS pixels. */
const holeCentres: [number, number][] = Array.from({ length: HOLES }, () => [0, 0]);

// The end-to-end layout test checks every hole is on screen; it only exists in test runs.
if (urlOptions.speed === 'skip' && typeof window !== 'undefined') {
  Object.assign(window, { __gebetaHolePositions: () => holeCentres.map((p) => [...p]) });
}

/**
 * Projects the fourteen disc anchors through the live camera every frame and moves the DOM discs
 * marked `data-disc` to match: one cheap pass instead of a React render per frame.
 */
export function DiscAnchors() {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    const discs = document.querySelectorAll<HTMLElement>('[data-disc]');
    const seat = useScene.getState().seat;
    const project = (x: number, y: number, z: number): [number, number] => {
      v.set(x, y, z).project(camera);
      return [((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height];
    };
    for (let h = 0; h < HOLES; h++) {
      const [x, , z] = holeCenter(h);
      holeCentres[h] = project(x, 0, z);
    }
    for (let i = 0; i < DISCS && i < discs.length; i++) {
      const [x, y, z] = discAnchor(i, seat);
      const [px, py] = project(x, y, z);
      discs[i]!.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%)`;
    }
  });
  return null;
}
