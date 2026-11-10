import { PerformanceMonitor, Stats, useProgress } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useShallow } from 'zustand/react/shallow';
import { useBoardGeometry } from './board/useBoardGeometry';
import { BoardScene } from './BoardScene';
import { Post } from './Post';
import { useScene } from './sceneStore';
import { TIERS } from './tiers';
import { useTier } from './useTier';
import { Daylight } from './world/Daylight';
import { Yard } from './world/Yard';

const showFps = typeof location !== 'undefined' && new URLSearchParams(location.search).has('fps');

/** Measures the frame rate on the home screen and sets the tier; must live inside the canvas. */
function TierProbe() {
  useTier();
  return null;
}

/**
 * Mounts only once every sibling in its Suspense boundary has resolved, then waits for the board
 * and for the frames to be quick again: the first frames with everything in the scene upload the
 * buffers and compile the shaders, a stall of a second or two that must not land in the reveal.
 */
function WorldReady() {
  const detail = useScene((s) => TIERS[s.tier].detail);
  const geometry = useBoardGeometry(detail);
  const probe = useRef({ idle: 0, quick: 0 });
  useEffect(() => {
    probe.current = { idle: 0, quick: 0 };
  }, [geometry]);
  useFrame((_, delta) => {
    if (!geometry || useScene.getState().worldReady) return;
    const p = probe.current;
    // The loaders flip busy and idle in bursts as textures arrive (the board's follow its geometry),
    // so wait for a continuous idle stretch, read here and not through a lagging render.
    if (useProgress.getState().active) {
      p.idle = 0;
      p.quick = 0;
      return;
    }
    p.idle += delta;
    // Then three quick frames in a row: enough for React to commit what arrived and draw it once.
    // A machine that never manages a quick frame still gets its game after three idle seconds.
    p.quick = delta < 0.1 ? p.quick + 1 : 0;
    if ((p.idle > 0.3 && p.quick >= 3) || p.idle > 3) useScene.setState({ worldReady: true });
  });
  return null;
}

/** The one canvas behind every screen: the board on its mat in the yard, in daylight, and the camera. */
export function SceneRoot() {
  const [declined, setDeclined] = useState(false);
  // A shallow pick, so per-frame writes to the store do not re-render the canvas.
  const { session, speed, sfx, suggested, onHoleTap, onAnimationDone, tier, fade, frameloop } = useScene(
    useShallow((s) => ({
      session: s.session,
      speed: s.speed,
      sfx: s.sfx,
      suggested: s.suggested,
      onHoleTap: s.onHoleTap,
      onAnimationDone: s.onAnimationDone,
      tier: s.tier,
      fade: s.fade,
      frameloop: s.frameloop,
    })),
  );
  const dpr = declined ? Math.min(1, TIERS[tier].dpr) : TIERS[tier].dpr;

  return (
    <div className="scene-root" aria-hidden="true">
      <Canvas
        // Percentage-closer shadows: in three r186 these are the soft ones, their softness set by
        // each light's shadow radius. Asking for "soft" names a type three has removed.
        shadows="percentage"
        dpr={dpr}
        frameloop={frameloop}
        camera={{ fov: 30, near: 0.1, far: 2000, position: [0, 12, 11] }}
        // The renderer's tone mapping only reaches the screen on the minimal tier; with a composer
        // mounted, `Post` maps tones with the same Neutral curve (see `postPlan.ts` for why not AgX).
        gl={{ toneMapping: THREE.NeutralToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      >
        <PerformanceMonitor onDecline={() => setDeclined(true)} />
        <TierProbe />
        <Daylight />
        <Suspense fallback={null}>
          <Yard />
          <WorldReady />
        </Suspense>
        <BoardScene
          session={session}
          speed={speed}
          sfx={sfx}
          suggested={suggested}
          onHoleTap={onHoleTap}
          onAnimationDone={onAnimationDone}
        />
        <Post />
        {showFps && <Stats />}
      </Canvas>
      <div className="scene-fade" style={{ opacity: fade }} />
    </div>
  );
}
