import { useProgress } from '@react-three/drei';
import { useEffect, useState } from 'react';
import { loadBoardGeometry } from './board/useBoardGeometry';
import { useScene } from './sceneStore';
import { TIERS } from './tiers';

export interface SceneReadiness {
  /** Texture and model downloads, 0–1; 1 once the world has rendered whatever it needed. */
  progress: number;
  geometryReady: boolean;
  fontsReady: boolean;
}

/** What the loading screen waits for: the downloads, the board build and the fonts. */
export function useSceneReadiness(): SceneReadiness {
  const loaded = useProgress((s) => s.progress);
  const worldReady = useScene((s) => s.worldReady);
  const detail = useScene((s) => TIERS[s.tier].detail);
  const [geometryReady, setGeometryReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(() => typeof document === 'undefined' || !('fonts' in document));

  useEffect(() => {
    let live = true;
    loadBoardGeometry(detail).then(
      () => live && setGeometryReady(true),
      () => live && setGeometryReady(true), // a failed build falls back to a plain board; nothing to wait for
    );
    return () => {
      live = false;
    };
  }, [detail]);

  useEffect(() => {
    if (fontsReady) return;
    let live = true;
    document.fonts.ready.then(() => live && setFontsReady(true));
    return () => {
      live = false;
    };
  }, [fontsReady]);

  // The downloads can finish before the world has drawn once, and that first draw is the slow
  // frame (buffer uploads, shader compiles): the last step waits for the scene to say so.
  return { progress: worldReady ? 1 : Math.min(0.95, loaded / 100), geometryReady, fontsReady };
}
