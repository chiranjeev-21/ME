import { useRef } from 'react';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import { MEDIA, gsap } from '../../lib/gsap.ts';
import { useQueuedGSAP } from '../../lib/motionQueue.ts';

interface RevealProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
  /** `rise`: soft lift; `fade`: opacity only; `clip`: wipes open from below. */
  variant?: 'rise' | 'fade' | 'clip';
  delay?: number;
  start?: string;
  /** Stagger direct children instead of moving the wrapper as one block. */
  stagger?: number;
}

/** One-time entrance for blocks of content. Content stays visible without JS. */
export function Reveal({
  as: Tag = 'div',
  children,
  className,
  style,
  id,
  variant = 'rise',
  delay = 0,
  start = 'top 86%',
  stagger,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useQueuedGSAP(
    () => {
      const element = ref.current;
      if (!element) return;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        const targets = stagger ? Array.from(element.children) : element;
        const from =
          variant === 'clip'
            ? { clipPath: 'inset(100% 0% 0% 0%)', y: 30 }
            : variant === 'fade'
              ? { autoAlpha: 0 }
              : { autoAlpha: 0, y: 36 };
        const to =
          variant === 'clip'
            ? { clipPath: 'inset(0% 0% 0% 0%)', y: 0 }
            : variant === 'fade'
              ? { autoAlpha: 1 }
              : { autoAlpha: 1, y: 0 };
        gsap.fromTo(targets, from, {
          ...to,
          duration: variant === 'clip' ? 1.3 : 1.15,
          delay,
          ease: variant === 'clip' ? 'cine' : 'reveal',
          stagger: stagger ?? 0,
          ...(variant === 'clip' ? { clearProps: 'clipPath' } : {}),
          scrollTrigger: { trigger: element, start, once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className} style={style} id={id}>
      {children}
    </Tag>
  );
}
