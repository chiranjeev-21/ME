import styles from './SideQuests.module.css';

export function SideQuests() {
  return (
    <section id="side-quests" className={styles.section} aria-label="Side quests">
      <div className={styles.cloudLayer} aria-hidden="true">
        <div className={`${styles.cloud} ${styles.cloud1}`} />
        <div className={`${styles.cloud} ${styles.cloud2}`} />
        <div className={`${styles.cloud} ${styles.cloud3}`} />
        <div className={`${styles.cloud} ${styles.cloud4}`} />
      </div>

      <div className={styles.inner}>
        <div className={styles.badge}>Side Quests</div>
        <h2 className={styles.heading}>
          Hidden projects,
          <br />
          <span className={styles.accent}>coming soon.</span>
        </h2>
        <p className={styles.description}>
          This is where the experimental builds, weekend hacks, and playful repos from my GitHub
          will live. Think mini-games, tooling experiments, and AI side quests that didn&apos;t fit
          in the main portfolio.
        </p>

        <div className={styles.cardRow}>
          <article className={styles.card}>
            <div className={styles.cardGlow} />
            <h3 className={styles.cardTitle}>Quest board</h3>
            <p className={styles.cardText}>
              Soon this will auto-pull featured side quests directly from GitHub — with live
              deploy links, tech stacks, and difficulty tiers.
            </p>
            <span className={styles.cardTag}>GitHub integration · TODO</span>
          </article>

          <article className={styles.cardSecondary}>
            <p className={styles.cardSecondaryLabel}>Status</p>
            <p className={styles.cardSecondaryText}>Matchmaking side quests…</p>
          </article>
        </div>
      </div>
    </section>
  );
}

