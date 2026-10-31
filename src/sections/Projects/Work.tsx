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

export function Work({ content, feed }: { content: PortfolioContent; feed: GitHubFeedState }) {
  const featured = content.projects.filter(project => project.treatment);
  // Sub-chapter codes continue after the featured scenes (04.1–04.2).
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
          Things I’ve <em>built.</em>
        </SplitReveal>
        <Reveal as="p" className={styles.lede} delay={0.15}>
          One case study, a published research artifact, and the side quests on my GitHub.
        </Reveal>
      </header>

      {featured.map((project, index) => (
        <ProjectFeature key={project.id} project={project} index={index} />
      ))}

      <SideQuests projects={content.projects} feed={feed} code={code(1)} />
      <StudioNotes notes={content.notes} code={code(2)} />
    </section>
  );
}
