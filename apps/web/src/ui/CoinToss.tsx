import type { Player } from '@etg/gebeta-rules';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Session } from '../game/session';
import { playerName } from '../game/view';
import type { Speed } from '../state/settings';

type Call = 'lion' | 'person';
const FLIP_MS = 1200;

interface Props {
  session: Session;
  speed: Speed;
  /** Tosses the coin for this call and returns who starts. */
  onCall(call: Call): Player;
  onDone(): void;
}

/** Who starts: the player calls አንበሳ (lion) or ሰው (person) and the coin is flipped. */
export function CoinToss({ session, speed, onCall, onDone }: Props) {
  const { t } = useTranslation();
  const [stage, setStage] = useState<'call' | 'flip' | 'result'>('call');
  const [outcome, setOutcome] = useState<{ coin: Call; starter: Player } | null>(null);

  useEffect(() => {
    if (stage !== 'flip') return;
    const id = setTimeout(() => setStage('result'), FLIP_MS);
    return () => clearTimeout(id);
  }, [stage]);

  const call = (c: Call) => {
    const starter = onCall(c);
    // The caller sits in seat A, so they start exactly when their call matched the coin.
    setOutcome({ coin: starter === 0 ? c : c === 'lion' ? 'person' : 'lion', starter });
    if (speed === 'skip') onDone();
    else setStage('flip');
  };

  let starts = '';
  if (outcome) {
    if (session.humanSeat === null) starts = t('toss.playerStarts', { player: playerName(t, session, outcome.starter) });
    else starts = t(outcome.starter === session.humanSeat ? 'toss.youStart' : 'toss.computerStarts');
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="toss-title">
      <section className="card toss">
        {stage === 'call' && (
          <>
            <h2 id="toss-title">{t(session.humanSeat === null ? 'toss.promptFriend' : 'toss.prompt')}</h2>
            <div className="card-actions">
              <button className="btn btn-primary" onClick={() => call('lion')} autoFocus>
                {t('toss.lion')}
              </button>
              <button className="btn btn-primary" onClick={() => call('person')}>
                {t('toss.person')}
              </button>
            </div>
          </>
        )}
        {stage !== 'call' && outcome && (
          <>
            <div className={`coin${stage === 'flip' ? ' is-flipping' : ''} lands-${outcome.coin}`} aria-hidden="true">
              <span className="coin-face coin-lion">አንበሳ</span>
              <span className="coin-face coin-person">ሰው</span>
            </div>
            {stage === 'result' && (
              <>
                <h2 id="toss-title">
                  {t('toss.landed', { side: t(outcome.coin === 'lion' ? 'toss.sideLion' : 'toss.sidePerson') })}
                </h2>
                <p className="card-note">{starts}</p>
                <button className="btn btn-primary" onClick={onDone} autoFocus>
                  {t('toss.go')}
                </button>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
