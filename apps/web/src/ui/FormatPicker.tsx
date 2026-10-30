import type { Format, Level } from '@etg/gebeta-rules';
import { useTranslation } from 'react-i18next';
import { Button, Medallion, Mixed, Panel } from './kit';

/** Quick game or full match: two choices, each with its one-line explanation (spec §9, screen 4). */
export function FormatPicker({ onPick, onBack }: { onPick(format: Format): void; onBack(): void }) {
  const { t } = useTranslation();
  return (
    <Panel labelledBy="format-title" title={t('picker.format')} right={59} y={70} width={316} className="panel-compact home-panel">
      <Medallion icon="back" size={30} label={t('picker.back')} className="panel-back" onClick={onBack} />
      <div className="panel-stack">
        <Button kind="choice" className="btn-primary" hint={t('picker.quickHint')} onClick={() => onPick('quick')} autoFocus>
          {t('picker.quick')}
        </Button>
        <Button kind="choice" hint={<Mixed text={t('picker.matchHint')} />} onClick={() => onPick('match')}>
          {t('picker.match')}
        </Button>
      </div>
    </Panel>
  );
}

/** How strong the computer plays (spec §9, screen 3). */
export function LevelPicker({ onPick, onBack }: { onPick(level: Level): void; onBack(): void }) {
  const { t } = useTranslation();
  return (
    <Panel labelledBy="level-title" title={t('picker.level')} right={59} y={62} width={276} className="panel-compact home-panel">
      <Medallion icon="back" size={30} label={t('picker.back')} className="panel-back" onClick={onBack} />
      <div className="panel-stack">
        {(['easy', 'medium', 'hard'] as const).map((level, i) => (
          <Button key={level} kind={i === 0 ? 'primary' : 'secondary'} onClick={() => onPick(level)} autoFocus={i === 0}>
            {t(`picker.${level}`)}
          </Button>
        ))}
      </div>
    </Panel>
  );
}
