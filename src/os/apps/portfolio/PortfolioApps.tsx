import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { EDUCATION, EMAIL, EXPERIENCE, HERO_SKILLS, SOCIAL_LINKS } from '../../../constants';
import { OSIcon } from '../../Icons';
import { portfolioFeedLabel, portfolioText, portfolioWebUrl } from '../../filesystem.ts';
import type { DesktopAppProps, ProjectCaseStudy, VfsEntry } from '../../types';
import styles from './PortfolioApps.module.css';

const HOME = '/home/cj';
const PDF_URL = '/resume/Chiranjeev-Singh-Resume.pdf';

function ExternalLink({
  href,
  children,
  className = styles.link,
}: {
  href: string | null | undefined;
  children: ReactNode;
  className?: string;
}) {
  const safeUrl = portfolioWebUrl(href);
  return safeUrl ? (
    <a className={className} href={safeUrl} target="_blank" rel="noopener noreferrer">
      {children}
      <OSIcon name="arrow" size={14} />
    </a>
  ) : null;
}

function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <OSIcon name="folder" size={32} />
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}

function fileType(entry: VfsEntry): string {
  if (entry.kind === 'directory') return 'Folder';
  if (entry.appId === 'project') return 'Project investigation';
  if (entry.appId === 'vault') return 'Vault map';
  if (entry.mime === 'application/pdf') return 'PDF document';
  if (entry.mime?.startsWith('image/')) return 'Image';
  return entry.mime === 'text/markdown' ? 'Markdown document' : 'Text document';
}

function parentPath(path: string): string {
  return path.slice(0, path.lastIndexOf('/')) || '/';
}

