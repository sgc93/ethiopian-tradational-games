import type { ButtonHTMLAttributes } from 'react';
import { sfx } from '../../audio/instance';
import { Icon } from './Icon';
import type { IconName } from './icons';

export interface MedallionProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName;
  /** The button's accessible name; the medallion shows only the icon. */
  label: string;
  /** 40 px, or 30 px for the small back medallion inside panels. */
  size?: 40 | 30;
  /** For toggles such as sound: sets `aria-pressed`. */
  pressed?: boolean;
}

/** A round icon button with a double ring (spec §9 "Medallion button"). */
export function Medallion({ icon, label, size = 40, pressed, className, type = 'button', onClick, ...rest }: MedallionProps) {
  const classes = ['medal', size === 30 ? 'medal-small' : null, className].filter(Boolean).join(' ');
  return (
    <button
      className={classes}
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={(e) => {
        sfx.tick();
        onClick?.(e);
      }}
      {...rest}
    >
      <Icon name={icon} size={size === 30 ? 14 : 18} />
    </button>
  );
}
