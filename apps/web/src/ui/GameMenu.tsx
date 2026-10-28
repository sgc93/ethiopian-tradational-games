import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Session } from '../game/session';
import { SPEEDS, type Settings } from '../state/settings';

interface Props {
  session: Session;
  settings: Settings;
  onPause(paused: boolean): void;
  onSettings(patch: Partial<Settings>): void;
  onRestart(): void;
  onQuit(): void;
}

/** The menu button and the paused sheet behind it. The game holds still while it is open. */
export function GameMenu({ session, settings, onPause, onSettings, onRestart, onQuit }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const show = (o: boolean) => {
    setOpen(o);
    onPause(o);
  };
  const toggle = (key: 'showCounts' | 'fixedCamera' | 'sound') => (
    <button className="toggle" aria-pressed={settings[key]} onClick={() => onSettings({ [key]: !settings[key] })}>
      {settings[key] ? t('menu.on') : t('menu.off')}
    </button>
  );

  return (
    <>
      <button className="menu-button" onClick={() => show(true)}>
        {t('hud.menu')}
      </button>
      {open && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="menu-title">
          <section className="card menu">
            <h2 id="menu-title">{t('menu.title')}</h2>
            <button className="btn btn-primary" onClick={() => show(false)} autoFocus>
              {t('menu.resume')}
            </button>
            <div className="menu-row">
              <span>{t('menu.speed')}</span>
              <div className="segmented" role="group" aria-label={t('menu.speed')}>
                {SPEEDS.map((speed) => (
                  <button key={speed} aria-pressed={settings.speed === speed} onClick={() => onSettings({ speed })}>
                    {t(`menu.${speed}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="menu-row">
              <span>{t('menu.counts')}</span>
              {toggle('showCounts')}
            </div>
            {session.humanSeat === null && (
              <div className="menu-row">
                <span>{t('menu.fixedCamera')}</span>
                {toggle('fixedCamera')}
              </div>
            )}
            <div className="menu-row">
              <span>{t('menu.sound')}</span>
              {toggle('sound')}
            </div>
            <div className="card-actions">
              <button
                className="btn"
                onClick={() => {
                  setOpen(false);
                  onRestart();
                }}
              >
                {t('menu.restart')}
              </button>
              <button className="btn btn-quiet" onClick={onQuit}>
                {t('menu.quit')}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
