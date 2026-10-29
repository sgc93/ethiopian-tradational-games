import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { Divider } from './Divider';

export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The panel title, set in Cinzel with the divider under it. */
  title?: ReactNode;
  /** The id of the element that names the panel; the title gets it when there is one. */
  labelledBy: string;
  /** Sizes and positions in reference px at 844 × 390; the interface scales them. */
  width: number;
  height?: number;
  x?: number;
  y?: number;
  /** Centred horizontally (and vertically when `y` is not given) instead of anchored at `x`. */
  center?: boolean;
  /** Playing its exit motion. */
  exiting?: boolean;
  children?: ReactNode;
}

const px = (n: number) => `calc(${n}px * var(--ui))`;

/** A framed panel: the panel ground, a line, an inner line and four corner diamonds (spec §9 "Panel"). */
export function Panel({ title, labelledBy, width, height, x, y, center, exiting, className, style, children, ...rest }: PanelProps) {
  const placed = x !== undefined || y !== undefined || center;
  const position: CSSProperties = placed
    ? {
        position: 'absolute',
        left: center ? '50%' : x !== undefined ? px(x) : undefined,
        top: y !== undefined ? px(y) : center ? '50%' : undefined,
        transform: center ? (y !== undefined ? 'translateX(-50%)' : 'translate(-50%, -50%)') : undefined,
      }
    : {};
  const classes = ['panel', exiting ? 'panel-exit' : 'panel-enter', className].filter(Boolean).join(' ');
  return (
    <section
      className={classes}
      aria-labelledby={labelledBy}
      style={{ width: px(width), height: height !== undefined ? px(height) : undefined, ...position, ...style }}
      {...rest}
    >
      <i className="k tl" aria-hidden="true" />
      <i className="k tr" aria-hidden="true" />
      <i className="k bl" aria-hidden="true" />
      <i className="k br" aria-hidden="true" />
      {title !== undefined && (
        <>
          <h2 className="ttl" id={labelledBy}>
            {title}
          </h2>
          <Divider />
        </>
      )}
      {children}
    </section>
  );
}
