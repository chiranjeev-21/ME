import { AppLink } from '../app/router.tsx';
import { Icon } from '../components/ui/Icon';
import type { Note } from '../data/types.ts';
import { Overlay } from './Overlay';
import styles from './NotePage.module.css';

export function NotePage({ note, notes }: { note?: Note; notes: Note[] }) {
  const titleId = `note-title-${note?.slug ?? 'missing'}`;
  if (!note)
    return (
      <Overlay labelledBy={titleId} tone="paper" backLabel="Back to the notes" backHref="/#notes">
        <article className={styles.page}>
          <h1 id={titleId} tabIndex={-1} className={styles.title}>
            This note isn’t in the archive.
          </h1>
          <AppLink href="/#notes" className="u-link">
            Browse the studio notes <Icon name="arrow-right" />
          </AppLink>
        </article>
      </Overlay>
    );
  const index = notes.findIndex(item => item.slug === note.slug);
  const next = notes[(index + 1) % notes.length];
  return (
    <Overlay labelledBy={titleId} tone="paper" backLabel="Back to the notes" backHref="/#notes">
      <article className={styles.page}>
        <header className={styles.head}>
          <p className="u-label">
            {note.kind} — N° {String(index + 1).padStart(2, '0')}
          </p>
          <h1 id={titleId} tabIndex={-1} className={styles.title}>
            {note.title}
          </h1>
          <p className={styles.summary}>{note.summary}</p>
          <p className={styles.context}>{note.context}</p>
          <ul className={styles.tags}>
            {note.tags.map(tag => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </header>
        <div className={styles.body}>
          {note.sections.map((section, sectionIndex) => (
            <section key={section.heading}>
              <h2>
                <span className="u-label">{String(sectionIndex + 1).padStart(2, '0')}</span>
                {section.heading}
              </h2>
              {section.paragraphs.map(paragraph => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
              {section.code && (
                <pre>
                  <code>{section.code}</code>
                </pre>
              )}
            </section>
          ))}
        </div>
        {next && next.slug !== note.slug && (
          <AppLink href={`/writing/${next.slug}`} className={styles.next}>
            <span className="u-label">Next note</span>
            <span className={styles.nextTitle}>{next.title}</span>
          </AppLink>
        )}
      </article>
    </Overlay>
  );
}
