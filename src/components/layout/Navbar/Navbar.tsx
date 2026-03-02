import { cn } from '@/utils/cn';
import { NAV_LINKS } from '@/constants';
import styles from './Navbar.module.css';

export function Navbar() {
  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <div className={styles.brand}>
        <span className={styles.name}>Chiranjeev Singh</span>
        <span className={styles.sub}>Software Engineer · AI</span>
      </div>

      <ul className={styles.links} role="list">
        {NAV_LINKS.map(link => (
          <li key={link.label}>
            <a
              href={link.href}
              className={cn(styles.link, link.cta && styles.linkCta)}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
