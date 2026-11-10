import type { Format, Level } from '@etg/gebeta-rules';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { controller } from '../game/instance';
import type { Mode } from '../game/session';
import { loadSession } from '../persistence/storage';
import { useScene } from '../scene/sceneStore';
import { LANGUAGES } from '../state/settings';
import { useApp } from '../state/store';
import { FormatPicker, LevelPicker } from '../ui/FormatPicker';
import { onFirstPlayTap } from '../ui/fullscreen';
import { Button, Emblem, Medallion, Mixed } from '../ui/kit';
import './HomeScreen.css';

type Step = null | { kind: 'level' } | { kind: 'format'; mode: Mode };

/**
 * Home: the board in the middle of the screen with nothing over it, framed by two leather bars.
 * The top bar carries the name either side of the crest, with the language and the sound at its
 * ends; the bottom bar carries the ways to play. Setting a game up (how strong, what kind) swaps
 * the bottom bar's buttons for that step's answers.
 */
export function HomeScreen() {
  const { t } = useTranslation();
  const { settings, updateSettings, setScreen } = useApp();
  const saved = useMemo(() => loadSession(), []);
  const [step, setStep] = useState<Step>(null);
  useEffect(() => useScene.getState().setMode('home'), []);

  const begin = (mode: Mode, format: Format) => {
    controller.start(mode, format);
    setScreen('game');
  };

  return (
    <main className="home panel-enter">
      <div className="bar bar-top" aria-hidden="true" />
      <div className="bar bar-bottom" aria-hidden="true" />

      <header className="home-title">
        <h1 lang="am">{t('app.titleGeez')}</h1>
        <Emblem size={60} className="home-crest" />
        <p className="home-latin">GEBETA</p>
      </header>
      <p className="home-tagline">{t('app.tagline')}</p>

      <div className="seg home-language" role="group" aria-label={t('languages.label')}>
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            type="button"
            lang={lang}
            aria-pressed={settings.language === lang}
            onClick={() => updateSettings({ language: lang })}
          >
            {t(`languages.${lang}`)}
          </button>
        ))}
      </div>
      <div className="home-tools">
        <Button kind="quiet" className="home-about" onClick={() => setScreen('about')}>
          <Mixed text={t('home.about')} />
        </Button>
        <Medallion
          icon={settings.sound ? 'sound' : 'soundOff'}
          label={settings.sound ? t('home.soundOn') : t('home.soundOff')}
          pressed={settings.sound}
          onClick={() => updateSettings({ sound: !settings.sound })}
        />
      </div>

      {step === null && (
        <nav className="home-menu">
          {saved && (
            <Button
              kind="primary"
              onClick={() => {
                onFirstPlayTap();
                controller.resume(saved);
                setScreen('game');
              }}
            >
              {t('home.continue')}
            </Button>
          )}
          <Button
            kind={saved ? 'secondary' : 'primary'}
            onClick={() => {
              onFirstPlayTap();
              setStep({ kind: 'level' });
            }}
          >
            {t('home.playComputer')}
          </Button>
          <Button
            onClick={() => {
              onFirstPlayTap();
              setStep({ kind: 'format', mode: { kind: 'friend' } });
            }}
          >
            {t('home.playFriend')}
          </Button>
          <Button
            onClick={() => {
              onFirstPlayTap();
              begin({ kind: 'guided' }, 'quick');
            }}
          >
            {t('home.learn')}
          </Button>
        </nav>
      )}
      {step?.kind === 'level' && (
        <LevelPicker
          onPick={(level: Level) => setStep({ kind: 'format', mode: { kind: 'computer', level } })}
          onBack={() => setStep(null)}
        />
      )}
      {step?.kind === 'format' && <FormatPicker onPick={(f) => begin(step.mode, f)} onBack={() => setStep(null)} />}
    </main>
  );
}
