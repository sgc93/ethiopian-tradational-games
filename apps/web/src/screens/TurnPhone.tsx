import { useTranslation } from 'react-i18next';
import { Emblem } from '../ui/kit/Emblem';
import { Icon } from '../ui/kit/Icon';
import './TurnPhone.css';

/**
 * Shown whenever the screen is taller than it is wide (spec §9 "Turn your phone"): the emblem, a
 * phone rocking towards landscape, the title and the line, with the title repeated in the other
 * language. The game is paused and the scene stops drawing behind it.
 */
export function TurnPhone() {
  const { t, i18n } = useTranslation();
  const other = i18n.language === 'am' ? 'en' : 'am';
  return (
    <div className="turn-phone" role="status">
      <Emblem size={72} />
      <Icon name="phone" size={54} className="turn-phone-icon" />
      <p className="turn-phone-title">{t('turn.title')}</p>
      <p className="turn-phone-body">{t('turn.body')}</p>
      <p className="turn-phone-other" lang={other}>
        {t('turn.title', { lng: other })}
      </p>
    </div>
  );
}
