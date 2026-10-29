import './ui/tokens.css';
import './ui/fonts.css';
import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { setupI18n } from './i18n';
import { useApp } from './state/store';

setupI18n(useApp.getState().settings.language);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
