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

/** Looking almost straight down over the board, for the toss and the end of a round. */
export function topCamera(_size: Size, _bands: Bands): Pose {
  return tilted((84 * Math.PI) / 180, 15.5, [0, 0, 0.05], 0, PLAY_FOV);
}

const TAU = Math.PI * 2;
const HOME_RADIUS = 22;
const HOME_TARGET: Vec3 = [-9, 0.5, -1];

/**
 * The home camera: on A's side, 1.1 m from the board's centre, sweeping a slow ±25° arc once a
 * minute and bobbing between 2 and 5 above the top, aimed between the board and the fire.
 */
export function homePose(t: number): Pose {
  const az = ((25 * Math.PI) / 180) * Math.sin((TAU * t) / 60);
  const y = 3.5 + 1.5 * Math.sin((TAU * t) / 60 + 1);
  return { position: [HOME_RADIUS * Math.sin(az), y, HOME_RADIUS * Math.cos(az)], target: HOME_TARGET, fov: 32 };
}

const ORBIT_RADIUS = 18;
const ORBIT_TILT = (35 * Math.PI) / 180;
const ORBIT_TARGET: Vec3 = [0, 0.2, 0];

/** The result camera: a slow orbit at 35°, one turn every 40 s, 0.9 m from the board's centre. */
export function orbitPose(t: number): Pose {
  const az = (TAU * t) / 40;
  const r = ORBIT_RADIUS * Math.cos(ORBIT_TILT);
  return {
    position: [r * Math.sin(az), ORBIT_TARGET[1] + ORBIT_RADIUS * Math.sin(ORBIT_TILT), r * Math.cos(az)],
    target: ORBIT_TARGET,
    fov: PLAY_FOV,
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
