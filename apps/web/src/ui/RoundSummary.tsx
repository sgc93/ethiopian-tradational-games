import { homesOf, type Player } from '@etg/gebeta-rules';
import { useTranslation } from 'react-i18next';
import type { Session } from '../game/session';
import { playerName } from '../game/view';
import { useScene } from '../scene/sceneStore';
import { Button, Icon, Panel } from './kit';
import './RoundSummary.css';

/**
 * Between rounds of a full match (spec §9, screen 7): a low panel across the bottom with each
 * player's stones and next-round homes as rows of small huts, and Next round in the middle. The
 * near player (the seat the camera sits behind) is at the left.
 */
export function RoundSummary({ session, onNext }: { session: Session; onNext(): void }) {
  const { t } = useTranslation();
  const near = useScene((s) => s.seat);
  const { match } = session;
  const last = match.history.at(-1);
  if (!last) return null;

  const side = (p: Player) => {
    const homes = homesOf(match.round.owners, p);
    const tone = p === near ? 'ember' : 'moon';
    return (
      <div className={`summary-side ${tone}`}>
        <div className="summary-head" data-testid={`summary-stones-${p}`}>
          {playerName(t, session, p)} · {t('summary.stones', { count: last.totals[p] })}
        </div>
        <div data-testid={`summary-homes-${p}`}>
          <div className="homes" aria-hidden="true">
            {Array.from({ length: homes }, (_, i) => (
              <Icon key={i} name="hut" size={15} className="hut" />
            ))}
          </div>
          <p className="note">{t('summary.nextHomes', { count: homes })}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="summary" role="dialog" aria-modal="true" aria-labelledby="summary-title">
      <Panel labelledBy="summary-title" center bottom={12} width={620} className="summary-panel">
        <h2 id="summary-title" className="sr-only">
          {t('summary.title', { n: match.roundNumber - 1 })}
        </h2>
        {side(near)}
        <div className="summary-middle">
          <Button kind="primary" className="summary-next" onClick={onNext} autoFocus>
            {t('summary.next')}
          </Button>
          {last.winner === null && <p className="note">{t('summary.draw')}</p>}
        </div>
        {side(near === 0 ? 1 : 0)}
      </Panel>
    </div>
  );
}
