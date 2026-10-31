import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { AppLink } from '../../app/router.tsx';
import type { PortfolioContent } from '../../data/types.ts';
import { retrieveResearch } from '../../lib/retrieval.ts';
import type { ResearchDocument, ResearchResult } from '../../lib/retrieval.ts';
import styles from './RetrievalLab.module.css';

const STAGES = ['Corpus', 'Vectorize', 'Retrieve', 'Evidence'];

export function RetrievalLab({ content }: { content: PortfolioContent }) {
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
      ...content.notes.map(note => ({
        id: note.slug,
        title: note.title,
        href: `/writing/${note.slug}`,
        text: [note.summary, ...note.sections.flatMap(s => [s.heading, ...s.paragraphs])].join(
          '\n\n'
        ),
      })),
    ],
    [content]
  );
  const [query, setQuery] = useState('retrieval evidence');
  const [topK, setTopK] = useState(3);
  const [stage, setStage] = useState(0);
  const [run, setRun] = useState<{
    result: ResearchResult;
    duration: number;
    query: string;
  } | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const start = performance.now();
    const result = retrieveResearch(documents, query, topK);
    setRun({ result, duration: performance.now() - start, query });
    setStage(3);
  };

  const explanations = [
    `The corpus holds ${documents.length} public case studies, repository dossiers and studio notes. No private files, PDF parsing, or web search.`,
    'Words are normalised, common stop words removed, and term frequency weighted by inverse document frequency. Lexical matching — not an embedding model.',
    'Cosine similarity ranks the document vectors. Scores measure word overlap; they are not model confidence or benchmarks.',
    'The experiment quotes source text and never generates an answer. An unsupported query returns an explicit no-match.',
  ];

  return (
    <div className={styles.lab}>
      <form className={styles.form} onSubmit={submit}>
        <label htmlFor="lab-query" className="u-label">
          Query
        </label>
        <div className={styles.inputRow}>
          <input
            id="lab-query"
            value={query}
            onChange={event => setQuery(event.target.value)}
            maxLength={400}
            autoComplete="off"
            spellCheck={false}
          />
          <label className={styles.topK}>
            <span className="u-sr">Number of results</span>
            <select value={topK} onChange={event => setTopK(Number(event.target.value))}>
              {[1, 2, 3, 4, 5, 6].map(value => (
                <option key={value} value={value}>
                  top {value}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={!query.trim()}>
            Run
          </button>
        </div>
        <div className={styles.samples}>
          <span className="u-label">Try</span>
          {['distributed systems', 'retrieval evidence', 'accessibility', 'computer vision'].map(
            sample => (
              <button key={sample} type="button" onClick={() => setQuery(sample)}>
                {sample}
              </button>
            )
          )}
        </div>
      </form>

      <div className={styles.pipeline} role="group" aria-label="Pipeline stages">
        {STAGES.map((label, index) => (
          <button
            key={label}
            type="button"
            aria-pressed={stage === index}
            onClick={() => setStage(index)}
          >
            <span>0{index + 1}</span>
            {label}
          </button>
        ))}
      </div>
      <p className={styles.explanation} aria-live="polite">
        {explanations[stage]}
      </p>

      <div
        className={styles.output}
        role="region"
        aria-label="Retrieval results"
        aria-live="polite"
      >
        {!run ? (
          <p className={styles.empty}>Run the query. No results or timings are simulated.</p>
        ) : (
          <>
            <dl className={styles.metrics}>
              <div>
                <dt>indexed</dt>
                <dd>{run.result.indexed}</dd>
              </div>
              <div>
                <dt>measured</dt>
                <dd>{run.duration.toFixed(3)} ms</dd>
              </div>
              <div>
                <dt>returned</dt>
                <dd>{run.result.matches.length}</dd>
              </div>
            </dl>
            <p className={styles.verdict}>
              {run.result.abstained
                ? 'No supported evidence found.'
                : 'Evidence, not a generated answer.'}
              {query !== run.query && <span> Inputs changed — run again to refresh.</span>}
            </p>
            {run.result.abstained ? (
              <p className={styles.empty}>
                No lexical match exists in these sources. The lab will not invent an answer.
              </p>
            ) : (
              <ol className={styles.matches}>
                {run.result.matches.map(match => (
                  <li key={match.document.id}>
                    <div className={styles.matchHead}>
                      <AppLink href={match.document.href}>{match.document.title}</AppLink>
                      <span>{match.score.toFixed(4)}</span>
                    </div>
                    <div className={styles.score} aria-hidden="true">
                      <i style={{ transform: `scaleX(${match.score})` }} />
                    </div>
                    <blockquote>{match.excerpt}</blockquote>
                    <p className={styles.terms}>
                      matched: {match.terms.join(', ')} · cosine similarity, not confidence
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>
      <details className={styles.limits}>
        <summary>What this can — and cannot — show</summary>
        <p>
          Local TF-IDF retrieval misses synonyms and paraphrases, and shared words can mislead. It
          performs no planning, model inference, semantic embedding, or web lookup. Agentic AI, LLMs
          and RAG remain part of my professional toolkit; this exposes one bounded retrieval stage
          honestly. Bounded to 40 documents, 14,000 characters each, 400-character queries and six
          results.
        </p>
      </details>
    </div>
  );
}
