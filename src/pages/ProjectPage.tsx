import { AppLink } from '../app/router.tsx';
import { ExternalLink } from '../components/ui/ExternalLink';
import { Icon } from '../components/ui/Icon';
import type { Project } from '../data/types.ts';
import { Overlay } from './Overlay';
import styles from './ProjectPage.module.css';

export function ProjectPage({ project, projects }: { project?: Project; projects: Project[] }) {
  const titleId = `project-title-${project?.slug ?? 'missing'}`;
  if (!project)
    return (
      <Overlay labelledBy={titleId} backLabel="Back to the work" backHref="/#work">
        <article className={styles.page}>
          <p className="u-label">Not found</p>
          <h1 id={titleId} tabIndex={-1} className={styles.title}>
            This project isn’t in the current index.
          </h1>
          <p className={styles.summary}>
            It may have been renamed, or the public feed may be unavailable right now.
          </p>
          <AppLink href="/#work" className={styles.primary}>
            See the selected work <Icon name="arrow-right" />
          </AppLink>
        </article>
      </Overlay>
    );

  const artifact = project.treatment === 'surveillance';
  const dossier = project.source !== 'curated' && !artifact;
  const kind = artifact
    ? 'Research artifact'
    : dossier
      ? 'Repository dossier — public metadata'
      : 'Case study';
  const sections = dossier
    ? []
    : [
        { title: 'The problem', text: project.problem },
        { title: 'Constraints', items: project.constraints },
        { title: 'Architecture', items: project.architecture },
        { title: 'Design decisions', items: project.decisions },
        { title: 'Trade-offs & failure modes', items: project.tradeoffs },
        { title: 'What is actually documented', items: project.outcomes },
      ].filter(section => section.text || section.items?.length);

  const curated = projects.filter(item => item.treatment);
  const position = curated.findIndex(item => item.slug === project.slug);
  const next = position >= 0 ? curated[(position + 1) % curated.length] : undefined;

  return (
    <Overlay
      labelledBy={titleId}
      backLabel={dossier ? 'Back to the side quests' : 'Back to the work'}
      backHref={dossier ? '/#side-quests' : '/#work'}
    >
      <article className={styles.page}>
        <header className={styles.head}>
          <p className="u-label">{kind}</p>
          <h1 id={titleId} tabIndex={-1} className={styles.title}>
            {project.title}
          </h1>
          <p className={styles.summary}>{project.summary}</p>
          <div className={styles.actions}>
            {project.sourceUrl && (
              <ExternalLink href={project.sourceUrl} className={styles.primary}>
                {artifact ? 'Original research artifact' : 'View source'}{' '}
                <Icon name="arrow-up-right" />
              </ExternalLink>
            )}
            {project.demoUrl && project.demoUrl !== project.sourceUrl && (
              <ExternalLink href={project.demoUrl} className="u-link">
                Open live preview <Icon name="arrow-up-right" />
              </ExternalLink>
            )}
          </div>
          <p className={styles.provenance}>{project.provenance}</p>
        </header>

        {project.image && (
          <figure className={styles.figure}>
            <img
              src={project.image.src}
              srcSet={`${project.image.srcSmall} 1200w, ${project.image.src} 2400w`}
              sizes="(max-width: 899px) 100vw, 90vw"
              width={project.image.width}
              height={project.image.height}
              alt={project.image.alt}
            />
            <figcaption>{project.image.alt}</figcaption>
          </figure>
        )}

        {sections.length > 0 && (
          <div className={styles.body}>
            {sections.map((section, index) => (
              <section key={section.title} className={styles.row}>
                <div className={styles.rowHead}>
                  <span className="u-label">{String(index + 1).padStart(2, '0')}</span>
                  <h2>{section.title}</h2>
                </div>
                <div className={styles.rowBody}>
                  {section.text ? (
                    <p className={styles.lead}>{section.text}</p>
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

        {dossier && (
          <p className={styles.dossierNote}>
            This entry reflects the repository’s public description, language and topics. No
            architecture, impact or deployment claims are inferred from it.
          </p>
        )}

        {project.technologies.length > 0 && (
          <section className={styles.stack}>
            <p className="u-label">{dossier ? 'Language & topics' : 'Technologies'}</p>
            <ul>
              {project.technologies.map(tech => (
                <li key={tech}>{tech}</li>
              ))}
            </ul>
          </section>
        )}

        {next && next.slug !== project.slug && (
          <AppLink href={`/projects/${next.slug}`} className={styles.next}>
            <span className="u-label">Next project</span>
            <span className={styles.nextTitle}>
              {next.title} <Icon name="arrow-right" />
            </span>
          </AppLink>
        )}
      </article>
    </Overlay>
  );
}
