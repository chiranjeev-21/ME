import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { OSIcon } from '../../Icons';
import type { DesktopAppProps } from '../../types';
import { createRetrievalIndex, extractEvidence, retrieve } from './retrieval.ts';
import type { ExtractiveAnswer, RetrievalIndex, RetrievalResult } from './retrieval.ts';
import styles from './LabApp.module.css';

interface CompletedRun {
  result: RetrievalResult;
  answer: ExtractiveAnswer;
  durationMs: number;
  index: RetrievalIndex;
}

export function LabApp(props: DesktopAppProps) {
  const index = useMemo(() => createRetrievalIndex(props.files), [props.files]);
  const [query, setQuery] = useState((props.window.payload.command ?? 'Agentic AI').slice(0, 400));
  const [topK, setTopK] = useState(3);
  const [run, setRun] = useState<CompletedRun | null>(null);
  const sequence = useRef(0);

  useEffect(() => {
    if (props.window.payload.command !== undefined) {
      setQuery(props.window.payload.command.slice(0, 400));
    }
  }, [props.window.payload.command, props.window.launchCount]);

  function runExperiment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const start = performance.now();
    const result = retrieve(index, query, topK);
    const answer = extractEvidence(result);
    const durationMs = Math.max(0, performance.now() - start);
    const at = Date.now();
    sequence.current += 1;
    setRun({ result, answer, durationMs, index });
    props.recordLabRun({
      id: `lab-${at}-${sequence.current}-${Math.round(start * 1000)}`,
      query: result.query,
      at,
      durationMs,
      documents: index.documentCount,
      topScore: result.topScore,
      matched: result.matched,
    });
  }

  const changed =
    run && (run.result.query !== query || run.result.topK !== topK || run.index !== index);
  const samples = ['Agentic AI', 'Which projects use TypeScript?', 'Production server uptime'];

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.eyebrow}>
          <OSIcon name="spark" size={16} /> AI LAB / LOCAL EXPERIMENT
        </div>
        <h1>Retrieval, with the lid off.</h1>
        <p className={styles.scope}>
          Local lexical retrieval / extractive RAG sandbox. No remote LLM, semantic embedding model,
          or autonomous agent.
        </p>
        <p className={styles.skill}>
          Portfolio skill: <strong>Agentic AI</strong>. This experiment demonstrates only the
          retrieval and evidence stages, not an agent implementation.
        </p>
      </header>

      <div className={styles.workspace}>
        <section className={styles.card} aria-labelledby="lab-query-heading">
          <h2 id="lab-query-heading">
            <span>01</span> Ask the corpus
          </h2>
          <form onSubmit={runExperiment} className={styles.form}>
            <label htmlFor="lab-query">Search query</label>
            <textarea
              id="lab-query"
              value={query}
              onChange={event => setQuery(event.target.value)}
              maxLength={400}
              rows={3}
              placeholder="Try a skill, project, or technology…"
              aria-describedby="lab-query-help"
            />
            <p id="lab-query-help" className={styles.help}>
              Search public virtual text files only. Edit the query, then run to recompute.
            </p>
            <div className={styles.samples} aria-label="Sample queries; select to edit">
              {samples.map(sample => (
                <button key={sample} type="button" onClick={() => setQuery(sample)}>
                  {sample}
                </button>
              ))}
            </div>
            <div className={styles.formFooter}>
              <label className={styles.topK} htmlFor="lab-top-k">
                Results
                <select
                  id="lab-top-k"
                  value={topK}
                  onChange={event => setTopK(Number(event.target.value))}
                >
                  {Array.from({ length: 8 }, (_, position) => position + 1).map(value => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <button className={styles.primary} type="submit" disabled={!query.trim()}>
                <OSIcon name="search" size={16} /> Run retrieval
              </button>
            </div>
          </form>
        </section>

        <section className={styles.card} aria-labelledby="lab-pipeline-heading">
          <h2 id="lab-pipeline-heading">
            <span>02</span> The actual pipeline
          </h2>
          <ol className={styles.pipeline}>
            <li>
              <b>Read</b>
              <span>
                {index.documentCount} public text files → {index.chunks.length} chunks
              </span>
            </li>
            <li>
              <b>Weight</b>
              <span>Normalized words, stop-word removal, TF-IDF</span>
            </li>
            <li>
              <b>Rank</b>
              <span>Cosine similarity; return at most {topK} positive matches</span>
            </li>
            <li>
              <b>Extract / abstain</b>
              <span>Quote a chunk only if every query term occurs in it</span>
            </li>
          </ol>
          <details className={styles.limitations}>
            <summary>Scope &amp; meaningful failure cases</summary>
            <p>
              Scores measure lexical overlap, not confidence. Paraphrases and synonyms may miss;
              shared words, negation, and unrelated context can mislead. There is no reasoning, tool
              use, live web lookup, or generated answer.
            </p>
            <p>
              Bounds: 24 public text files, 96 chunks, 16,000 characters per file, 900 characters
              per chunk, and 400 query characters. No hidden or binary files.
              {index.truncated ? ' The current corpus reached a bound; some text was omitted.' : ''}
            </p>
          </details>
        </section>
      </div>

      {!index.chunks.length && (
        <section className={styles.empty}>
          <h2>No public text corpus is available.</h2>
          <p>
            Only readable, non-hidden virtual files are indexed. Images and PDF assets are not
            parsed.
          </p>
          <button type="button" onClick={() => props.openApp('explorer')}>
            Inspect Explorer
          </button>
        </section>
      )}

      <div className={styles.runStatus} role="status">
        {run
          ? `${run.result.matched} matching chunks; ${run.durationMs.toFixed(3)} ms local search and extraction.${changed ? ' Inputs or corpus changed — run again to refresh.' : ''}`
          : 'Ready. Nothing has been inferred or measured yet.'}
      </div>

      {run && (
        <section className={styles.results} aria-label="Retrieval results">
          <div className={styles.sectionHeading}>
            <h2 id="lab-results-heading">Results for “{run.result.query}”</h2>
            <span className={styles.tag}>
              {run.answer.status === 'abstain' ? 'ABSTAINED' : 'SOURCE EXCERPTS'}
            </span>
          </div>
          <dl className={styles.metrics}>
            <div>
              <dt>Search + extraction</dt>
              <dd>
                {run.durationMs.toFixed(3)} <small>ms</small>
              </dd>
            </div>
            <div>
              <dt>Indexed documents</dt>
              <dd>{run.index.documentCount}</dd>
            </div>
            <div>
              <dt>Positive chunk matches</dt>
              <dd>{run.result.matched}</dd>
            </div>
            <div>
              <dt>Top cosine score</dt>
              <dd>{run.result.topScore.toFixed(4)}</dd>
            </div>
          </dl>
          <section className={styles.answer} aria-labelledby="lab-answer-heading">
            <h3 id="lab-answer-heading">
              {run.answer.status === 'abstain'
                ? 'No supported extractive answer'
                : 'Evidence, not a generated answer'}
            </h3>
            <p>{run.answer.explanation}</p>
            {run.answer.evidence.map(match => (
              <figure key={match.chunk.id}>
                <blockquote>{match.chunk.text}</blockquote>
                <figcaption>
                  <button type="button" onClick={() => props.openPath(match.chunk.sourcePath)}>
                    <OSIcon name="file" size={14} /> {match.chunk.sourcePath}
                  </button>
                  <span>chunk {match.chunk.part}</span>
                </figcaption>
              </figure>
            ))}
          </section>
          {run.result.results.length > 0 && (
            <div className={styles.ranking}>
              <h3>
                Ranked chunks <small>cosine scores, not answer confidence</small>
              </h3>
              <ol>
                {run.result.results.map((match, position) => (
                  <li key={match.chunk.id}>
                    <details>
                      <summary>
                        <span className={styles.rank}>{String(position + 1).padStart(2, '0')}</span>
                        <span className={styles.matchTitle}>
                          <b>{match.chunk.title}</b>
                          <small>
                            chunk {match.chunk.part} · {match.matchedTerms.length}/
                            {run.result.queryTerms.length} query terms
                          </small>
                        </span>
                        <span className={styles.score}>{match.score.toFixed(4)}</span>
                      </summary>
                      <div className={styles.chunkBody}>
                        <p>{match.chunk.text}</p>
                        <p className={styles.help}>Matched: {match.matchedTerms.join(', ')}</p>
                        <button
                          type="button"
                          onClick={() => props.openPath(match.chunk.sourcePath)}
                        >
                          Open source: {match.chunk.sourcePath}
                        </button>
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}

      <details className={styles.corpus}>
        <summary>Inspect indexed source chunks ({index.chunks.length})</summary>
        <p className={styles.help}>
          Quotes are normalized from the supplied virtual files, not downloaded or generated.
        </p>
        <div className={styles.corpusGrid}>
          {index.chunks.map(chunk => (
            <article key={chunk.id}>
              <button type="button" onClick={() => props.openPath(chunk.sourcePath)}>
                {chunk.sourcePath}
              </button>
              <small>
                Chunk {chunk.part} · {chunk.text.length} characters
              </small>
              <p>{chunk.text}</p>
            </article>
          ))}
        </div>
      </details>
    </div>
  );
}
