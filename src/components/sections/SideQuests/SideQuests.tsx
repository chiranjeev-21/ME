import styles from './SideQuests.module.css';

interface SideQuestsProps {
  onBack?: () => void;
}

const FEATURED_ARTIFACT = {
  title: 'Real-Time Face-Mask Detection',
  description:
    'YOLO-based system for detecting mask offenders in real-time via camera surveillance. Published with Intellectual Property India, 2022.',
  href: 'https://drive.google.com/drive/u/1/folders/1Kzb7cPkzDbj38a8uRQgOvbUnCQTpJK8Z',
};

const QUEST_TYPES = [
  'Prototypes that are fun, weird, or too early for the main portfolio.',
  'Research-flavored builds with demos, notes, and supporting assets.',
  'Weekend experiments that show process, curiosity, and range.',
];

const NEXT_UNLOCKS = [
  'GitHub-powered side quest gallery',
  'Mini-game and tooling experiments',
  'More hidden artifacts from research work',
];

export function SideQuests({ onBack }: SideQuestsProps) {
  return (
    <section id="side-quests" className={styles.section} aria-label="Hidden vault">
      <div className={styles.cloudLayer} aria-hidden="true">
        <div className={`${styles.cloud} ${styles.cloud1}`} />
        <div className={`${styles.cloud} ${styles.cloud2}`} />
        <div className={`${styles.cloud} ${styles.cloud3}`} />
        <div className={`${styles.cloud} ${styles.cloud4}`} />
      </div>

      <div className={styles.sparkLayer} aria-hidden="true">
        <span className={`${styles.spark} ${styles.spark1}`} />
        <span className={`${styles.spark} ${styles.spark2}`} />
        <span className={`${styles.spark} ${styles.spark3}`} />
        <span className={`${styles.spark} ${styles.spark4}`} />
        <span className={`${styles.spark} ${styles.spark5}`} />
      </div>

      <div className={styles.inner}>
        <div className={styles.topBar}>
          <button type="button" className={styles.backButton} onClick={onBack}>
            <span className={styles.backIcon} aria-hidden="true">
              ←
            </span>
            Return to Portfolio
          </button>
          <div className={styles.topStatus}>Treasure unlocked</div>
        </div>

        <div className={styles.heroGrid}>
          <div className={styles.copyCol}>
            <div className={styles.badge}>Hidden Vault</div>
            <h1 className={styles.heading}>
              Secret experiments,
              <br />
              <span className={styles.accent}>off the main path.</span>
            </h1>
            <p className={styles.description}>
              You&apos;ve uncovered a tucked-away room of playful experiments, research-heavy
              builds, and unexpected ideas. Opened through the treasure chest in the hero, this
              vault holds the side quests hidden beyond the main path.
            </p>
          </div>

          <aside className={styles.vaultPanel}>
            <p className={styles.vaultPanelLabel}>Vault signal</p>
            <div className={styles.vaultMeter}>
              <span className={styles.vaultMeterGlow} />
              <span className={styles.vaultMeterCore} />
            </div>
            <p className={styles.vaultPanelText}>
              One artifact is unlocked right now. More hidden builds can stack here as the secret
              collection grows.
            </p>
          </aside>
        </div>

        <div className={styles.contentGrid}>
          <a
            className={styles.featureCard}
            href={FEATURED_ARTIFACT.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className={styles.featureGlow} />
            <div className={styles.featureTop}>
              <span className={styles.featureBadge}>Unlocked Artifact</span>
              <span className={styles.featureArrow} aria-hidden="true">
                ↗
              </span>
            </div>

            <div className={styles.featureBody}>
              <p className={styles.featureLabel}>Featured Hidden Project</p>
              <h2 className={styles.featureTitle}>{FEATURED_ARTIFACT.title}</h2>
              <p className={styles.featureDescription}>{FEATURED_ARTIFACT.description}</p>
            </div>

            <div className={styles.featureMeta}>
              <span className={styles.metaPill}>Drive Archive</span>
              <span className={styles.metaPill}>Publication</span>
              <span className={styles.metaPill}>Vision</span>
            </div>
          </a>

          <div className={styles.sideColumn}>
            <article className={styles.infoCard}>
              <p className={styles.infoLabel}>What belongs here</p>
              <ul className={styles.infoList}>
                {QUEST_TYPES.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className={styles.infoCardAlt}>
              <p className={styles.infoLabel}>Next unlocks</p>
              <ul className={styles.queueList}>
                {NEXT_UNLOCKS.map(item => (
                  <li key={item} className={styles.queueItem}>
                    <span className={styles.queueDot} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
