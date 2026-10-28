import { PerformanceMonitor, Stats } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import { createSfx } from '../audio/sfx';
import { controller, useSession } from '../game/instance';
import { BoardScene } from '../scene/BoardScene';
import { CountLabels } from '../scene/CountLabels';
import { useApp } from '../state/store';

const showFps = typeof location !== 'undefined' && new URLSearchParams(location.search).has('fps');

export function GameScreen() {
  const session = useSession((s) => s.session);
  const settings = useApp((s) => s.settings);
  const [dpr, setDpr] = useState<number | [number, number]>([1, 2]);
  const sfx = useMemo(() => createSfx(), []);

  useEffect(() => sfx.setEnabled(settings.sound), [sfx, settings.sound]);
  useEffect(() => {
    // Browsers only allow sound after a gesture; every tap makes sure audio is running.
    const unlock = () => sfx.unlock();
    window.addEventListener('pointerdown', unlock);
    return () => window.removeEventListener('pointerdown', unlock);
  }, [sfx]);

  return (
    <div className="game-screen">
      <Canvas shadows="percentage" dpr={dpr} camera={{ fov: 40, near: 0.1, far: 100, position: [0, 6, 5] }}>
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <BoardScene
          session={session}
          settings={settings}
          speed={settings.speed}
          sfx={sfx}
          onHoleTap={controller.playHole}
          onAnimationDone={controller.animationDone}
        />
        {showFps && <Stats />}
      </Canvas>
      {settings.showCounts && <CountLabels />}
      {/* Temporary until the game flow screens exist (plan task 11). */}
      {!session && (
        <button
          className="btn btn-primary temp-start"
          onClick={() => {
            controller.start({ kind: 'computer', level: 'easy' }, 'quick');
            controller.toss('lion');
          }}
        >
          Start a test game
        </button>
      )}
    </div>
  );
}
