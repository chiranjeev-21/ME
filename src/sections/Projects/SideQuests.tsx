import type { CSSProperties } from 'react';
import { AppLink } from '../../app/router.tsx';
import { HorizontalScroll } from '../../components/motion/HorizontalScroll';
import { SplitReveal } from '../../components/motion/SplitReveal';
import { ExternalLink } from '../../components/ui/ExternalLink';
import { Icon } from '../../components/ui/Icon';
import type { GitHubFeedState } from '../../hooks/useGitHubFeed.ts';
import type { GitHubRepository, Project } from '../../data/types.ts';
import { gsap } from '../../lib/gsap.ts';
import styles from './SideQuests.module.css';

const HEX_COLOUR = /^#[0-9a-f]{3,8}$/i;

const pad = (value: number) => String(value).padStart(2, '0');
const canonical = (url: string) => url.replace(/\/$/, '').toLowerCase();

function feedLabel(feed: GitHubFeedState) {
  if (feed.isLoading) return 'Checking public repositories';
  if (feed.data.source === 'fallback') return 'Local fallback — not a live GitHub result';
  if (feed.data.selection === 'pinned') return 'Pinned on GitHub';
  if (feed.data.selection === 'recent') return 'Recently updated on GitHub';
  return 'Public GitHub metadata';
}

