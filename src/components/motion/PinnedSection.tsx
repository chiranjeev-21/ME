import { useRef } from 'react';
import type { ReactNode } from 'react';
import { MEDIA, gsap } from '../../lib/gsap.ts';
import { useQueuedGSAP } from '../../lib/motionQueue.ts';
import styles from './PinnedSection.module.css';

interface PinnedSectionProps {
  id?: string;
  className?: string;
  stageClassName?: string;
  children: ReactNode;
  /** Extra scroll distance while the stage is held, in viewport heights. */
  length?: number;
  /** Builds the scrubbed choreography; only runs when motion is allowed. */
  choreograph?: (timeline: gsap.core.Timeline, stage: HTMLElement) => void;
  /** Seconds of smoothing applied to the scrub. */
  smoothing?: number;
  /** Additional media condition (e.g. wide screens only). */
  media?: string;
  labelledBy?: string;
  dataAttributes?: Record<string, string>;
}

/**
 * Holds a full-viewport stage in place with CSS sticky positioning while a
 * scroll-scrubbed timeline plays. Without motion the stage is ordinary flow.
 */
export function PinnedSection({
  id,
  className,
  stageClassName,
  children,
  length = 1,
  choreograph,
  smoothing = 0.8,
  media,
  labelledBy,
  dataAttributes,
}: PinnedSectionProps) {
  const ref = useRef<HTMLElement>(null);

  useQueuedGSAP(
    () => {
      const root = ref.current;
      const stage = root?.querySelector<HTMLElement>('[data-stage]');
      if (!root || !stage) return;
      const mm = gsap.matchMedia();
      mm.add(media ? `${MEDIA.motion} and ${media}` : MEDIA.motion, () => {
        root.dataset.pinned = 'true';
        const timeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: 'bottom bottom',
            scrub: smoothing,
            invalidateOnRefresh: true,
          },
        });
        choreograph?.(timeline, stage);
        return () => {
          delete root.dataset.pinned;
        };
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <section
      ref={ref}
      id={id}
      className={`${styles.root} ${className ?? ''}`}
      style={{ ['--pin-length' as string]: length }}
      aria-labelledby={labelledBy}
      {...dataAttributes}
    >
      <div className={`${styles.stage} ${stageClassName ?? ''}`} data-stage>
        {children}
      </div>
    </section>
  );
}
