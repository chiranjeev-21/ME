import { useRef } from 'react';
import type { ReactNode } from 'react';
import { AppLink } from '../../app/router.tsx';
import { Reveal } from '../../components/motion/Reveal';
import { SplitReveal } from '../../components/motion/SplitReveal';
import { ChapterMark } from '../../components/ui/ChapterMark';
import { Icon } from '../../components/ui/Icon';
import type { GitHubFeedState } from '../../hooks/useGitHubFeed.ts';
import { themeAttributes } from '../../data/themes.ts';
import type { PortfolioContent } from '../../data/types.ts';
import { ScrollTrigger, gsap } from '../../lib/gsap.ts';
import { useQueuedGSAP } from '../../lib/motionQueue.ts';
import { ContourGarden } from './ContourGarden';
import { RetrievalLab } from './RetrievalLab';
import { SideQuests } from './SideQuests';
import styles from './Lab.module.css';

const EXPERIMENTS = [
  { id: 'retrieval', code: 'EXP-01', kind: 'Working · AI', title: 'Retrieval is not evidence' },
  { id: 'contour', code: 'EXP-02', kind: 'Generative · SVG', title: 'Contour garden' },
  { id: 'side-quests', code: 'EXP-03', kind: 'Live feed · GitHub', title: 'Side quests' },
  { id: 'notes', code: 'EXP-04', kind: 'Writing', title: 'Studio notes' },
] as const;

export function Lab({ content, feed }: { content: PortfolioContent; feed: GitHubFeedState }) {
  const ref = useRef<HTMLElement>(null);

  useQueuedGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const links = gsap.utils.toArray<HTMLElement>('[data-index-link]', root);
      EXPERIMENTS.forEach((experiment, index) => {
        const entry = root.querySelector(`#${experiment.id}`);
        if (!entry) return;
        ScrollTrigger.create({
          trigger: entry,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: self => links[index]?.classList.toggle(styles.indexActive, self.isActive),
        });
      });
    },
    { scope: ref }
  );

  return (
    <section
      ref={ref}
      id="lab"
      className={styles.lab}
      aria-labelledby="lab-title"
      {...themeAttributes('lab')}
    >
      <header className={styles.header}>
        <ChapterMark chapter="lab" />
        <SplitReveal as="h2" id="lab-title" className={styles.title}>
          Experiments, <em>in progress.</em>
        </SplitReveal>
        <Reveal as="p" className={styles.lede} delay={0.15}>
          A bench for prototypes, studies and side quests. Everything here runs in your browser;
          nothing on this bench is simulated.
        </Reveal>
      </header>

      <div className={styles.bench}>
        <nav className={styles.index} aria-label="Experiments">
          <ol>
            {EXPERIMENTS.map(experiment => (
              <li key={experiment.id}>
                <AppLink href={`/#${experiment.id}`} data-index-link>
                  <span>{experiment.code}</span>
                  {experiment.title}
                </AppLink>
              </li>
            ))}
          </ol>
        </nav>

        <div className={styles.entries}>
          <article id="retrieval" className={styles.entry} aria-labelledby="retrieval-title">
            <EntryHead
              code="EXP-01"
              kind="Working · AI"
              id="retrieval-title"
              title={
                <>
                  Retrieval is <em>not evidence.</em>
                </>
              }
              body="A local TF-IDF lab over this portfolio’s own case studies and notes. It shows what it found, what it did not, and where its authority ends."
            />
            <RetrievalLab content={content} />
          </article>

          <article id="contour" className={styles.entry} aria-labelledby="contour-title">
            <EntryHead
              code="EXP-02"
              kind="Generative · SVG"
              id="contour-title"
              title={
                <>
                  Contour <em>garden.</em>
                </>
              }
              body="A seeded study: soft terrain fields, five botanical stems, one warm sun. Change the density to change the rhythm without changing the composition — then export the paths."
            />
            <ContourGarden />
          </article>

          <article id="side-quests" className={styles.entry} aria-labelledby="quests-title">
            <EntryHead
              code="EXP-03"
              kind="Live feed · GitHub"
              id="quests-title"
              title={
                <>
                  Side <em>quests.</em>
                </>
              }
              body="Public repositories, pulled live from GitHub — pinned when a token is configured, most recent otherwise."
            />
            <SideQuests projects={content.projects} feed={feed} />
          </article>

          <article id="notes" className={styles.entry} aria-labelledby="notes-title">
            <EntryHead
              code="EXP-04"
              kind="Writing"
              id="notes-title"
              title={
                <>
                  Studio <em>notes.</em>
                </>
              }
              body="Implementation notes on decisions, trade-offs and failure paths."
            />
            <ol className={styles.notes}>
              {content.notes.map((note, index) => (
                <li key={note.slug}>
                  <AppLink href={`/writing/${note.slug}`} className={styles.note}>
                    <span className="u-label">N° {String(index + 1).padStart(2, '0')}</span>
                    <span className={styles.noteTitle}>{note.title}</span>
                    <span className={styles.noteSummary}>{note.summary}</span>
                    <Icon name="arrow-right" className={styles.noteArrow} />
                  </AppLink>
                </li>
              ))}
            </ol>
          </article>
        </div>
      </div>
    </section>
  );
}

function EntryHead({
  code,
  kind,
  id,
  title,
  body,
}: {
  code: string;
  kind: string;
  id: string;
  title: ReactNode;
  body: string;
}) {
  return (
    <Reveal className={styles.entryHead}>
      <p className={`u-label ${styles.entryCode}`}>
        <span>{code}</span>
        <span>{kind}</span>
      </p>
      <h3 id={id} className={styles.entryTitle}>
        {title}
      </h3>
      <p className={styles.entryBody}>{body}</p>
    </Reveal>
  );
}
