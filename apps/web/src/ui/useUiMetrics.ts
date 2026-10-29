import { useEffect, useState } from 'react';
import { useScene } from '../scene/sceneStore';
import { uiMetrics, type UiMetrics } from './uiMetrics';

/** The visible viewport: the visual viewport where the browser has one (toolbars and keyboard shrink it), else the window. */
function visible(): { width: number; height: number } {
  const vv = globalThis.visualViewport;
  return vv ? { width: vv.width, height: vv.height } : { width: window.innerWidth, height: window.innerHeight };
}

function formatScale(scale: number): string {
  return String(Math.round(scale * 1000) / 1000);
}

/**
 * The interface's scale and layout for the visible viewport (spec §9). Follows `visualViewport`
 * resizes (or the window's), writes the scale to `--ui` on the root element and the measured
 * bands to the scene, so the play camera fits the board between them.
 */
export function useUiMetrics(): UiMetrics {
  const [metrics, setMetrics] = useState<UiMetrics>(() => {
    const { width, height } = visible();
    return uiMetrics(width, height);
  });

  useEffect(() => {
    const target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'> = globalThis.visualViewport ?? window;
    const update = () => {
      const { width, height } = visible();
      setMetrics((prev) => (prev.width === width && prev.height === height ? prev : uiMetrics(width, height)));
    };
    target.addEventListener('resize', update);
    update();
    return () => target.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--ui', formatScale(metrics.scale));
    useScene.setState({ bands: metrics.bands });
  }, [metrics]);

  return metrics;
}
