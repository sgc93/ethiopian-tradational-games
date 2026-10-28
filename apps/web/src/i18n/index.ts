import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Language } from '../state/settings';
import am from './am.json';
import en from './en.json';

export function setupI18n(language: Language) {
  void i18n.use(initReactI18next).init({
    resources: { am: { translation: am }, en: { translation: en } },
    lng: language,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
  document.documentElement.lang = language;
  return i18n;
}

export function changeLanguage(language: Language) {
  void i18n.changeLanguage(language);
  document.documentElement.lang = language;
}
