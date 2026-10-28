import { create } from 'zustand';
import { changeLanguage } from '../i18n';
import { loadSettings, saveSettings } from '../persistence/storage';
import { defaultSettings, deviceEnv, type Settings } from './settings';

export type Screen = 'home' | 'about' | 'game' | 'result';

export interface AppStore {
  screen: Screen;
  settings: Settings;
  setScreen(s: Screen): void;
  updateSettings(p: Partial<Settings>): void;
}

export const useApp = create<AppStore>((set, get) => ({
  screen: 'home',
  settings: loadSettings(defaultSettings(deviceEnv())),
  setScreen: (screen) => set({ screen }),
  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    if (patch.language && patch.language !== get().settings.language) changeLanguage(patch.language);
    saveSettings(settings);
    set({ settings });
  },
}));
