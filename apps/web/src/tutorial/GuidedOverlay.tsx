import { useTranslation } from 'react-i18next';
import type { Session } from '../game/session';
import type { Guide } from './useGuide';

/** The guided game's hint line, lesson cards and the always-visible way out. */
export function GuidedOverlay({ guide, session, onLeave }: { guide: Guide; session: Session; onLeave(): void }) {
  const { t } = useTranslation();
  const last = session.match.history.at(-1);
  const seat = session.humanSeat ?? 0;

  return (
    <>
      <button className="leave-lesson" onClick={onLeave}>
        {t('guide.leave')}
      </button>
      {guide.hint && (
        <p className="guide-hint" aria-live="polite">
          {t(guide.hint)}
        </p>
      )}
      {guide.card && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="lesson-title">
          <section className="card lesson">
            <h2 id="lesson-title">{t(`guide.card.${guide.card}.title`)}</h2>
            <p className="card-note">
              {guide.card === 'homes' && last
                ? t('guide.card.homes.body', { you: last.totals[seat] / 4, them: last.totals[1 - seat]! / 4 })
                : t(`guide.card.${guide.card}.body`)}
            </p>
            <button className="btn btn-primary" onClick={guide.dismiss} autoFocus>
              {t('guide.gotIt')}
            </button>
          </section>
        </div>
      )}
    </>
  );
}
