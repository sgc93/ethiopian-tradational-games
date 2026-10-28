import { useTranslation } from 'react-i18next';

export function NoWebGL() {
  const { t } = useTranslation();
  return (
    <main className="screen about" role="alert">
      <h1>{t('noWebgl.title')}</h1>
      <p>{t('noWebgl.body')}</p>
    </main>
  );
}
