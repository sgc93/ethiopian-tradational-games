import type { Player } from '@etg/gebeta-rules';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef, type ComponentRef } from 'react';
import type * as THREE from 'three';
import { seatCamera } from './layout';

const TURN_LIMIT = (25 * Math.PI) / 180;
const deg = (d: number) => (d * Math.PI) / 180;

/** Puts the camera behind a seat; players may tilt or turn it a little, never far enough to lose the board. */
export function CameraRig({ seat }: { seat: Player }) {
  const { camera, size } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const aspect = size.width / Math.max(1, size.height);
  const view = useMemo(() => seatCamera(seat, aspect), [seat, aspect]);
  const distance = Math.hypot(
    view.position[0] - view.target[0],
    view.position[1] - view.target[1],
    view.position[2] - view.target[2],
  );

  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(...view.position);
    cam.fov = view.fov;
    cam.updateProjectionMatrix();
    controls.current?.target.set(...view.target);
    controls.current?.update();
  }, [camera, view]);

  const azimuth = seat === 0 ? 0 : Math.PI;
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      minAzimuthAngle={azimuth - TURN_LIMIT}
      maxAzimuthAngle={azimuth + TURN_LIMIT}
      minPolarAngle={deg(35)}
      maxPolarAngle={deg(65)}
      minDistance={distance * 0.8}
      maxDistance={distance * 1.15}
    />
  );
}
