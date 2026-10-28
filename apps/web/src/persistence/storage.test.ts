import { newMatch } from '@etg/gebeta-rules';
import { expect, test } from 'vitest';
import type { SavedSession } from '../game/session';
import { defaultSettings } from '../state/settings';
import { clearSession, loadSession, loadSettings, saveSession, saveSettings } from './storage';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

const sample = (): SavedSession => ({
  version: 1,
  mode: { kind: 'computer', level: 'easy' },
  match: newMatch('match', 0),
  humanSeat: 0,
  savedAt: 1,
});

test('settings round-trip and survive garbage', () => {
  const m = memoryStorage();
  const d = defaultSettings({ languages: ['en'], reducedMotion: false });
  saveSettings({ ...d, sound: false }, m);
  expect(loadSettings(d, m).sound).toBe(false);
  m.setItem('gebeta.settings.v1', '{not json');
  expect(loadSettings(d, m)).toEqual(d);
  m.setItem('gebeta.settings.v1', JSON.stringify({ language: 'fr', speed: 'warp' }));
  expect(loadSettings(d, m)).toEqual(d);
});

test('a throwing storage never crashes', () => {
  const bad = {
    getItem() {
      throw new Error('denied');
    },
    setItem() {
      throw new Error('denied');
    },
    removeItem() {
      throw new Error('denied');
    },
  } as unknown as Storage;
  const d = defaultSettings({ languages: ['en'], reducedMotion: false });
  expect(loadSession(bad)).toBeNull();
  expect(loadSettings(d, bad)).toEqual(d);
  expect(() => saveSession(sample(), bad)).not.toThrow();
  expect(() => saveSettings(d, bad)).not.toThrow();
  expect(() => clearSession(bad)).not.toThrow();
});

test('invalid, old-version, finished or guided sessions are not resumed', () => {
  const m = memoryStorage();
  m.setItem('gebeta.session.v1', JSON.stringify({ ...sample(), version: 0 }));
  expect(loadSession(m)).toBeNull();
  m.setItem('gebeta.session.v1', JSON.stringify({ ...sample(), match: { format: 'match' } }));
  expect(loadSession(m)).toBeNull();
  saveSession({ ...sample(), match: { ...sample().match, result: { winner: 0, reason: 'quick', rounds: 1 } } }, m);
  expect(loadSession(m)).toBeNull();
  saveSession({ ...sample(), mode: { kind: 'guided' } }, m);
  expect(loadSession(m)).toBeNull();
  saveSession(sample(), m);
  expect(loadSession(m)?.match).toEqual(sample().match);
  clearSession(m);
  expect(loadSession(m)).toBeNull();
});
