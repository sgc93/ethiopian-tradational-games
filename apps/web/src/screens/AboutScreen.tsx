import { useTranslation } from 'react-i18next';
import { useApp } from '../state/store';

export function AboutScreen() {
  const { t } = useTranslation();
  const setScreen = useApp((s) => s.setScreen);
  return (
    <main className="screen about">
      <h1>{t('about.title')}</h1>
      <p>{t('about.p1')}</p>
      <p>{t('about.p2')}</p>
      <p>{t('about.p3')}</p>
      <button className="btn" onClick={() => setScreen('home')}>
        {t('about.back')}
      </button>
    </main>
  );
}
