import {
  advanceMatch,
  legalMoves,
  newMatch,
  playMove,
  type Format,
  type HoleIndex,
  type Level,
  type MatchState,
  type Player,
  type RoundState,
} from '@etg/gebeta-rules';
import type { Mode, SavedSession, Session } from './session';

export interface AiClient {
  requestMove(state: RoundState, level: Level): Promise<HoleIndex>;
}

export interface SessionPersistence {
  save(s: SavedSession): void;
  clear(): void;
}

export interface Controller {
  start(mode: Mode, format: Format): void;
  toss(call: 'lion' | 'person'): Player;
  playHole(hole: HoleIndex): boolean;
  animationDone(turnId: number): void;
  continueAfterSummary(): void;
  setPaused(paused: boolean): void;
  resume(saved: SavedSession): void;
  restart(): void;
  quit(): void;
  get(): Session | null;
}

interface Deps {
  ai: AiClient;
  persistence: SessionPersistence;
  rng: () => number;
  onChange: (s: Session | null) => void;
}

const seatFor = (mode: Mode): Player | null => (mode.kind === 'friend' ? null : 0);
const levelFor = (mode: Mode): Level => (mode.kind === 'computer' ? mode.level : 'easy');

/** Runs one game session: whose turn it is, when to animate, when the computer thinks, what gets saved. */
export function createController({ ai, persistence, rng, onChange }: Deps): Controller {
  let session: Session | null = null;
  /** Bumped whenever a session starts or ends, so late computer answers from an old one are dropped. */
  let epoch = 0;
  /** A computer move that arrived while the game was paused. */
  let held: HoleIndex | null = null;

  const set = (next: Session | null) => {
    session = next;
    onChange(session);
  };

  const update = (patch: Partial<Session>) => set({ ...session!, ...patch });

  const save = () => {
    if (!session || session.mode.kind === 'guided') return;
    persistence.save({
      version: 1,
      mode: session.mode,
      match: session.match,
      humanSeat: session.humanSeat,
      savedAt: Date.now(),
    });
  };

  const isComputerTurn = (s: Session) =>
    s.mode.kind !== 'friend' && !s.match.round.over && s.match.round.toMove !== s.humanSeat;

  const begin = (mode: Mode, match: MatchState, phase: Session['phase']) => {
    epoch++;
    held = null;
    set({ mode, match, humanSeat: seatFor(mode), phase, turnEvents: [], turnId: 0, paused: false });
  };

  const play = (hole: HoleIndex) => {
    const s = session!;
    const { match, events } = playMove(s.match, hole);
    set({ ...s, match, turnEvents: events, turnId: s.turnId + 1, phase: 'animating' });
    save();
  };

  const think = () => {
    const s = session!;
    update({ phase: 'thinking' });
    const mine = epoch;
    const turnId = s.turnId;
    const state = s.match.round;
    ai.requestMove(state, levelFor(s.mode))
      .catch(() => legalMoves(state)[0]!)
      .then((hole) => {
        if (mine !== epoch || session?.turnId !== turnId || session.phase !== 'thinking') return;
        if (session.paused) held = hole;
        else play(hole);
      });
  };

  /** After the board has caught up: the computer's turn, the human's, or the end of the round. */
  const next = () => {
    const s = session!;
    if (s.match.round.over) {
      const match = advanceMatch(s.match);
      if (match.result) {
        set({ ...s, match, phase: 'finished' });
        persistence.clear();
      } else {
        set({ ...s, match, phase: 'round-summary' });
        save();
      }
    } else if (isComputerTurn(s)) {
      think();
    } else {
      update({ phase: 'awaiting-move' });
    }
  };

  const controller: Controller = {
    start(mode, format) {
      if (mode.kind === 'guided') begin(mode, newMatch('quick', 0), 'awaiting-move');
      else begin(mode, newMatch(format, 0), 'toss');
    },

    toss(call) {
      const s = session!;
      const coin = rng() < 0.5 ? 'lion' : 'person';
      const starter: Player = call === coin ? 0 : 1;
      set({ ...s, match: newMatch(s.match.format, starter) });
      save();
      next();
      return starter;
    },

    playHole(hole) {
      const s = session;
      if (!s || s.phase !== 'awaiting-move' || s.paused || isComputerTurn(s)) return false;
      if (!legalMoves(s.match.round).includes(hole)) return false;
      play(hole);
      return true;
    },

    animationDone(turnId) {
      if (!session || session.phase !== 'animating' || turnId !== session.turnId) return;
      next();
    },

    continueAfterSummary() {
      const s = session;
      if (!s || s.phase !== 'round-summary') return;
      set({ ...s, phase: 'animating', turnEvents: [], turnId: s.turnId + 1 });
    },

    setPaused(paused) {
      if (!session) return;
      update({ paused });
      if (!paused && held !== null) {
        const hole = held;
        held = null;
        play(hole);
      }
    },

    resume(saved) {
      begin(saved.mode, saved.match, 'awaiting-move');
      next();
    },

    restart() {
      if (!session) return;
      const { mode, match } = session;
      persistence.clear();
      controller.start(mode, match.format);
    },

    quit() {
      epoch++;
      held = null;
      set(null);
    },

    get: () => session,
  };
  return controller;
}
