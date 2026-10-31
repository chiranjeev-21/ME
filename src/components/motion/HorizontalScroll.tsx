import { useRef } from 'react';
import type { FocusEvent, ReactNode } from 'react';
import { MEDIA, ScrollTrigger, gsap } from '../../lib/gsap.ts';
import { useQueuedGSAP } from '../../lib/motionQueue.ts';
import styles from './HorizontalScroll.module.css';

interface HorizontalScrollProps {
  className?: string;
  trackClassName?: string;
  children: ReactNode;
  /** Receives the scrubbed track tween for panel-level `containerAnimation` triggers. */
  onBuild?: (tween: gsap.core.Tween, track: HTMLElement, section: HTMLElement) => void;
  label?: string;
  /** Stationary layer held with the sticky stage (e.g. a progress rail). */
  overlay?: ReactNode;
}

/**
 * Vertical scrolling drives a horizontal track. The stage is held with CSS
 * sticky positioning (no fixed-position pinning, so no layout shift), and the
 * section is sized to the track's overflow. Narrow screens and reduced motion
 * get the same panels as a vertical sequence.
 */
export function HorizontalScroll({
  className,
  trackClassName,
  children,
  onBuild,
  label,
  overlay,
}: HorizontalScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useQueuedGSAP(
    () => {
      const section = ref.current;
      const track = trackRef.current;
      if (!section || !track) return;
      const mm = gsap.matchMedia();
      mm.add(`${MEDIA.motion} and ${MEDIA.wide}`, () => {
        section.dataset.horizontal = 'true';
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const size = () => {
          section.style.height = `${window.innerHeight + distance()}px`;
        };
        size();
        ScrollTrigger.addEventListener('refreshInit', size);
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.9,
            invalidateOnRefresh: true,
          },
        });
        onBuild?.(tween, track, section);
        return () => {
          ScrollTrigger.removeEventListener('refreshInit', size);
          section.style.height = '';
          delete section.dataset.horizontal;
        };
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  // Keyboard focus inside the moving track scrolls the page to where that panel is on screen.
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const section = ref.current;
    const track = trackRef.current;
    if (!section?.dataset.horizontal || !track) return;
    const trigger = ScrollTrigger.getAll().find(item => item.trigger === section);
    if (!trigger) return;
    let panel = event.target as HTMLElement;
    while (panel.parentElement && panel.parentElement !== track) panel = panel.parentElement;
    if (panel.parentElement !== track) return;
    const distance = Math.max(1, track.scrollWidth - window.innerWidth);
    const offset = Math.min(distance, Math.max(0, panel.offsetLeft - window.innerWidth * 0.1));
    window.scrollTo({ top: trigger.start + (offset / distance) * (trigger.end - trigger.start) });
  };

  return (
    <div
      ref={ref}
      className={`${styles.root} ${className ?? ''}`}
      aria-label={label}
      role={label ? 'region' : undefined}
      onFocus={onFocus}
    >
      <div className={styles.stage}>
        <div ref={trackRef} className={`${styles.track} ${trackClassName ?? ''}`} data-track>
          {children}
        </div>
        {overlay}
      </div>
    </div>
  );
}
