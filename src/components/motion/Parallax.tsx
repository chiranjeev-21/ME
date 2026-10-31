import { useRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import { MEDIA, gsap } from '../../lib/gsap.ts';
import { useQueuedGSAP } from '../../lib/motionQueue.ts';

interface ParallaxProps {
  as?: ElementType;
  children?: ReactNode;
  className?: string;
  /**
   * Travel relative to the page while the element crosses the viewport, in
   * viewport heights. Positive values lag behind the scroll (a distant layer);
   * negative values lead it (a foreground layer).
   */
  depth?: number;
  /** Horizontal drift, in viewport widths, for lateral layers. */
  drift?: number;
  /** Decorative layers are hidden from assistive technology. */
  decorative?: boolean;
}

export function Parallax({
  as: Tag = 'div',
  children,
  className,
  depth = 0.15,
  drift = 0,
  decorative = false,
}: ParallaxProps) {
  const ref = useRef<HTMLElement>(null);

  useQueuedGSAP(
    () => {
      const element = ref.current;
      if (!element) return;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        gsap.fromTo(
          element,
          {
            y: () => -depth * window.innerHeight * 0.5,
            x: () => -drift * window.innerWidth * 0.5,
          },
          {
            y: () => depth * window.innerHeight * 0.5,
            x: () => drift * window.innerWidth * 0.5,
            ease: 'none',
            scrollTrigger: {
              trigger: element,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true,
            },
          }
        );
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className} aria-hidden={decorative || undefined}>
      {children}
    </Tag>
  );
}
