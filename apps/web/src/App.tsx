import { useEffect, useMemo, useRef } from 'react';
import { controller, useSession } from './game/instance';
import { SceneRoot } from './scene/SceneRoot';
import { useScene } from './scene/sceneStore';
import { AboutScreen } from './screens/AboutScreen';
import { GameScreen } from './screens/GameScreen';
import { HomeScreen } from './screens/HomeScreen';
import { NoWebGL } from './screens/NoWebGL';
import { TurnPhone } from './screens/TurnPhone';
import { useApp } from './state/store';
import { supportsWebGL2 } from './support';
import { usePortrait } from './ui/orientation';
import { UiLayer } from './ui/UiLayer';

/**
 * While the screen is portrait, "turn your phone" covers everything, the scene stops drawing and
 * the game is paused; landscape resumes it, but only if it was this that paused it.
 */
function usePortraitPause(portrait: boolean) {
  const pausedByOrientation = useRef(false);
  useEffect(() => {
    useScene.setState({ frameloop: portrait ? 'never' : 'always' });
    const session = useSession.getState().session;
    if (portrait) {
      if (session && !session.paused) {
        controller.setPaused(true);
        pausedByOrientation.current = true;
      }
    } else if (pausedByOrientation.current) {
      pausedByOrientation.current = false;
      controller.setPaused(false);
    }
  }, [portrait]);
}

export function App() {
  const screen = useApp((s) => s.screen);
  const webgl = useMemo(() => supportsWebGL2(), []);
  const portrait = usePortrait();
  usePortraitPause(portrait);
  if (!webgl) return <NoWebGL />;
  return (
    <>
      <SceneRoot />
      <UiLayer>
        <div className="screens" inert={portrait || undefined}>
          {screen === 'about' ? <AboutScreen /> : screen === 'game' ? <GameScreen /> : <HomeScreen />}
        </div>
        {portrait && <TurnPhone />}
      </UiLayer>
    </>
  );
}
