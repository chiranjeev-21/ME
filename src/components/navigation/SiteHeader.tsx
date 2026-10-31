import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { AppLink } from '../../app/router.tsx';
import { useActiveChapter } from '../../app/chapterStore.ts';
import { CHAPTERS } from '../../data/chapters.ts';
import { ChapterIndex } from './ChapterIndex';
import styles from './SiteHeader.module.css';

export function SiteHeader({ showChapter = true }: { showChapter?: boolean }) {
  const [open, setOpen] = useState(false);
  const active = useActiveChapter();
  const chapter = CHAPTERS.find(item => item.id === active)!;
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const main = document.getElementById('main');
    if (!main) return;
    if (open) main.setAttribute('inert', '');
    else main.removeAttribute('inert');
    document.documentElement.classList.toggle('is-locked', open);
    return () => {
      main.removeAttribute('inert');
      document.documentElement.classList.remove('is-locked');
    };
  }, [open]);

  return (
    <>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <header className={styles.header}>
        <AppLink
          href="/"
          className={styles.brand}
          aria-label="Chiranjeev Singh — back to the opening"
        >
          <span className={styles.monogram} aria-hidden="true">
            CJ
          </span>
          <span className={styles.name}>Chiranjeev Singh</span>
        </AppLink>
        {showChapter && (
          <p className={styles.chapter} aria-hidden="true">
            <span key={chapter.id} className={styles.chapterText}>
              <span className={styles.chapterNumber}>{chapter.number}</span>
              {chapter.title}
            </span>
          </p>
        )}
        <button
          ref={buttonRef}
          type="button"
          className={styles.menuButton}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span>Index</span>
          <span className={styles.menuGlyph} aria-hidden="true">
            <i />
            <i />
          </span>
        </button>
        <span className={styles.progress} aria-hidden="true">
          <span id="reading-progress" />
        </span>
      </header>
      <AnimatePresence>
        {open && (
          <ChapterIndex
            active={active}
            onClose={() => {
              setOpen(false);
              requestAnimationFrame(() => buttonRef.current?.focus());
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
