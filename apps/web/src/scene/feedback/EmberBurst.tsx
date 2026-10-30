import { FLAME_BASE } from '../world/embersState';
import { Burst } from './Burst';

/** The result (spec §9, screen 8): 200 extra embers burst up from the fire over a second. */
export function EmberBurst() {
  return (
    <Burst
      event="burst"
      origin={() => [FLAME_BASE[0], FLAME_BASE[1] + 1.5, FLAME_BASE[2]]}
      radius={2.5}
      spread={1}
      count={[200, 200]}
      capacity={256}
      life={3}
      up={[9, 15]}
      out={2.5}
      gravity={0}
      size={[2, 4]}
      color="#ffb060"
      brightness={2}
      additive
    />
  );
}
