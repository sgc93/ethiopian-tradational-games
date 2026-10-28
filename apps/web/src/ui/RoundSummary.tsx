import { homesOf, type Player } from '@etg/gebeta-rules';
import { useTranslation } from 'react-i18next';
import type { Session } from '../game/session';
import { playerName } from '../game/view';

/** Between rounds of a full match: the stones each player took and the homes they will own next. */
export function RoundSummary({ session, onNext }: { session: Session; onNext(): void }) {
  const { t } = useTranslation();
  const { match } = session;
  const last = match.history.at(-1);
  if (!last) return null;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="summary-title">
      <section className="card">
        <h2 id="summary-title">{t('summary.title', { n: match.roundNumber - 1 })}</h2>
        <div className="summary-rows">
          {([0, 1] as Player[]).map((p) => (
            <div key={p} className={`summary-row seat-${p}${last.winner === p ? ' is-winner' : ''}`}>
              <span className="summary-name">{playerName(t, session, p)}</span>
              <span data-testid={`summary-stones-${p}`}>{t('summary.stones', { count: last.totals[p] })}</span>
              <span data-testid={`summary-homes-${p}`}>{t('summary.nextHomes', { count: homesOf(match.round.owners, p) })}</span>
            </div>
          ))}
        </div>
        {last.winner === null && <p className="card-note">{t('summary.draw')}</p>}
        <button className="btn btn-primary" onClick={onNext} autoFocus>
          {t('summary.next')}
        </button>
      </section>
    </div>
  );
}
