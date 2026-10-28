import { PerformanceMonitor, Stats } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useState } from 'react';
import { controller, useSession } from '../game/instance';
import { BoardScene } from '../scene/BoardScene';
import { useBoardView } from '../scene/boardView';
import { CountLabels } from '../scene/CountLabels';
import { useApp } from '../state/store';

const showFps = typeof location !== 'undefined' && new URLSearchParams(location.search).has('fps');

export function GameScreen() {
  const session = useSession((s) => s.session);
  const settings = useApp((s) => s.settings);
  const counts = useBoardView((s) => s.counts);
  const [dpr, setDpr] = useState<number | [number, number]>([1, 2]);

  return (
    <div className="game-screen">
      <Canvas shadows="percentage" dpr={dpr} camera={{ fov: 40, near: 0.1, far: 100, position: [0, 6, 5] }}>
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <BoardScene
          session={session}
          settings={settings}
          onHoleTap={controller.playHole}
          onAnimationDone={controller.animationDone}
        />
        {showFps && <Stats />}
      </Canvas>
      {settings.showCounts && <CountLabels counts={counts} />}
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
