import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import * as m from 'motion/react-m';
import { AppLink } from '../../app/router.tsx';
import { CHAPTERS } from '../../data/chapters.ts';
import type { ChapterId } from '../../data/chapters.ts';
import { PROFILE } from '../../data/content.ts';
import { ExternalLink } from '../ui/ExternalLink';
import { Icon } from '../ui/Icon';
import styles from './ChapterIndex.module.css';

const EASE = [0.76, 0, 0.24, 1] as const;
const REVEAL = [0.16, 1, 0.3, 1] as const;
const COUNT = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const chapterCount = COUNT[CHAPTERS.length] ?? String(CHAPTERS.length);

export function ChapterIndex({ active, onClose }: { active: ChapterId; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !ref.current) return;
    const focusable = Array.from(
      ref.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <m.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Chapter index"
      className={styles.overlay}
      onKeyDown={onKeyDown}
      initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      animate={{ clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 0.9, ease: EASE } }}
      exit={{ clipPath: 'inset(100% 0% 0% 0%)', transition: { duration: 0.7, ease: EASE } }}
    >
      <div className={styles.top}>
        <span className="u-label">Index — {chapterCount} chapters</span>
        <button type="button" className={styles.close} onClick={onClose} data-autofocus>
          Close <Icon name="close" />
        </button>
      </div>
      <nav aria-label="Chapters">
        <ol className={styles.list}>
          {CHAPTERS.map((chapter, index) => (
            <m.li
              key={chapter.id}
              initial={{ y: 60, opacity: 0 }}
              animate={{
                y: 0,
                opacity: 1,
                transition: { delay: 0.28 + index * 0.055, duration: 1, ease: REVEAL },
              }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              <AppLink
                href={chapter.id === 'opening' ? '/' : `/#${chapter.id}`}
                className={styles.item}
                aria-current={chapter.id === active ? 'location' : undefined}
                onNavigate={onClose}
              >
                <span className={styles.number}>{chapter.number}</span>
                <span className={styles.title}>{chapter.title}</span>
                <span className={styles.caption}>{chapter.caption}</span>
              </AppLink>
            </m.li>
          ))}
        </ol>
      </nav>
      <m.div
        className={styles.footer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.7, duration: 0.8 } }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
      >
        <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
        {PROFILE.socials.map(social => (
          <ExternalLink key={social.label} href={social.href}>
            {social.label}
          </ExternalLink>
        ))}
        <a href={PROFILE.resume} download>
          Résumé (PDF)
        </a>
      </m.div>
    </m.div>
  );
}
