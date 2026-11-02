import { Reveal } from '../../components/motion/Reveal';
import { SplitReveal } from '../../components/motion/SplitReveal';
import { ChapterMark } from '../../components/ui/ChapterMark';
import { themeAttributes } from '../../data/themes.ts';
import type { PortfolioContent } from '../../data/types.ts';
import { selectQuests } from '../../data/questMedia.ts';
import type { GitHubFeedState } from '../../hooks/useGitHubFeed.ts';
import { ProjectFeature } from './ProjectFeature';
import { SideQuests } from './SideQuests';
import { StudioNotes } from './StudioNotes';
import styles from './Work.module.css';

export function Work({ content, feed }: { content: PortfolioContent; feed: GitHubFeedState }) {
  const featured = content.projects.filter(project => project.treatment);
  const quests = feed.isLoading ? [] : selectQuests(content.projects, feed.data.profile.login);
  // Featured work, then the GitHub projects, then the notes: one run of 04.n numbers.
  const notesCode = `04.${featured.length + quests.length + 1}`;
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
          A hackathon win, a published research artifact, and the projects on my GitHub.
        </Reveal>
      </header>

      {featured.map((project, index) => (
        <ProjectFeature key={project.id} project={project} index={index} />
      ))}

      <SideQuests quests={quests} feed={feed} start={featured.length + 1} />
      <StudioNotes notes={content.notes} code={notesCode} />
    </section>
  );
}
