import { PerformanceMonitor, Stats } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import { createSfx } from '../audio/sfx';
import { controller, useSession } from '../game/instance';
import { BoardScene } from '../scene/BoardScene';
import { CountLabels } from '../scene/CountLabels';
import { useApp } from '../state/store';
import { CoinToss } from '../ui/CoinToss';
import { GameMenu } from '../ui/GameMenu';
import { HoleButtons } from '../ui/HoleButtons';
import { Hud } from '../ui/Hud';
import { RoundSummary } from '../ui/RoundSummary';
import { urlOptions } from '../urlOptions';
import { ResultScreen } from './ResultScreen';

const showFps = typeof location !== 'undefined' && new URLSearchParams(location.search).has('fps');

export function GameScreen() {
  const session = useSession((s) => s.session);
  const { settings, updateSettings, setScreen } = useApp();
  const speed = urlOptions.speed ?? settings.speed;
  const [dpr, setDpr] = useState<number | [number, number]>([1, 2]);
  const [tossOpen, setTossOpen] = useState(false);
  const sfx = useMemo(() => createSfx(), []);

  useEffect(() => sfx.setEnabled(settings.sound), [sfx, settings.sound]);
  useEffect(() => {
    // Browsers only allow sound after a gesture; every tap makes sure audio is running.
    const unlock = () => sfx.unlock();
    window.addEventListener('pointerdown', unlock);
    return () => window.removeEventListener('pointerdown', unlock);
  }, [sfx]);

  useEffect(() => {
    if (!session) setScreen('home');
    else if (session.phase === 'toss') setTossOpen(true);
  }, [session, setScreen]);

  const goHome = () => {
    controller.quit();
    setScreen('home');
  };

  return (
    <div className="game-screen">
      <Canvas shadows="percentage" dpr={dpr} camera={{ fov: 40, near: 0.1, far: 100, position: [0, 6, 5] }}>
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <BoardScene
          session={session}
          settings={settings}
          speed={speed}
          sfx={sfx}
          onHoleTap={controller.playHole}
          onAnimationDone={controller.animationDone}
        />
        {showFps && <Stats />}
      </Canvas>
      {settings.showCounts && <CountLabels />}
      {session && (
        <>
          <Hud session={session} />
          <GameMenu
            session={session}
            settings={settings}
            onPause={controller.setPaused}
            onSettings={updateSettings}
            onRestart={controller.restart}
            onQuit={goHome}
          />
          <HoleButtons session={session} onPlay={controller.playHole} />
          {tossOpen && (
            <CoinToss
              session={session}
              speed={speed}
              onCall={(call) => {
                // Hold the game while the coin is in the air; the computer may already be thinking.
                controller.setPaused(true);
                return controller.toss(call);
              }}
              onDone={() => {
                setTossOpen(false);
                controller.setPaused(false);
              }}
            />
          )}
          {session.phase === 'round-summary' && <RoundSummary session={session} onNext={controller.continueAfterSummary} />}
          {session.phase === 'finished' && (
            <ResultScreen session={session} onPlayAgain={controller.restart} onHome={goHome} />
          )}
        </>
      )}
    </div>
  );
}
