import type { Player } from '@etg/gebeta-rules';
import * as THREE from 'three';
import { fitPoints, type Vec3 } from '../layout';

export interface Pose {
  position: Vec3;
  target: Vec3;
  fov: number;
}

export interface Size {
  width: number;
  height: number;
}

/** The interface bands, in CSS px from the top: the top band's bottom edge and the bottom band's top edge. */
export interface Bands {
  top: number;
  bottom: number;
}

const PLAY_TILT = (48 * Math.PI) / 180;
const PLAY_FOV = 30;
const PLAY_TARGET: Vec3 = [0, 0.4, 0];
/** The board's horizontal margin, as a fraction of the width (80 px of 844). */
const SIDE_MARGIN = 0.095;
/** Clearance from the bands, in px: the horns stay 7 px under the top band and 13 px above the bottom one. */
const TOP_GAP = 7;
const BOTTOM_GAP = 13;

const scratchCamera = new THREE.PerspectiveCamera();
const scratch = new THREE.Vector3();

function apply(pose: Pose, size: Size): THREE.PerspectiveCamera {
  const cam = scratchCamera;
  cam.fov = pose.fov;
  cam.aspect = size.width / Math.max(1, size.height);
  cam.near = 0.1;
  cam.far = 2000;
  cam.position.set(...pose.position);
  cam.lookAt(scratch.set(...pose.target));
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  return cam;
}

/** Where a world point lands on screen for a pose, in CSS px from the top-left. */
export function project(pose: Pose, size: Size, point: Vec3): [number, number] {
  const cam = apply(pose, size);
  scratch.set(...point).project(cam);
  return [((scratch.x + 1) / 2) * size.width, ((1 - scratch.y) / 2) * size.height];
}

function tilted(tilt: number, distance: number, target: Vec3, seat: Player, fov: number): Pose {
  const sign = seat === 0 ? 1 : -1;
  return {
    position: [target[0], target[1] + distance * Math.sin(tilt), target[2] + sign * distance * Math.cos(tilt)],
    target,
    fov,
  };
}

/**
 * The play view for a seat: tilted 48° down with a 30° lens, backed off until the board, heads and
 * horns fit between the interface bands and inside the side margins.
 */
export function playCamera(seat: Player, size: Size, bands: Bands): Pose {
  const points = fitPoints();
  const xMin = size.width * SIDE_MARGIN;
  const xMax = size.width * (1 - SIDE_MARGIN);
  const yMin = bands.top + TOP_GAP;
  const yMax = bands.bottom - BOTTOM_GAP;
  let pose = tilted(PLAY_TILT, 80, PLAY_TARGET, seat, PLAY_FOV);
  for (let d = 8; d <= 80; d += 0.25) {
    pose = tilted(PLAY_TILT, d, PLAY_TARGET, seat, PLAY_FOV);
    const cam = apply(pose, size);
    let fits = true;
    for (const p of points) {
      scratch.set(...p).project(cam);
      const x = ((scratch.x + 1) / 2) * size.width;
      const y = ((1 - scratch.y) / 2) * size.height;
      if (x < xMin || x > xMax || y < yMin || y > yMax) {
        fits = false;
        break;
      }
    }
    if (fits) break;
  }
  return pose;
}

/** Where the top view aims: a little towards the near player, which sets the board in the upper part of the screen. */
export const TOP_TARGET: Vec3 = [0, 0, 1.15];

/**
 * Looking almost straight down over the board, for the toss and the end of a round. Both have a
 * low panel along the bottom of the screen, so the view is aimed below the board and the board,
 * and the coin over it, sit above the panel.
 */
export function topCamera(_size: Size, _bands: Bands): Pose {
  return tilted((84 * Math.PI) / 180, 15.5, TOP_TARGET, 0, PLAY_FOV);
}

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const HOME_AZIMUTH = -30 * DEG;
/** The home camera stands this far from the board's centre along the ground, this high, aimed this far above the board. */
const HOME_DISTANCE = 19;
const HOME_HEIGHT = 5.5;
const HOME_AIM = 2.2;
const HOME_FOV = 44;
/** The share of the screen's height between the interface's bars that the home view is composed for. */
const HOME_ROOM = 0.71;

/**
 * The home camera: a low three-quarter view from A's side, in front and to the left, with a wide
 * lens. Low enough that the yard stands behind the board (the house, the trees, the ridges and
 * the sky), high enough that the cups and their stones show. It drifts a slow ±10° about that
 * view once a minute and rises and falls a little.
 *
 * `room` is the share of the screen's height left between the interface's two bars,
 * `centre` is where the middle of that space is (0 at the top, 1 at the bottom) and `aspect`
 * is the screen's width over its height. With less room than the view was composed for, or a
 * narrower screen than 16:9, the camera stands back along the same line; with more room or a
 * wider screen it comes a little nearer; and it tips so the picture's middle is the middle of
 * the space between the bars.
 */
