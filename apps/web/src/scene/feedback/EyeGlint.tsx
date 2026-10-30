import type { Player } from '@etg/gebeta-rules';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BLUEPRINT } from '../board/blueprint';
import type { Vec3 } from '../layout';
import { latest, now, useFeedback } from './feedbackStore';
import { glowTexture } from './glowTexture';

const GLINT_S = 0.4;
/** The eye in the head's own frame: forward 1.05, up 1.85, out to the side 0.32. */
const EYE_LOCAL: Vec3 = [1.05, 1.85, 0.32];

/** Where the owning head's eye is in the world: A's head stands at +x facing −x, B's at −x facing +x. */
export function eyePosition(player: Player): Vec3 {
  const x = BLUEPRINT.heads.x;
  return player === 0 ? [x - EYE_LOCAL[0], EYE_LOCAL[1], EYE_LOCAL[2]] : [-x + EYE_LOCAL[0], EYE_LOCAL[1], -EYE_LOCAL[2]];
}

/** A 0.08 glint of light in the owning ibex's eye for 0.4 s as a capture lands (spec §7 "Captures"). */
export function EyeGlint() {
  const map = useMemo(glowTexture, []);
  const materials = useRef<(THREE.SpriteMaterial | null)[]>([]);

  useFrame(() => {
    const captured = latest(useFeedback.getState().events, 'captured');
    const age = captured ? (now() - captured.at) / GLINT_S : 2;
    for (const player of [0, 1] as Player[]) {
      const m = materials.current[player];
      if (m) m.opacity = captured && captured.by === player && age < 1 ? Math.sin(Math.PI * age) : 0;
    }
  });

  return (
    <>
      {([0, 1] as Player[]).map((player) => (
        <sprite key={player} position={eyePosition(player)} scale={[0.16, 0.16, 1]}>
          <spriteMaterial
            ref={(m) => void (materials.current[player] = m)}
            map={map}
            color={new THREE.Color('#fff1c4').multiplyScalar(2)}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      ))}
    </>
  );
}
