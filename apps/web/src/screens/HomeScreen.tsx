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
import { Button, Medallion, Mixed } from '../ui/kit';
import './HomeScreen.css';

type Step = null | { kind: 'level' } | { kind: 'format'; mode: Mode };

/**
 * Home (spec §9, screen 2): the live scene behind, the title block at the left, the menu stack at
 * the right, the language switch and the sound medallion at the bottom left. The level and game
 * type panels replace the stack in place.
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
      <div className="home-grade" aria-hidden="true" />
      <header className="home-title">
        <h1 lang="am">{t('app.titleGeez')}</h1>
        <p className="home-latin">GEBETA</p>
        <p className="home-tagline">{t('app.tagline')}</p>
      </header>

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
          <Button kind="quiet" className="home-about" onClick={() => setScreen('about')}>
            <Mixed text={t('home.about')} />
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

      <footer className="home-footer">
        <div className="seg" role="group" aria-label={t('languages.label')}>
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
        <Medallion
          icon={settings.sound ? 'sound' : 'soundOff'}
          label={settings.sound ? t('home.soundOn') : t('home.soundOff')}
          pressed={settings.sound}
          onClick={() => updateSettings({ sound: !settings.sound })}
        />
      </footer>
    </main>
  );
}
