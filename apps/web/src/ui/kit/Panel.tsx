import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The panel title, set in a header band across the top with the board's band under it. */
  title?: ReactNode;
  /** The id of the element that names the panel; the title gets it when there is one. */
  labelledBy: string;
  /** Sizes and positions in reference px at 844 × 390; the interface scales them. */
  width: number;
  height?: number;
  x?: number;
  y?: number;
  /** Anchored to the right edge instead of the left. */
  right?: number;
  /** Anchored this far above the bottom edge instead of at `y`: for panels that leave the board in view above them. */
  bottom?: number;
  /** Centred horizontally (and vertically when neither `y` nor `bottom` is given) instead of anchored at `x`. */
  center?: boolean;
  /** Playing its exit motion. */
  exiting?: boolean;
  children?: ReactNode;
}

const px = (n: number) => `calc(${n}px * var(--ui))`;

/**
 * A framed panel: case leather inside a brass line, with stepped corners. A panel never grows
 * past the screen: whatever does not fit scrolls inside it.
 */
export function Panel({ title, labelledBy, width, height, x, y, right, bottom, center, exiting, className, style, children, ...rest }: PanelProps) {
  const placed = x !== undefined || y !== undefined || right !== undefined || bottom !== undefined || center;
  const middle = center && y === undefined && bottom === undefined;
  const position: CSSProperties = placed
    ? {
        position: 'absolute',
        left: center ? '50%' : x !== undefined ? px(x) : undefined,
        right: right !== undefined ? px(right) : undefined,
        top: y !== undefined ? px(y) : middle ? '50%' : undefined,
        bottom: bottom !== undefined ? `max(${px(bottom)}, calc(var(--safe-b) + 8px))` : undefined,
        transform: center ? (middle ? 'translate(-50%, -50%)' : 'translateX(-50%)') : undefined,
      }
    : {};
  // How much of the screen's height is spoken for above or below the panel, for its height limit.
  const taken = { '--panel-taken': y !== undefined ? px(y) : bottom !== undefined ? px(bottom) : '0px' } as CSSProperties;
  const classes = ['panel', exiting ? 'panel-exit' : 'panel-enter', title !== undefined ? 'panel-titled' : null, className].filter(Boolean).join(' ');
  return (
    <section
      className={classes}
      aria-labelledby={labelledBy}
      style={{ width: px(width), height: height !== undefined ? px(height) : undefined, ...taken, ...position, ...style }}
      {...rest}
    >
      <i className="k tl" aria-hidden="true" />
      <i className="k tr" aria-hidden="true" />
      <i className="k bl" aria-hidden="true" />
      <i className="k br" aria-hidden="true" />
      {title !== undefined && (
        <header className="panel-head">
          <h2 className="ttl" id={labelledBy}>
            {title}
          </h2>
        </header>
      )}
      {children}
    </section>
  );
}
