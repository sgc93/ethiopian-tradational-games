import { Bloom, DepthOfField, EffectComposer, Noise, SMAA, Vignette } from '@react-three/postprocessing';
import { useMemo } from 'react';
import { GradeEffect } from './gradeEffect';
import { useScene } from './sceneStore';
import { TIERS } from './tiers';

/**
 * Post-processing by tier: bloom for the fire and the gold, a vignette, film grain and the colour
 * grade; depth of field and SMAA on the high tier only; half-resolution bloom on the low tier; and
 * nothing at all on the minimal tier (the renderer's tone mapping alone).
 */
export function Post() {
  const level = useScene((s) => TIERS[s.tier].post);
  const grade = useMemo(() => new GradeEffect(), []);
  if (level === 'none') return null;
  const light = level === 'light';
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {level === 'full' ? <SMAA /> : <></>}
      <Bloom luminanceThreshold={0.85} intensity={0.6} mipmapBlur resolutionScale={light ? 0.5 : 1} />
      {level === 'full' ? <DepthOfField focusDistance={0.02} focalLength={0.02} bokehScale={2} /> : <></>}
      <Noise opacity={0.06} />
      <Vignette offset={0.35} darkness={0.65} />
      <primitive object={grade} />
    </EffectComposer>
  );
}
