import { useScrollReveal } from '@/hooks/useScrollReveal';
import { cn } from '@/utils/cn';
import type { ExperienceItem } from '@/types';
import styles from './Experience.module.css';

interface ExperienceCardProps {
  item: ExperienceItem;
  index: number;
}

export function ExperienceCard({ item, index }: ExperienceCardProps) {
  const ref = useScrollReveal<HTMLDivElement>();
  const delayClass = index > 0 ? `reveal-delay-${Math.min(index, 4)}` : '';

  return (
    <article ref={ref} className={cn('reveal', delayClass, styles.card)}>
      <header className={styles.cardHeader}>
        <div className={styles.companyRow}>
          <div className={cn(styles.logo, styles[`logo_${item.logoVariant}`])}>
            {item.logoInitial}
          </div>
          <div>
            <div className={styles.company}>{item.company}</div>
            <div className={styles.role}>{item.role}</div>
          </div>
        </div>

        <div className={styles.meta}>
          <div className={styles.period}>{item.period}</div>
          {item.location && <div className={styles.location}>{item.location}</div>}
        </div>
      </header>

      <div className={styles.cardBody}>
        <ul className={styles.highlights}>
          {item.highlights.map((h, i) => (
            <li key={i} className={styles.highlight}>
              <p dangerouslySetInnerHTML={{ __html: h }} />
            </li>
          ))}
        </ul>

        <div className={styles.tags}>
          {item.tags.map(tag => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
