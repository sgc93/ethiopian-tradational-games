import { useEffect, useMemo, useRef, useState } from 'react';
import { controller, useSession } from './game/instance';
import { SceneRoot } from './scene/SceneRoot';
import { useScene } from './scene/sceneStore';
import { AboutScreen } from './screens/AboutScreen';
import { GameScreen } from './screens/GameScreen';
import { HomeScreen } from './screens/HomeScreen';
import { Loading } from './screens/Loading';
import { NoWebGL } from './screens/NoWebGL';
import { TurnPhone } from './screens/TurnPhone';
import { useApp } from './state/store';
import { supportsWebGL2 } from './support';
import { usePortrait } from './ui/orientation';
import { UiLayer } from './ui/UiLayer';
import { urlOptions } from './urlOptions';

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
  // The scene loads behind the loading screen; the screens mount once the fire has flared.
  const [loaded, setLoaded] = useState(false);
  usePortraitPause(portrait);
  // `?still=1`: the lit scene alone, for the no-WebGL still (the loading flare is skipped).
  useEffect(() => {
    if (urlOptions.still) useScene.setState({ flare: 1 });
  }, []);
  if (!webgl) {
    return (
      <UiLayer>
        <NoWebGL />
      </UiLayer>
    );
  }
  if (urlOptions.still) return <SceneRoot />;
  return (
    <>
      <SceneRoot />
      <UiLayer>
        {loaded && (
          <div className="screens" inert={portrait || undefined}>
            {screen === 'about' ? <AboutScreen /> : screen === 'game' ? <GameScreen /> : <HomeScreen />}
          </div>
        )}
        {!loaded && <Loading onDone={() => setLoaded(true)} />}
        {portrait && <TurnPhone />}
      </UiLayer>
    </>
  );
}
