import { useEffect, useRef, useState } from 'react';
import { AppLink } from '../../app/router.tsx';
import { Magnetic } from '../../components/motion/Magnetic';
import { SplitReveal } from '../../components/motion/SplitReveal';
import { ChapterMark } from '../../components/ui/ChapterMark';
import { ExternalLink } from '../../components/ui/ExternalLink';
import { Icon } from '../../components/ui/Icon';
import { PROFILE } from '../../data/content.ts';
import { themeAttributes } from '../../data/themes.ts';
import { MEDIA, ScrollTrigger, gsap } from '../../lib/gsap.ts';
import { useQueuedGSAP } from '../../lib/motionQueue.ts';
import { OrbitalScene } from '../../scenes/orbital/OrbitalScene';
import styles from './Contact.module.css';

const POSTER = {
  wide: '/images/orbit/eclipse-wide.webp',
  tall: '/images/orbit/eclipse-tall.webp',
};

export function Contact() {
  const ref = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [copy, setCopy] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useQueuedGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        ScrollTrigger.create({
          trigger: root,
          start: 'top bottom',
          end: 'bottom bottom',
          onUpdate: self => (progress.current = self.progress),
        });
        gsap.from(root.querySelectorAll('[data-rise]'), {
          y: 40,
          autoAlpha: 0,
          duration: 1.2,
          stagger: 0.1,
          scrollTrigger: { trigger: root, start: 'top 35%', once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  const copyEmail = async () => {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopy('copied');
      timer.current = window.setTimeout(() => setCopy('idle'), 4000);
    } catch {
      setCopy('failed');
    }
  };

  const github = PROFILE.socials.find(social => social.label === 'GitHub');
  const linkedin = PROFILE.socials.find(social => social.label === 'LinkedIn');

  return (
    <section
      ref={ref}
      id="contact"
      className={styles.contact}
      aria-labelledby="contact-title"
      {...themeAttributes('contact')}
    >
      <div className={styles.stage}>
        <OrbitalScene preset="eclipse" progress={progress} poster={POSTER} />
        <div className={styles.veil} aria-hidden="true" />
        <div className={styles.content}>
          <ChapterMark chapter="contact" />
          <SplitReveal as="h2" id="contact-title" className={styles.title} start="top 70%">
            A good conversation
            <br />
            starts with <em>hello.</em>
          </SplitReveal>
          <p className={styles.lede} data-rise>
            About a system. An interface. Or something worth building.
          </p>

          <div className={styles.email} data-rise>
            <Magnetic>
              <a className={styles.emailLink} href={`mailto:${PROFILE.email}`}>
                {PROFILE.email}
                <Icon name="arrow-up-right" />
              </a>
            </Magnetic>
            <div className={styles.copyRow}>
              <button type="button" onClick={() => void copyEmail()} className={styles.copy}>
                <Icon name={copy === 'copied' ? 'check' : 'copy'} />
                {copy === 'copied' ? 'Copied' : 'Copy address'}
              </button>
              <span role="status" aria-live="polite" className={styles.copyStatus}>
                {copy === 'copied'
                  ? 'Copied to your clipboard.'
                  : copy === 'failed'
                    ? 'Copy was blocked — select the address above instead.'
                    : 'Opens your mail app. Nothing is sent by this site.'}
              </span>
            </div>
          </div>

          <ul className={styles.links} data-rise>
            {github && (
              <li>
                <ExternalLink href={github.href} className={styles.link}>
                  <span className="u-label">GitHub</span>
                  <span className={styles.linkText}>Source, repositories, experiments</span>
                  <Icon name="arrow-up-right" />
                </ExternalLink>
              </li>
            )}
            {linkedin && (
              <li>
                <ExternalLink href={linkedin.href} className={styles.link}>
                  <span className="u-label">LinkedIn</span>
                  <span className={styles.linkText}>Professional context</span>
                  <Icon name="arrow-up-right" />
                </ExternalLink>
              </li>
            )}
            <li>
              <a href={PROFILE.resume} download className={styles.link}>
                <span className="u-label">Résumé</span>
                <span className={styles.linkText}>The original PDF</span>
                <Icon name="arrow-down" />
              </a>
            </li>
          </ul>
        </div>
        <footer className={styles.footer}>
          <span>© {new Date().getFullYear()} Chiranjeev Singh</span>
          <span className={styles.footerNote}>
            Earth imagery: NASA Blue Marble &amp; Black Marble ·{' '}
            <a href="/assets/CREDITS.txt" className="u-link">
              credits
            </a>
          </span>
          <AppLink href="/" className={styles.top}>
            Back to orbit <Icon name="arrow-up-right" style={{ transform: 'rotate(-45deg)' }} />
          </AppLink>
        </footer>
      </div>
    </section>
  );
}
