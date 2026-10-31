import { useRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import { MEDIA, SplitText, gsap } from '../../lib/gsap.ts';
import { useQueuedGSAP } from '../../lib/motionQueue.ts';
import { whenNear } from './whenNear.ts';

interface ScrubTextProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Opacity of words that have not been read yet. */
  dim?: number;
}

/**
 * Reading-pace text: words brighten in sequence as the passage crosses the
 * viewport, so the scroll position becomes the reading cursor.
 */
export function ScrubText({ as: Tag = 'p', children, className, dim = 0.16 }: ScrubTextProps) {
  const ref = useRef<HTMLElement>(null);

  useQueuedGSAP(
    contextSafe => {
      const element = ref.current;
      if (!element) return;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        let split: SplitText | null = null;
        const build = contextSafe(() => {
          split = SplitText.create(element, { type: 'words', wordsClass: 'scrub-word' });
          gsap.fromTo(
            split.words,
            { opacity: dim },
            {
              opacity: 1,
              ease: 'none',
              stagger: 0.12,
              scrollTrigger: {
                trigger: element,
                start: 'top 80%',
                end: 'bottom 48%',
                scrub: 0.6,
              },
            }
          );
        });
        const stop = whenNear(element, build);
        return () => {
          stop();
          split?.revert();
        };
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
