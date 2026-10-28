export type Language = 'am' | 'en';
export type Speed = 'normal' | 'fast' | 'skip';

export interface Settings {
  language: Language;
  sound: boolean;
  speed: Speed;
  showCounts: boolean;
  fixedCamera: boolean;
}

export const LANGUAGES: readonly Language[] = ['am', 'en'];
export const SPEEDS: readonly Speed[] = ['normal', 'fast', 'skip'];

export interface DeviceEnv {
  languages: readonly string[];
  reducedMotion: boolean;
}

export function defaultSettings(env: DeviceEnv): Settings {
  return {
    language: env.languages.some((l) => l.toLowerCase().startsWith('am')) ? 'am' : 'en',
    sound: true,
    speed: env.reducedMotion ? 'fast' : 'normal',
    showCounts: true,
    fixedCamera: false,
  };
}

/** What the browser says about the device; safe to call where there is no window. */
export function deviceEnv(): DeviceEnv {
  if (typeof window === 'undefined') return { languages: [], reducedMotion: false };
  return {
    languages: navigator.languages?.length ? navigator.languages : [navigator.language],
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  };
}
