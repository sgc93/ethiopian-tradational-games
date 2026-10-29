import * as THREE from 'three';

/** (r, y) profiles in game units, from the bottom on the axis to the top. */
export type Profile = [number, number][];

/** A jebena, the clay coffee pot: round belly, narrow neck, flared lip. 25 cm tall. */
export const JEBENA: Profile = [
  [0, 0],
  [1.1, 0],
  [1.5, 0.3],
  [1.8, 1.2],
  [1.75, 2.2],
  [1.3, 3.0],
  [0.75, 3.5],
  [0.6, 4.1],
  [0.7, 4.6],
  [0.95, 5],
  [0.8, 5],
  [0, 5],
];

/** A small handleless coffee cup, 5 cm tall. */
export const CUP: Profile = [
  [0, 0],
  [0.35, 0],
  [0.48, 0.5],
  [0.55, 1],
  [0.47, 1],
  [0.42, 0.55],
  [0.3, 0.1],
  [0, 0.1],
];

/** A clay charcoal brazier: a bowl on a waisted foot, 15 cm tall. */
export const BRAZIER: Profile = [
  [0, 0],
  [1.4, 0],
  [1.0, 0.8],
  [1.1, 1.6],
  [2.2, 2.4],
  [2.4, 3],
  [2.1, 3],
  [1.6, 2.2],
  [0, 2.1],
];

/** A lidded basket: a bulging body with a domed lid, 30 cm tall. */
export const BASKET: Profile = [
  [0, 0],
  [2.0, 0],
  [2.6, 1.6],
  [2.7, 3.2],
  [2.4, 4.4],
  [2.55, 4.6],
  [2.0, 5.5],
  [0.8, 5.95],
  [0, 6],
];

/** A stool leg, turned: 30 cm from the ground to the seat. */
export const STOOL_LEG: Profile = [
  [0, 0],
  [0.45, 0],
  [0.35, 1.5],
  [0.5, 2.5],
  [0.35, 4],
  [0.4, 6],
  [0, 6],
];

/** Revolves a profile about the y axis. */
export function lathe(profile: Profile, segments = 24): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  );
}
