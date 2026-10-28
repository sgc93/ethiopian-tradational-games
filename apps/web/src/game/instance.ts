import { mulberry32 } from '@etg/gebeta-rules';
import { create } from 'zustand';
import { createWorkerAi } from '../ai/client';
import { clearSession, saveSession } from '../persistence/storage';
import { urlOptions } from '../urlOptions';
import { createController } from './controller';
import type { Session } from './session';

/** The current game session, for components to read. */
export const useSession = create<{ session: Session | null }>(() => ({ session: null }));

const rng = urlOptions.seed === undefined ? Math.random : mulberry32(urlOptions.seed);

/** The app's one game controller. */
export const controller = createController({
  ai: createWorkerAi(urlOptions.speed === 'skip' ? 0 : 600, rng),
  persistence: { save: saveSession, clear: clearSession },
  rng,
  onChange: (session) => useSession.setState({ session }),
});

// A handle for poking at the game from the browser console while developing.
if (import.meta.env.DEV) Object.assign(window, { __gebeta: { controller, session: () => useSession.getState().session } });
