import { isValidMatchState, normalizeRules } from '@etg/gebeta-rules';
import type { Mode, SavedSession } from '../game/session';
import { LANGUAGES, SPEEDS, type Settings } from '../state/settings';

const SETTINGS_KEY = 'gebeta.settings.v1';
const SESSION_KEY = 'gebeta.session.v1';

/** localStorage, or null where reading it throws (private mode, some web views). */
function defaultStore(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function read(key: string, store: Storage | null): unknown {
  try {
    const raw = store?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown, store: Storage | null): void {
  try {
    store?.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the game still works, it just won't remember.
  }
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

/** Saved settings field by field; anything missing or invalid falls back. */
export function loadSettings(fallback: Settings, store: Storage | null = defaultStore()): Settings {
  const saved = read(SETTINGS_KEY, store);
  if (!isObject(saved)) return fallback;
  const bool = (k: 'sound' | 'showCounts' | 'fixedCamera') => (typeof saved[k] === 'boolean' ? (saved[k] as boolean) : (fallback[k] as boolean));
  return {
    language: LANGUAGES.includes(saved.language as never) ? (saved.language as Settings['language']) : fallback.language,
    speed: SPEEDS.includes(saved.speed as never) ? (saved.speed as Settings['speed']) : fallback.speed,
    sound: bool('sound'),
    showCounts: bool('showCounts'),
    fixedCamera: bool('fixedCamera'),
    // Each rule is taken on its own: a rule that is missing or unknown is the usual one.
    rules: saved.rules === undefined ? fallback.rules : normalizeRules(saved.rules),
  };
}

export function saveSettings(s: Settings, store: Storage | null = defaultStore()): void {
  write(SETTINGS_KEY, s, store);
}

function isResumableMode(x: unknown): x is Mode {
  if (!isObject(x)) return false;
  if (x.kind === 'friend') return true;
  return x.kind === 'computer' && ['easy', 'medium', 'hard'].includes(x.level as string);
}

/** The saved game, or null when there is none worth resuming. */
export function loadSession(store: Storage | null = defaultStore()): SavedSession | null {
  const s = read(SESSION_KEY, store);
  if (!isObject(s) || s.version !== 1 || !isResumableMode(s.mode)) return null;
  if (!(s.humanSeat === 0 || s.humanSeat === 1 || s.humanSeat === null)) return null;
  if (!isValidMatchState(s.match) || s.match.result !== null) return null;
  return s as unknown as SavedSession;
}

export function saveSession(s: SavedSession, store: Storage | null = defaultStore()): void {
  write(SESSION_KEY, s, store);
}

export function clearSession(store: Storage | null = defaultStore()): void {
  try {
    store?.removeItem(SESSION_KEY);
  } catch {
    // Nothing to do: a stale save is rejected on load anyway once the match is over.
  }
}
