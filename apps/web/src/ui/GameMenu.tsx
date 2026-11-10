import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Session } from '../game/session';
import { useScene, type SceneMode } from '../scene/sceneStore';
import { SPEEDS, type Settings } from '../state/settings';
import { Button, Medallion, Panel } from './kit';
import './GameMenu.css';

interface Props {
  session: Session;
  settings: Settings;
  onPause(paused: boolean): void;
  onSettings(patch: Partial<Settings>): void;
  onRestart(): void;
  onQuit(): void;
}


/**
 * The menu medallion and the paused panel behind it (spec §9, screen 6): the scene keeps burning,
 * blurred and darkened, while the game holds still. Settings are rows of toggles.
 */
export function GameMenu({ session, settings, onPause, onSettings, onRestart, onQuit }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  // Start again and Quit throw the game away, so each asks once: the first press arms it, the second does it.
  const [armed, setArmed] = useState<'restart' | 'quit' | null>(null);
  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(null), 4000);
    return () => clearTimeout(timer);
  }, [armed]);
  const before = useRef<SceneMode>('play');
  const show = (o: boolean) => {
    setOpen(o);
    setArmed(null);
    onPause(o);
    // The scene knows it is paused; back to whatever it was showing when the panel closes.
    const scene = useScene.getState();
    if (o) {
      before.current = scene.mode;
      scene.setMode('paused');
    } else if (scene.mode === 'paused') scene.setMode(before.current);
  };
  const toggle = (key: 'showCounts' | 'fixedCamera' | 'sound') => (
    <button type="button" className={`tg${settings[key] ? ' on' : ''}`} aria-pressed={settings[key]} onClick={() => onSettings({ [key]: !settings[key] })}>
      {settings[key] ? t('menu.on') : t('menu.off')}
    </button>
  );

  return (
    <>
      <Medallion icon="menu" label={t('hud.menu')} className="hud-menu" onClick={() => show(true)} />
      {open && (
        <div className="pause-overlay" role="dialog" aria-modal="true" aria-labelledby="menu-title">
          <Panel labelledBy="menu-title" title={t('menu.title')} center width={400} className="menu-panel">
            <div className="menu-main">
              <Button kind="primary" className="menu-continue" onClick={() => show(false)} autoFocus>
                {t('menu.resume')}
              </Button>
            </div>
            <div className="menu-rows">
              <div className="row2">
                <span>{t('menu.speed')}</span>
                <span className="v" role="group" aria-label={t('menu.speed')}>
                  {SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      className={`tg${settings.speed === speed ? ' on' : ''}`}
                      aria-pressed={settings.speed === speed}
                      onClick={() => onSettings({ speed })}
                    >
                      {t(`menu.${speed}`)}
                    </button>
                  ))}
                </span>
              </div>
              <div className="row2">
                <span>{t('menu.counts')}</span>
                <span className="v">{toggle('showCounts')}</span>
              </div>
              {session.humanSeat === null && (
                <div className="row2">
                  <span>{t('menu.fixedCamera')}</span>
                  <span className="v">{toggle('fixedCamera')}</span>
                </div>
              )}
              <div className="row2">
                <span>{t('menu.sound')}</span>
                <span className="v">{toggle('sound')}</span>
              </div>
            </div>
            <div className="menu-actions">
              <Button
                className={armed === 'restart' ? 'btn-armed' : undefined}
                onClick={() => {
                  if (armed !== 'restart') return setArmed('restart');
                  show(false);
                  onRestart();
                }}
              >
                {t(armed === 'restart' ? 'menu.confirmRestart' : 'menu.restart')}
              </Button>
              <Button kind="quiet" className={armed === 'quit' ? 'btn-armed' : undefined} onClick={() => (armed === 'quit' ? onQuit() : setArmed('quit'))}>
                {t(armed === 'quit' ? 'menu.confirmQuit' : 'menu.quit')}
              </Button>
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
