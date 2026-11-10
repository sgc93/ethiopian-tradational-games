import { Grass } from './Grass';
import { Ground } from './Ground';
import { Mat } from './Mat';

/**
 * The place the game is played: a highland homestead's yard. The board lies on a woven mat on
 * packed earth and dry grass grows round the mat. Nothing else stands in it: no house, no
 * trees, nothing set out. The board has the open yard, the hills and the sky to itself.
 * These parts load textures, so they mount inside the scene's Suspense boundary; the light, the
 * sky and the air are in `Daylight`.
 */
export function Yard() {
  return (
    <>
      <Ground />
      <Mat />
      <Grass />
    </>
  );
}
