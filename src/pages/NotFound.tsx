import { AppLink } from '../app/router.tsx';
import { Icon } from '../components/ui/Icon';
import { Overlay } from './Overlay';
import styles from './ProjectPage.module.css';

export function NotFound({ path }: { path: string }) {
  return (
    <Overlay labelledBy="not-found-title" backLabel="Back to the opening" backHref="/">
      <article className={styles.page}>
        <p className="u-label">404 — off the map</p>
        <h1 id="not-found-title" tabIndex={-1} className={styles.title}>
          Nothing orbits here.
        </h1>
        <p className={styles.summary}>
          <code>{path}</code> isn’t a page in this universe. Every chapter is one scroll away.
        </p>
        <div className={styles.actions}>
          <AppLink href="/" className={styles.primary}>
            Return to the opening <Icon name="arrow-right" />
          </AppLink>
        </div>
      </article>
    </Overlay>
  );
}
