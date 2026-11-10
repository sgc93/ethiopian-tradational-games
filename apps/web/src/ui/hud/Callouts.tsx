import { HOLES, type Player } from '@etg/gebeta-rules';
import { useEffect, useRef, useState } from 'react';
import { useFeedback } from '../../scene/feedback/feedbackStore';

interface Callout {
  id: number;
  by: Player;
  count: number;
  x: number;
  y: number;
}

/** How long a call-out stays: its CSS animation runs this long too. */
export const CALLOUT_MS = 1100;

/**
 * What a capture is worth, said where it lands: a "+4" rises from the capturing player's store
 * (from their plate when the count discs are switched off) and fades. It reads the same events
 * the scene's sparks do, so the two happen together.
 */
export function Callouts() {
  const [items, setItems] = useState<Callout[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const seen = useRef(useFeedback.getState().events.at(-1)?.id ?? 0);

  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const stop = useFeedback.subscribe((state) => {
      const fresh = state.events.filter((e) => e.id > seen.current);
      if (fresh.length === 0) return;
      seen.current = fresh.at(-1)!.id;
      const frame = root.current?.getBoundingClientRect();
      if (!frame) return;
      const added: Callout[] = [];
      for (const e of fresh) {
        if (e.kind !== 'captured') continue;
        const anchor = document.querySelector(`[data-disc="${HOLES + e.by}"]`) ?? document.querySelector(`.plate[data-player="${e.by}"] .st`);
        const at = anchor?.getBoundingClientRect();
        if (!at || at.width === 0) continue;
        added.push({ id: e.id, by: e.by, count: e.count, x: at.left + at.width / 2 - frame.left, y: at.top - frame.top });
      }
      if (added.length === 0) return;
      setItems((now) => [...now, ...added]);
      const timer = setTimeout(() => {
        timers.delete(timer);
        setItems((now) => now.filter((c) => !added.includes(c)));
      }, CALLOUT_MS);
      timers.add(timer);
    });
    return () => {
      stop();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="callouts" ref={root} aria-hidden="true">
      {items.map((c) => (
        <span key={c.id} className="callout" data-by={c.by} style={{ left: c.x, top: c.y }}>
          +{c.count}
        </span>
      ))}
    </div>
  );
}
