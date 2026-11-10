import { Bloom, DepthOfField, EffectComposer, Noise, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import type { ReactElement } from 'react';
import { BOARD_FOCUS, FOCUS_RANGE, postEffects, type PostEffect } from './postPlan';
import { useScene } from './sceneStore';
import { TIERS } from './tiers';

/**
 * Post-processing by tier, in the order `postEffects` gives: a little bloom for the highlights,
 * Neutral tone mapping (the composer turns the renderer's own off), a trace of film grain and a
 * light vignette; depth of field focused on the board and SMAA on the high tier, and four-sample
 * multisampling in its place on the tiers below it, so no tier shows stair-stepped edges;
 * half-resolution bloom on the low tier; and nothing at all on the minimal tier, where the
 * renderer's tone mapping stands. The values are the daylight studio's: quieter than the night
 * scene's, so the wood shows its own colour.
 */
export function Post() {
  const level = useScene((s) => TIERS[s.tier].post);
  if (level === 'none') return null;
  const effect: Record<PostEffect, () => ReactElement> = {
    smaa: () => <SMAA key="smaa" />,
    bloom: () => <Bloom key="bloom" luminanceThreshold={0.92} intensity={0.25} mipmapBlur resolutionScale={level === 'light' ? 0.5 : 1} />,
    'depth-of-field': () => <DepthOfField key="dof" target={BOARD_FOCUS} focusRange={FOCUS_RANGE} bokehScale={2} />,
    'tone-mapping': () => <ToneMapping key="tone" mode={ToneMappingMode.NEUTRAL} />,
    grain: () => <Noise key="grain" opacity={0.025} />,
    vignette: () => <Vignette key="vignette" offset={0.3} darkness={0.38} />,
  };
  return (
    <EffectComposer multisampling={level === 'full' ? 0 : 4} enableNormalPass={false}>
      {postEffects(level).map((name) => effect[name]())}
    </EffectComposer>
  );
}
