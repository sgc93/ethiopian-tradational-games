import { PerformanceMonitor, Stats, useProgress } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useShallow } from 'zustand/react/shallow';
import { useBoardGeometry } from './board/useBoardGeometry';
import { BoardScene } from './BoardScene';
import { Post } from './Post';
import { useScene } from './sceneStore';
import { TIERS } from './tiers';
import { useTier } from './useTier';
import { Embers } from './world/Embers';
import { makeEnvironment } from './world/environment';
import { Flame } from './world/Flame';
import { Grass } from './world/Grass';
import { Ground } from './world/Ground';
import { Hearth } from './world/Hearth';
import { Hut } from './world/Hut';
import { BakedShadow } from './world/BakedShadow';
import { Lights } from './world/Lights';
import { Mat } from './world/Mat';
import { Props } from './world/Props';
import { Sky } from './world/Sky';
import { Smoke } from './world/Smoke';
import { Trees } from './world/Trees';

const showFps = typeof location !== 'undefined' && new URLSearchParams(location.search).has('fps');

/** Reflections from a tiny procedural night environment, built once per renderer. */
function Environment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const env = makeEnvironment(gl);
    scene.environment = env;
    scene.environmentIntensity = 0.6;
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** Measures the frame rate on the home screen and sets the tier; must live inside the canvas. */
function TierProbe() {
  useTier();
  return null;
}

/**
 * Mounts only once every sibling in its Suspense boundary has resolved, then waits for the board
 * and for the frames to be quick again: the first frames with everything in the scene upload the
 * buffers and compile the shaders, a stall of a second or two that must not land in the flare.
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

/** The one canvas behind every screen: the fireside world, the board and the camera. */
export function SceneRoot() {
  const [declined, setDeclined] = useState(false);
  // A shallow pick, so the per-frame `flare` writes during the loading flare do not re-render the canvas.
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
        shadows="soft"
        dpr={dpr}
        frameloop={frameloop}
        camera={{ fov: 30, near: 0.1, far: 2000, position: [0, 12, 11] }}
        gl={{ toneMapping: THREE.AgXToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      >
        <PerformanceMonitor onDecline={() => setDeclined(true)} />
        <TierProbe />
        <color attach="background" args={['#0a0806']} />
        <fogExp2 attach="fog" args={['#0a0806', 0.0035]} />
        <Environment />
        <Lights />
        <Suspense fallback={null}>
          <Sky />
          <Ground />
          <Mat />
          <Hearth />
          <Props />
          <Hut />
          <Trees />
          <WorldReady />
        </Suspense>
        <Grass />
        {TIERS[tier].bakedShadow && <BakedShadow />}
        <Flame />
        <Embers />
        <Smoke />
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
