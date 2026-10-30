import { useMemo, useState } from 'react';
import type { ProjectCategory, UniverseProject, WorldViewProps } from '../types';
import { DestinationLink, ExternalLink, Eyebrow, MissingDocument } from './shared';

const CATEGORIES: ProjectCategory[] = ['AI/ML', 'Web', 'Systems', 'Games', 'Experiments'];

function CaseStudy({
  project,
  ...props
}: Pick<WorldViewProps, 'navigation' | 'navigate'> & { project: UniverseProject }) {
  const artifact = project.slug === 'face-mask-detection';
  const metadataOnly = project.source !== 'curated' && !artifact;
  const authored = !metadataOnly && !artifact;
  const sections = authored
    ? [
        { title: 'The problem', text: project.problem },
        { title: 'Constraints', items: project.constraints },
        { title: 'Architecture', items: project.architecture },
        { title: 'Design decisions', items: project.decisions },
        { title: 'Trade-offs & failure modes', items: project.tradeoffs },
        { title: 'What is actually documented', items: project.outcomes },
      ]
    : [];
  return (
    <article className="uw-case-study">
      <DestinationLink
        {...props}
        target={{ world: 'projects', projectSlug: null }}
        className="uw-back"
      >
        ← Back to {props.navigation.vault ? 'Builder vault' : 'Projects'}
      </DestinationLink>
      <header>
        <Eyebrow>
          {artifact
            ? 'Research artifact'
            : authored
              ? 'Implementation case study'
              : 'Repository dossier / metadata only'}
        </Eyebrow>
        <h1>{project.title}</h1>
        <p className="uw-lead">{project.summary}</p>
        <p className="uw-provenance">{project.provenance}</p>
        <div className="uw-case-actions">
          {project.sourceUrl && (
            <ExternalLink href={project.sourceUrl} className="uw-button">
              {artifact ? 'Original research artifact' : 'View source'}
            </ExternalLink>
          )}
          {authored && project.demoUrl && project.demoUrl !== project.sourceUrl && (
            <ExternalLink href={project.demoUrl} className="uw-button">
              Open preview
            </ExternalLink>
          )}
        </div>
      </header>
      {project.image && (
        <figure className="uw-case-image">
          <img
            src={project.image}
            alt={project.imageAlt || project.title}
            width="1600"
            height="1000"
          />
          <figcaption>{project.imageAlt}</figcaption>
        </figure>
      )}
      {sections.length > 0 && (
        <div className="uw-case-body">
          {sections.map((section, index) => (
            <section key={section.title} data-reveal="section">
              <div>
                <span className="uw-meta">{String(index + 1).padStart(2, '0')} /</span>
                <h2>{section.title}</h2>
              </div>
              <div>
                {section.text ? (
                  <p>{section.text}</p>
                ) : (
                  <ul>
                    {section.items?.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
      {artifact && (
        <p className="uw-dossier-note">
          The linked folder is the original artifact. Training, evaluation, and deployment results
          are not documented here.
        </p>
      )}
      {project.technologies.length > 0 && (
        <footer className={authored ? undefined : 'uw-dossier-technologies'}>
          <Eyebrow>
            {metadataOnly ? 'Language & topics from the feed' : 'Technologies / supplied context'}
          </Eyebrow>
          <div className="uw-tags">
            {project.technologies.map(tech => (
              <span key={tech}>{tech}</span>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
}

export function ProjectsWorld(props: WorldViewProps) {
  const { content, navigation, feed } = props;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ProjectCategory | 'All'>('All');
  const collection = useMemo(
    () =>
      navigation.vault
        ? content.projects.filter(project => project.source !== 'curated')
        : content.projects,
    [content.projects, navigation.vault]
  );
  const filtered = useMemo(
    () =>
      collection.filter(project => {
        const text =
          `${project.title} ${project.summary} ${project.technologies.join(' ')}`.toLowerCase();
        return (
          (category === 'All' || project.categories.includes(category)) &&
          text.includes(query.trim().toLowerCase())
        );
      }),
    [category, collection, query]
  );
  if (navigation.projectSlug) {
    const project = content.projects.find(item => item.slug === navigation.projectSlug);
    return (
      <section className="uw-world uw-projects">
        {project ? (
          <CaseStudy {...props} project={project} />
        ) : (
          <MissingDocument {...props} kind="project" />
        )}
      </section>
    );
  }
  const feedLabel = feed.isLoading
    ? 'Checking public repositories'
    : feed.data.source === 'fallback'
      ? 'Local fallback'
      : feed.data.selection === 'pinned'
        ? 'Pinned public repositories'
        : feed.data.selection === 'recent'
          ? 'Recent public repositories'
          : 'Public GitHub metadata';
  return (
    <section className="uw-world uw-projects" aria-labelledby="uw-projects-title">
      <header className="uw-projects-header">
        <div>
          <Eyebrow>04 / The spaceport catalog</Eyebrow>
          <h1 id="uw-projects-title">
            {navigation.vault ? (
              <>
                The builder
                <br />
                <em>vault.</em>
              </>
            ) : (
              <>
                Built. Explored.
                <br />
                <em>Documented.</em>
              </>
            )}
          </h1>
          <p className="uw-lead">
            {navigation.vault
              ? 'A shelf of public repositories, separate from the authored work.'
              : 'Implementation case studies, a research artifact, and a public repository shelf.'}
          </p>
        </div>
        <div className="uw-catalog-stamp" aria-hidden="true">
          <span>CJ</span>
          <span>{navigation.vault ? 'VAULT / OPEN INDEX' : 'WORK / SELECTED INDEX'}</span>
          <span>↗</span>
        </div>
      </header>
      <nav className="uw-collection-tabs" aria-label="Project collections">
        <DestinationLink
          {...props}
          target={{ vault: false, projectSlug: null }}
          className={!navigation.vault ? 'is-current' : undefined}
        >
          All work
        </DestinationLink>
        <DestinationLink
          {...props}
          target={{ vault: true, projectSlug: null }}
          className={navigation.vault ? 'is-current' : undefined}
        >
          Builder vault <span aria-hidden="true">↗</span>
        </DestinationLink>
      </nav>
      <aside className="uw-feed-notice">
        <span className="uw-meta">{feedLabel}</span>
        <p>
          {feed.data.source === 'fallback'
            ? feed.isLoading
              ? 'Showing the local research artifact while the public repository feed loads. This is not a live GitHub result.'
              : 'The repository connection is unavailable. The local research artifact remains accessible; it is not presented as live GitHub data.'
            : feed.notice ||
              'Repository dossiers contain the public description, language, topics, and source link—not inferred case studies.'}
        </p>
      </aside>
      <div className="uw-project-controls">
        <label className="uw-search">
          <span>Search the catalog</span>
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Title, technology, or topic"
          />
        </label>
        <fieldset className="uw-category-filter">
          <legend>Category</legend>
          {(['All', ...CATEGORIES] as const).map(item => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </fieldset>
      </div>
      <p className="uw-result-count" role="status">
        {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
        {category !== 'All' ? ` in ${category}` : ''}
        {query ? ` matching “${query}”` : ''}
      </p>
      {filtered.length ? (
        <div className="uw-project-grid" aria-label="Project manifest">
          {filtered.map((project, index) => (
            <article
              className={`uw-project-card ${project.image ? 'uw-project-card-featured' : ''}`}
              key={project.id}
              data-reveal="manifest"
            >
              <span className="uw-project-bay" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              {project.image && (
                <div className="uw-project-thumb">
                  <img
                    src={project.image}
                    alt={project.imageAlt || project.title}
                    loading="lazy"
                    width="1600"
                    height="1000"
                  />
                  <span aria-hidden="true">Runtime view</span>
                </div>
              )}
              <div className="uw-project-card-body">
                <div className="uw-project-card-top">
                  <span className="uw-meta">
                    {project.slug === 'face-mask-detection'
                      ? project.source === 'fallback'
                        ? 'LOCAL ARTIFACT'
                        : 'RESEARCH ARTIFACT'
                      : project.source === 'curated'
                        ? 'AUTHORED CASE STUDY'
                        : project.source === 'fallback'
                          ? 'LOCAL FALLBACK'
                          : 'REPOSITORY / METADATA'}
                  </span>
                  <span aria-hidden="true">↗</span>
                </div>
                <h2>
                  <DestinationLink {...props} target={{ projectSlug: project.slug }}>
                    {project.title}
                  </DestinationLink>
                </h2>
                <p>{project.summary}</p>
                <div className="uw-tags">
                  {project.categories.map(item => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="uw-empty">
          <span aria-hidden="true">∅</span>
          <h2>No documented work in this selection.</h2>
          <p>
            {category === 'Games' &&
            !collection.some(project => project.categories.includes('Games'))
              ? 'No game repositories are in the current feed. Hush has its own atmosphere study.'
              : 'Try a different category or clear the search. An empty shelf is more useful than an invented project.'}
          </p>
          <button
            className="uw-button"
            onClick={() => {
              setQuery('');
              setCategory('All');
            }}
          >
            Reset filters
          </button>
          {navigation.vault && (
            <DestinationLink {...props} target={{ vault: false }} className="uw-text-link">
              See authored work →
            </DestinationLink>
          )}
        </div>
      )}
    </section>
  );
}
