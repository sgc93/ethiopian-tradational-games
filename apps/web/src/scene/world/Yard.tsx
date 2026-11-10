import { Grass } from './Grass';
import { Ground } from './Ground';
import { Hut } from './Hut';
import { Mat } from './Mat';
import { Props } from './Props';
import { Trees } from './Trees';

/**
 * The place the game is played: a highland homestead's yard. The board lies on a woven mat on
 * packed earth; dry grass grows round the mat; the coffee things, a stool and a basket are set
 * out behind it; the round house stands across the yard, and acacia and eucalyptus beyond.
 * These parts load textures, so they mount inside the scene's Suspense boundary; the light, the
 * sky and the air are in `Daylight`.
 */
export function Yard() {
  return (
    <>
      <Ground />
      <Mat />
      <Grass />
      <Props />
      <Hut />
      <Trees />
    </>
  );
}
