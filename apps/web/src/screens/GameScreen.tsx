import { useEffect, useMemo, useState } from 'react';
import { createSfx } from '../audio/sfx';
import { controller, useSession } from '../game/instance';
import { CountLabels } from '../scene/CountLabels';
import { useScene } from '../scene/sceneStore';
import { useApp } from '../state/store';
import { GuidedOverlay } from '../tutorial/GuidedOverlay';
import { useGuide } from '../tutorial/useGuide';
import { CoinToss } from '../ui/CoinToss';
import { GameMenu } from '../ui/GameMenu';
import { HoleButtons } from '../ui/HoleButtons';
import { Hud } from '../ui/Hud';
import { RoundSummary } from '../ui/RoundSummary';
import { urlOptions } from '../urlOptions';
import { ResultScreen } from './ResultScreen';

export function GameScreen() {
  const session = useSession((s) => s.session);
  const { settings, updateSettings, setScreen } = useApp();
  const speed = urlOptions.speed ?? settings.speed;
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

  const guide = useGuide(session, controller.setPaused);

  // Tell the scene what to show: the game, whose seat the camera sits behind, and the moment.
  const round = session?.match.round;
  const seat = session?.humanSeat ?? (settings.fixedCamera ? 0 : (round?.toMove ?? 0));
  useEffect(() => {
    useScene.setState({
      session,
      speed,
      sfx,
      suggested: guide.suggested,
      seat,
      onHoleTap: controller.playHole,
      onAnimationDone: controller.animationDone,
      mode: tossOpen ? 'toss' : session?.phase === 'round-summary' ? 'round-end' : session?.phase === 'finished' ? 'result' : 'play',
    });
  }, [session, speed, sfx, guide.suggested, seat, tossOpen]);
  useEffect(() => () => useScene.setState({ session: null, suggested: null, mode: 'home' }), []);

  const goHome = () => {
    controller.quit();
    setScreen('home');
  };

  return (
    <div className="game-screen">
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
          {guide.active && <GuidedOverlay guide={guide} session={session} onLeave={goHome} />}
          {session.phase === 'finished' && !guide.busy && (
            <ResultScreen session={session} onPlayAgain={controller.restart} onHome={goHome} />
          )}
        </>
      )}
    </div>
  );
}
