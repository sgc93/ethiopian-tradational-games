import type { HTMLAttributes, ReactNode } from 'react';

/** A band fading at both ends along the bottom, for the lesson hints; key words go in `<b>` (spec §9 "Ribbon"). */
export function Ribbon({ className, children, ...rest }: HTMLAttributes<HTMLParagraphElement> & { children: ReactNode }) {
  const classes = ['ribbon', className].filter(Boolean).join(' ');
  return (
    <p className={classes} aria-live="polite" {...rest}>
      {children}
    </p>
  );
}
