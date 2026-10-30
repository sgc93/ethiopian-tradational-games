import { Trans, useTranslation } from 'react-i18next';
import type { Session } from '../game/session';
import { Button, Mixed, Panel, Ribbon } from '../ui/kit';
import type { Guide } from './useGuide';
import './GuidedOverlay.css';

/**
 * The guided game (spec §9, screen 9): the hint as a ribbon above the near plate with its key
 * phrase in ember, lesson cards as the standard panel over the dimmed scene, and Leave lesson in
 * the menu medallion's place.
 */
export function GuidedOverlay({ guide, session, onLeave }: { guide: Guide; session: Session; onLeave(): void }) {
  const { t } = useTranslation();
  const last = session.match.history.at(-1);
  const seat = session.humanSeat ?? 0;
  const body =
    guide.card === 'homes' && last
      ? t('guide.card.homes.body', { you: last.totals[seat] / 4, them: last.totals[1 - seat]! / 4 })
      : guide.card
        ? t(`guide.card.${guide.card}.body`)
        : '';

  return (
    <>
      {!guide.card && (
        <Button className="leave-lesson" onClick={onLeave}>
          {t('guide.leave')}
        </Button>
      )}
      {guide.hint && (
        <Ribbon>
          <Trans i18nKey={guide.hint} components={[<span key="0" />, <b key="1" />]} />
        </Ribbon>
      )}
      {guide.card && (
        <div className="lesson" role="dialog" aria-modal="true" aria-labelledby="lesson-title">
          <div className="lesson-dim" aria-hidden="true" />
          <Panel labelledBy="lesson-title" title={<Mixed text={t(`guide.card.${guide.card}.title`)} />} center y={66} width={360} className="lesson-panel">
            <p className="note lesson-body">
              <Mixed text={body} />
            </p>
            <Button kind="primary" className="lesson-ok" onClick={guide.dismiss} autoFocus>
              {t('guide.gotIt')}
            </Button>
          </Panel>
        </div>
      )}
    </>
  );
}
