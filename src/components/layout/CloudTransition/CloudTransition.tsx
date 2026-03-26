import styles from './CloudTransition.module.css';

interface CloudTransitionProps {
  visible: boolean;
}

export function CloudTransition({ visible }: CloudTransitionProps) {
  if (!visible) return null;

  return (
    <div className={styles.overlay} aria-hidden="true">
      <div className={`${styles.cloud} ${styles.cloud1}`} />
      <div className={`${styles.cloud} ${styles.cloud2}`} />
      <div className={`${styles.cloud} ${styles.cloud3}`} />
      <div className={`${styles.cloud} ${styles.cloud4}`} />
    </div>
  );
}

