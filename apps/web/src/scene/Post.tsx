import { Bloom, DepthOfField, EffectComposer, Noise, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useMemo, type ReactElement } from 'react';
import { GradeEffect } from './gradeEffect';
import { BOARD_FOCUS, FOCUS_RANGE, postEffects, type PostEffect } from './postPlan';
import { useScene } from './sceneStore';
import { TIERS } from './tiers';

/**
 * Post-processing by tier, in the order `postEffects` gives: bloom for the fire and the gold,
 * Neutral tone mapping (the composer turns the renderer's own off), film grain, a vignette and the
 * colour grade; depth of field focused on the board and SMAA on the high tier only;
 * half-resolution bloom on the low tier; and nothing at all on the minimal tier, where the
 * renderer's tone mapping stands.
 */
export function Post() {
  const level = useScene((s) => TIERS[s.tier].post);
  const grade = useMemo(() => new GradeEffect(), []);
  if (level === 'none') return null;
  const effect: Record<PostEffect, () => ReactElement> = {
    smaa: () => <SMAA key="smaa" />,
    bloom: () => <Bloom key="bloom" luminanceThreshold={0.85} intensity={0.6} mipmapBlur resolutionScale={level === 'light' ? 0.5 : 1} />,
    'depth-of-field': () => <DepthOfField key="dof" target={BOARD_FOCUS} focusRange={FOCUS_RANGE} bokehScale={2} />,
    'tone-mapping': () => <ToneMapping key="tone" mode={ToneMappingMode.NEUTRAL} />,
    grain: () => <Noise key="grain" opacity={0.06} />,
    vignette: () => <Vignette key="vignette" offset={0.35} darkness={0.65} />,
    grade: () => <primitive key="grade" object={grade} />,
  };
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {postEffects(level).map((name) => effect[name]())}
    </EffectComposer>
  );
}
