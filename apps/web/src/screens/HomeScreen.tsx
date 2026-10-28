import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../state/settings';
import { useApp } from '../state/store';

export function HomeScreen() {
  const { t } = useTranslation();
  const { settings, updateSettings, setScreen } = useApp();

  return (
    <main className="screen home">
      <header className="home-title">
        <h1 lang="am">{t('app.titleGeez')}</h1>
        <p className="home-latin">Gebeta</p>
        <p className="home-tagline">{t('app.tagline')}</p>
        <HoleRow />
      </header>

      <nav className="home-actions">
        <button className="btn btn-primary">{t('home.playComputer')}</button>
        <button className="btn">{t('home.playFriend')}</button>
        <button className="btn">{t('home.learn')}</button>
        <button className="btn btn-quiet" onClick={() => setScreen('about')}>
          {t('home.about')}
        </button>
      </nav>

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
