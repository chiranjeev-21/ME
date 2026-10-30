import { useMemo, useState } from 'react';
import type { UniverseArticle, WorldViewProps } from '../types';
import { DestinationLink, Eyebrow, MissingDocument } from './shared';

function ReadingRoom({
  article,
  ...props
}: Pick<WorldViewProps, 'navigation' | 'navigate'> & { article: UniverseArticle }) {
  return (
    <article className="uw-reading-room">
      <DestinationLink {...props} target={{ articleSlug: null }} className="uw-back">
        ← The writing archive
      </DestinationLink>
      <header>
        <Eyebrow>{article.kind} / Written for this portfolio</Eyebrow>
        <h1>{article.title}</h1>
        <p className="uw-article-byline">
          By Chiranjeev Singh <span aria-hidden="true">·</span> {article.tags.join(' / ')}
        </p>
      </header>
      <nav className="uw-reading-index" aria-label="In this note">
        <p className="uw-meta">On these pages</p>
        <ol>
          {article.sections.map((section, index) => (
            <li key={section.heading}>
              <a href={`#uw-note-${article.slug}-${index + 1}`}>{section.heading}</a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="uw-article-prose">
        {article.sections.map((section, index) => (
          <section
            key={section.heading}
            id={`uw-note-${article.slug}-${index + 1}`}
            tabIndex={-1}
            data-reveal="paper"
          >
            <span className="uw-meta">{String(index + 1).padStart(2, '0')} /</span>
            <h2>{section.heading}</h2>
            {section.paragraphs.map(paragraph => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.code && (
              <pre>
                <code>{section.code}</code>
              </pre>
            )}
          </section>
        ))}
      </div>
      <footer>
        <span aria-hidden="true">✳</span>
        <p>End of note.</p>
      </footer>
    </article>
  );
}

export function WritingWorld(props: WorldViewProps) {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('All notes');
  const tags = useMemo(
    () => [...new Set(props.content.articles.flatMap(article => article.tags))],
    [props.content.articles]
  );
  const articles = useMemo(
    () =>
      props.content.articles.filter(
        article =>
          (tag === 'All notes' || article.tags.includes(tag)) &&
          `${article.title} ${article.summary} ${article.sections.map(section => section.paragraphs.join(' ')).join(' ')}`
            .toLowerCase()
            .includes(query.trim().toLowerCase())
      ),
    [props.content.articles, query, tag]
  );
  if (props.navigation.articleSlug) {
    const article = props.content.articles.find(item => item.slug === props.navigation.articleSlug);
    return (
      <section className="uw-world uw-writing">
        {article ? (
          <ReadingRoom {...props} article={article} />
        ) : (
          <MissingDocument {...props} kind="article" />
        )}
      </section>
    );
  }
  return (
    <section className="uw-world uw-writing" aria-labelledby="uw-writing-title">
      <header className="uw-writing-header">
        <div className="uw-paper-masthead">
          <span>THE CJ STUDIO</span>
          <span>07 / READING ROOM</span>
        </div>
        <Eyebrow>An archive of decisions</Eyebrow>
        <h1 id="uw-writing-title">
          Notes from
          <br />
          <em>the making.</em>
        </h1>
        <p>Field notes on systems, experiments, and the decisions behind this universe.</p>
        <div className="uw-paper-rule" aria-hidden="true">
          ✳
        </div>
      </header>
      <div className="uw-writing-controls">
        <label className="uw-search">
          <span>Search the archive</span>
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="A question, idea, or phrase"
          />
        </label>
        <label className="uw-topic-select">
          <span>Reading shelf</span>
          <select value={tag} onChange={event => setTag(event.target.value)}>
            <option>All notes</option>
            {tags.map(item => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="uw-result-count" role="status">
        {articles.length} {articles.length === 1 ? 'studio note' : 'studio notes'}
      </p>
      <div className="uw-archive-list">
        {articles.map((article, index) => (
          <article key={article.slug} data-reveal="paper">
            <span className="uw-archive-number" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <Eyebrow>
                {article.kind} / {article.tags.join(' · ')}
              </Eyebrow>
              <h2>
                <DestinationLink {...props} target={{ articleSlug: article.slug }}>
                  {article.title}
                </DestinationLink>
              </h2>
              <p>{article.summary}</p>
            </div>
          </article>
        ))}
      </div>
      {!articles.length && (
        <div className="uw-empty">
          <h2>No notes match that shelf.</h2>
          <p>Search a different phrase, or return to all three studio notes.</p>
          <button
            className="uw-button"
            onClick={() => {
              setQuery('');
              setTag('All notes');
            }}
          >
            Reset archive
          </button>
        </div>
      )}
    </section>
  );
}
