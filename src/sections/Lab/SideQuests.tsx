import { AppLink } from '../../app/router.tsx';
import { ExternalLink } from '../../components/ui/ExternalLink';
import { Icon } from '../../components/ui/Icon';
import type { GitHubFeedState } from '../../hooks/useGitHubFeed.ts';
import type { Project } from '../../data/types.ts';
import styles from './Lab.module.css';

function feedLabel(feed: GitHubFeedState) {
  if (feed.isLoading) return 'Checking public repositories';
  if (feed.data.source === 'fallback') return 'Local fallback — not a live GitHub result';
  if (feed.data.selection === 'pinned') return 'Pinned on GitHub';
  if (feed.data.selection === 'recent') return 'Recently updated on GitHub';
  return 'Public GitHub metadata';
}

export function SideQuests({ projects, feed }: { projects: Project[]; feed: GitHubFeedState }) {
  const quests = projects.filter(project => project.source !== 'curated');
  const updated = new Map(
    feed.data.items.map(item => [item.url.replace(/\/$/, '').toLowerCase(), item])
  );
  return (
    <div className={styles.quests}>
      <p className={`u-label ${styles.feedState}`} data-loading={feed.isLoading}>
        <span className={styles.feedDot} aria-hidden="true" />
        {feedLabel(feed)}
      </p>
      <ol className={styles.questList}>
        {quests.map((project, index) => {
          const meta = project.sourceUrl
            ? updated.get(project.sourceUrl.replace(/\/$/, '').toLowerCase())
            : undefined;
          return (
            <li key={project.id} className={styles.quest}>
              <span className={styles.questIndex} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className={styles.questBody}>
                <h4>
                  <AppLink href={`/projects/${project.slug}`}>{project.title}</AppLink>
                </h4>
                <p>{project.summary}</p>
                {project.technologies.length > 0 && (
                  <p className={styles.questTech}>{project.technologies.slice(0, 5).join(' · ')}</p>
                )}
              </div>
              <div className={styles.questMeta}>
                {meta && project.source === 'github' && (
                  <span className="u-label">
                    {meta.stargazerCount > 0 && `★ ${meta.stargazerCount} · `}
                    {new Date(meta.updatedAt).toLocaleDateString('en-GB', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
                {project.sourceUrl && (
                  <ExternalLink href={project.sourceUrl} className={styles.questLink}>
                    Source <Icon name="arrow-up-right" />
                  </ExternalLink>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className={styles.provenance}>
        Repository entries show public descriptions, languages and topics — not inferred case
        studies.{' '}
        {feed.data.profile && (
          <ExternalLink href={feed.data.profile.url} className="u-link">
            Everything on GitHub
          </ExternalLink>
        )}
      </p>
    </div>
  );
}
