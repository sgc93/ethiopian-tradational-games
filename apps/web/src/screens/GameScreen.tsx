import { useEffect, useState } from 'react';
import { sfx } from '../audio/instance';
import { controller, useSession } from '../game/instance';
import { CountDiscs } from '../ui/hud/CountDiscs';
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
import { hudShown, menuShown } from './gameChrome';
import { ResultScreen } from './ResultScreen';

export function GameScreen() {
  const session = useSession((s) => s.session);
  const { settings, updateSettings, setScreen } = useApp();
  const speed = urlOptions.speed ?? settings.speed;
  const [tossOpen, setTossOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!session) setScreen('home');
    else if (session.phase === 'toss') setTossOpen(true);
  }, [session, setScreen]);

  const guide = useGuide(session, controller.setPaused);

  // Tell the scene what to show: the game, whose seat the camera sits behind, and the moment.
  const round = session?.match.round;
  const seat = session?.humanSeat ?? (settings.fixedCamera ? 0 : (round?.toMove ?? 0));
  useEffect(() => {
    const mode = tossOpen ? 'toss' : menuOpen ? 'paused' : session?.phase === 'round-summary' ? 'round-end' : session?.phase === 'finished' ? 'result' : 'play';
    useScene.setState((s) => ({
      session,
      speed,
      sfx,
      suggested: guide.suggested,
      seat,
      onHoleTap: controller.playHole,
      onAnimationDone: controller.animationDone,
      mode,
      cameraMoving: s.cameraMoving || s.mode !== mode || s.seat !== seat,
    }));
  }, [session, speed, guide.suggested, seat, tossOpen, menuOpen]);
  useEffect(() => () => useScene.setState({ session: null, suggested: null, mode: 'home' }), []);

  const goHome = () => {
    controller.quit();
    setScreen('home');
  };

  return (
    <div className="game-screen">
      {settings.showCounts && <CountDiscs />}
      {session && (
        <>
          {hudShown({ phase: session.phase, tossOpen, card: guide.card !== null }) && <Hud session={session} />}
          {menuShown({ phase: session.phase, tossOpen, lesson: guide.active }) && (
          <GameMenu
            session={session}
            settings={settings}
            onPause={(paused) => {
              setMenuOpen(paused);
              controller.setPaused(paused);
            }}
            onSettings={updateSettings}
            onRestart={controller.restart}
            onQuit={goHome}
          />
          )}
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
