import { create } from 'zustand';
import { createWorkerAi } from '../ai/client';
import { clearSession, saveSession } from '../persistence/storage';
import { createController } from './controller';
import type { Session } from './session';

/** The current game session, for components to read. */
export const useSession = create<{ session: Session | null }>(() => ({ session: null }));

/** The app's one game controller. */
export const controller = createController({
  ai: createWorkerAi(),
  persistence: { save: saveSession, clear: clearSession },
  rng: Math.random,
  onChange: (session) => useSession.setState({ session }),
});

// A handle for poking at the game from the browser console while developing.
if (import.meta.env.DEV) Object.assign(window, { __gebeta: { controller, session: () => useSession.getState().session } });
