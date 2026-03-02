import { useScrollReveal } from '@/hooks/useScrollReveal';
import { SectionLabel } from '@/components/ui';
import { EXPERIENCE, PROJECTS, STATS, EDUCATION } from '@/constants';
import { ExperienceCard } from './ExperienceCard';
import { ProjectCard } from './ProjectCard';
import styles from './Experience.module.css';

/**
 * Work experience + projects + education section.
 * All data sourced from src/constants/index.ts.
 */
export function Experience() {
  const headingRef = useScrollReveal<HTMLDivElement>();
  const statsRef = useScrollReveal<HTMLDivElement>();
  const projectsHeadRef = useScrollReveal<HTMLDivElement>();
  const eduRef = useScrollReveal<HTMLDivElement>();

  return (
    <section id="work" className={styles.section}>
      {/* Decorative orbs */}
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />

      <div className={styles.inner}>

        {/* ── Heading ── */}
        <div ref={headingRef} className="reveal">
          <SectionLabel style={{ marginBottom: '14px' }}>Professional Experience</SectionLabel>
          <h2 className={styles.heading}>
            Where I&apos;ve
            <br />
            <span className={styles.accent}>shipped impact.</span>
          </h2>
          <p className={styles.subtitle}>
            From intelligent systems at Amazon to AI-driven pipelines at Oyo — building things
            that scale and matter.
          </p>
        </div>

        {/* ── Stats ── */}
        <div ref={statsRef} className={cn('reveal', styles.statsRow)}>
          {STATS.map((stat, i) => (
            <div key={stat.label} className={cn(`reveal-delay-${i + 1}`, styles.stat)}>
              <div className={styles.statValue}>
                {stat.value}
                {stat.suffix && <span className={styles.statSuffix}>{stat.suffix}</span>}
              </div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Experience cards ── */}
        <div className={styles.expGrid}>
          {EXPERIENCE.map((item, i) => (
            <ExperienceCard key={item.id} item={item} index={i} />
          ))}
        </div>

        {/* ── Projects heading ── */}
        <div ref={projectsHeadRef} id="projects" className={cn('reveal', styles.projectsHeading)}>
          <SectionLabel style={{ marginBottom: '14px' }}>Highlights</SectionLabel>
          <h2 className={styles.heading}>
            Notable <span className={styles.accent}>builds &amp; research.</span>
          </h2>
        </div>

        {/* ── Project cards ── */}
        <div className={styles.projectsGrid}>
          {PROJECTS.map((item, i) => (
            <ProjectCard key={item.id} item={item} index={i} />
          ))}
        </div>

        {/* ── Education / Certs ── */}
        <div ref={eduRef} className={cn('reveal', styles.eduRow)}>
          {EDUCATION.map(edu => (
            <div key={edu.id} className={styles.eduCard}>
              <div className={styles.eduIcon}>{edu.icon}</div>
              <div>
                <div className={styles.eduTitle}>{edu.title}</div>
                <div
                  className={styles.eduSub}
                  dangerouslySetInnerHTML={{ __html: edu.subtitle }}
                />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

// cn inline helper to avoid importing for a few classnames
function cn(...cs: (string | false | undefined | null)[]) {
  return cs.filter(Boolean).join(' ');
}
