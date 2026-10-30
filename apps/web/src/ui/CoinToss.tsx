import type { Player } from '@etg/gebeta-rules';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sfx } from '../audio/instance';
import type { Session } from '../game/session';
import { playerName } from '../game/view';
import { useScene } from '../scene/sceneStore';
import type { Speed } from '../state/settings';
import { Button, Mixed, Panel } from './kit';
import './CoinToss.css';

type Call = 'lion' | 'person';
const FLIP_MS = 1200;

interface Props {
  session: Session;
  speed: Speed;
  /** Tosses the coin for this call and returns who starts. */
  onCall(call: Call): Player;
  onDone(): void;
}

/**
 * Who starts (spec §9, screens 5–6): a low panel offers አንበሳ or ሰው; the coin in the scene spins
 * up and lands; a panel names the side and who starts, with Play.
 */
export function CoinToss({ session, speed, onCall, onDone }: Props) {
  const { t } = useTranslation();
  const [stage, setStage] = useState<'call' | 'flip' | 'result'>('call');
  const [outcome, setOutcome] = useState<{ coin: Call; starter: Player } | null>(null);

  useEffect(() => {
    if (stage !== 'flip') return;
    const id = setTimeout(() => {
      sfx.coinRing(); // it lands
      setStage('result');
    }, FLIP_MS);
    return () => clearTimeout(id);
  }, [stage]);

  // The coin rests, face up, while the call is open.
  useEffect(() => {
    useScene.setState({ coin: null });
  }, []);

  const call = (c: Call) => {
    const starter = onCall(c);
    // The caller sits in seat A, so they start exactly when their call matched the coin.
    const coin: Call = starter === 0 ? c : c === 'lion' ? 'person' : 'lion';
    setOutcome({ coin, starter });
    if (speed === 'skip') {
      onDone();
      return;
    }
    useScene.setState({ coin: { lands: coin, startedAt: performance.now() / 1000 } });
    sfx.coinWhoosh();
    setStage('flip');
  };

  let starts = '';
  if (outcome) {
    if (session.humanSeat === null) starts = t('toss.playerStarts', { player: playerName(t, session, outcome.starter) });
    else starts = t(outcome.starter === session.humanSeat ? 'toss.youStart' : 'toss.computerStarts');
  }

  return (
    <div className="toss" role="dialog" aria-modal="true" aria-labelledby="toss-title">
      {stage === 'call' && (
        <Panel
          labelledBy="toss-title"
          title={<Mixed text={t(session.humanSeat === null ? 'toss.promptFriend' : 'toss.prompt')} />}
          center
          y={252}
          width={360}
          className="panel-compact toss-panel"
        >
          <div className="toss-choices">
            <Button onClick={() => call('lion')} autoFocus>
              <Mixed text={t('toss.lion')} />
            </Button>
            <Button onClick={() => call('person')}>
              <Mixed text={t('toss.person')} />
            </Button>
          </div>
        </Panel>
      )}
      {stage === 'result' && outcome && (
        <Panel
          labelledBy="toss-title"
          title={<Mixed text={t('toss.landed', { side: t(outcome.coin === 'lion' ? 'toss.sideLion' : 'toss.sidePerson') })} />}
          center
          y={226}
          width={320}
          className="panel-compact toss-panel toss-result"
        >
          <p className="note">{starts}</p>
          <Button kind="primary" className="toss-go" onClick={onDone} autoFocus>
            {t('toss.go')}
          </Button>
        </Panel>
      )}
    </div>
  );
}
