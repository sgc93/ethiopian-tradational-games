import type { Strategy } from './ai';
import { advanceMatch, newMatch, playMove, type Format } from './match';
import { mulberry32 } from './rng';

export interface SimStats {
  matches: number;
  roundsPerMatch: number[];
  turnsPerRound: number[];
  /** Turns cut short by the endless-turn rule (§4.6). */
  loops: number;
  /** Rounds ended by the provisional repeated-position rule. */
  repetitionEnds: number;
  unfinishedRounds: number;
  unfinishedMatches: number;
}

export interface SimOptions {
  matches: number;
  format: Format;
  /** players[0] plays seat A, players[1] seat B. */
  players: [Strategy, Strategy];
  seed: number;
  maxTurnsPerRound?: number;
}

/** Plays whole matches between two strategies and reports how long rounds and matches run (§4.6). */
export function simulate({ matches, format, players, seed, maxTurnsPerRound = 5000 }: SimOptions): SimStats {
  const rng = mulberry32(seed);
  const stats: SimStats = {
    matches,
    roundsPerMatch: [],
    turnsPerRound: [],
    loops: 0,
    repetitionEnds: 0,
    unfinishedRounds: 0,
    unfinishedMatches: 0,
  };

  for (let i = 0; i < matches; i++) {
    let match = newMatch(format, rng() < 0.5 ? 0 : 1);
    let finished = true;
    while (!match.result) {
      let turns = 0;
      while (!match.round.over && turns < maxTurnsPerRound) {
        const strategy = players[match.round.toMove];
        const played = playMove(match, strategy(match.round, rng));
        match = played.match;
        turns++;
        for (const e of played.events) {
          if (e.type === 'turn-end' && e.reason === 'loop') stats.loops++;
          if (e.type === 'round-end' && e.reason === 'repetition') stats.repetitionEnds++;
        }
      }
      if (!match.round.over) {
        stats.unfinishedRounds++;
        finished = false;
        break;
      }
      stats.turnsPerRound.push(turns);
      match = advanceMatch(match);
    }
    if (finished) stats.roundsPerMatch.push(match.roundNumber);
    else stats.unfinishedMatches++;
  }
  return stats;
}
