import { useRef } from 'react';
import { MEDIA, gsap } from '../../lib/gsap.ts';
import { useQueuedGSAP } from '../../lib/motionQueue.ts';
import styles from './ImageReveal.module.css';

interface ImageRevealProps {
  src: string;
  srcSmall?: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  className?: string;
  /** Which edge the mask opens from. */
  from?: 'bottom' | 'top' | 'left' | 'right';
  /** Inner image drift while scrolling past (0 disables). */
  drift?: number;
  priority?: boolean;
  caption?: string;
}

const INSET = {
  bottom: 'inset(100% 0% 0% 0%)',
  top: 'inset(0% 0% 100% 0%)',
  left: 'inset(0% 100% 0% 0%)',
  right: 'inset(0% 0% 0% 100%)',
};

/**
 * A photograph uncovered by a moving mask while the image settles from a slight
 * over-scale — a camera push rather than a fade.
 */
export function ImageReveal({
  src,
  srcSmall,
  alt,
  width,
  height,
  sizes = '100vw',
  className,
  from = 'bottom',
  drift = 0.08,
  priority = false,
  caption,
}: ImageRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useQueuedGSAP(
    () => {
      const figure = ref.current;
      const frame = figure?.querySelector<HTMLElement>('[data-frame]');
      const image = figure?.querySelector<HTMLElement>('img');
      if (!figure || !frame || !image) return;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: figure, start: 'top 85%', once: true },
        });
        tl.fromTo(
          frame,
          { clipPath: INSET[from] },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'cine' }
        ).fromTo(image, { scale: 1.32 }, { scale: 1.08, duration: 2.1, ease: 'reveal' }, 0);
        if (drift)
          gsap.fromTo(
            image,
            { yPercent: -drift * 50 },
            {
              yPercent: drift * 50,
              ease: 'none',
              scrollTrigger: {
                trigger: figure,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            }
          );
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <figure ref={ref} className={`${styles.figure} ${className ?? ''}`}>
      <div className={styles.frame} data-frame>
        <img
          src={src}
          srcSet={srcSmall ? `${srcSmall} ${Math.round(width / 2)}w, ${src} ${width}w` : undefined}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      </div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
