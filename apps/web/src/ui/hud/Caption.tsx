import type { ReactNode } from 'react';

export interface CaptionProps {
  /** Ember for the player's own turn, moon for the other side's. */
  tone: 'ember' | 'moon';
  text: ReactNode;
  /** Three pulsing diamonds after the text while the computer thinks or sows. */
  thinking?: boolean;
  /** Changes when the turn does: the line then comes in afresh, with a motion. */
  motionKey?: string;
}

/** The one line under the cartouche that says whose turn it is (spec §9 "Caption"). */
export function Caption({ tone, text, thinking, motionKey }: CaptionProps) {
  return (
    <p className={`hud-caption${tone === 'moon' ? ' cool' : ''}`} aria-live="polite">
      <span className="caption-line" key={motionKey}>
        {text}
        {thinking && (
          <span className="dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
      </span>
    </p>
  );
}
