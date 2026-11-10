import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { deviceEnv } from '../state/settings';
import { urlOptions } from '../urlOptions';
import { blendPose, defaultBands, homePose, openingPose, orbitPose, playCamera, seatArc, topCamera, type Pose } from './camera/poses';
import { latest, now, useFeedback } from './feedback/feedbackStore';
import { nudge } from './feedback/pulses';
import { holeCenter } from './layout';
import { useScene, type SceneMode } from './sceneStore';

const REDUCED_MOTION = typeof window !== 'undefined' && deviceEnv().reducedMotion;
/** Fixed looks for checking the set: the reference three-quarter view, and three at head B (at x = −5.25, facing +x) like the reference sheets. */
const DEV_LOOKS: Record<NonNullable<typeof urlOptions.cam>, Pose> = {
  home: { position: [-9.5, 5.5, 16.45], target: [0, 2.2, 0], fov: 44 },
  head: { position: [-5.0, 1.9, 9.5], target: [-5.0, 1.7, 0], fov: 30 },
  head34: { position: [1.5, 3.4, 7.5], target: [-5.0, 1.6, 0], fov: 30 },
  headfront: { position: [4.5, 2.2, 0], target: [-5.0, 1.8, 0], fov: 30 },
};

const DEG = Math.PI / 180;

/** How far the player may take the view from where a mode puts it. */
interface Reach {
  /** Either way round the board, in radians; Infinity for all the way round. */
  turn: number;
  /** The lowest and highest the camera may look down from, in radians above the ground. */
  tiltMin: number;
  tiltMax: number;
  /** The nearest and farthest, as a share of the mode's own distance. */
  zoomMin: number;
  zoomMax: number;
  /** After this long untouched the view eases back by itself; 0 to stay where it was left. */
  returnAfterMs: number;
}

/**
 * In play the view stays where the player leaves it (a double tap, or the reset medallion, puts
 * it back). On the home and result screens the board can be turned all the way round and the
 * view drifts back after a few seconds.
 */
const REACH: Record<'play' | 'show', Reach> = {
  play: { turn: 80 * DEG, tiltMin: 20 * DEG, tiltMax: 76 * DEG, zoomMin: 0.7, zoomMax: 1.4, returnAfterMs: 0 },
  show: { turn: Infinity, tiltMin: 5 * DEG, tiltMax: 55 * DEG, zoomMin: 0.65, zoomMax: 1.5, returnAfterMs: 5000 },
};
const reachOf = (mode: SceneMode): Reach | null => (mode === 'play' ? REACH.play : mode === 'home' || mode === 'result' ? REACH.show : null);
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** What the player did with a drag: a turn about the target, a change of tilt, and a zoom. */
interface Nudge {
  turn: number;
  tilt: number;
  zoom: number;
}

function moveSeconds(from: SceneMode, to: SceneMode, seatChanged: boolean): number {
  if (REDUCED_MOTION) return 0.001;
  if (seatChanged && from === 'play' && to === 'play') return 1.4;
  if ((from === 'play' && to === 'toss') || (from === 'toss' && to === 'play')) return 1.0;
  if (from === 'play' && to === 'round-end') return 1.2;
  return 0.8;
}

/** A pose with the player's hand applied: turned about its target, re-tilted and brought nearer or farther, within a reach. */
function nudged(base: Pose, n: Nudge, reach: Reach): Pose {
  const dx = base.position[0] - base.target[0];
  const dy = base.position[1] - base.target[1];
  const dz = base.position[2] - base.target[2];
  const dist = Math.hypot(dx, dy, dz) * n.zoom;
  const az = Math.atan2(dx, dz) + n.turn;
  const own = Math.atan2(dy, Math.hypot(dx, dz));
  // A mode's own view may already be outside the reach (the home view is lower than the play view's floor): never push it.
  const tilt = n.tilt === 0 ? own : clamp(own + n.tilt, Math.min(own, reach.tiltMin), Math.max(own, reach.tiltMax));
  return {
    position: [base.target[0] + dist * Math.cos(tilt) * Math.sin(az), base.target[1] + dist * Math.sin(tilt), base.target[2] + dist * Math.cos(tilt) * Math.cos(az)],
    target: base.target,
    fov: base.fov,
  };
}

