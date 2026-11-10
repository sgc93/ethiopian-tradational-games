import type { Format, Level } from '@etg/gebeta-rules';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Medallion, Mixed } from './kit';

/**
 * One step of setting a game up, shown in the home screen's bottom bar: the question is asked in
 * ink on the paper above the bar, and its answers stand in the bar beside a way back.
 */
function Step({ id, question, onBack, children }: { id: string; question: string; onBack(): void; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="home-step" role="group" aria-labelledby={id}>
      <h2 className="home-question" id={id}>
        {question}
      </h2>
      <Medallion icon="back" size={30} label={t('picker.back')} className="home-back" onClick={onBack} />
      {children}
    </div>
  );
}

/** Quick game or full match: two choices, each with its one-line explanation. */
export function FormatPicker({ onPick, onBack }: { onPick(format: Format): void; onBack(): void }) {
  const { t } = useTranslation();
  return (
    <Step id="format-title" question={t('picker.format')} onBack={onBack}>
      <Button kind="choice" className="btn-primary" hint={t('picker.quickHint')} onClick={() => onPick('quick')} autoFocus>
        {t('picker.quick')}
      </Button>
      <Button kind="choice" hint={<Mixed text={t('picker.matchHint')} />} onClick={() => onPick('match')}>
        {t('picker.match')}
      </Button>
    </Step>
  );
}

/** How strong the computer plays. */
export function LevelPicker({ onPick, onBack }: { onPick(level: Level): void; onBack(): void }) {
  const { t } = useTranslation();
  return (
    <Step id="level-title" question={t('picker.level')} onBack={onBack}>
      {(['easy', 'medium', 'hard'] as const).map((level, i) => (
        <Button key={level} kind={i === 0 ? 'primary' : 'secondary'} onClick={() => onPick(level)} autoFocus={i === 0}>
          {t(`picker.${level}`)}
        </Button>
      ))}
    </Step>
  );
}
