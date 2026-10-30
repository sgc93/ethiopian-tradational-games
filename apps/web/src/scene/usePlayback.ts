import { initialOwners, newRound, type Player, type RoundState } from '@etg/gebeta-rules';
import gsap from 'gsap';
import { useEffect, useRef, type MutableRefObject } from 'react';
import type { Sfx } from '../audio/sfx';
import type { Session } from '../game/session';
import type { Speed } from '../state/settings';
import { now, useFeedback } from './feedback/feedbackStore';
import { handSlot, stoneSlot, storeSlot, type Vec3 } from './layout';
import { planPlayback } from './playbackPlan';
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

/** A point between two positions, lifted into an arc of the given height. */
function arc(from: Vec3, to: Vec3, t: number, height: number): Vec3 {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t + height * 4 * t * (1 - t),
    from[2] + (to[2] - from[2]) * t,
  ];
}

interface Args {
  session: Session | null;
  speed: Speed;
  sfx: Sfx;
  /** Stone positions by id, read by <Stones> every frame. */
  positions: MutableRefObject<Vec3[]>;
  onDone(turnId: number): void;
  onCounts(counts: number[]): void;
  onOwners(owners: readonly Player[]): void;
}

/**
 * Replays each move's events as animation: stones lift from a hole, fly one by one into the
 * following holes (the rest of the hand following along), relay, and captured fours fly to their
 * pile. Between rounds every stone is dealt back out, four to a hole.
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
    const { session, speed, sfx, positions, onDone, onCounts, onOwners } = live.current;
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
      onCounts(allCounts(tracker.current));
      onOwners(round.owners);
      turnTo(session ? round.toMove : null);
    };

    const finish = (turnId: number) => {
      positions.current = tracker.current!.locations().map(locationToPosition);
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

    /** Moves one stone along an arc; where it starts is read when the flight begins. */
    const fly = (id: number, to: () => Vec3, atSec: number, durSec: number, height: number) => {
      const s = { t: 0 };
      let from: Vec3 = positions.current[id]!;
      let target: Vec3 = from;
      tl.to(
        s,
        {
          t: 1,
          duration: Math.max(durSec, 0.001),
          ease: 'power1.inOut',
          onStart: () => {
            from = positions.current[id]!;
            target = to();
          },
          onUpdate: () => {
            positions.current[id] = arc(from, target, s.t, height);
          },
        },
        atSec,
      );
    };

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
      const flight = speed === 'fast' ? 0.25 : 0.4;
      moves.forEach((m, i) => {
        const at = 0.5 + i * per;
        fly(m.id, () => locationToPosition(m.to), at, flight, 0.35);
        if (i % 4 === 3) tl.call(() => sfx.drop(4), [], at + flight);
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
        case 'pickup':
          hand = moves.map((m) => m.id);
          tl.call(() => (sfx.pickup(e.count), onCounts(counts)), [], at);
          hand.forEach((id, i) => fly(id, () => handSlot(e.hole, i), at, dur, 0));
          break;
        case 'drop': {
          const id = hand.shift();
          if (id === undefined) break;
          const target = locationToPosition(moves[0]!.to);
          fly(id, () => target, at, dur, 0.25);
          // The rest of the hand moves along above the hole just sown into.
          hand.forEach((rid, i) => fly(rid, () => handSlot(e.hole, i), at, dur, 0));
          tl.call(() => (sfx.drop(e.countAfter), onCounts(counts), feedback.push({ kind: 'landed', hole: e.hole, at: now() })), [], at + dur * 0.9);
          break;
        }
        case 'capture':
          tl.call(() => (sfx.capture(), onCounts(counts), feedback.push({ kind: 'captured', hole: e.hole, by: e.by, at: now() })), [], at);
          // The four lift together in one arc into the store: 0.6 s at normal speed (1.5× the step).
          moves.forEach((m) => fly(m.id, () => locationToPosition(m.to), at, dur * 1.5, 0.5));
          break;
        case 'round-end': {
          const per = DURATION_MS[speed].sweepStone / 1000;
          tl.call(() => onCounts(counts), [], at);
          moves.forEach((m, i) => fly(m.id, () => locationToPosition(m.to), at + i * per, speed === 'fast' ? 0.2 : 0.35, 0.4));
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
