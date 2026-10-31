import { useRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import { MEDIA, SplitText, gsap } from '../../lib/gsap.ts';
import { useQueuedGSAP } from '../../lib/motionQueue.ts';
import { whenNear } from './whenNear.ts';

type SplitUnit = 'lines' | 'words' | 'chars';

interface SplitRevealProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  id?: string;
  /** Smallest unit that moves; lines are always masked. */
  by?: SplitUnit;
  /** `mount` plays immediately; `scroll` waits until the element enters view. */
  play?: 'mount' | 'scroll';
  start?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
}

/**
 * Masked editorial reveal: each line (or word/char) rises out of its own clip.
 * The split happens just before the element approaches the viewport, after
 * fonts have loaded, and re-splits on resize. Screen readers get the original text.
 */
export function SplitReveal({
  as: Tag = 'div',
  children,
  className,
  id,
  by = 'lines',
  play = 'scroll',
  start = 'top 82%',
  delay = 0,
  stagger,
  duration = 1.25,
}: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useQueuedGSAP(
    contextSafe => {
      const element = ref.current;
      if (!element) return;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        let split: SplitText | null = null;
        // Hidden until split so the first visible frame is already masked.
        element.dataset.splitPending = 'true';
        const build = contextSafe(() => {
          delete element.dataset.splitPending;
          split = SplitText.create(element, {
            type: by === 'lines' ? 'lines' : `lines,${by}`,
            mask: 'lines',
            linesClass: 'split-line',
            autoSplit: true,
            onSplit(self) {
              const targets =
                by === 'chars' ? self.chars : by === 'words' ? self.words : self.lines;
              return gsap.from(targets, {
                yPercent: 118,
                rotate: by === 'lines' ? 0 : 4,
                transformOrigin: '0% 100%',
                duration,
                delay,
                ease: 'reveal',
                stagger: stagger ?? (by === 'chars' ? 0.028 : by === 'words' ? 0.05 : 0.09),
                scrollTrigger:
                  play === 'scroll' ? { trigger: element, start, once: true } : undefined,
              });
            },
          });
        });
        const stop = play === 'mount' ? (build(), () => undefined) : whenNear(element, build);
        return () => {
          stop();
          split?.revert();
          delete element.dataset.splitPending;
        };
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className} id={id}>
      {children}
    </Tag>
  );
}
