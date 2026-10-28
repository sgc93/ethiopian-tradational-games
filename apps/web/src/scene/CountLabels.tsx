/**
 * The number of stones in each hole, as plain DOM over the canvas. `HoleAnchors` (inside the
 * canvas) moves each label above its hole every frame.
 */
export function CountLabels({ counts }: { counts: readonly number[] }) {
  return (
    <div className="count-layer" aria-hidden="true">
      {counts.map((n, hole) => (
        <span key={hole} className="count-badge" data-hole-label={hole}>
          {n}
        </span>
      ))}
    </div>
  );
}
