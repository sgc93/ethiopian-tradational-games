import { Fragment, type ReactNode } from 'react';

const GEEZ_RUN = /[ሀ-፿ᎀ-᎟ⶀ-⷟]+/g;

/**
 * Text that mixes Latin and Ge’ez, with every Ge’ez run wrapped in `<span lang="am">` so it is
 * set in Noto Serif Ethiopic, never uppercased or letter-spaced (spec §9 "Amharic").
 */
export function Mixed({ text }: { text: string }): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(GEEZ_RUN)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span lang="am" key={m.index}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <Fragment>{parts}</Fragment>;
}
