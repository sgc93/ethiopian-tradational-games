import { useTranslation } from 'react-i18next';
import type { Session } from '../game/session';
import { playerName } from '../game/view';

/** The end of a game: who won, the score, and what to do next. Shown over the board. */
export function ResultScreen({ session, onPlayAgain, onHome }: { session: Session; onPlayAgain(): void; onHome(): void }) {
  const { t } = useTranslation();
  const { match } = session;
  const result = match.result;
  const last = match.history.at(-1);
  if (!result || !last) return null;

  let headline: string;
  if (result.winner === null) headline = t('result.draw');
  else if (session.humanSeat === null) headline = t('result.playerWon', { player: playerName(t, session, result.winner) });
  else headline = t(result.winner === session.humanSeat ? 'result.youWon' : 'result.computerWon');

  const loser = result.winner === null ? null : result.winner === 0 ? 1 : 0;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <section className="card result">
        <h2 id="result-title">{headline}</h2>
        <p className="result-score">{t('result.score', { a: last.totals[0], b: last.totals[1] })}</p>
        {result.reason === 'no-homes' && loser !== null && (
          <p className="card-note">{t('result.noHomes', { player: playerName(t, session, loser) })}</p>
        )}
        {match.format === 'match' && <p className="card-note">{t('result.rounds', { count: result.rounds })}</p>}
        <div className="card-actions">
          <button className="btn btn-primary" onClick={onPlayAgain} autoFocus>
            {t('result.again')}
          </button>
          <button className="btn" onClick={onHome}>
            {t('result.home')}
          </button>
        </div>
      </section>
    </div>
  );
}
