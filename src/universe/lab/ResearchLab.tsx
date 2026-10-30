import { useMemo, useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import { parseUniverseUrl, routeHref } from '../navigation';
import type { UniverseContent, UniverseNavigation } from '../types';
import { retrieveResearch } from './retrieval';
import type { ResearchDocument, ResearchResult } from './retrieval';
import styles from './ResearchLab.module.css';

interface Props {
  content: UniverseContent;
  navigation: UniverseNavigation;
  navigate: (patch: Partial<UniverseNavigation>) => void;
  onRun?: (matches: number) => void;
}
export function ResearchLab({ content, navigation, navigate, onRun }: Props) {
  const documents = useMemo<ResearchDocument[]>(
    () => [
      ...content.projects.map(project => ({
        id: project.id,
        title: project.title,
        href: `/projects/${project.slug}`,
        text: [
          project.summary,
          project.problem,
          ...project.architecture,
          ...project.decisions,
          ...project.technologies,
          ...project.tradeoffs,
        ].join('\n\n'),
      })),
      ...content.articles.map(article => ({
        id: article.slug,
        title: article.title,
        href: `/writing/${article.slug}`,
        text: [
          article.summary,
          ...article.sections.flatMap(section => [section.heading, ...section.paragraphs]),
        ].join('\n\n'),
      })),
    ],
    [content]
  );
  const [query, setQuery] = useState('retrieval evidence');
  const [topK, setTopK] = useState(3);
  const [run, setRun] = useState<{
    result: ResearchResult;
    duration: number;
    query: string;
  } | null>(null);
  const [stage, setStage] = useState(0);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const start = performance.now();
    const result = retrieveResearch(documents, query, topK);
    setRun({ result, duration: performance.now() - start, query });
    onRun?.(result.matches.length);
    setStage(2);
  };
  const source = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(parseUniverseUrl(href, navigation.mode));
  };
  const explanations = [
    `The corpus contains ${documents.length} public project investigations and studio notes. No private files, PDF parsing, or web search.`,
    'Words are normalized, common stop words removed, and term frequency weighted by inverse document frequency. This is lexical matching, not an embedding model.',
    'Cosine similarity ranks the actual document vectors. Scores measure word overlap; they are not model confidence or evaluation benchmarks.',
    'The experiment quotes source text. It never generates a claimed LLM answer. An unsupported query returns an explicit no-match result.',
  ];
  return (
    <section className={styles.lab} aria-label="Interactive retrieval lab">
      <div className={styles.scope}>
        <span>WORKING LOCAL EXPERIMENT</span>
        <p>Retrieval is real. Generation is intentionally absent.</p>
      </div>
      <form className={styles.queryForm} onSubmit={submit}>
        <label htmlFor="research-query">Search query</label>
        <textarea
          id="research-query"
          value={query}
          onChange={event => setQuery(event.target.value)}
          maxLength={400}
          rows={3}
        />
        <div className={styles.samples}>
          {['distributed systems', 'retrieval evidence', 'camera accessibility'].map(sample => (
            <button key={sample} type="button" onClick={() => setQuery(sample)}>
              {sample}
            </button>
          ))}
        </div>
        <div className={styles.queryActions}>
          <label>
            Results
            <select
              aria-label="Results"
              value={topK}
              onChange={event => setTopK(Number(event.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map(value => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={!query.trim()}>
            Run retrieval <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>
      <div className={styles.pipeline} aria-label="Inspect the retrieval pipeline">
        {['Corpus', 'Vectorize', 'Retrieve', 'Evidence'].map((label, index) => (
          <button key={label} aria-pressed={stage === index} onClick={() => setStage(index)}>
            <span>0{index + 1}</span>
            {label}
          </button>
        ))}
      </div>
      <p className={styles.explanation}>{explanations[stage]}</p>
      {run ? (
        <div className={styles.results} aria-label="Retrieval results" role="region">
          <div className={styles.metrics}>
            <span>
              <b>{run.result.indexed}</b> indexed documents
            </span>
            <span>
              <b>{run.duration.toFixed(3)} ms</b> measured retrieval
            </span>
            <span>
              <b>{run.result.matches.length}</b> returned sources
            </span>
          </div>
          <h3>
            {run.result.abstained
              ? 'No supported evidence found.'
              : 'Evidence, not a generated answer.'}
          </h3>
          <p className={styles.runNotice}>
            Query: “{run.query}”.{' '}
            {query !== run.query
              ? 'Inputs changed; run again to refresh.'
              : 'All results below come from the supplied portfolio corpus.'}
          </p>
          {!run.result.abstained && (
            <div className={styles.matches}>
              {run.result.matches.map((match, index) => {
                const href = routeHref(parseUniverseUrl(match.document.href, navigation.mode));
                return (
                  <article key={match.document.id}>
                    <header>
                      <span>0{index + 1}</span>
                      <a href={href} onClick={event => source(event, href)}>
                        {match.document.title} ↗
                      </a>
                      <strong>{match.score.toFixed(4)}</strong>
                    </header>
                    <div className={styles.scoreTrack}>
                      <i style={{ width: `${match.score * 100}%` }} />
                    </div>
                    <blockquote>{match.excerpt}</blockquote>
                    <small>
                      Matched: {match.terms.join(', ')} · cosine similarity, not confidence
                    </small>
                  </article>
                );
              })}
            </div>
          )}
          {run.result.abstained && (
            <p>
              No lexical match exists in these sources. Try a portfolio technology or project. The
              lab will not invent an answer.
            </p>
          )}
        </div>
      ) : (
        <div className={styles.empty}>
          Change the input and run the pipeline. No results or timings are simulated.
        </div>
      )}
      <details className={styles.limits}>
        <summary>What this demonstration can—and cannot—show</summary>
        <p>
          Local TF-IDF retrieval can miss synonyms and paraphrases, and shared words can be
          misleading. It performs no autonomous planning, model inference, semantic embedding, or
          live web lookup. Agentic AI, LLMs, and RAG remain part of my professional toolkit; this
          experiment exposes one bounded retrieval stage honestly.
        </p>
        <p>
          Bounded to 40 public documents, 14,000 characters per document, 400 query characters, and
          six returned sources. Timings are local observations, not production benchmarks.
        </p>
      </details>
    </section>
  );
}
