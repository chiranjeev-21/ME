import { useRef } from 'react';
import { HorizontalScroll } from '../../components/motion/HorizontalScroll';
import { SplitReveal } from '../../components/motion/SplitReveal';
import { ChapterMark } from '../../components/ui/ChapterMark';
import { RichText } from '../../components/ui/RichText';
import { AppLink } from '../../app/router.tsx';
import { CAREER } from '../../data/content.ts';
import { themeAttributes } from '../../data/themes.ts';
import { gsap } from '../../lib/gsap.ts';
import type { ExperienceItem } from '../../data/types.ts';
import styles from './Journey.module.css';

/** Tonal light per chapter of the career — atmosphere, not brand colours. */
const LIGHT: Record<string, { tint: string; year: string }> = {
  'oyo-intern': { tint: '#c7a37f', year: '2024' },
  'oyo-sde1': { tint: '#cf7f61', year: '2024' },
  'amazon-jwo': { tint: '#d9a35e', year: '2025' },
  'microsoft-azure': { tint: '#8fb5d6', year: '2026' },
};

function Panel({ job, index, total }: { job: ExperienceItem; index: number; total: number }) {
  const light = LIGHT[job.id] ?? { tint: '#9cc0de', year: job.period.slice(3, 7) };
  return (
    <article
      className={styles.panel}
      style={{ ['--tint' as string]: light.tint }}
      aria-labelledby={`job-${job.id}`}
      data-panel
    >
      <div className={styles.glow} aria-hidden="true" />
      <span className={styles.year} aria-hidden="true" data-year>
        {light.year}
      </span>
      <header className={styles.panelHead} data-head>
        <p className={`u-label ${styles.count}`}>
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </p>
        <h3 id={`job-${job.id}`} className={styles.company}>
          {job.company}
        </h3>
        <p className={styles.role}>{job.role}</p>
        <p className={`u-label ${styles.meta}`}>
          <span>{job.period}</span>
          <span>{job.location}</span>
        </p>
      </header>
      <div className={styles.body} data-body>
        <ul className={styles.highlights}>
          {job.highlights.map(item => (
            <li key={item}>
              <RichText text={item} />
            </li>
          ))}
        </ul>
        <ul className={styles.tags} aria-label="Technologies">
          {job.tags.map(tag => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function Journey() {
  const jobs = [...CAREER].reverse();
  const railRef = useRef<HTMLDivElement>(null);

  const build = (tween: gsap.core.Tween, track: HTMLElement, section: HTMLElement) => {
    const panels = gsap.utils.toArray<HTMLElement>('[data-panel]', track);
    panels.forEach(panel => {
      const year = panel.querySelector('[data-year]');
      const head = panel.querySelectorAll('[data-head] > *');
      const body = panel.querySelector('[data-body]');
      gsap.fromTo(
        year,
        { xPercent: 28 },
        {
          xPercent: -28,
          ease: 'none',
          scrollTrigger: {
            trigger: panel,
            containerAnimation: tween,
            start: 'left right',
            end: 'right left',
            scrub: true,
          },
        }
      );
      gsap.from([...head, body], {
        x: 90,
        autoAlpha: 0,
        duration: 1.3,
        ease: 'reveal',
        stagger: 0.07,
        scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left 78%' },
      });
    });
    const marker = railRef.current?.querySelector('[data-marker]');
    if (marker)
      gsap.fromTo(
        marker,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
          },
        }
      );
  };

  return (
    <section
      id="journey"
      className={styles.journey}
      aria-labelledby="journey-title"
      {...themeAttributes('journey')}
      data-seam-start="top 92%"
      data-seam-end="top 52%"
    >
      <HorizontalScroll
        trackClassName={styles.track}
        onBuild={build}
        label="Career timeline"
        overlay={
          <div ref={railRef} className={styles.rail} aria-hidden="true">
            <span className="u-label">01/2024</span>
            <span className={styles.railTrack}>
              <span data-marker />
            </span>
            <span className="u-label">Present</span>
          </div>
        }
      >
        <div className={styles.intro}>
          <ChapterMark chapter="journey" />
          <SplitReveal as="h2" id="journey-title" className={styles.title}>
            Where I’ve been <em>building.</em>
          </SplitReveal>
          <p className={styles.lede}>Three companies. Four roles. Oldest first.</p>
          <p className={`u-label ${styles.hint}`} aria-hidden="true">
            Keep scrolling <span>→</span>
          </p>
        </div>
        {jobs.map((job, index) => (
          <Panel key={job.id} job={job} index={index} total={jobs.length} />
        ))}
        <div className={styles.outro}>
          <p className="u-label">Present</p>
          <p className={styles.outroLine}>
            Now designing for the <em>unhappy path</em> — at storage scale.
          </p>
          <AppLink href="/#work" className="u-link">
            Continue to the work <span aria-hidden="true">↓</span>
          </AppLink>
        </div>
      </HorizontalScroll>
    </section>
  );
}
