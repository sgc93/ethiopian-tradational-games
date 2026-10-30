import { useTranslation } from 'react-i18next';
import { Panel } from '../ui/kit';
import './NoWebGL.css';

/**
 * The only screen without the live scene behind it (spec §9, screen 12): the message panel over
 * a still of the home scene, saved in the app.
 */
export function NoWebGL() {
  const { t } = useTranslation();
  return (
    <main className="nowebgl" role="alert">
      <img className="nowebgl-still" src="/home-still.webp" alt="" />
      <div className="nowebgl-dim" aria-hidden="true" />
      <Panel labelledBy="nowebgl-title" title={t('noWebgl.title')} center y={96} width={400} className="nowebgl-panel">
        <p className="note">{t('noWebgl.body')}</p>
      </Panel>
    </main>
  );
}
