import { ChapterMark } from '../../components/ui/ChapterMark';
import { ImageReveal } from '../../components/motion/ImageReveal';
import { Parallax } from '../../components/motion/Parallax';
import { Reveal } from '../../components/motion/Reveal';
import { ScrubText } from '../../components/motion/ScrubText';
import { SplitReveal } from '../../components/motion/SplitReveal';
import { RichText } from '../../components/ui/RichText';
import { CAREER, PROFILE, QUALIFICATIONS, SKILLS } from '../../data/content.ts';
import { themeAttributes } from '../../data/themes.ts';
import styles from './Identity.module.css';

export function Identity() {
  const current = CAREER[0];
  return (
    <section
      id="identity"
      className={styles.identity}
      aria-labelledby="identity-title"
      {...themeAttributes('identity')}
      data-seam-start="top 100%"
      data-seam-end="top 64%"
    >
      <div className={styles.opening}>
        <ChapterMark chapter="identity" />
        <SplitReveal as="h2" id="identity-title" className={styles.statement} by="lines">
          Engineer by trade.
          <br />
          <em>Curious by default.</em>
        </SplitReveal>
      </div>

      <div className={styles.composition}>
        <Parallax className={styles.monogram} depth={0.5} decorative>
          <span>CJ</span>
        </Parallax>
        <Parallax className={styles.portraitWrap} depth={-0.12}>
          <ImageReveal
            className={styles.portrait}
            src={PROFILE.portrait.src}
            srcSmall={PROFILE.portrait.srcSmall}
            width={PROFILE.portrait.width}
            height={PROFILE.portrait.height}
            alt={PROFILE.portrait.alt}
            sizes="(max-width: 899px) 86vw, 36vw"
            caption="Chiranjeev Singh — Bengaluru, India"
          />
        </Parallax>
        <div className={styles.copy}>
          <ScrubText className={styles.lead}>
            I’m Chiranjeev — CJ to most people. An engineer and builder, curious about how things
            hold together. Based in Bengaluru, my work connects distributed computing, storage
            reliability, and AI.
          </ScrubText>
          <Reveal as="dl" className={styles.facts} stagger={0.08}>
            <div>
              <dt className="u-label">Now</dt>
              <dd>
                {current.role.split(' · ')[0]}, {current.company}
                <span> — Azure Direct Drive</span>
              </dd>
            </div>
            <div>
              <dt className="u-label">Before</dt>
              <dd>
                Amazon <span>— JWO Tech</span>
                <br />
                Oyo <span>— SDE 1 &amp; intern</span>
              </dd>
            </div>
            <div>
              <dt className="u-label">Studied</dt>
              <dd>
                B.E. Computer Science, Thapar <span>— 9.30 CGPA</span>
              </dd>
            </div>
            <div>
              <dt className="u-label">Résumé</dt>
              <dd>
                <a className="u-link" href={PROFILE.resume} download>
                  Download the original PDF
                </a>
              </dd>
            </div>
          </Reveal>
        </div>
      </div>

      <div className={styles.facets}>
        <p className="u-sr">Software engineer, builder, experimenter.</p>
        <Parallax className={styles.facetLine} depth={0} drift={-0.32} decorative>
          <span>Software engineer</span>
          <span className={styles.facetDot} />
          <span>
            <em>Builder</em>
          </span>
          <span className={styles.facetDot} />
          <span>Experimenter</span>
        </Parallax>
        <Parallax
          className={`${styles.facetLine} ${styles.facetLineMuted}`}
          depth={0}
          drift={0.24}
          decorative
        >
          <span>
            <em>Systems</em>
          </span>
          <span className={styles.facetDot} />
          <span>Reliability</span>
          <span className={styles.facetDot} />
          <span>
            <em>Applied AI</em>
          </span>
          <span className={styles.facetDot} />
          <span>Things worth making</span>
        </Parallax>
      </div>

      <div className={styles.toolkit}>
        <div>
          <Reveal>
            <p className="u-label">Tools &amp; disciplines</p>
          </Reveal>
          <Reveal as="p" className={styles.skills} delay={0.1}>
            {SKILLS.map((skill, index) => (
              <span key={skill.label} className={skill.hot ? styles.hot : undefined}>
                {skill.label}
                {index < SKILLS.length - 1 && <i aria-hidden="true"> / </i>}
              </span>
            ))}
          </Reveal>
        </div>
        <div>
          <Reveal>
            <p className="u-label">Education &amp; credentials</p>
          </Reveal>
          <Reveal as="ul" className={styles.credentials} stagger={0.08}>
            {QUALIFICATIONS.map(item => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <span>
                  <RichText text={item.subtitle} />
                </span>
              </li>
            ))}
          </Reveal>
        </div>
      </div>

      <div className={styles.decisions}>
        <ScrubText className={styles.decisionLine} dim={0.12}>
          Systems are built from decisions. This universe makes some of mine visible.
        </ScrubText>
      </div>
    </section>
  );
}
