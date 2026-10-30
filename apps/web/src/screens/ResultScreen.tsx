import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Session } from '../game/session';
import { playerName } from '../game/view';
import { now, useFeedback } from '../scene/feedback/feedbackStore';
import { Button, Emblem, Panel } from '../ui/kit';
import './ResultScreen.css';

/**
 * The end of a game (spec §9, screen 8): over the orbiting scene, a panel with the emblem, the
 * headline, the score, the reason and the rounds played, with Play again and Home. Embers burst
 * up from the fire as it opens.
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

  const loser = result.winner === null ? null : result.winner === 0 ? 1 : 0;
  const notes: string[] = [];
  if (result.reason === 'no-homes' && loser !== null) notes.push(t('result.noHomes', { player: playerName(t, session, loser) }));
  if (match.format === 'match') notes.push(t('result.rounds', { count: result.rounds }));

  return (
    <div className="result" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div className="result-dim" aria-hidden="true" />
      <Panel labelledBy="result-title" center y={46} width={320} className="result-panel">
        <Emblem size={44} />
        <h2 id="result-title" className={`big${headline.length > 12 ? ' big-long' : ''}`}>
          {headline}
        </h2>
        <p className="score result-score">{t('result.score', { a: last.totals[0], b: last.totals[1] })}</p>
        {notes.length > 0 && <p className="note result-note">{notes.join(' · ')}</p>}
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
