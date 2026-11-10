import { DEFAULT_RULES, RULE_CHOICES, type Rules } from '@etg/gebeta-rules';
import { useTranslation } from 'react-i18next';
import { useApp } from '../state/store';
import { Button, Medallion, Panel } from '../ui/kit';
import '../ui/GameMenu.css';
import './RulesScreen.css';

/** The rules that can be chosen, in the order the panel shows them. */
const RULES: readonly (keyof Rules)[] = ['direction', 'stranded', 'passingFour', 'nextStarter'];

/**
 * The rules of play, for households that play differently: which way the stones are sown, what
 * happens when a player runs out, who takes a four made in passing, and who starts the next
 * round. Each rule is a row of choices, the usual one first. They are kept with the settings and
 * apply to the next game started; a game already under way keeps the rules it began with.
 */
export function RulesScreen() {
  const { t } = useTranslation();
  const { settings, updateSettings, setScreen } = useApp();
  const rules = settings.rules;
  const usual = RULES.every((key) => rules[key] === DEFAULT_RULES[key]);
  const choose = <K extends keyof Rules>(key: K, value: Rules[K]) => updateSettings({ rules: { ...rules, [key]: value } });

  return (
    <main className="rules">
      <div className="rules-dim" aria-hidden="true" />
      <Panel labelledBy="rules-title" title={t('rules.title')} center width={560} className="rules-panel">
        <Medallion icon="close" size={30} label={t('about.close')} className="panel-back" onClick={() => setScreen('home')} />
        <div className="rules-rows">
          {RULES.map((key) => (
            <div className="rules-row" key={key}>
              <span className="rules-label" id={`rule-${key}`}>
                {t(`rules.${key}.label`)}
              </span>
              <span className="rules-choices" role="group" aria-labelledby={`rule-${key}`}>
                {(RULE_CHOICES[key] as readonly string[]).map((value) => (
                  <button key={value} type="button" className={`tg${rules[key] === value ? ' on' : ''}`} aria-pressed={rules[key] === value} onClick={() => choose(key, value as never)}>
                    {t(`rules.${key}.${value}`)}
                  </button>
                ))}
              </span>
            </div>
          ))}
        </div>
        <p className="note rules-note">{t('rules.note')}</p>
        <div className="rules-actions">
          <Button kind="quiet" disabled={usual} onClick={() => updateSettings({ rules: DEFAULT_RULES })}>
            {t('rules.reset')}
          </Button>
          <Button kind="primary" onClick={() => setScreen('home')} autoFocus>
            {t('rules.done')}
          </Button>
        </div>
      </Panel>
    </main>
  );
}
