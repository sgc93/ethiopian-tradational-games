import { HOLES } from '@etg/gebeta-rules';
import { useEffect, useRef, useState } from 'react';
import { useBoardView } from '../../scene/boardView';
import { useScene } from '../../scene/sceneStore';
import { playableHoles } from '../../game/view';
import { DISCS } from './discAnchors';

/** One disc: ticks (a scale and a gold flash) whenever its value changes. */
function Disc({ index, value, playable }: { index: number; value: number; playable: boolean }) {
  const [tick, setTick] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setTick(true);
    const timer = setTimeout(() => setTick(false), 160);
    return () => clearTimeout(timer);
  }, [value]);
  const store = index >= HOLES;
  const classes = ['cnt', store ? 'store' : null, playable ? 'play' : null, tick ? 'tick' : null].filter(Boolean).join(' ');
  return (
    <span className={classes} data-disc={index} data-hole-label={store ? undefined : index}>
      {value}
    </span>
  );
}

/**
 * The fourteen count discs pinned to the board (spec §9 "Count disc"): the DOM over the canvas,
 * moved every frame by `DiscAnchors` inside it, hidden while the camera moves so they are never
 * drawn at stale positions. Playable cups' discs get the ember ring.
 */
export function CountDiscs() {
  const counts = useBoardView((s) => s.counts);
  const moving = useScene((s) => s.cameraMoving);
  const tossing = useScene((s) => s.mode === 'toss');
  const session = useScene((s) => s.session);
  const playable = playableHoles(session);
  // Hidden while the camera moves (never at stale positions) and during the toss, which is the coin's moment.
  return (
    <div className="discs" hidden={moving || tossing} aria-hidden="true">
      {Array.from({ length: DISCS }, (_, i) => (
        <Disc key={i} index={i} value={counts[i] ?? 0} playable={playable.has(i as 0)} />
      ))}
    </div>
  );
}
