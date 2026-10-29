import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonKind = 'primary' | 'secondary' | 'quiet' | 'choice';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `primary` is the one main button of a screen; `choice` is the tall button with a one-line explanation. */
  kind?: ButtonKind;
  /** The italic sub-line under a choice button's label. */
  hint?: ReactNode;
  children: ReactNode;
}

/** A Cinzel button in one of the four kinds (spec §9 "Main button", "Other buttons"). */
export function Button({ kind = 'secondary', hint, className, type = 'button', children, ...rest }: ButtonProps) {
  const classes = ['btn', `btn-${kind}`, className].filter(Boolean).join(' ');
  return (
    <button className={classes} type={type} {...rest}>
      <span className="btn-label">{children}</span>
      {hint !== undefined && <small className="btn-hint">{hint}</small>}
    </button>
  );
}
