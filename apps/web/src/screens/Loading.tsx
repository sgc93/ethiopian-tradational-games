import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FIRST_FLARE_S, RETURN_FLARE_S, flareCurve, hasVisited, loadingState, markVisited, type VisitStorage } from '../scene/loading';
import { useScene } from '../scene/sceneStore';
import { useSceneReadiness } from '../scene/useSceneReadiness';
import { Emblem } from '../ui/kit';
import { urlOptions } from '../urlOptions';
import './Loading.css';

/** localStorage, or something that throws like it when even touching it is refused. */
function visitStorage(): VisitStorage {
  try {
    return globalThis.localStorage;
  } catch {
    return {
      getItem() {
        throw new Error('no storage');
      },
      setItem() {
        throw new Error('no storage');
      },
    };
  }
}

/**
 * "Lighting the fire…" (spec §9, screen 1): the emblem, the name and a gold line filling as the
 * scene loads. When everything is ready it fades over 300 ms while the fire flares from black,
 * then `onDone` fires and the home screen takes over.
 */
export function Loading({ onDone }: { onDone(): void }) {
  const { t } = useTranslation();
  const { progress, geometryReady, fontsReady } = useSceneReadiness();
  // A high-water mark: the loaders restart their count with each batch of textures, and a line
  // that runs backwards looks broken.
  const peak = useRef(0);
  peak.current = Math.max(peak.current, loadingState(progress, geometryReady, fontsReady));
  const state = peak.current;
  const ready = state >= 1;
  const [exiting, setExiting] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (!ready) return;
    const storage = visitStorage();
    // The test-only skip speed takes the flare to almost nothing, so the e2e suite does not wait on it.
    const duration = urlOptions.speed === 'skip' ? 0.05 : hasVisited(storage) ? RETURN_FLARE_S : FIRST_FLARE_S;
    markVisited(storage);
    setExiting(true);

    const start = performance.now();
    let frame = 0;
    const tick = () => {
      const flare = flareCurve((performance.now() - start) / 1000, duration);
      useScene.setState({ flare });
      if (flare < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const timer = setTimeout(() => {
      useScene.setState({ flare: 1 });
      done.current();
    }, duration * 1000);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [ready]);

  const percent = Math.round(state * 100);
  return (
    <div className={`loading${exiting ? ' loading-exit' : ''}`} aria-busy={!ready}>
      <Emblem size={56} />
      <p className="loading-name">GEBETA</p>
      <div
        className="loading-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={t('loading.line')}
      >
        <i style={{ width: `${percent}%` }} />
      </div>
      <p className="loading-line">{t('loading.line')}</p>
    </div>
  );
}
