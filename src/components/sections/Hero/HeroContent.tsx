import { Button, SkillPill } from '@/components/ui';
import { HERO_SKILLS } from '@/constants';
import styles from './Hero.module.css';

export function HeroContent() {
  return (
    <div className={styles.content}>
      <div className={styles.statusTag} aria-label="Availability status">
        <span className={styles.statusDot} />
        Open to Opportunities
      </div>

      <h1 className={styles.heading}>
        Software Engineer
        <br />
        <span className={styles.headingGrad}>&amp; AI Specialist.</span>
      </h1>

      <p className={styles.description}>
        Building <strong>production-grade AI systems</strong> at the intersection of LLMs, agentic
        workflows, and scalable backend engineering. Currently SDE at{' '}
        <strong>Amazon JWO Tech</strong>, Bengaluru.
      </p>

      <div className={styles.ctaRow}>
        <Button variant="primary" href="#work">
          View Experience
        </Button>
        <Button variant="ghost" href="#cta">
          Get in touch <span className={styles.arrowCircle}>→</span>
        </Button>
      </div>

      <div className={styles.skills}>
        {HERO_SKILLS.map(skill => (
          <SkillPill key={skill.label} label={skill.label} hot={skill.hot} />
        ))}
      </div>
    </div>
  );
}
