import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Button, SectionLabel } from '@/components/ui';
import { SOCIAL_LINKS, EMAIL } from '@/constants';
import styles from './CTA.module.css';

export function CTA() {
  const textRef = useScrollReveal<HTMLDivElement>();
  const actionsRef = useScrollReveal<HTMLDivElement>();

  return (
    <section id="cta" className={styles.section}>
      <div className={styles.inner}>
        <div ref={textRef} className="reveal">
          <SectionLabel style={{ marginBottom: '14px' }}>Get in Touch</SectionLabel>
          <h2 className={styles.heading}>
            Let&apos;s build
            <br />
            <span className={styles.accent}>something intelligent.</span>
          </h2>
          <p className={styles.description}>
            Whether it&apos;s an AI system, a backend architecture, or something that doesn&apos;t
            exist yet — I&apos;d love to talk about it.
          </p>
        </div>

        <div ref={actionsRef} className="reveal reveal-delay-2">
          <Button variant="cta" href={`mailto:${EMAIL}`} className={styles.emailBtn}>
            Say Hello →
          </Button>

          <div className={styles.social}>
            {SOCIAL_LINKS.map(link => (
              <Button
                key={link.label}
                variant="social"
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {link.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
