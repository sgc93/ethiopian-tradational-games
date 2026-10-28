import { HOLES, type HoleIndex } from '@etg/gebeta-rules';
import { useTranslation } from 'react-i18next';
import type { Session } from '../game/session';
import { playableHoles, playerName } from '../game/view';

/**
 * One button per hole for keyboards and screen readers (and the end-to-end tests). Hidden until
 * one of them takes focus, then shown as a bar along the bottom of the screen.
 */
export function HoleButtons({ session, onPlay }: { session: Session; onPlay(hole: HoleIndex): void }) {
  const { t } = useTranslation();
  const playable = playableHoles(session);
  const { board, owners } = session.match.round;
  return (
    <div className="hole-buttons">
      {Array.from({ length: HOLES }, (_, h) => (
        <button
          key={h}
          data-testid={`hole-${h}`}
          aria-label={t('holes.label', { n: h + 1, count: board[h], owner: playerName(t, session, owners[h]!) })}
          disabled={!playable.has(h)}
          onClick={() => onPlay(h)}
        >
          {h + 1}
        </button>
      ))}
    </div>
  );
}
