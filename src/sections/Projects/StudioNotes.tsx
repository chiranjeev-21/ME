import { useRef } from 'react';
import { AppLink } from '../../app/router.tsx';
import { Reveal } from '../../components/motion/Reveal';
import { SplitReveal } from '../../components/motion/SplitReveal';
import { Icon } from '../../components/ui/Icon';
import type { Note } from '../../data/types.ts';
import { MEDIA, gsap } from '../../lib/gsap.ts';
import { useQueuedGSAP } from '../../lib/motionQueue.ts';
import styles from './StudioNotes.module.css';

export function StudioNotes({ notes, code }: { notes: Note[]; code: string }) {
  const listRef = useRef<HTMLOListElement>(null);

  // Opacity only (not visibility), so the note links stay in the tab order before they rise in.
  useQueuedGSAP(
    () => {
      const list = listRef.current;
      if (!list) return;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        const rows = Array.from(list.children);
        gsap.set(rows, { opacity: 0, y: 40 });
        gsap.to(rows, {
          opacity: 1,
          y: 0,
          duration: 1.15,
          ease: 'reveal',
          stagger: 0.1,
          scrollTrigger: { trigger: list, start: 'top 82%', once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: listRef }
  );

  return (
    <section id="notes" className={styles.studio} aria-labelledby="notes-title">
      <header className={styles.head}>
        <p className={`u-label ${styles.code}`}>{code} — Studio notes</p>
        <SplitReveal as="h3" id="notes-title" className={styles.title}>
          Studio <em>notes.</em>
        </SplitReveal>
        <Reveal as="p" className={styles.lede} delay={0.12}>
          Implementation notes on decisions, trade-offs and failure paths.
        </Reveal>
      </header>
      <ol ref={listRef} className={styles.notes}>
        {notes.map((note, index) => (
          <li key={note.slug}>
            <AppLink href={`/writing/${note.slug}`} className={styles.note}>
              <span className="u-label">N° {String(index + 1).padStart(2, '0')}</span>
              <span className={styles.noteTitle}>{note.title}</span>
              <span className={styles.noteSummary}>{note.summary}</span>
              {note.tags.length > 0 && (
                <span className={styles.noteTags}>{note.tags.join(' · ')}</span>
              )}
              <Icon name="arrow-right" className={styles.noteArrow} />
            </AppLink>
          </li>
        ))}
      </ol>
    </section>
  );
}