function Panel({
  project,
  meta,
  index,
  total,
}: {
  project: Project;
  meta?: GitHubRepository;
  index: number;
  total: number;
}) {
  const language = meta?.primaryLanguage?.name || undefined;
  const colour = meta?.primaryLanguage?.color;
  const topics = project.technologies.filter(item => item !== language).slice(0, 5);
  const stars = meta?.stargazerCount ?? 0;
  const updated = meta
    ? new Date(meta.updatedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : undefined;
  const titleId = `quest-${project.slug}`;
  const style =
    colour && HEX_COLOUR.test(colour) ? ({ '--lang': colour } as CSSProperties) : undefined;
  return (
    <article
      className={styles.panel}
      style={style}
      aria-labelledby={titleId}
      data-panel
      data-lang={style ? '' : undefined}
    >
      <div className={styles.glow} aria-hidden="true" />
      <p className={`u-label ${styles.count}`} data-rise>
        <span>
          {pad(index + 1)} / {pad(total)}
        </span>
        {language && (
          <span className={styles.language}>
            <i aria-hidden="true" />
            {language}
          </span>
        )}
      </p>
      <span className={styles.ghost} aria-hidden="true" data-ghost>
        {project.title}
      </span>
      <div className={styles.body}>
        <div className={styles.lead}>
          <h4 id={titleId} className={styles.name} data-rise>
            {project.title}
          </h4>
          <p className={styles.description} data-rise>
            {project.summary}
          </p>
        </div>
        <div className={styles.facts}>
          {topics.length > 0 && (
            <p className={styles.topics} data-rise>
              {topics.join(' · ')}
            </p>
          )}
          {updated && (
            <p className={`u-label ${styles.meta}`} data-rise>
              <span>Updated {updated}</span>
              {stars > 0 && (
                <span>
                  {stars} {stars === 1 ? 'star' : 'stars'}
                </span>
              )}
            </p>
          )}
          <div className={styles.links} data-rise>
            <AppLink href={`/projects/${project.slug}`} className={styles.primary}>
              Read the dossier<span className="u-sr"> for {project.title}</span>{' '}
              <Icon name="arrow-right" />
            </AppLink>
            {project.sourceUrl && (
              <ExternalLink href={project.sourceUrl} className="u-link">
                Source on GitHub<span className="u-sr">: {project.title}</span>{' '}
                <Icon name="arrow-up-right" />
              </ExternalLink>
            )}
            {project.demoUrl && project.demoUrl !== project.sourceUrl && (
              <ExternalLink href={project.demoUrl} className="u-link">
                Live site<span className="u-sr">: {project.title}</span>{' '}
                <Icon name="arrow-up-right" />
              </ExternalLink>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Public repositories as a horizontal gallery that sits beside the featured
 * scenes. Each panel is typographic: repositories carry no imagery, so none
 * is invented. With nothing to show, it collapses to a short, honest state.
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
  const quests = projects.filter(
    project => !project.treatment && project.title.toLowerCase() !== login
  );
  const items = new Map(feed.data.items.map(item => [canonical(item.url), item]));
  const profile = feed.data.profile.url;
  const live = feed.data.source === 'github' && !feed.isLoading;

  const intro = (
    <div className={styles.intro}>
      <p className={`u-label ${styles.code}`}>{code} — Side quests</p>
      <SplitReveal as="h3" id="side-quests-title" className={styles.title}>
        Side <em>quests.</em>
      </SplitReveal>
      <p className={styles.lede}>
        {live
          ? 'Smaller things I’ve built and published — pulled live from GitHub.'
          : 'Smaller things I’ve built and published on GitHub.'}
      </p>
      <p className={`u-label ${styles.feedState}`} data-loading={feed.isLoading}>
        <span className={styles.feedDot} aria-hidden="true" />
        {feedLabel(feed)}
      </p>
      {quests.length > 0 && (
        <p className={`u-label ${styles.hint}`} aria-hidden="true">
          Keep scrolling <span>→</span>
        </p>
      )}
    </div>
  );

  const build = (tween: gsap.core.Tween, track: HTMLElement, section: HTMLElement) => {
    gsap.utils.toArray<HTMLElement>('[data-panel]', track).forEach(panel => {
      const ghost = panel.querySelector('[data-ghost]');
      const rise = panel.querySelectorAll('[data-rise]');
      if (ghost)
        gsap.fromTo(
          ghost,
          { x: () => panel.clientWidth * 0.14 },
          {
            x: () => panel.clientWidth * -0.14,
            ease: 'none',
            scrollTrigger: {
              trigger: panel,
              containerAnimation: tween,
              start: 'left right',
              end: 'right left',
              scrub: true,
              invalidateOnRefresh: true,
            },
          }
        );
      // Opacity only (not visibility): links stay in the tab order before they are revealed.
      gsap.set(rise, { y: 44, opacity: 0 });
      const visibleAtStart = panel.offsetLeft < window.innerWidth * 0.8;
      gsap.to(rise, {
        y: 0,
        opacity: 1,
        duration: 1.15,
        ease: 'reveal',
        stagger: 0.07,
        scrollTrigger: visibleAtStart
          ? { trigger: section, start: 'top 45%' }
          : { trigger: panel, containerAnimation: tween, start: 'left 80%' },
      });
    });
    const marker = section.querySelector('[data-marker]');
    if (marker)
      gsap.fromTo(
        marker,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: true },
        }
      );
  };

  return (
    <section
      id="side-quests"
      className={styles.quests}
      aria-labelledby="side-quests-title"
      data-state={quests.length ? 'gallery' : 'empty'}
    >
      {quests.length === 0 ? (
        <div className={styles.static}>
          {intro}
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
        </div>
      ) : (
        <HorizontalScroll
          className={styles.gallery}
          trackClassName={styles.track}
          onBuild={build}
          overlay={
            <div className={styles.rail} aria-hidden="true">
              <span className="u-label">{code} — Side quests</span>
              <span className={styles.railTrack}>
                <span data-marker />
              </span>
              <span className="u-label">
                {pad(quests.length)} {quests.length === 1 ? 'repository' : 'repositories'}
              </span>
            </div>
          }
        >
          {intro}
          {quests.map((project, index) => (
            <Panel
              key={project.id}
              project={project}
              meta={project.sourceUrl ? items.get(canonical(project.sourceUrl)) : undefined}
              index={index}
              total={quests.length}
            />
          ))}
          <div className={styles.outro}>
            <p className="u-label">The rest</p>
            <p className={styles.outroLine}>
              Everything else lives <em>on GitHub.</em>
            </p>
            <ExternalLink href={profile} className="u-link">
              Everything on GitHub <Icon name="arrow-up-right" />
            </ExternalLink>
            <AppLink href="/#notes" className={`u-link ${styles.next}`}>
              Continue to the studio notes <span aria-hidden="true">↓</span>
            </AppLink>
          </div>
        </HorizontalScroll>
      )}
    </section>
  );
}
