import { homesOf, MAX_ROUNDS, type Player } from '@etg/gebeta-rules';
import { useTranslation } from 'react-i18next';
import type { Session } from '../game/session';
import { activePlayer, playerName } from '../game/view';

/** Whose turn it is, the round, and each player's stones and homes. */
export function Hud({ session }: { session: Session }) {
  const { t } = useTranslation();
  const { match, phase } = session;
  const round = match.round;
  const active = activePlayer(session);

  let turn = '';
  if (phase !== 'finished' && phase !== 'round-summary' && phase !== 'toss') {
    if (session.humanSeat === null) turn = t('hud.playerTurn', { player: playerName(t, session, active) });
    else if (active === session.humanSeat) turn = t('hud.yourTurn');
    else turn = t(phase === 'thinking' ? 'hud.computerThinking' : 'hud.computerPlaying');
  }

  return (
    <header className="hud">
      <div className="hud-top">
        <p className="hud-turn" aria-live="polite">
          {turn}
        </p>
        {match.format === 'match' && (
          <p className="hud-round">
            {match.roundNumber <= MAX_ROUNDS
              ? t('hud.round', { n: match.roundNumber, total: MAX_ROUNDS })
              : t('hud.extraRound')}
          </p>
        )}
      </div>
      <div className="hud-players">
        {([0, 1] as Player[]).map((p) => (
          <div key={p} className={`hud-player seat-${p}${active === p && turn ? ' is-active' : ''}`}>
            <span className="hud-name">{playerName(t, session, p)}</span>
            <span className="hud-stat">
              {t('hud.stones')} <b data-testid={`stones-${p}`}>{round.captured[p]}</b>
            </span>
            {match.format === 'match' && (
              <span className="hud-stat">
                {t('hud.homes')} <b data-testid={`homes-${p}`}>{homesOf(round.owners, p)}</b>
              </span>
            )}
          </div>
        ))}
      </div>
    </header>
  );
}
