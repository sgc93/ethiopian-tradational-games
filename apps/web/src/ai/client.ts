import type { AiClient } from '../game/controller';
import type { AiRequest, AiResponse } from './ai.worker';

/**
 * The computer opponent in a Web Worker. Every answer takes at least `minThinkMs`, so a quick
 * computer move still reads as the computer taking its turn.
 */
export function createWorkerAi(minThinkMs = 600, rng: () => number = Math.random): AiClient {
  let worker: Worker | null = null;
  let nextId = 1;
  const waiting = new Map<number, (hole: number) => void>();

  const getWorker = () => {
    if (!worker) {
      worker = new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e: MessageEvent<AiResponse>) => {
        waiting.get(e.data.id)?.(e.data.hole);
        waiting.delete(e.data.id);
      };
    }
    return worker;
  };

  return {
    requestMove(state, level) {
      const id = nextId++;
      const answer = new Promise<number>((resolve) => waiting.set(id, resolve));
      const request: AiRequest = { id, state, level, seed: Math.floor(rng() * 2 ** 32) };
      getWorker().postMessage(request);
      const pause = new Promise((resolve) => setTimeout(resolve, minThinkMs));
      return Promise.all([answer, pause]).then(([hole]) => hole);
    },
  };
}
