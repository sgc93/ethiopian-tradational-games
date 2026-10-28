import type { Format, Level } from '@etg/gebeta-rules';
import { useTranslation } from 'react-i18next';

/** Quick game or full match. */
export function FormatPicker({ onPick, onBack }: { onPick(format: Format): void; onBack(): void }) {
  const { t } = useTranslation();
  return (
    <section className="picker" aria-labelledby="format-title">
      <h2 id="format-title">{t('picker.format')}</h2>
      <button className="btn btn-primary choice" onClick={() => onPick('quick')} autoFocus>
        <span>{t('picker.quick')}</span>
        <small>{t('picker.quickHint')}</small>
      </button>
      <button className="btn choice" onClick={() => onPick('match')}>
        <span>{t('picker.match')}</span>
        <small>{t('picker.matchHint')}</small>
      </button>
      <button className="btn btn-quiet" onClick={onBack}>
        {t('picker.back')}
      </button>
    </section>
  );
}

/** How strong the computer plays. */
export function LevelPicker({ onPick, onBack }: { onPick(level: Level): void; onBack(): void }) {
  const { t } = useTranslation();
  return (
    <section className="picker" aria-labelledby="level-title">
      <h2 id="level-title">{t('picker.level')}</h2>
      {(['easy', 'medium', 'hard'] as const).map((level, i) => (
        <button key={level} className={`btn${i === 0 ? ' btn-primary' : ''}`} onClick={() => onPick(level)} autoFocus={i === 0}>
          {t(`picker.${level}`)}
        </button>
      ))}
      <button className="btn btn-quiet" onClick={onBack}>
        {t('picker.back')}
      </button>
    </section>
  );
}
