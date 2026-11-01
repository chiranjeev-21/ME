import { SplitReveal } from '../../components/motion/SplitReveal';
import { ExternalLink } from '../../components/ui/ExternalLink';
import { Icon } from '../../components/ui/Icon';
import { arrangeQuests } from '../../data/questMedia.ts';
import type { GitHubFeedState } from '../../hooks/useGitHubFeed.ts';
import type { Project } from '../../data/types.ts';
import { QuestFeature } from './ProjectFeature';
import styles from './SideQuests.module.css';

const pad = (value: number) => String(value).padStart(2, '0');
const canonical = (url: string) => url.replace(/\/$/, '').toLowerCase();

function feedLabel(feed: GitHubFeedState) {
  if (feed.isLoading) return 'Checking public repositories';
  if (feed.data.source === 'fallback') return 'Local fallback — not a live GitHub result';
  if (feed.data.selection === 'pinned') return 'Pinned on GitHub';
  if (feed.data.selection === 'recent') return 'Recently updated on GitHub';
  return 'Public GitHub metadata';
}

/**
 * Public repositories, each staged as its own pinned scene with the same
 * choreography as the featured work. With nothing live to show, the section
 * collapses to a short, honest note instead of empty scenes.
 */
export function SideQuests({
  projects,
  feed,
  code,
}: {
  projects: Project[];
  feed: GitHubFeedState;
  code: string;
}) {
  const login = feed.data.profile.login.toLowerCase();
  // GitHub's profile-README repository is account configuration, not a project.
  const quests = feed.isLoading
    ? []
    : arrangeQuests(
        projects.filter(project => !project.treatment && project.title.toLowerCase() !== login)
      );
  const items = new Map(feed.data.items.map(item => [canonical(item.url), item]));
  const profile = feed.data.profile.url;
  const live = feed.data.source === 'github' && !feed.isLoading;

  return (
    <section
      id="side-quests"
      className={styles.quests}
      aria-labelledby="side-quests-title"
      data-state={quests.length ? 'scenes' : feed.isLoading ? 'loading' : 'empty'}
    >
      <header className={styles.head}>
        <p className={`u-label ${styles.code}`}>{code} — Side quests</p>
        <SplitReveal as="h3" id="side-quests-title" className={styles.title}>
          Side <em>quests.</em>
        </SplitReveal>
        <div className={styles.aside}>
          <p className={styles.lede}>
            {live
              ? 'Smaller things I’ve built and published — pulled live from GitHub.'
              : 'Smaller things I’ve built and published on GitHub.'}
          </p>
          <p className={`u-label ${styles.feedState}`} data-loading={feed.isLoading}>
            <span className={styles.feedDot} aria-hidden="true" />
            <span>{feedLabel(feed)}</span>
            {quests.length > 0 && (
              <span className={styles.count}>
                {pad(quests.length)} {quests.length === 1 ? 'repository' : 'repositories'}
              </span>
            )}
          </p>
        </div>
      </header>

      {quests.length === 0 ? (
        <div className={styles.empty}>
          <p>
            {feed.isLoading
              ? 'Looking up public repositories…'
              : live
                ? 'Nothing else is public yet.'
                : 'GitHub couldn’t be reached just now, so no repository is shown as current.'}
          </p>
          <ExternalLink href={profile} className="u-link">
            Everything on GitHub <Icon name="arrow-up-right" />
          </ExternalLink>
        </div>
      ) : (
        <>
          {quests.map((project, index) => (
            <QuestFeature
              key={project.id}
              project={project}
              meta={project.sourceUrl ? items.get(canonical(project.sourceUrl)) : undefined}
              index={index}
              total={quests.length}
            />
          ))}
          <div className={styles.outro}>
            <p className={styles.outroLine}>
              Everything else lives <em>on GitHub.</em>
            </p>
            <ExternalLink href={profile} className="u-link">
              Everything on GitHub <Icon name="arrow-up-right" />
            </ExternalLink>
          </div>
        </>
      )}
    </section>
  );
}