/**
 * Drives the camera from the scene's mode: the play view for a seat, the home arc, the top-down
 * view, the result orbit. Mode changes ease between poses (the seat change swings round the fire
 * end). The player's hand is on it too: a drag turns and tilts the view, a pinch or the wheel
 * brings it nearer, a double tap puts it back, and with a mouse the view leans a little towards
 * the pointer. The play camera breathes slightly unless motion is reduced.
 */
export function CameraRig() {
  const { camera, size, gl } = useThree();
  const mode = useScene((s) => s.mode);
  const seat = useScene((s) => s.seat);
  const measured = useScene((s) => s.bands);
  const bands = measured ?? defaultBands(size.height);
  const fixed = urlOptions.cam !== undefined;

  const state = useRef({
    mode,
    seat,
    from: null as Pose | null,
    k: 1,
    arc: false,
    nudge: { turn: 0, tilt: 0, zoom: 1 } as Nudge,
    dragging: false,
    /** Where the mouse is over the picture, −0.5 to 0.5 each way, and the lean it has eased into. */
    look: { x: 0, y: 0 },
    lean: { x: 0, y: 0 },
    returnTimer: 0 as ReturnType<typeof setTimeout> | 0,
    current: homePose(0),
  });
  const target = useMemo(() => new THREE.Vector3(), []);

  // The pose the mode asks for right now, with the player's hand on it.
  const livePose = (t: number): Pose => {
    if (urlOptions.cam) return DEV_LOOKS[urlOptions.cam];
    const s = state.current;
    const reach = reachOf(s.mode);
    const held = (base: Pose): Pose => {
      if (!reach || urlOptions.still) return base;
      const n = { turn: s.nudge.turn + s.lean.x * 0.07, tilt: s.nudge.tilt + s.lean.y * 0.035, zoom: s.nudge.zoom };
      return n.turn === 0 && n.tilt === 0 && n.zoom === 1 ? base : nudged(base, n, reach);
    };
    switch (s.mode) {
      case 'home': {
        // The bare still has the whole height; otherwise the board fits between the interface's bars.
        if (urlOptions.still) return homePose(12, 0.71);
        const home = homePose(t, (bands.bottom - bands.top) / size.height, (bands.bottom + bands.top) / 2 / size.height, size.width / size.height);
        // The reveal: the loading screen runs `flare` from 0 to 1, and the camera cranes down from over the yard.
        const reveal = useScene.getState().flare;
        return reveal < 1 && !REDUCED_MOTION ? blendPose(openingPose(home), home, reveal * reveal * (3 - 2 * reveal)) : held(home);
      }
      case 'toss':
      case 'round-end':
        return topCamera(size, bands);
      case 'result':
        return held(REDUCED_MOTION ? orbitPose(0) : orbitPose(t));
      default:
        return held(playCamera(s.seat, size, bands));
    }
  };

  // A new mode or seat starts an eased move from wherever the camera is.
  useEffect(() => {
    const s = state.current;
    const seatChanged = s.seat !== seat;
    const seconds = moveSeconds(s.mode, mode, seatChanged);
    s.arc = seatChanged && s.mode === 'play' && mode === 'play';
    s.from = { ...s.current };
    s.k = 0;
    s.mode = mode;
    s.seat = seat;
    s.nudge = { turn: 0, tilt: 0, zoom: 1 };
    useScene.setState({ cameraMoving: true, viewMoved: false });
    if (REDUCED_MOTION) useScene.setState({ fade: 1 });
    const tween = gsap.to(s, {
      k: 1,
      duration: seconds,
      ease: 'power2.inOut',
      delay: REDUCED_MOTION ? 0.1 : 0,
      onComplete: () => {
        useScene.setState({ cameraMoving: false, fade: 0 });
      },
    });
    return () => {
      tween.kill();
    };
  }, [mode, seat]);

  // The player's hand on the view: one finger or the mouse turns and tilts, two fingers or the
  // wheel bring it nearer, a double tap puts it back.
  const resetView = useScene((st) => st.resetView);
  useEffect(() => {
    const s = state.current;
    gsap.to(s.nudge, { turn: 0, tilt: 0, zoom: 1, duration: 0.7, ease: 'power2.inOut', overwrite: true });
    useScene.setState({ viewMoved: false });
  }, [resetView]);
  useEffect(() => {
    const el = gl.domElement;
    const s = state.current;
    const fingers = new Map<number, { x: number; y: number }>();
    let spread = 0;
    const back = () => {
      gsap.to(s.nudge, { turn: 0, tilt: 0, zoom: 1, duration: 0.9, ease: 'power2.inOut', overwrite: true });
      useScene.setState({ viewMoved: false });
    };
    const rest = () => {
      if (s.returnTimer) clearTimeout(s.returnTimer);
      const reach = reachOf(s.mode);
      s.returnTimer = reach && reach.returnAfterMs > 0 ? setTimeout(back, reach.returnAfterMs) : 0;
    };
    const moved = () => {
      if (s.mode === 'play' && !useScene.getState().viewMoved) useScene.setState({ viewMoved: true });
    };
    const gap = () => {
      const [a, b] = [...fingers.values()];
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };
    const down = (e: PointerEvent) => {
      if (!reachOf(s.mode) || fixed) return;
      fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      s.dragging = true;
      spread = gap();
      if (s.returnTimer) clearTimeout(s.returnTimer);
      gsap.killTweensOf(s.nudge);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && !s.dragging) s.look = { x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 };
      const last = fingers.get(e.pointerId);
      const reach = reachOf(s.mode);
      if (!last || !s.dragging || !reach) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (fingers.size >= 2) {
        // Two fingers: the distance between them is the zoom.
        const now = gap();
        if (spread > 0 && now > 0) s.nudge.zoom = clamp((s.nudge.zoom * spread) / now, reach.zoomMin, reach.zoomMax);
        spread = now;
      } else {
        s.nudge.turn = clamp(s.nudge.turn - dx * 0.005, -reach.turn, reach.turn);
        s.nudge.tilt = clamp(s.nudge.tilt + dy * 0.004, -1.2, 1.2);
      }
      if (Math.abs(dx) + Math.abs(dy) > 0) moved();
    };
    const up = (e: PointerEvent) => {
      fingers.delete(e.pointerId);
      spread = gap();
      if (fingers.size > 0 || !s.dragging) return;
      s.dragging = false;
      rest();
    };
    const wheel = (e: WheelEvent) => {
      const reach = reachOf(s.mode);
      if (!reach || fixed) return;
      gsap.killTweensOf(s.nudge);
      s.nudge.zoom = clamp(s.nudge.zoom + e.deltaY * 0.0008, reach.zoomMin, reach.zoomMax);
      moved();
      rest();
    };
    const twice = () => {
      if (reachOf(s.mode)) back();
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: true });
    el.addEventListener('dblclick', twice);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('dblclick', twice);
      if (s.returnTimer) clearTimeout(s.returnTimer);
    };
  }, [gl, fixed]);

  useFrame(({ clock }) => {
    const s = state.current;
    const t = clock.elapsedTime;
    // The lean towards the pointer eases in, and lets go while the view is being dragged.
    const want = s.dragging || REDUCED_MOTION ? { x: 0, y: 0 } : s.look;
    s.lean.x += (want.x - s.lean.x) * 0.06;
    s.lean.y += (want.y - s.lean.y) * 0.06;
    const live = livePose(t);
    const pose = s.k < 1 && s.from ? (s.arc ? seatArc(s.from, live, s.k) : blendPose(s.from, live, s.k)) : live;
    s.current = pose;
    const cam = camera as THREE.PerspectiveCamera;
    let [x, y, z] = pose.position;
    if (s.mode === 'play' && !REDUCED_MOTION && !fixed) {
      x += 0.04 * Math.sin((2 * Math.PI * t) / 7);
      y += 0.04 * Math.sin((2 * Math.PI * t) / 11);
      // A capture eases the camera 3% towards the cup and back (spec §7 "Captures").
      const captured = latest(useFeedback.getState().events, 'captured');
      const n = captured ? nudge(now() - captured.at) : 0;
      if (n > 0) {
        const [hx, hy, hz] = holeCenter(captured!.hole);
        x += (hx - x) * n;
        y += (hy - y) * n;
        z += (hz - z) * n;
      }
    }
    cam.position.set(x, y, z);
    cam.lookAt(target.set(...pose.target));
    if (cam.fov !== pose.fov) {
      cam.fov = pose.fov;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
