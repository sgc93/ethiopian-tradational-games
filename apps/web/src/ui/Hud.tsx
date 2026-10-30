import { homesOf, MAX_ROUNDS, type Player } from '@etg/gebeta-rules';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Session } from '../game/session';
import { activePlayer, playerName } from '../game/view';
import { useScene } from '../scene/sceneStore';
import { Caption } from './hud/Caption';
import { Cartouche } from './hud/Cartouche';
import { PlayerPlate } from './hud/PlayerPlate';
import { roman } from './hud/roman';
import './hud/hud.css';

/**
 * The play HUD (spec §9, screens 7–8): the far player's plate at the top left, the near player's
 * at the bottom left, the round cartouche and the turn caption at the top centre.
 */
export function Hud({ session }: { session: Session }) {
  const { t, i18n } = useTranslation();
  const { match, phase } = session;
  const round = match.round;
  const active = activePlayer(session);
  const near = useScene((s) => s.seat);
  const far: Player = near === 0 ? 1 : 0;
  const inPlay = phase !== 'finished' && phase !== 'round-summary' && phase !== 'toss';

  // The caption: whose turn, in the player's colour, or the other side's with pulsing diamonds.
  let caption: { tone: 'ember' | 'moon'; text: ReactNode; thinking: boolean } | null = null;
  if (inPlay) {
    if (session.humanSeat === null) {
      caption = { tone: active === near ? 'ember' : 'moon', text: t('hud.playerTurn', { player: playerName(t, session, active) }), thinking: false };
    } else if (active === session.humanSeat) {
      caption = {
        tone: 'ember',
        text: (
          <>
            <span>{t('hud.yourTurn')}</span>
            <span className="hint"> · {t('hud.tapHint')}</span>
          </>
        ),
        thinking: false,
      };
    } else {
      caption = { tone: 'moon', text: t(phase === 'thinking' ? 'hud.computerThinking' : 'hud.computerPlaying'), thinking: true };
    }
  }

  // The cartouche: the round in roman numerals for English, digits elsewhere; "Quick game" otherwise.
  const numeral = (n: number) => (i18n.resolvedLanguage?.startsWith('en') ? roman(n) : String(n));
  const cartouche =
    match.format === 'match'
      ? phase === 'round-summary'
        ? { text: t('hud.endOfRound', { n: numeral(match.roundNumber - 1) }), pips: { total: MAX_ROUNDS, done: Math.min(MAX_ROUNDS, match.roundNumber - 1), now: 0 } }
        : match.roundNumber <= MAX_ROUNDS
        ? { text: t('hud.round', { n: numeral(match.roundNumber), total: numeral(MAX_ROUNDS) }), pips: { total: MAX_ROUNDS, done: match.roundNumber - 1, now: match.roundNumber } }
        : { text: t('hud.extraRound'), pips: { total: MAX_ROUNDS, done: MAX_ROUNDS, now: 0 } }
      : { text: t('hud.quickGame') };

  const plate = (player: Player, side: 'near' | 'far') => (
    <PlayerPlate
      player={player}
      name={playerName(t, session, player)}
      stones={round.captured[player]}
      homes={match.format === 'match' ? homesOf(round.owners, player) : undefined}
      active={inPlay && active === player}
      side={side}
    />
  );

  return (
    <header className={`hud${phase === 'round-summary' ? ' hud-summary' : ''}`}>
      {plate(far, 'far')}
      <Cartouche text={cartouche.text} pips={cartouche.pips} />
      {caption ? <Caption tone={caption.tone} text={caption.text} thinking={caption.thinking} /> : <p className="hud-caption" aria-live="polite" />}
      {plate(near, 'near')}
    </header>
  );
}
