import { PerformanceMonitor, Stats } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';
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

/** The one canvas behind every screen: the fireside world, the board and the camera. */
export function SceneRoot() {
  const [declined, setDeclined] = useState(false);
  const { session, speed, sfx, suggested, onHoleTap, onAnimationDone, tier, fade, frameloop } = useScene();
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
