import { useCursor } from '@/hooks/useCursor';
import styles from './Cursor.module.css';

/**
 * Two-part custom cursor rendered as fixed overlays.
 * Hidden on touch devices via CSS.
 */
export function Cursor() {
  const { dotRef, ringRef } = useCursor();

  return (
    <>
      <div ref={dotRef} className={styles.dot} aria-hidden="true" />
      <div ref={ringRef} className={styles.ring} aria-hidden="true" />
    </>
  );
}
