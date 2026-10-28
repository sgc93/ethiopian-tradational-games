import type { HoleIndex, Player, RoundState, TurnEvent } from '@etg/gebeta-rules';

export type StoneLocation =
  | { kind: 'hole'; hole: HoleIndex; slot: number }
  /** `hole` is where the stones were picked up, so they can hover above it. */
  | { kind: 'hand'; hole: HoleIndex; index: number }
  | { kind: 'pile'; player: Player; index: number };

export interface StoneMove {
  id: number;
  to: StoneLocation;
  event: TurnEvent | null;
}

/**
 * Follows each of the 48 stones by id, so the board can move the very stone the rules moved.
 * Replaying a move's events leaves it matching the rules' board and captures exactly.
 */
export class StoneTracker {
  private holes: number[][] = [];
  private hand: number[] = [];
  private handHole: HoleIndex = 0;
  private piles: [number[], number[]] = [[], []];
  private where: StoneLocation[] = [];

  constructor(round: RoundState) {
    let id = 0;
    this.holes = round.board.map((n) => Array.from({ length: n }, () => id++));
    this.piles = [
      Array.from({ length: round.captured[0] }, () => id++),
      Array.from({ length: round.captured[1] }, () => id++),
    ];
    this.relocateAll();
  }

  apply(event: TurnEvent): StoneMove[] {
    switch (event.type) {
      case 'pickup': {
        this.hand = this.holes[event.hole]!.splice(0);
        this.handHole = event.hole;
        return this.hand.map((id, index) => this.move(id, { kind: 'hand', hole: event.hole, index }, event));
      }
      case 'drop': {
        const id = this.hand.shift();
        if (id === undefined) return [];
        const hole = this.holes[event.hole]!;
        hole.push(id);
        return [this.move(id, { kind: 'hole', hole: event.hole, slot: hole.length - 1 }, event)];
      }
      case 'capture':
        return this.toPile(this.holes[event.hole]!.splice(0), event.by, event);
      case 'round-end':
        return this.toPile(this.holes.flatMap((h) => h.splice(0)), event.sweptBy, event);
      default:
        return [];
    }
  }

  /** Every stone goes back into the holes, four to a hole, for the next round. */
  redeal(next: RoundState): StoneMove[] {
    const all = [...this.piles[0], ...this.piles[1], ...this.hand, ...this.holes.flat()];
    this.piles = [[], []];
    this.hand = [];
    let i = 0;
    this.holes = next.board.map((n) => all.slice(i, (i += n)));
    const moves: StoneMove[] = [];
    this.holes.forEach((ids, hole) =>
      ids.forEach((id, slot) => moves.push(this.move(id, { kind: 'hole', hole, slot }, null))),
    );
    return moves;
  }

  locations(): readonly StoneLocation[] {
    return this.where;
  }

  holeCounts(): number[] {
    return this.holes.map((h) => h.length);
  }

  pileCounts(): [number, number] {
    return [this.piles[0].length, this.piles[1].length];
  }

  /** The hole the stones in hand were picked up from. */
  get pickupHole(): HoleIndex {
    return this.handHole;
  }

  private toPile(ids: number[], player: Player, event: TurnEvent): StoneMove[] {
    const pile = this.piles[player];
    return ids.map((id) => {
      pile.push(id);
      return this.move(id, { kind: 'pile', player, index: pile.length - 1 }, event);
    });
  }

  private move(id: number, to: StoneLocation, event: TurnEvent | null): StoneMove {
    this.where[id] = to;
    return { id, to, event };
  }

  private relocateAll() {
    this.where = [];
    this.holes.forEach((ids, hole) => ids.forEach((id, slot) => (this.where[id] = { kind: 'hole', hole, slot })));
    this.piles.forEach((ids, player) =>
      ids.forEach((id, index) => (this.where[id] = { kind: 'pile', player: player as Player, index })),
    );
  }
}