export function ExplorerApp(props: DesktopAppProps) {
  const requestedPath = (props.window.payload.path ?? HOME).replace(/\/+$/, '') || '/';
  const [path, setPath] = useState(requestedPath);
  const [showHidden, setShowHidden] = useState(false);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [query, setQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  useEffect(() => {
    setPath(requestedPath);
    setSelectedPath(null);
  }, [requestedPath]);

  const current = props.files.find(entry => entry.path === path);
  const selected = props.files.find(entry => entry.path === selectedPath);
  const entries = useMemo(
    () =>
      props.files
        .filter(
          entry =>
            entry.path !== path &&
            parentPath(entry.path) === path &&
            (showHidden || (!entry.hidden && !entry.name.startsWith('.'))) &&
            entry.name.toLowerCase().includes(query.toLowerCase())
        )
        .sort(
          (a, b) =>
            Number(b.kind === 'directory') - Number(a.kind === 'directory') ||
            a.name.localeCompare(b.name)
        ),
    [props.files, path, query, showHidden]
  );
  const segments = path.split('/').filter(Boolean);

  function navigate(nextPath: string) {
    props.openApp('explorer', { path: nextPath });
    setPath(nextPath);
    setSelectedPath(null);
  }

  function openEntry(entry: VfsEntry) {
    if (entry.kind === 'directory') navigate(entry.path);
    else if (entry.appId === 'project' && entry.projectId)
      props.openApp('project', { projectId: entry.projectId });
    else props.openPath(entry.path);
  }

  function openWithKeyboard(event: KeyboardEvent<HTMLButtonElement>, entry: VfsEntry) {
    if (event.key === 'Enter') {
      event.preventDefault();
      openEntry(entry);
    }
  }

  return (
    <div className={`${styles.app} ${styles.explorer}`}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>Workspace / read-only</span>
          <h1>Project Explorer</h1>
        </div>
        <button className={styles.button} onClick={() => props.openApp('resume')} type="button">
          <OSIcon name="file" size={16} /> Resume
        </button>
      </header>
      <div className={styles.addressBar}>
        <button
          className={styles.iconButton}
          type="button"
          disabled={path === '/'}
          onClick={() => navigate(parentPath(path))}
          aria-label="Go to parent folder"
        >
          ↑
        </button>
        <nav className={styles.breadcrumbs} aria-label="Folder path">
          <button type="button" onClick={() => navigate('/')} aria-label="Filesystem root">
            /
          </button>
          {segments.map((segment, index) => {
            const segmentPath = `/${segments.slice(0, index + 1).join('/')}`;
            return (
              <span key={segmentPath}>
                <OSIcon name="chevron" size={12} />
                <button
                  type="button"
                  aria-current={segmentPath === path ? 'page' : undefined}
                  onClick={() => navigate(segmentPath)}
                >
                  {segment}
                </button>
              </span>
            );
          })}
        </nav>
      </div>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <OSIcon name="search" size={15} />
          <input
            type="search"
            aria-label="Filter current folder"
            placeholder="Filter this folder…"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </label>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={showHidden}
            onChange={event => setShowHidden(event.target.checked)}
          />
          Hidden files
        </label>
        <div className={styles.segmented} aria-label="Folder view">
          <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
            List
          </button>
          <button type="button" aria-pressed={view === 'grid'} onClick={() => setView('grid')}>
            Grid
          </button>
        </div>
      </div>
      <div className={styles.explorerBody}>
        <nav className={styles.sidebar} aria-label="Workspace shortcuts">
          <span className={styles.sidebarLabel}>Favorites</span>
          {[
            { name: 'Home', path: HOME },
            { name: 'Projects', path: `${HOME}/projects` },
            { name: 'Experiments', path: `${HOME}/experiments` },
            { name: 'Writing', path: `${HOME}/writing` },
            { name: 'Assets', path: `${HOME}/assets` },
            ...(showHidden ? [{ name: '.secrets', path: `${HOME}/.secrets` }] : []),
          ].map(shortcut => (
            <button
              key={shortcut.path}
              type="button"
              aria-current={path === shortcut.path ? 'page' : undefined}
              onClick={() => navigate(shortcut.path)}
            >
              <OSIcon name={shortcut.path === HOME ? 'home' : 'folder'} size={16} />
              {shortcut.name}
            </button>
          ))}
          <p>Virtual files only. Nothing here changes your device.</p>
        </nav>
        <div className={styles.browser}>
          {current?.kind === 'directory' ? (
            <>
              <div className={styles.folderIntro}>
                <p>{current.description}</p>
                <span>Double-click or Enter to open. On touch, use Open.</span>
              </div>
              {entries.length ? (
                <ul className={view === 'grid' ? styles.fileGrid : styles.fileList}>
                  {entries.map(entry => (
                    <li
                      key={entry.path}
                      className={`${styles.fileRow} ${selectedPath === entry.path ? styles.selected : ''}`}
                    >
                      <button
                        type="button"
                        className={styles.fileMain}
                        onClick={() => setSelectedPath(entry.path)}
                        onDoubleClick={() => openEntry(entry)}
                        onKeyDown={event => openWithKeyboard(event, entry)}
                        aria-label={`${entry.name}, ${fileType(entry)}. Press Enter to open.`}
                        aria-pressed={selectedPath === entry.path}
                      >
                        <span className={styles.fileIcon}>
                          <OSIcon
                            name={
                              entry.kind === 'directory'
                                ? 'folder'
                                : entry.mime?.startsWith('image/')
                                  ? 'image'
                                  : entry.appId === 'vault'
                                    ? 'vault'
                                    : 'file'
                            }
                            size={24}
                          />
                        </span>
                        <span className={styles.fileLabel}>
                          <strong>{entry.name}</strong>
                          <small>{fileType(entry)}</small>
                        </span>
                      </button>
                      <button
                        className={styles.openButton}
                        type="button"
                        onClick={() => openEntry(entry)}
                        aria-label={`Open ${entry.name}`}
                      >
                        Open <OSIcon name="chevron" size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title={query ? 'No matching files' : 'This folder is empty'}
                  action={
                    query ? (
                      <button className={styles.button} type="button" onClick={() => setQuery('')}>
                        Clear filter
                      </button>
                    ) : null
                  }
                >
                  {query
                    ? 'Try another filename or clear the current filter.'
                    : 'Hidden entries can be revealed with the Hidden files switch.'}
                </EmptyState>
              )}
            </>
          ) : (
            <EmptyState
              title={current ? 'This path is a file' : 'Folder not found'}
              action={
                <div className={styles.actions}>
                  {current && (
                    <button
                      className={styles.button}
                      type="button"
                      onClick={() => openEntry(current)}
                    >
                      Open file
                    </button>
                  )}
                  <button className={styles.button} type="button" onClick={() => navigate(HOME)}>
                    Go home
                  </button>
                </div>
              }
            >
              {path} is not a folder in this virtual workspace.
            </EmptyState>
          )}
        </div>
      </div>
      <footer className={styles.statusBar} aria-live="polite">
        <span>
          {entries.length} {entries.length === 1 ? 'item' : 'items'} · read-only
        </span>
        <span>{selected?.description ?? path}</span>
      </footer>
    </div>
  );
}

function displayPeriod(period: string): string {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return period.replace(/(\d{2})\/(\d{4})/g, (original, month: string, year: string) => {
    const name = months[Number(month) - 1];
    return name ? `${name} ${year}` : original;
  });
}

export function ResumeApp(props: DesktopAppProps) {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>Resume / conventional view</span>
          <h1>Chiranjeev Singh</h1>
          <p>Software Engineer · Distributed Computing · Agentic AI</p>
        </div>
        <img className={styles.avatar} src="/images/photo.jpeg" alt="Chiranjeev Singh" />
      </header>
      <nav className={styles.contactBar} aria-label="Résumé download and contact">
        <a className={styles.primaryButton} href={PDF_URL} download="Chiranjeev-Singh-Resume.pdf">
          <OSIcon name="file" size={16} /> Download PDF
        </a>
        <a className={styles.button} href={`mailto:${EMAIL}`}>
          Email
        </a>
        {SOCIAL_LINKS.map(link => (
          <ExternalLink key={link.label} href={link.href} className={styles.button}>
            {link.label}
          </ExternalLink>
        ))}
      </nav>
      <div className={styles.scroll}>
        <div className={styles.document}>
          <p className={styles.resumeIntro}>
            Building distributed systems and applied AI, with experience in storage reliability,
            telemetry, resource allocation, and retrieval workflows.
          </p>
          <section className={styles.section}>
            <h2>Experience</h2>
            <div className={styles.experience}>
              {EXPERIENCE.map(job => (
                <article className={styles.job} key={job.id}>
                  <div className={styles.jobHeader}>
                    <div>
                      <h3>{job.company}</h3>
                      <p>{job.role}</p>
                    </div>
                    <div className={styles.jobMeta}>
                      <span>{displayPeriod(job.period)}</span>
                      <span>{job.location}</span>
                    </div>
                  </div>
                  <ul className={styles.bullets}>
                    {job.highlights.map(highlight => (
                      <li key={highlight}>{portfolioText(highlight)}</li>
                    ))}
                  </ul>
                  <div className={styles.tags}>
                    {job.tags.map(tag => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className={styles.section}>
            <h2>Skills</h2>
            <div className={styles.tags}>
              {HERO_SKILLS.map(skill => (
                <span className={skill.hot ? styles.hotTag : undefined} key={skill.label}>
                  {skill.label}
                </span>
              ))}
            </div>
          </section>
          <section className={styles.section}>
            <h2>Education & certifications</h2>
            <div className={styles.education}>
              {EDUCATION.map(item => (
                <article key={item.id}>
                  <h3>{item.title}</h3>
                  <p>{portfolioText(item.subtitle)}</p>
                </article>
              ))}
            </div>
          </section>
          <section className={styles.section}>
            <h2>Contact</h2>
            <a className={styles.link} href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
            <p className={styles.muted}>
              The PDF download is the original résumé, not a generated browser snapshot.
            </p>
            <button
              className={styles.button}
              type="button"
              onClick={() => props.openPath(`${HOME}/projects`)}
            >
              Explore projects <OSIcon name="chevron" size={14} />
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function projectProvenance(project: ProjectCaseStudy, props: DesktopAppProps): string {
  if (project.source === 'github') return portfolioFeedLabel(props.feed.data);
  if (project.id.startsWith('fallback:')) return 'Local fallback · not live GitHub data';
  return 'Local case study';
}

export function ProjectApp(props: DesktopAppProps) {
  const projectId =
    props.window.payload.projectId ??
    props.files.find(entry => entry.path === props.window.payload.path)?.projectId ??
    'cj-os';
  const project = props.projects.find(item => item.id === projectId);

  if (!project) {
    return (
      <div className={styles.app}>
        <div className={styles.scroll}>
          <EmptyState
            title="Project not found"
            action={
              <button
                className={styles.button}
                type="button"
                onClick={() => props.openPath(`${HOME}/projects`)}
              >
                Open Project Explorer
              </button>
            }
          >
            This investigation is not in the current portfolio. GitHub selections may change when
            the feed refreshes.
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>Project investigation</span>
          <h1>{project.title}</h1>
          <span className={styles.source}>{projectProvenance(project, props)}</span>
        </div>
        <button
          className={styles.button}
          type="button"
          onClick={() => props.openPath(`${HOME}/projects/${project.slug}`)}
        >
          <OSIcon name="folder" size={16} /> Files
        </button>
      </header>
      <div className={styles.scroll}>
        <article className={styles.document}>
          <p className={styles.lead}>{project.summary}</p>
          <div className={styles.actions}>
            <ExternalLink href={project.repoUrl} className={styles.button}>
              {project.source === 'github' ? 'Source repository' : 'Project artifact'}
            </ExternalLink>
            <ExternalLink href={project.demoUrl} className={styles.button}>
              Published homepage
            </ExternalLink>
            {project.id === 'ai-lab' && (
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => props.openApp('lab')}
              >
                <OSIcon name="spark" size={16} /> Open AI Lab
              </button>
            )}
            {project.id === 'cj-os' && (
              <button
                className={styles.button}
                type="button"
                onClick={() => props.openApp('terminal')}
              >
                <OSIcon name="terminal" size={16} /> Open Terminal
              </button>
            )}
          </div>
          <section className={styles.section}>
            <h2>
              <span className={styles.sectionNumber}>01</span> Problem
            </h2>
            <p>{project.problem}</p>
          </section>
          <section className={styles.section}>
            <h2>
              <span className={styles.sectionNumber}>02</span> Approach
            </h2>
            <ul className={styles.bullets}>
              {project.approach.map(line => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
          <section className={styles.section}>
            <h2>
              <span className={styles.sectionNumber}>03</span> Architecture
            </h2>
            <div className={styles.architecture}>
              {project.architecture.map((line, index) => (
                <div key={line}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{line}</p>
                </div>
              ))}
            </div>
          </section>
          <section className={styles.section}>
            <h2>
              <span className={styles.sectionNumber}>04</span> Stack / published metadata
            </h2>
            {project.stack.length ? (
              <div className={styles.tags}>
                {project.stack.map((item, index) => (
                  <span key={`${item}-${index}`}>{item}</span>
                ))}
              </div>
            ) : (
              <p className={styles.muted}>No stack metadata is published in this feed.</p>
            )}
          </section>
          <section className={styles.section}>
            <h2>
              <span className={styles.sectionNumber}>05</span> Results
            </h2>
            <ul className={styles.bullets}>
              {project.outcomes.map(line => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
          {!!project.limitations?.length && (
            <aside className={styles.note}>
              <h2>Limits & evidence</h2>
              <ul className={styles.bullets}>
                {project.limitations.map(line => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </aside>
          )}
        </article>
      </div>
    </div>
  );
}

function ReadableText({ content }: { content: string }) {
  return (
    <div className={styles.readable}>
      {content.split(/\n\s*\n/).map((block, index) => {
        const lines = block.split('\n');
        const first = lines[0];
        if (/^#{1,3} /.test(first)) {
          const title = first.replace(/^#{1,3} /, '');
          return (
            <section key={index}>
              {first.startsWith('# ') ? <h1>{title}</h1> : <h2>{title}</h2>}
              {lines.length > 1 && <p>{lines.slice(1).join('\n')}</p>}
            </section>
          );
        }
        if (lines.every(line => line.startsWith('- '))) {
          return (
            <ul className={styles.bullets} key={index}>
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{line.slice(2)}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{block}</p>;
      })}
    </div>
  );
}

export function ReaderApp(props: DesktopAppProps) {
  const path = props.window.payload.path;
  const entry = props.files.find(file => file.path === path);
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>Document / read-only</span>
          <h1>{entry?.name ?? 'Document Reader'}</h1>
          {path && <code className={styles.path}>{path}</code>}
        </div>
        <button
          className={styles.button}
          type="button"
          onClick={() => props.openPath(path ? parentPath(path) : HOME)}
        >
          <OSIcon name="folder" size={16} /> Explorer
        </button>
      </header>
      <div className={styles.scroll}>
        {!entry ? (
          <EmptyState
            title={path ? 'File not found' : 'Choose a document'}
            action={
              <button className={styles.button} type="button" onClick={() => props.openPath(HOME)}>
                Open Explorer
              </button>
            }
          >
            {path
              ? 'This path is not a file in the current virtual workspace.'
              : 'Browse the virtual workspace to open a document or image.'}
          </EmptyState>
        ) : entry.kind === 'directory' ? (
          <EmptyState
            title="This is a folder"
            action={
              <button
                className={styles.button}
                type="button"
                onClick={() => props.openPath(entry.path)}
              >
                Browse folder
              </button>
            }
          >
            Folders open in Project Explorer.
          </EmptyState>
        ) : entry.mime?.startsWith('image/') && entry.assetUrl ? (
          <figure className={styles.imagePreview}>
            <img src={entry.assetUrl} alt={entry.description ?? entry.name} />
            <figcaption>{entry.description ?? entry.name}</figcaption>
          </figure>
        ) : entry.mime === 'application/pdf' && entry.assetUrl ? (
          <div className={styles.pdfPreview}>
            <OSIcon name="file" size={48} />
            <h2>Original résumé PDF</h2>
            <p>Open the original document in your PDF viewer or download a copy.</p>
            <div className={styles.actions}>
              <a className={styles.primaryButton} href={entry.assetUrl} download>
                Download PDF
              </a>
              <a
                className={styles.button}
                href={entry.assetUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open PDF <OSIcon name="arrow" size={14} />
              </a>
              <button
                className={styles.button}
                type="button"
                onClick={() => props.openApp('resume')}
              >
                Read Resume.app
              </button>
            </div>
          </div>
        ) : entry.content ? (
          <article className={styles.document}>
            <ReadableText content={entry.content} />
          </article>
        ) : (
          <EmptyState title="No preview available" action={null}>
            This virtual entry has no readable text or supported local preview.
          </EmptyState>
        )}
      </div>
    </div>
  );
}

export function VaultApp(props: DesktopAppProps) {
  const feed = props.feed.data;
  const label = portfolioFeedLabel(feed);
  return (
    <div className={`${styles.app} ${styles.vault}`}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>Hidden Vault / optional builder layer</span>
          <h1>
            <OSIcon name="vault" size={26} /> You found the side track.
          </h1>
        </div>
        <button
          className={styles.button}
          type="button"
          onClick={() => props.openPath(`${HOME}/projects`)}
        >
          <OSIcon name="folder" size={16} /> Explorer
        </button>
      </header>
      <div className={styles.scroll}>
        <div className={styles.document}>
          <p className={styles.lead}>
            The treasure is a closer look at the builder: public projects, small experiments, and
            the decisions behind this desktop. No password. No detour required to find the résumé.
          </p>
          <div className={styles.feedStatus} role="status">
            <span className={styles.source}>{label}</span>
            {props.feed.isLoading && (
              <p>Refreshing GitHub metadata. The current source is shown above.</p>
            )}
            {(props.feed.notice || feed.message) && <p>{props.feed.notice || feed.message}</p>}
          </div>
          <div className={styles.vaultActions}>
            <button
              className={styles.button}
              type="button"
              onClick={() => props.openApp('project', { projectId: 'cj-os' })}
            >
              Investigate CJ OS
            </button>
            <button className={styles.button} type="button" onClick={() => props.openApp('lab')}>
              Open AI Lab
            </button>
            <button className={styles.button} type="button" onClick={() => props.openApp('resume')}>
              Resume & contact
            </button>
            <ExternalLink href={feed.profile.url}>GitHub profile</ExternalLink>
          </div>
          <section className={styles.section}>
            <h2>
              {feed.source === 'github' ? 'Public GitHub artifacts' : 'Curated fallback artifacts'}
            </h2>
            <p className={styles.muted}>
              {feed.source === 'github'
                ? 'Descriptions, language, topics, and counters are repository metadata—not verified architecture or production results.'
                : 'These are local portfolio artifacts. They are not live pinned repositories; placeholder counters and dates are not presented as activity.'}
            </p>
            <div className={styles.artifactGrid}>
              {feed.items.map((item, index) => {
                const id = `${feed.source === 'github' ? 'github' : 'fallback'}:${item.id}`;
                const project = props.projects.find(candidate => candidate.id === id);
                const date = new Date(item.updatedAt);
                return (
                  <article className={styles.artifact} key={`${item.id}-${index}`}>
                    <div className={styles.artifactTop}>
                      <OSIcon name="folder" size={22} />
                      <span>{label}</span>
                    </div>
                    <h3>{item.name}</h3>
                    <p>{item.description || 'No description was supplied by this source.'}</p>
                    <div className={styles.tags}>
                      {item.primaryLanguage && <span>{item.primaryLanguage.name}</span>}
                      {item.topics.map((topic, topicIndex) => (
                        <span key={`${topic}-${topicIndex}`}>{topic}</span>
                      ))}
                    </div>
                    {feed.source === 'github' && (
                      <p className={styles.repoMeta}>
                        {item.stargazerCount} stars · {item.forkCount} forks
                        {Number.isFinite(date.getTime()) && (
                          <>
                            {' · Updated '}
                            <time dateTime={item.updatedAt}>
                              {date.toLocaleDateString('en', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </time>
                          </>
                        )}
                      </p>
                    )}
                    <div className={styles.artifactLinks}>
                      {project && (
                        <button
                          className={styles.button}
                          type="button"
                          onClick={() => props.openApp('project', { projectId: project.id })}
                        >
                          Investigate
                        </button>
                      )}
                      <ExternalLink href={item.url}>
                        {feed.source === 'github' ? 'Repository' : 'Project artifact'}
                      </ExternalLink>
                      <ExternalLink href={item.homepageUrl}>Published homepage</ExternalLink>
                    </div>
                  </article>
                );
              })}
            </div>
            {!feed.items.length && (
              <p className={styles.note}>
                This feed has no artifacts right now. The local CJ OS investigation and AI Lab
                remain available above.
              </p>
            )}
          </section>
          <aside className={styles.note}>
            <h2>A small map back</h2>
            <p>
              Project Explorer, Terminal, and this Vault all open the same case studies through the
              shared desktop registry. The map is a playful side track—not a different website.
            </p>
            <button
              className={styles.button}
              type="button"
              onClick={() => props.openPath(`${HOME}/writing/design notes.md`)}
            >
              Read the design notes
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
