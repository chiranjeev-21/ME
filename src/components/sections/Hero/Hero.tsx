import { useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { HeroBlobs } from './HeroBlobs';
import { HeroContent } from './HeroContent';
import { HeroPortrait } from './HeroPortrait';
import styles from './Hero.module.css';

/**
 * Hero section — full-viewport intro.
 * Composes: Navbar + animated blobs + left content column + right portrait column.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section id="hero" ref={sectionRef} className={styles.hero}>
      <HeroBlobs containerRef={sectionRef} />

      <Navbar />

      <div className={styles.body}>
        <HeroContent />
        <HeroPortrait />
      </div>

      <div className={styles.scrollHint} aria-hidden="true">
        <div className={styles.scrollLine} />
        <span>scroll</span>
      </div>
    </section>
  );
}