export function homePose(t: number, room = HOME_ROOM, centre = 0.5, aspect = 16 / 9): Pose {
  const forHeight = HOME_ROOM / Math.min(1, Math.max(0.3, room));
  const forWidth = Math.min(1.5, Math.max(0.9, 16 / 9 / aspect));
  const back = Math.min(1.9, Math.max(0.88, forHeight * forWidth));
  const az = HOME_AZIMUTH + 10 * DEG * Math.sin((TAU * t) / 60);
  const d = HOME_DISTANCE * back;
  const y = (HOME_HEIGHT + 0.4 * Math.sin((TAU * t) / 60 + 1)) * back;
  const tip = (0.5 - Math.min(0.7, Math.max(0.3, centre))) * HOME_FOV * DEG * d;
  return { position: [d * Math.sin(az), y, d * Math.cos(az)], target: [0, HOME_AIM * back - tip, 0], fov: HOME_FOV };
}

/**
 * The opening shot: from high over the yard, behind where the home camera will stand. The home
 * view is reached from here as the game is revealed, a crane coming down to the board.
 */
export function openingPose(home: Pose): Pose {
  return {
    position: [home.position[0] * 2.3, home.position[1] * 3.6, home.position[2] * 2.3],
    target: [home.target[0], home.target[1] + 3.5, home.target[2]],
    fov: home.fov,
  };
}

const RESULT_DISTANCE = 22;
const RESULT_TILT = 12 * DEG;
const RESULT_FOV = 40;
/** Aimed below the board, so it sits in the upper part of the screen, over the result panel. */
const RESULT_TARGET: Vec3 = [0, -0.6, 0];
/** How far the result camera swings to either side of the broadside view. */
const RESULT_SWING = 35 * DEG;

/**
 * The result camera: low and wide, the yard and the hills behind the board, swinging 35° to
 * either side of the near player's broadside view and back every 40 s. It never comes end-on,
 * where the near head would stand in front of the result panel.
 */
export function orbitPose(t: number): Pose {
  const az = RESULT_SWING * Math.sin((TAU * t) / 40);
  const r = RESULT_DISTANCE * Math.cos(RESULT_TILT);
  return {
    position: [r * Math.sin(az), RESULT_TARGET[1] + RESULT_DISTANCE * Math.sin(RESULT_TILT), r * Math.cos(az)],
    target: RESULT_TARGET,
    fov: RESULT_FOV,
  };
}

const ARC_CENTRE: Vec3 = [-6, 0, 0];

/**
 * The seat change: the camera swings round the board's fire end on a circle through both seats,
 * rising on the way so the flames show beyond, and the aim slides from one seat's target to the other's.
 */
export function seatArc(from: Pose, to: Pose, k: number): Pose {
  if (k <= 0) return from;
  if (k >= 1) return to;
  const a0 = Math.atan2(from.position[2] - ARC_CENTRE[2], from.position[0] - ARC_CENTRE[0]);
  let a1 = Math.atan2(to.position[2] - ARC_CENTRE[2], to.position[0] - ARC_CENTRE[0]);
  // Go the long way round, through the fire end (angle π), never past the hut end (angle 0).
  if (a1 < a0) a1 += TAU;
  const r0 = Math.hypot(from.position[0] - ARC_CENTRE[0], from.position[2] - ARC_CENTRE[2]);
  const r1 = Math.hypot(to.position[0] - ARC_CENTRE[0], to.position[2] - ARC_CENTRE[2]);
  const a = a0 + (a1 - a0) * k;
  const r = r0 + (r1 - r0) * k;
  const lerp = (p: number, q: number) => p + (q - p) * k;
  return {
    position: [ARC_CENTRE[0] + r * Math.cos(a), lerp(from.position[1], to.position[1]) + 6 * Math.sin(Math.PI * k), ARC_CENTRE[2] + r * Math.sin(a)],
    target: [lerp(from.target[0], to.target[0]), lerp(from.target[1], to.target[1]), lerp(from.target[2], to.target[2])],
    fov: lerp(from.fov, to.fov),
  };
}

/** A straight blend between two poses. */
export function blendPose(from: Pose, to: Pose, k: number): Pose {
  if (k <= 0) return from;
  if (k >= 1) return to;
  const lerp = (p: number, q: number) => p + (q - p) * k;
  return {
    position: [lerp(from.position[0], to.position[0]), lerp(from.position[1], to.position[1]), lerp(from.position[2], to.position[2])],
    target: [lerp(from.target[0], to.target[0]), lerp(from.target[1], to.target[1]), lerp(from.target[2], to.target[2])],
    fov: lerp(from.fov, to.fov),
  };
}

/**
 * The interface bands when the interface has not measured them: the reference 56 px bands, or
 * the compact 44 px bands below 340 px tall, each plus the 12 px inset at the bottom (spec §9).
 */
export function defaultBands(height: number): Bands {
  const compact = height < 340;
  return { top: compact ? 44 : 56, bottom: height - (compact ? 56 : 77) };
}
