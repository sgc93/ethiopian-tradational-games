export interface CartoucheProps {
  text: string;
  /** Round pips under the text: `total` diamonds, `done` filled, the `now`-th lit. */
  pips?: { total: number; done: number; now: number };
}

/** The round cartouche at the top centre (spec §9 "Cartouche"). */
export function Cartouche({ text, pips }: CartoucheProps) {
  return (
    <div className="cart">
      <div className="t">{text}</div>
      {pips && (
        <div className="pips" aria-hidden="true">
          {Array.from({ length: pips.total }, (_, i) => (
            <i key={i} className={i < pips.done ? 'done' : i === pips.now - 1 ? 'now' : ''} />
          ))}
        </div>
      )}
    </div>
  );
}
