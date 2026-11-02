import { ExternalLink } from '../../components/ui/ExternalLink';
import { Icon } from '../../components/ui/Icon';
import type { GitHubFeedState } from '../../hooks/useGitHubFeed.ts';
import type { Project } from '../../data/types.ts';
import { QuestFeature } from './ProjectFeature';
import styles from './SideQuests.module.css';

const canonical = (url: string) => url.replace(/\/$/, '').toLowerCase();

function feedLabel(feed: GitHubFeedState) {
  if (feed.isLoading) return 'Checking public repositories';
  if (feed.data.source === 'fallback') return 'Local fallback — not a live GitHub result';
  if (feed.data.selection === 'pinned') return 'Pinned on GitHub';
  if (feed.data.selection === 'recent') return 'Recently updated on GitHub';
  return 'Public GitHub metadata';
}

/**
 * Public repositories, continuing the chapter's numbered scenes with the same
 * choreography as the featured work. No heading of their own: they are simply
 * more things built. With nothing live to show, a short honest note remains.
 */
export function SideQuests({
  quests,
  feed,
  start,
}: {
  /** Already filtered and ordered (see `selectQuests`). */
  quests: Project[];
  feed: GitHubFeedState;
  /** Number of the first scene within the chapter (04.n). */
  start: number;
}) {
  const items = new Map(feed.data.items.map(item => [canonical(item.url), item]));
  const profile = feed.data.profile.url;
  const live = feed.data.source === 'github' && !feed.isLoading;
  const provenance = (
    <p className={`u-label ${styles.feedState}`} data-loading={feed.isLoading}>
      <span className={styles.feedDot} aria-hidden="true" />
      <span>{feedLabel(feed)}</span>
    </p>
  );

  return (
    <section
      id="side-quests"
      className={styles.quests}
      aria-label="Projects on GitHub"
      data-state={quests.length ? 'scenes' : feed.isLoading ? 'loading' : 'empty'}
    >
      {quests.length === 0 ? (
        <div className={styles.empty}>
          {provenance}
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
              number={start + index}
              index={index}
            />
          ))}
          <div className={styles.outro}>
            <p className={styles.outroLine}>
              Everything else lives <em>on GitHub.</em>
            </p>
            <div className={styles.outroLinks}>
              {provenance}
              <ExternalLink href={profile} className="u-link">
                Everything on GitHub <Icon name="arrow-up-right" />
              </ExternalLink>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
