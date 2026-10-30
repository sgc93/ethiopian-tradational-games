import { holeCenter } from '../layout';
import { Burst } from './Burst';

/** 6–10 dust motes puff up from a cup for 0.4 s as a stone lands, rising about 0.3 (spec §7). */
export function Dust() {
  return (
    <Burst
      event="landed"
      origin={(e) => {
        const [x, , z] = holeCenter(e.kind === 'landed' ? e.hole : 0);
        return [x, 0.02, z];
      }}
      count={[6, 10]}
      life={0.4}
      up={[0.6, 1.1]}
      out={0.5}
      gravity={-1.2}
      size={[3, 5]}
      color="#c9a67a"
      alpha={0.55}
    />
  );
}
