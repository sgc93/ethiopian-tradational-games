import { ICONS, type IconName } from './icons';

export interface IconProps {
  name: IconName;
  /** In reference px; scaled by the interface. Default 18. */
  size?: number;
  className?: string;
}

/** A gold line icon; decorative, so its button or label carries the name. */
export function Icon({ name, size = 18, className }: IconProps) {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      viewBox="0 0 24 24"
      style={{ width: `calc(${size}px * var(--ui))`, height: `calc(${size}px * var(--ui))` }}
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}
