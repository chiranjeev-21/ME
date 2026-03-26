import { cn } from '@/utils/cn';
import { HERO_BADGES } from '@/constants';
import type { HeroBadge } from '@/types';
import styles from './Hero.module.css';

const positionStyles: Record<HeroBadge['position'], string> = {
  topLeft: styles.badgeTopLeft,
  right: styles.badgeRight,
  bottomLeft: styles.badgeBottomLeft,
};

const iconStyles: Record<HeroBadge['iconVariant'], string> = {
  gold: styles.iconGold,
  purple: styles.iconPurple,
  pink: styles.iconPink,
};

const delayStyles = ['', styles.delay1, styles.delay2];

export function HeroPortrait() {
  return (
    <div className={styles.portraitCol}>
      {HERO_BADGES.map((badge, i) => (
        <div
          key={badge.id}
          className={cn(styles.badge, positionStyles[badge.position], delayStyles[i])}
        >
          <div className={cn(styles.badgeIcon, iconStyles[badge.iconVariant])}>{badge.icon}</div>
          <div>
            <div className={styles.badgeTitle}>{badge.title}</div>
            <div className={styles.badgeSub}>{badge.subtitle}</div>
          </div>
        </div>
      ))}

      <div className={styles.frame}>
        <div className={styles.frameInner}>
          <img
            className={styles.photo}
            src="/images/photo.jpeg"
            alt="Chiranjeev Singh"
            width={390}
            height={500}
          />
        </div>
      </div>
    </div>
  );
}
