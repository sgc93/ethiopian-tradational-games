import { initialOwners, newRound, type Player, type RoundState } from '@etg/gebeta-rules';
import gsap from 'gsap';
import { useEffect, useRef, type MutableRefObject } from 'react';
import type { Sfx } from '../audio/sfx';
import type { Session } from '../game/session';
import type { Speed } from '../state/settings';
import { now, useFeedback } from './feedback/feedbackStore';
import { handSlot, stoneSlot, storeSlot, type Vec3 } from './layout';
import { planPlayback } from './playbackPlan';
import { flight, type Motion } from './stoneMotion';
import { StoneTracker, type StoneLocation } from './stoneTracker';
import { buildTimeline, DURATION_MS } from './timeline';

export function locationToPosition(loc: StoneLocation): Vec3 {
  switch (loc.kind) {
    case 'hole':
      return stoneSlot(loc.hole, loc.slot);
    case 'hand':
      return handSlot(loc.hole, loc.index);
    case 'pile':
      return storeSlot(loc.player, loc.index);
  }
}

const IDLE_ROUND = newRound(initialOwners(), 0);

interface Args {
  session: Session | null;
  speed: Speed;
  sfx: Sfx;
  /** Stone positions by id, read by <Stones> every frame. */
  positions: MutableRefObject<Vec3[]>;
  /** How far each stone has tumbled from its resting angle, in radians, by id; 0 at rest. */
  spins?: MutableRefObject<number[]>;
  onDone(turnId: number): void;
  onCounts(counts: number[]): void;
  onOwners(owners: readonly Player[]): void;
}

/**
 * Replays each move's events as animation: stones lift from a hole one after another, are tossed
 * one by one into the following holes (the rest of the hand hopping along), relay, and captured
 * fours swirl up and stream to their pile. Between rounds every stone is dealt back out in high
 * arcs, four to a hole. How each kind of move looks is in `stoneMotion.ts`.
 */
/** The fourteen counts the discs show: the cups, then the two piles (stores) as stones land in them. */
const allCounts = (t: StoneTracker): number[] => [...t.holeCounts(), ...t.pileCounts()];

