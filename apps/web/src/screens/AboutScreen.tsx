import { useTranslation } from 'react-i18next';
import { useApp } from '../state/store';
import { Medallion, Mixed, Panel } from '../ui/kit';
import './AboutScreen.css';

/** About Gebeta (spec §9, screen 13): a reading panel over the dimmed home scene. */
export function AboutScreen() {
  const { t } = useTranslation();
  const setScreen = useApp((s) => s.setScreen);
  return (
    <main className="about">
      <div className="about-dim" aria-hidden="true" />
      <Panel labelledBy="about-title" title={<Mixed text={t('about.title')} />} center width={500} className="about-panel">
        <Medallion icon="close" size={30} label={t('about.close')} className="panel-back" onClick={() => setScreen('home')} />
        <p className="note about-p">
          <Mixed text={t('about.p1')} />
        </p>
        <p className="note about-p">
          <Mixed text={t('about.p2')} />
        </p>
        <p className="note about-p">
          <Mixed text={t('about.p3')} />
        </p>
      </Panel>
    </main>
  );
}
