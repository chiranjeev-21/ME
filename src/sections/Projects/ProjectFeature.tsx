import { useRef } from 'react';
import type { FocusEvent } from 'react';
import { AppLink } from '../../app/router.tsx';
import { PinnedSection } from '../../components/motion/PinnedSection';
import { ExternalLink } from '../../components/ui/ExternalLink';
import { Icon } from '../../components/ui/Icon';
import type { Project } from '../../data/types.ts';
import { ScrollTrigger, gsap } from '../../lib/gsap.ts';
import styles from './ProjectFeature.module.css';

const TINT: Record<string, string> = {
  monitor: '#9fb3c9',
  iris: '#e2b07a',
  surveillance: '#d0574a',
};

const FRAME: Record<string, string> = {
  monitor: 'inset(17% 6% 17% 47% round 3px)',
  iris: 'circle(17% at 72% 52%)',
  surveillance: 'inset(17% 6% 17% 47% round 3px)',
};

const FULL: Record<string, string> = {
  monitor: 'inset(0% 0% 0% 0% round 0px)',
  iris: 'circle(76% at 50% 50%)',
  surveillance: 'inset(0% 0% 0% 0% round 0px)',
};

function Surveillance({ title }: { title: string }) {
  return (
    <div className={styles.cctv} aria-hidden="true">
      <span className={styles.cctvWord}>MASK</span>
      <div className={styles.cctvBox} data-box>
        <i />
        <i />
        <i />
        <i />
        <span className="u-label">detection region</span>
      </div>
      <p className={`u-label ${styles.hud} ${styles.hudTl}`}>CAM 01 — real-time</p>
      <p className={`u-label ${styles.hud} ${styles.hudTr}`}>
        <span className={styles.rec} /> rec
      </p>
      <p className={`u-label ${styles.hud} ${styles.hudBl}`}>{title}</p>
      <p className={`u-label ${styles.hud} ${styles.hudBr}`}>YOLO · computer vision</p>
      <div className={styles.scan} />
    </div>
  );
}

