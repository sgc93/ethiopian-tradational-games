import { useMemo } from 'react';
import * as THREE from 'three';
import { buildEarthGeometry, GROUND_Y } from './earthGeometry';
import { makeEarthTexture } from './earthTexture';

/** The patch of ground the holes are scooped into, fading into wider ground around it. */
export function Earth() {
  const geometry = useMemo(() => buildEarthGeometry({ seed: 7, segments: 160 }), []);
  const map = useMemo(() => {
    const t = makeEarthTexture(256, 7);
    t.repeat.set(3, 2);
    return t;
  }, []);
  const outerMap = useMemo(() => {
    const t = map.clone();
    t.repeat.set(20, 20);
    t.needsUpdate = true;
    return t;
  }, [map]);

  return (
    <>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial map={map} vertexColors roughness={0.95} metalness={0} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={GROUND_Y - 0.002}>
        <circleGeometry args={[30, 48]} />
        <meshStandardMaterial map={outerMap} color={new THREE.Color('#9a8070')} roughness={1} />
      </mesh>
    </>
  );
}
