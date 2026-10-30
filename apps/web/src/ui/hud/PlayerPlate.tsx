import type { Player } from '@etg/gebeta-rules';
import { Icon } from '../kit';

export interface PlayerPlateProps {
  player: Player;
  name: string;
  stones: number;
  /** Homes (ቤት), shown in a full match only. */
  homes?: number;
  active: boolean;
  /** Near is the seat the camera sits behind (bottom left); far is the other (top left). */
  side: 'near' | 'far';
}

/**
 * A player's plate (spec §9 "Player plate"): avatar, name, stones and homes. The near player's
 * accent is ember and the far player's moon; the active one gets the ember border, the glow and
 * the diamond marker at its right edge.
 */
export function PlayerPlate({ player, name, stones, homes, active, side }: PlayerPlateProps) {
  const classes = ['plate', side === 'near' ? 'a' : 'b', side, active ? 'active' : null].filter(Boolean).join(' ');
  return (
    <div className={classes} data-player={player}>
      <div className="av">
        <Icon name={side === 'near' ? 'ibex' : 'knot'} size={20} />
      </div>
      <div className="plate-text">
        <div className="nm" title={name}>
          {name}
        </div>
        <div className="st">
          <span>
            <Icon name="pebble" size={12} />
            <b data-testid={`stones-${player}`}>{stones}</b>
          </span>
          {homes !== undefined && (
            <span>
              <Icon name="hut" size={12} />
              <b data-testid={`homes-${player}`}>{homes}</b>
            </span>
          )}
        </div>
      </div>
      {active && <i className="turn" aria-hidden="true" />}
    </div>
  );
}