export function ProjectFeature({ project, index }: { project: Project; index: number }) {
  const treatment = project.treatment ?? 'monitor';
  const sectionRef = useRef<HTMLDivElement>(null);
  const artifact = treatment === 'surveillance';

  const choreograph = (tl: gsap.core.Timeline, stage: HTMLElement) => {
    const q = gsap.utils.selector(stage);
    // Staggered targets in a timeline need explicit start states.
    gsap.set(q('[data-detail]'), { y: 70, autoAlpha: 0 });
    // Beat 1 — the title steps aside as the frame opens to full bleed.
    tl.to(q('[data-title]'), { autoAlpha: 0, x: -48, duration: 0.12, ease: 'power1.in' }, 0.02)
      .fromTo(
        q('[data-media]'),
        { clipPath: FRAME[treatment] },
        { clipPath: FULL[treatment], duration: 0.36, ease: 'cine' },
        0.04
      )
      .fromTo(
        q('[data-media-inner]'),
        { scale: 1.3 },
        { scale: 1, duration: 0.5, ease: 'power2.out' },
        0
      )
      // Beat 2 — a clean hold on the work itself, then the light drops.
      .fromTo(
        q('[data-scrim]'),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.12, ease: 'none' },
        0.5
      )
      // Beat 3 — the slate and details rise into the lower half and hold for reading.
      .to(
        q('[data-detail]'),
        { y: 0, autoAlpha: 1, duration: 0.16, stagger: 0.035, ease: 'power2.out' },
        0.55
      )
      .to({}, { duration: 0.28 });
    if (treatment === 'monitor')
      tl.fromTo(
        q('[data-tilt]'),
        { rotateX: 14, rotateY: -16, z: -90 },
        { rotateX: 0, rotateY: 0, z: 0, duration: 0.38, ease: 'cine' },
        0.04
      );
    if (treatment === 'surveillance')
      tl.fromTo(
        q('[data-box]'),
        { left: '58%', top: '30%', width: '18%', height: '34%' },
        {
          left: '52%',
          top: '16%',
          width: '34%',
          height: '38%',
          duration: 0.6,
          ease: 'power1.inOut',
        },
        0
      );
  };

  // Keyboard users tabbing into the details are brought to the point where they are visible.
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const root = sectionRef.current?.querySelector<HTMLElement>('section');
    if (!root?.dataset.pinned || !(event.target as HTMLElement).closest('[data-detail]')) return;
    const trigger = ScrollTrigger.getAll().find(item => item.trigger === root);
    if (trigger && trigger.progress < 0.75)
      window.scrollTo({
        top: trigger.start + (trigger.end - trigger.start) * 0.82,
        behavior: 'auto',
      });
  };

  const titleId = `project-${project.slug}`;
  return (
    <div ref={sectionRef} onFocus={onFocus} style={{ ['--tint' as string]: TINT[treatment] }}>
      <PinnedSection
        className={styles.feature}
        stageClassName={styles.stage}
        length={2.2}
        choreograph={choreograph}
        media="(min-width: 900px) and (min-height: 640px)"
        labelledBy={titleId}
        dataAttributes={{ 'data-treatment': treatment }}
      >
        <div className={styles.media} data-media>
          <div className={styles.tiltSpace}>
            <div className={styles.mediaInner} data-media-inner>
              <div className={styles.tilt} data-tilt>
                {project.image ? (
                  <img
                    src={project.image.src}
                    srcSet={`${project.image.srcSmall} 1200w, ${project.image.src} 2400w`}
                    sizes="100vw"
                    width={project.image.width}
                    height={project.image.height}
                    alt={project.image.alt}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <Surveillance title={project.title} />
                )}
              </div>
            </div>
          </div>
          <div className={styles.scrim} data-scrim aria-hidden="true" />
        </div>

        <div className={styles.titleBlock} data-title>
          <p className="u-label">
            04.{index + 1} — {artifact ? 'Research artifact' : project.categories.join(' · ')}
          </p>
          <h3 id={titleId} className={styles.title}>
            {project.title}
          </h3>
          <p className={styles.summary}>{project.summary}</p>
        </div>

        <div className={styles.details}>
          <div className={styles.slate} data-detail aria-hidden="true">
            <span className="u-label">
              04.{index + 1} — {artifact ? 'Research artifact' : project.categories.join(' · ')}
            </span>
            <span className={styles.slateTitle}>{project.title}</span>
          </div>
          <div className={styles.detailCol} data-detail>
            <p className="u-label">{artifact ? 'What it is' : 'The problem'}</p>
            <p className={styles.detailLead}>{artifact ? project.summary : project.problem}</p>
          </div>
          <div className={styles.detailCol} data-detail>
            <p className="u-label">{artifact ? 'What is documented' : 'Architecture'}</p>
            <ul className={styles.detailList}>
              {(artifact
                ? [...project.outcomes, ...project.tradeoffs]
                : project.architecture.slice(0, 3)
              ).map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className={styles.detailCol} data-detail>
            <p className="u-label">Stack</p>
            <p className={styles.stack}>{project.technologies.join(' · ')}</p>
            <div className={styles.links}>
              <AppLink href={`/projects/${project.slug}`} className={styles.primaryLink}>
                {artifact ? 'Read the dossier' : 'Read the case study'} <Icon name="arrow-right" />
              </AppLink>
              {project.sourceUrl && (
                <ExternalLink href={project.sourceUrl} className="u-link">
                  {artifact ? 'Original artifact' : 'Source on GitHub'}{' '}
                  <Icon name="arrow-up-right" />
                </ExternalLink>
              )}
              {project.demoUrl && (
                <ExternalLink href={project.demoUrl} className="u-link">
                  Live preview <Icon name="arrow-up-right" />
                </ExternalLink>
              )}
            </div>
          </div>
        </div>
      </PinnedSection>
    </div>
  );
}
