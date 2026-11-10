import { Burst } from './Burst';

/**
 * The result: gold dust thrown up from the middle of the board, falling back over two seconds.
 * It answers the `burst` event the result screen sends when it opens.
 */
export function Celebration() {
  return (
    <Burst
      event="burst"
      origin={() => [0, 0.2, 0]}
      radius={2.6}
      spread={0.35}
      count={[80, 100]}
      life={2}
      up={[3, 5.5]}
      out={2.4}
      gravity={-4.2}
      size={[3, 6.5]}
      color="#ffd98a"
      brightness={2.2}
      alpha={0.9}
      additive
      capacity={220}
    />
  );
}
