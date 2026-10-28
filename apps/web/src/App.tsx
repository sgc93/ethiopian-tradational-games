import { useMemo } from 'react';
import { AboutScreen } from './screens/AboutScreen';
import { GameScreen } from './screens/GameScreen';
import { HomeScreen } from './screens/HomeScreen';
import { NoWebGL } from './screens/NoWebGL';
import { useApp } from './state/store';
import { supportsWebGL2 } from './support';

export function App() {
  const screen = useApp((s) => s.screen);
  const webgl = useMemo(() => supportsWebGL2(), []);
  if (!webgl) return <NoWebGL />;
  switch (screen) {
    case 'about':
      return <AboutScreen />;
    case 'game':
      return <GameScreen />;
    default:
      return <HomeScreen />;
  }
}
