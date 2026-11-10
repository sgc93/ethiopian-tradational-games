import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { deviceEnv } from '../state/settings';
import { urlOptions } from '../urlOptions';
import { blendPose, defaultBands, homePose, orbitPose, playCamera, seatArc, topCamera, type Pose } from './camera/poses';
import { latest, now, useFeedback } from './feedback/feedbackStore';
import { nudge } from './feedback/pulses';
import { holeCenter } from './layout';
import { useScene, type SceneMode } from './sceneStore';

const REDUCED_MOTION = typeof window !== 'undefined' && deviceEnv().reducedMotion;
/** Fixed looks for checking the set: the reference three-quarter view, and three at head B (at x = −5.25, facing +x) like the reference sheets. */
const DEV_LOOKS: Record<NonNullable<typeof urlOptions.cam>, Pose> = {
  home: { position: [-7.75, 7, 13.4], target: [0, 0.8, 0], fov: 30 },
  head: { position: [-5.0, 1.9, 9.5], target: [-5.0, 1.7, 0], fov: 30 },
  head34: { position: [1.5, 3.4, 7.5], target: [-5.0, 1.6, 0], fov: 30 },
  headfront: { position: [4.5, 2.2, 0], target: [-5.0, 1.8, 0], fov: 30 },
};

const TURN_LIMIT = (15 * Math.PI) / 180;
const TILT_MIN = (38 * Math.PI) / 180;
const TILT_MAX = (58 * Math.PI) / 180;
const PLAY_TILT = (48 * Math.PI) / 180;
const RETURN_AFTER_MS = 2000;

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

/** A play pose with the player's drag applied: turned about the target, re-tilted and zoomed. */
function nudged(base: Pose, n: Nudge): Pose {
  const dx = base.position[0] - base.target[0];
  const dy = base.position[1] - base.target[1];
  const dz = base.position[2] - base.target[2];
  const dist = Math.hypot(dx, dy, dz) * n.zoom;
  const az = Math.atan2(dx, dz) + n.turn;
  const tilt = Math.min(TILT_MAX, Math.max(TILT_MIN, PLAY_TILT + n.tilt));
  return {
    position: [base.target[0] + dist * Math.cos(tilt) * Math.sin(az), base.target[1] + dist * Math.sin(tilt), base.target[2] + dist * Math.cos(tilt) * Math.cos(az)],
    target: base.target,
    fov: base.fov,
  };
}

/**
 * Drives the camera from the scene's mode: the play view for a seat, the home arc, the top-down
 * view, the result orbit. Mode changes ease between poses (the seat change swings round the fire
 * end); in play the player may drag a little and the view eases back after two seconds; the play
 * camera breathes slightly unless motion is reduced.
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
    returnTimer: 0 as ReturnType<typeof setTimeout> | 0,
    current: homePose(0),
  });
  const target = useMemo(() => new THREE.Vector3(), []);

  // The pose the mode asks for right now.
  const livePose = (t: number): Pose => {
    if (urlOptions.cam) return DEV_LOOKS[urlOptions.cam];
    const s = state.current;
    switch (s.mode) {
      case 'home':
        return homePose(urlOptions.still ? 12 : t);
      case 'toss':
      case 'round-end':
        return topCamera(size, bands);
      case 'result':
        return REDUCED_MOTION ? orbitPose(0) : orbitPose(t);
      default:
        return nudged(playCamera(s.seat, size, bands), s.nudge);
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
    useScene.setState({ cameraMoving: true });
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

  // Dragging in play: a small turn, tilt and zoom, eased back after two seconds.
  useEffect(() => {
    const el = gl.domElement;
    const s = state.current;
    let last: { x: number; y: number } | null = null;
    const back = () => {
      gsap.to(s.nudge, { turn: 0, tilt: 0, zoom: 1, duration: 0.8, ease: 'power2.inOut' });
    };
    const down = (e: PointerEvent) => {
      if (s.mode !== 'play' || fixed) return;
      last = { x: e.clientX, y: e.clientY };
      s.dragging = true;
      if (s.returnTimer) clearTimeout(s.returnTimer);
      gsap.killTweensOf(s.nudge);
    };
    const move = (e: PointerEvent) => {
      if (!last || !s.dragging) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      s.nudge.turn = Math.max(-TURN_LIMIT, Math.min(TURN_LIMIT, s.nudge.turn - dx * 0.004));
      s.nudge.tilt = Math.max(TILT_MIN - PLAY_TILT, Math.min(TILT_MAX - PLAY_TILT, s.nudge.tilt + dy * 0.003));
    };
    const up = () => {
      if (!s.dragging) return;
      s.dragging = false;
      last = null;
      s.returnTimer = setTimeout(back, RETURN_AFTER_MS);
    };
    const wheel = (e: WheelEvent) => {
      if (s.mode !== 'play' || fixed) return;
      s.nudge.zoom = Math.max(0.9, Math.min(1.1, s.nudge.zoom + e.deltaY * 0.0005));
      if (s.returnTimer) clearTimeout(s.returnTimer);
      s.returnTimer = setTimeout(back, RETURN_AFTER_MS);
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: true });
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
      if (s.returnTimer) clearTimeout(s.returnTimer);
    };
  }, [gl, fixed]);

  useFrame(({ clock }) => {
    const s = state.current;
    const t = clock.elapsedTime;
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
