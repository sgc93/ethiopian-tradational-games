import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Session } from '../game/session';
import { playerName } from '../game/view';
import { now, useFeedback } from '../scene/feedback/feedbackStore';
import { Button, Emblem, Panel } from '../ui/kit';
import './ResultScreen.css';

/**
 * The end of a game: a low panel along the bottom, under the board as the camera circles it, with
 * the crest, the headline, the score between the two players' names, the reason and the rounds
 * played, and Play again and Home. A win, a loss and a draw are dressed differently.
 */
export function ResultScreen({ session, onPlayAgain, onHome }: { session: Session; onPlayAgain(): void; onHome(): void }) {
  const { t } = useTranslation();
  const { match } = session;
  const result = match.result;
  const last = match.history.at(-1);

  useEffect(() => {
    useFeedback.getState().push({ kind: 'burst', at: now() });
  }, []);

  if (!result || !last) return null;

  let headline: string;
  if (result.winner === null) headline = t('result.draw');
  else if (session.humanSeat === null) headline = t('result.playerWon', { player: playerName(t, session, result.winner) });
  else headline = t(result.winner === session.humanSeat ? 'result.youWon' : 'result.computerWon');

  // Between friends somebody always wins; against the computer the player wins or loses.
  const outcome = result.winner === null ? 'draw' : session.humanSeat !== null && result.winner !== session.humanSeat ? 'lost' : 'won';
  const loser = result.winner === null ? null : result.winner === 0 ? 1 : 0;
  const notes: string[] = [];
  if (result.reason === 'no-homes' && loser !== null) notes.push(t('result.noHomes', { player: playerName(t, session, loser) }));
  if (match.format === 'match') notes.push(t('result.rounds', { count: result.rounds }));

  return (
    <div className="result" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div className="result-dim" aria-hidden="true" />
      <Panel labelledBy="result-title" center bottom={12} width={690} className={`result-panel result-${outcome}`}>
        <Emblem size={54} className="result-crest" />
        <div className="result-words">
          <h2 id="result-title" className={`big${headline.length > 12 ? ' big-long' : ''}`}>
            {headline}
          </h2>
          {notes.length > 0 && <p className="note result-note">{notes.join(' · ')}</p>}
        </div>
        <div className="scoreline">
          <span className="who">{playerName(t, session, 0)}</span>
          <p className="score result-score">{t('result.score', { a: last.totals[0], b: last.totals[1] })}</p>
          <span className="who">{playerName(t, session, 1)}</span>
        </div>
        <div className="result-actions">
          <Button kind="primary" className="result-again" onClick={onPlayAgain} autoFocus>
            {t('result.again')}
          </Button>
          <Button className="result-home" onClick={onHome}>
            {t('result.home')}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
