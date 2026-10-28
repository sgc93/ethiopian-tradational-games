/// <reference lib="webworker" />
import { chooseMove, mulberry32, type Level, type RoundState } from '@etg/gebeta-rules';

export interface AiRequest {
  id: number;
  state: RoundState;
  level: Level;
  seed: number;
}

export interface AiResponse {
  id: number;
  hole: number;
}

// The search runs here so the board keeps animating while the computer thinks.
self.onmessage = (e: MessageEvent<AiRequest>) => {
  const { id, state, level, seed } = e.data;
  const hole = chooseMove(state, level, { rng: mulberry32(seed) });
  self.postMessage({ id, hole } satisfies AiResponse);
};
