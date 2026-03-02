import { useScrollReveal } from '@/hooks/useScrollReveal';
import { cn } from '@/utils/cn';
import type { ProjectItem } from '@/types';
import styles from './Experience.module.css';

interface ProjectCardProps {
  item: ProjectItem;
  index: number;
}

export function ProjectCard({ item, index }: ProjectCardProps) {
  const ref = useScrollReveal<HTMLDivElement>();
  const delayClass = index > 0 ? `reveal-delay-${Math.min(index, 4)}` : '';

  const Wrapper = item.href ? 'a' : 'div';
  const wrapperProps = item.href
    ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <Wrapper
      ref={ref as React.RefObject<HTMLDivElement & HTMLAnchorElement>}
      className={cn(
        'reveal',
        delayClass,
        styles.projectCard,
        item.featured && styles.projectFeatured
      )}
      {...wrapperProps}
    >
      {/* Visual */}
      <div className={cn(styles.visual, styles[`grad_${item.gradientVariant}`])}>
        <div className={styles.visualBlob} />
        <span className={styles.projectTag}>{item.tag}</span>
        <div className={styles.arrow}>↗</div>
      </div>

      {/* Body */}
      <div className={styles.projectBody}>
        <div className={styles.projectTitle}>{item.title}</div>
        <div className={styles.projectDesc}>{item.description}</div>
      </div>
    </Wrapper>
  );
}
