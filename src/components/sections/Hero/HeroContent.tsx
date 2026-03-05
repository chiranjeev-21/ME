import { Button, SkillPill } from '@/components/ui';
import { HERO_SKILLS } from '@/constants';
import styles from './Hero.module.css';

/**
 * Left column of the Hero section:
 * tag → headline → description → CTA buttons → skill pills
 */
export function HeroContent() {
  return (
    <div className={styles.content}>
      {/* Status tag */}
      <div className={styles.statusTag} aria-label="Availability status">
        <span className={styles.statusDot} />
        Open to Opportunities
      </div>

      {/* Headline */}
      <h1 className={styles.heading}>
        Software Engineer
        <br />
        <span className={styles.headingGrad}>&amp; AI Specialist.</span>
      </h1>

      {/* Description */}
      <p className={styles.description}>
        Building{' '}
        <strong>production-grade AI systems</strong> at the intersection of LLMs, agentic
        workflows, and scalable backend engineering. Currently SDE at{' '}
        <strong>Amazon JWO Tech</strong>, Bengaluru.
      </p>

      {/* CTA row */}
      <div className={styles.ctaRow}>
        <Button variant="primary" href="#work">
          View Experience
        </Button>
        <Button variant="ghost" href="#cta">
          Get in touch{' '}
          <span className={styles.arrowCircle}>→</span>
        </Button>
      </div>

      {/* Skills */}
      <div className={styles.skills}>
        {HERO_SKILLS.map(skill => (
          <SkillPill key={skill.label} label={skill.label} hot={skill.hot} />
        ))}
      </div>
    </div>
  );
}
