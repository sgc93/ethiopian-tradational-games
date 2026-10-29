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

type Step = null | { kind: 'level' } | { kind: 'format'; mode: Mode };

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
    <main className="screen home">
      <header className="home-title">
        <h1 lang="am">{t('app.titleGeez')}</h1>
        <p className="home-latin">Gebeta</p>
        <p className="home-tagline">{t('app.tagline')}</p>
        <HoleRow />
      </header>

      {step === null && (
        <nav className="home-actions">
          {saved && (
            <button
              className="btn btn-primary"
              onClick={() => {
                onFirstPlayTap();
                controller.resume(saved);
                setScreen('game');
              }}
            >
              {t('home.continue')}
            </button>
          )}
          <button
            className={`btn${saved ? '' : ' btn-primary'}`}
            onClick={() => {
              onFirstPlayTap();
              setStep({ kind: 'level' });
            }}
          >
            {t('home.playComputer')}
          </button>
          <button
            className="btn"
            onClick={() => {
              onFirstPlayTap();
              setStep({ kind: 'format', mode: { kind: 'friend' } });
            }}
          >
            {t('home.playFriend')}
          </button>
          <button
            className="btn"
            onClick={() => {
              onFirstPlayTap();
              begin({ kind: 'guided' }, 'quick');
            }}
          >
            {t('home.learn')}
          </button>
          <button className="btn btn-quiet" onClick={() => setScreen('about')}>
            {t('home.about')}
          </button>
        </nav>
      )}
      {step?.kind === 'level' && (
        <LevelPicker
          onPick={(level: Level) => setStep({ kind: 'format', mode: { kind: 'computer', level } })}
          onBack={() => setStep(null)}
        />
      )}
      {step?.kind === 'format' && <FormatPicker onPick={(f) => begin(step.mode, f)} onBack={() => setStep(null)} />}

      <footer className="home-settings">
        <div className="segmented" role="group" aria-label={t('languages.label')}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              lang={lang}
              aria-pressed={settings.language === lang}
              onClick={() => updateSettings({ language: lang })}
            >
              {t(`languages.${lang}`)}
            </button>
          ))}
        </div>
        <button className="toggle" aria-pressed={settings.sound} onClick={() => updateSettings({ sound: !settings.sound })}>
          {settings.sound ? t('home.soundOn') : t('home.soundOff')}
        </button>
      </footer>
    </main>
  );
}

/** Six earth holes with four pebbles each: the board in miniature. */
function HoleRow() {
  return (
    <div className="hole-row" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className="hole">
          {Array.from({ length: 4 }, (_, j) => (
            <span key={j} className={`pebble pebble-${(i + j) % 4}`} />
          ))}
        </span>
      ))}
    </div>
  );
}
