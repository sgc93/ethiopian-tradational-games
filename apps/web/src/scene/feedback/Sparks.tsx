import { holeCenter } from '../layout';
import { Burst } from './Burst';

/** About 20 gold sparks rise 1.2 from a captured cup over 0.8 s (spec §7). */
export function Sparks() {
  return (
    <Burst
      event="captured"
      origin={(e) => {
        const [x, , z] = holeCenter(e.kind === 'captured' ? e.hole : 0);
        return [x, 0.05, z];
      }}
      count={[18, 24]}
      life={0.8}
      up={[1.2, 2.0]}
      out={0.7}
      gravity={-0.8}
      size={[2.5, 4.5]}
      color="#ffd27a"
      brightness={2.2}
      additive
    />
  );
}