export function usePlayback(args: Args): void {
  const live = useRef(args);
  live.current = args;
  const tracker = useRef<StoneTracker | null>(null);
  const shown = useRef<{ id: number; turnId: number } | null>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const lastTurn = useRef<Player | null>(null);

  const session = args.session;
  const key = session ? `${session.id}:${session.turnId}:${session.phase === 'animating'}` : 'idle';

  useEffect(() => {
    const { session, speed, sfx, positions, spins, onDone, onCounts, onOwners } = live.current;
    const still = () => {
      if (spins) spins.current = [];
    };
    const feedback = useFeedback.getState();

    /** The turn has passed to someone: the world answers (the firelight swells their way). */
    const turnTo = (player: Player | null) => {
      if (player === null || player === lastTurn.current) return;
      lastTurn.current = player;
      feedback.push({ kind: 'turn', player, at: now() });
    };

    const sync = (round: RoundState) => {
      timeline.current?.kill();
      timeline.current = null;
      sfx.duck(false); // a killed move must not leave the ambience down
      tracker.current = new StoneTracker(round);
      positions.current = tracker.current.locations().map(locationToPosition);
      still();
      onCounts(allCounts(tracker.current));
      onOwners(round.owners);
      turnTo(session ? round.toMove : null);
    };

    const finish = (turnId: number) => {
      positions.current = tracker.current!.locations().map(locationToPosition);
      still();
      onCounts(allCounts(tracker.current!));
      sfx.duck(false);
      onDone(turnId);
      turnTo(session?.match.round.toMove ?? null);
    };

    if (!session) {
      shown.current = null;
      sync(IDLE_ROUND);
      return;
    }
    const plan = planPlayback(shown.current, session, tracker.current !== null);
    if (plan === 'none') return;
    shown.current = { id: session.id, turnId: session.turnId };
    if (plan !== 'animate') {
      sync(session.match.round);
      if (plan === 'sync-then-done') setTimeout(() => onDone(session.turnId));
      return;
    }

    const t = tracker.current!; // 'animate' is only planned while stones are being followed
    const turnId = session.turnId;
    timeline.current?.kill();
    const tl = gsap.timeline({ paused: session.paused, onComplete: () => finish(turnId) });
    timeline.current = tl;
    sfx.duck(true); // the ambience drops while stones move (spec §10 "Mix")

    /** Moves one stone in the manner of `kind`, tumbling `turns` turns; where it starts is read when the move begins. */
    const fly = (id: number, to: () => Vec3, atSec: number, durSec: number, kind: Motion, turns = 0) => {
      const s = { t: 0 };
      let from: Vec3 = positions.current[id]!;
      let target: Vec3 = from;
      tl.to(
        s,
        {
          t: 1,
          duration: Math.max(durSec, 0.001),
          ease: 'none', // the motion has its own easing
          onStart: () => {
            from = positions.current[id]!;
            target = to();
          },
          onUpdate: () => {
            const f = flight(kind, from, target, s.t, turns);
            positions.current[id] = f.position;
            if (spins) spins.current[id] = f.spin;
          },
        },
        atSec,
      );
    };
    /** Stones differ a little in how much they tumble, by id, so a handful never moves as one. */
    const tumble = (id: number, base: number) => base + ((id * 7) % 5) * 0.25;

    if (session.turnEvents.length === 0) {
      // A new round: holes change hands, then every stone is dealt back out, four to a hole.
      const moves = t.redeal(session.match.round);
      onOwners(session.match.round.owners);
      if (speed === 'skip') {
        tl.kill();
        setTimeout(() => finish(turnId)); // a timer, not a frame: skipping must not wait on drawing
        return;
      }
      const per = DURATION_MS[speed].redealStone / 1000;
      const air = speed === 'fast' ? 0.3 : 0.55;
      moves.forEach((m, i) => {
        const at = 0.5 + i * per;
        fly(m.id, () => locationToPosition(m.to), at, air, 'deal', tumble(m.id, 1));
        if (i % 4 === 3) tl.call(() => sfx.drop(4), [], at + air * 0.8);
      });
      return;
    }

    if (speed === 'skip') {
      tl.kill();
      for (const e of session.turnEvents) t.apply(e);
      setTimeout(() => finish(turnId));
      return;
    }

    let hand: number[] = [];
    for (const step of buildTimeline(session.turnEvents, speed)) {
      const e = step.event;
      const at = step.atMs / 1000;
      const dur = step.durationMs / 1000;
      const moves = t.apply(e);
      const counts = allCounts(t);
      switch (e.type) {
        case 'pickup': {
          hand = moves.map((m) => m.id);
          tl.call(() => (sfx.pickup(e.count), onCounts(counts), e.relay && feedback.push({ kind: 'relay', hole: e.hole, at: now() })), [], at);
          // One after another, each a beat behind the last, all in the hand by the end of the step.
          const gap = Math.min(0.03, (dur * 0.35) / Math.max(1, hand.length));
          hand.forEach((id, i) => fly(id, () => handSlot(e.hole, i), at + i * gap, dur - hand.length * gap, 'lift', 0.5));
          break;
        }
        case 'drop': {
          const id = hand.shift();
          if (id === undefined) break;
          const target = locationToPosition(moves[0]!.to);
          fly(id, () => target, at, dur, 'drop', tumble(id, 0.5));
          // The rest of the hand hops along to above the hole just sown into.
          hand.forEach((rid, i) => fly(rid, () => handSlot(e.hole, i), at, dur, 'carry'));
          // The stone lands four fifths of the way through; the rest is its bounce.
          tl.call(() => (sfx.drop(e.countAfter), onCounts(counts), feedback.push({ kind: 'landed', hole: e.hole, at: now() })), [], at + dur * 0.8);
          break;
        }
        case 'capture':
          tl.call(() => (sfx.capture(), onCounts(counts), feedback.push({ kind: 'captured', hole: e.hole, by: e.by, count: moves.length, at: now() })), [], at);
          // They swirl up and stream to the store one behind another: 0.6 s in all at normal speed (1.5× the step).
          moves.forEach((m, i) => fly(m.id, () => locationToPosition(m.to), at + i * dur * 0.11, dur * (1.5 - (moves.length - 1) * 0.11), 'capture', tumble(m.id, 1.5)));
          break;
        case 'round-end': {
          const per = DURATION_MS[speed].sweepStone / 1000;
          tl.call(() => onCounts(counts), [], at);
          moves.forEach((m, i) => fly(m.id, () => locationToPosition(m.to), at + i * per, speed === 'fast' ? 0.25 : 0.45, 'deal', tumble(m.id, 1)));
          break;
        }
      }
    }
  }, [key]);

  // Pausing (the game menu) holds the animation where it is.
  const paused = session?.paused ?? false;
  useEffect(() => {
    if (paused) timeline.current?.pause();
    else timeline.current?.resume();
  }, [paused]);

  useEffect(
    () => () => {
      timeline.current?.kill();
      live.current.sfx.duck(false);
    },
    [],
  );
}
