import { useMemo } from 'react';
import { SceneRoot } from './scene/SceneRoot';
import { AboutScreen } from './screens/AboutScreen';
import { GameScreen } from './screens/GameScreen';
import { HomeScreen } from './screens/HomeScreen';
import { NoWebGL } from './screens/NoWebGL';
import { useApp } from './state/store';
import { supportsWebGL2 } from './support';
import { UiLayer } from './ui/UiLayer';

export function App() {
  const screen = useApp((s) => s.screen);
  const webgl = useMemo(() => supportsWebGL2(), []);
  if (!webgl) return <NoWebGL />;
  return (
    <>
      <SceneRoot />
      <UiLayer>{screen === 'about' ? <AboutScreen /> : screen === 'game' ? <GameScreen /> : <HomeScreen />}</UiLayer>
    </>
  );
}
