import { Reveal } from '../../components/motion/Reveal';
import { SplitReveal } from '../../components/motion/SplitReveal';
import { ChapterMark } from '../../components/ui/ChapterMark';
import { themeAttributes } from '../../data/themes.ts';
import type { PortfolioContent } from '../../data/types.ts';
import type { GitHubFeedState } from '../../hooks/useGitHubFeed.ts';
import { ProjectFeature } from './ProjectFeature';
import { SideQuests } from './SideQuests';
import { StudioNotes } from './StudioNotes';
import styles from './Work.module.css';

const PRINCIPLES = [
  {
    index: '01',
    title: 'Observe before interpreting.',
    body: 'Telemetry and release comparison help distinguish a changed workload from a changed system. A latency number without its conditions is an incomplete signal.',
  },
  {
    index: '02',
    title: 'Bound the failure.',
    body: 'Timeout-aware handling, recovery policy, and resource limits put explicit boundaries around work that cannot complete as expected.',
  },
  {
    index: '03',
    title: 'Keep the evidence attached.',
    body: 'Failure-test results are not production guarantees. A projected cost reduction is not realized savings. The qualifier belongs beside the result.',
  },
];

export function Work({ content, feed }: { content: PortfolioContent; feed: GitHubFeedState }) {
  const featured = content.projects.filter(project => project.treatment);
  // Sub-chapter codes continue after the featured scenes (04.1–04.3).
  const code = (offset: number) => `04.${featured.length + offset}`;
  return (
    <section
      id="work"
      className={styles.work}
      aria-labelledby="work-title"
      {...themeAttributes('work')}
    >
      <header className={styles.intro}>
        <ChapterMark chapter="work">Engineering &amp; Work</ChapterMark>
        <SplitReveal as="h2" id="work-title" className={styles.title}>
          Design for the <em>unhappy path.</em>
        </SplitReveal>
        <Reveal as="p" className={styles.lede} delay={0.15}>
          Distributed computing. Storage reliability. Useful systems under real constraints.
        </Reveal>
      </header>

      <Reveal as="ol" className={styles.principles} stagger={0.12} start="top 80%">
        {PRINCIPLES.map(principle => (
          <li key={principle.index}>
            <span className="u-label">{principle.index} /</span>
            <h3>{principle.title}</h3>
            <p>{principle.body}</p>
          </li>
        ))}
      </Reveal>

      <div className={styles.selected}>
        <p className="u-label">Selected work — {String(featured.length).padStart(2, '0')}</p>
        <p className={styles.selectedNote}>
          Case studies, a published research artifact, and the side quests that came out of
          curiosity.
        </p>
      </div>

      {featured.map((project, index) => (
        <ProjectFeature key={project.id} project={project} index={index} />
      ))}

      <SideQuests projects={content.projects} feed={feed} code={code(1)} />
      <StudioNotes notes={content.notes} code={code(2)} />
    </section>
  );
}
