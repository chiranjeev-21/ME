import { useRef } from 'react';
import { useParallax } from '@/hooks/useParallax';
import styles from './Hero.module.css';

interface HeroBlobsProps {
  containerRef: React.RefObject<HTMLElement>;
}

/**
 * Decorative animated blobs that react to mouse movement via parallax.
 * Purely visual — aria-hidden.
 */
export function HeroBlobs({ containerRef }: HeroBlobsProps) {
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);

  useParallax(containerRef, [
    { ref: blob1Ref, factorX: 24, factorY: 18 },
    { ref: blob2Ref, factorX: -14, factorY: -10 },
  ]);

  return (
    <div className={styles.blobLayer} aria-hidden="true">
      <div ref={blob1Ref} className={`${styles.blob} ${styles.blob1}`} />
      <div ref={blob2Ref} className={`${styles.blob} ${styles.blob2}`} />
      <div className={`${styles.blob} ${styles.blob3}`} />
      <div className={`${styles.blob} ${styles.blobGlow}`} />
    </div>
  );
}
