import { useBoardView } from './boardView';

/**
 * The number of stones in each hole, as plain DOM over the canvas. `HoleAnchors` (inside the
 * canvas) moves each label above its hole every frame. It reads the counts itself, so a count
 * changing mid-animation re-renders only these labels, not the 3D scene.
 */
export function CountLabels() {
  const counts = useBoardView((s) => s.counts);
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
