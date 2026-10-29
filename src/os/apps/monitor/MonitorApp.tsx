import { useEffect, useMemo, useState } from 'react';
import { OSIcon } from '../../Icons';
import type { DesktopAppProps } from '../../types';
import styles from './MonitorApp.module.css';

interface BrowserObservation {
  at: number;
  online: boolean | null;
  domReadyMs: number | null;
  loadEventMs: number | null;
  bufferedResources: number | null;
}

function readBrowserObservation(): BrowserObservation {
  const timing =
    typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function'
      ? (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)
      : undefined;
  return {
    at: Date.now(),
    online: typeof navigator === 'undefined' ? null : navigator.onLine,
    domReadyMs:
      timing && timing.domContentLoadedEventEnd > 0
        ? timing.domContentLoadedEventEnd - timing.startTime
        : null,
    loadEventMs: timing && timing.loadEventEnd > 0 ? timing.loadEventEnd - timing.startTime : null,
    bufferedResources:
      typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function'
        ? performance.getEntriesByType('resource').length
        : null,
  };
}

function formatTime(epoch: number): string {
  return Number.isFinite(epoch) ? new Date(epoch).toLocaleString() : 'Unavailable';
}

function formatUptime(startedAt: number, now: number): string {
  if (!Number.isFinite(startedAt) || startedAt <= 0 || startedAt > now) return 'Unavailable';
  const seconds = Math.floor((now - startedAt) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m ${seconds % 60}s`;
}

function milliseconds(value: number | null): string {
  return value !== null && Number.isFinite(value) && value >= 0
    ? `${value.toFixed(2)} ms`
    : 'Unavailable';
}

export function MonitorApp(props: DesktopAppProps) {
  const [browser, setBrowser] = useState(readBrowserObservation);

  useEffect(() => {
    if (!props.visible) return;
    const update = () => setBrowser(readBrowserObservation());
    update();
    const timer = window.setInterval(update, 1000);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, [props.visible]);

  const { data, isLoading, notice } = props.feed;
  const isGitHub = data.source === 'github';
  const feedSummary = useMemo(() => {
    const languages = new Map<string, number>();
    let stars = 0;
    let latestUpdate = Number.NEGATIVE_INFINITY;
    for (const item of data.items) {
      const language = item.primaryLanguage?.name ?? 'Not reported';
      languages.set(language, (languages.get(language) ?? 0) + 1);
      stars += item.stargazerCount;
      const updatedAt = Date.parse(item.updatedAt);
      if (Number.isFinite(updatedAt)) latestUpdate = Math.max(latestUpdate, updatedAt);
    }
    return {
      stars,
      latestUpdate,
      languages: [...languages.entries()].sort(
        (left, right) => right[1] - left[1] || left[0].localeCompare(right[0])
      ),
    };
  }, [data.items]);
  const recentRuns = useMemo(
    () => [...props.labRuns].sort((left, right) => right.at - left.at).slice(0, 8),
    [props.labRuns]
  );
  const meanRunMs = props.labRuns.length
    ? props.labRuns.reduce((sum, run) => sum + run.durationMs, 0) / props.labRuns.length
    : null;
  const selection = !isGitHub
    ? 'Local fallback artifacts — not GitHub pins'
    : data.selection === 'pinned'
      ? 'Pinned repositories'
      : data.selection === 'recent'
        ? 'Recent repositories — not pins'
        : 'Selection not supplied — pins not assumed';

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.eyebrow}>
          <OSIcon name="activity" size={16} /> SYSTEM MONITOR
        </div>
        <div className={styles.titleRow}>
          <h1>Observed, not assumed.</h1>
          <span className={styles.scope}>BROWSER + PUBLIC DATA</span>
        </div>
        <p>
          Desktop state, GitHub response metadata, and measured local retrieval runs. No server
          agents.
        </p>
      </header>

      <section className={styles.session} aria-labelledby="monitor-session-heading">
        <div className={styles.sectionHeading}>
          <h2 id="monitor-session-heading">Desktop session</h2>
          <span className={styles.source}>Source: local window manager</span>
        </div>
        <dl className={styles.sessionGrid}>
          <div>
            <dt>Session uptime</dt>
            <dd>{formatUptime(props.system.startedAt, browser.at)}</dd>
          </div>
          <div>
            <dt>Open windows</dt>
            <dd>{props.system.windows}</dd>
          </div>
          <div>
            <dt>Minimized windows</dt>
            <dd>{props.system.minimized}</dd>
          </div>
          <div>
            <dt>Viewport · CSS px</dt>
            <dd>
              {props.system.viewport.width} × {props.system.viewport.height}
            </dd>
          </div>
          <div>
            <dt>Hostname</dt>
            <dd>{props.system.hostname || 'Unavailable'}</dd>
          </div>
          <div>
            <dt>CJ OS version</dt>
            <dd>{props.system.version || 'Unavailable'}</dd>
          </div>
        </dl>
        <p className={styles.note}>
          Session started {formatTime(props.system.startedAt)}. This is the local desktop session,
          not service uptime. Sampling pauses while this window is hidden.
        </p>
      </section>

      {browser.online === false && (
        <div className={styles.notice} role="status">
          Browser reports offline. GitHub content may be a previous response or local fallback.
          Local retrieval remains available.
        </div>
      )}

      <section className={styles.feed} aria-labelledby="monitor-feed-heading">
        <div className={styles.sectionHeading}>
          <h2 id="monitor-feed-heading">
            <OSIcon name="folder" size={16} /> GitHub feed
          </h2>
          <span className={styles.badge}>
            {isLoading ? 'LOADING' : isGitHub ? 'GITHUB RESPONSE' : 'LOCAL FALLBACK'}
          </span>
        </div>
        <dl className={styles.provenance}>
          <div>
            <dt>Source</dt>
            <dd>
              {isGitHub
                ? 'GitHub API response (may be cached)'
                : isLoading
                  ? 'Bundled local fallback — awaiting GitHub'
                  : 'Bundled local fallback — live GitHub unavailable'}
            </dd>
          </div>
          <div>
            <dt>Selection</dt>
            <dd>{selection}</dd>
          </div>
          <div>
            <dt>Request state</dt>
            <dd>{isLoading ? 'Loading; displayed data is provisional' : 'Loading complete'}</dd>
          </div>
          <div>
            <dt>Profile</dt>
            <dd>
              <a href={data.profile.url} target="_blank" rel="noopener noreferrer">
                @{data.profile.login}
                <OSIcon name="arrow" size={12} />
              </a>
            </dd>
          </div>
        </dl>
        {(notice || data.message || !isGitHub) && (
          <div className={styles.notice} role="status">
            {!isGitHub && (
              <p>
                {isLoading
                  ? 'Local fallback shown while the feed loads.'
                  : 'Live GitHub data is unavailable. Fallback metadata is not a current repository measurement.'}
              </p>
            )}
            {notice && <p>{notice}</p>}
            {data.message && data.message !== notice && <p>{data.message}</p>}
          </div>
        )}
        <dl className={styles.feedMetrics}>
          <div>
            <dt>{isGitHub ? 'Repositories in response' : 'Local artifacts in response'}</dt>
            <dd>{data.items.length}</dd>
          </div>
          <div>
            <dt>{isGitHub ? 'Stars across these repositories' : 'Live GitHub star count'}</dt>
            <dd>{isGitHub ? feedSummary.stars.toLocaleString() : 'Unavailable'}</dd>
          </div>
          <div>
            <dt>
              {isGitHub ? 'Latest repository metadata update' : 'Latest fallback metadata date'}
            </dt>
            <dd className={styles.dateValue}>{formatTime(feedSummary.latestUpdate)}</dd>
          </div>
        </dl>
        <div className={styles.languages}>
          <h3>{isGitHub ? 'Reported primary languages' : 'Fallback language / category labels'}</h3>
          <ul>
            {feedSummary.languages.map(([language, count]) => (
              <li key={language}>
                {language}
                <span>{count}</span>
              </li>
            ))}
          </ul>
          <p className={styles.note}>
            Counts of feed items, not code proportions or the account’s complete repository
            inventory.
          </p>
        </div>
        {data.items.length > 0 ? (
          <div className={styles.repoList}>
            {data.items.map(item => (
              <article key={item.id}>
                <div>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.name}
                    <OSIcon name="arrow" size={12} />
                  </a>
                  <p>
                    {item.primaryLanguage?.name ?? 'Language not reported'}
                    {isGitHub
                      ? ` · ${item.stargazerCount.toLocaleString()} stars · ${item.forkCount.toLocaleString()} forks`
                      : ' · local artifact metadata'}
                  </p>
                </div>
                <div className={styles.repoUpdated}>
                  <span>{isGitHub ? 'Repository updated' : 'Metadata date'}</span>
                  <time dateTime={item.updatedAt}>{formatTime(Date.parse(item.updatedAt))}</time>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>The supplied feed contains no items.</p>
        )}
        <p className={styles.note}>
          Source: props.feed. Repository updates and stars are not deployment telemetry. The feed
          does not supply a fetch timestamp; freshness cannot be inferred here.
        </p>
      </section>

      <div className={styles.twoColumns}>
        <section className={styles.card} aria-labelledby="monitor-browser-heading">
          <div className={styles.sectionHeading}>
            <h2 id="monitor-browser-heading">Browser document</h2>
            <span className={styles.source}>Performance API</span>
          </div>
          <dl className={styles.rows}>
            <div>
              <dt>DOM ready after navigation</dt>
              <dd>{milliseconds(browser.domReadyMs)}</dd>
            </div>
            <div>
              <dt>Load event after navigation</dt>
              <dd>{milliseconds(browser.loadEventMs)}</dd>
            </div>
            <div>
              <dt>Resource entries in browser buffer</dt>
              <dd>{browser.bufferedResources ?? 'Unavailable'}</dd>
            </div>
            <div>
              <dt>Browser network hint</dt>
              <dd>
                {browser.online === null
                  ? 'Unavailable'
                  : browser.online
                    ? 'Reports online'
                    : 'Reports offline'}
              </dd>
            </div>
          </dl>
          <p className={styles.note}>
            Navigation Timing for this document only, not a benchmark. Resource buffers may be
            incomplete. Network hint: navigator.onLine; online does not prove a server is reachable.
            CPU, RAM, and FPS are not instrumented.
          </p>
        </section>

        <section className={styles.card} aria-labelledby="monitor-server-heading">
          <div className={styles.sectionHeading}>
            <h2 id="monitor-server-heading">Production / infrastructure</h2>
          </div>
          <dl className={styles.rows}>
            <div>
              <dt>Production server health</dt>
              <dd>Not instrumented</dd>
            </div>
            <div>
              <dt>Build / CI status</dt>
              <dd>Not instrumented</dd>
            </div>
            <div>
              <dt>Deployment status</dt>
              <dd>Not instrumented</dd>
            </div>
          </dl>
          <p className={styles.note}>
            No health probes, build results, or deployment API are connected. No production-health
            conclusion is available.
          </p>
          <button type="button" onClick={() => props.openApp('explorer')}>
            <OSIcon name="folder" size={14} /> Open Project Explorer
          </button>
        </section>
      </div>

      <section className={styles.lab} aria-labelledby="monitor-lab-heading">
        <div className={styles.sectionHeading}>
          <h2 id="monitor-lab-heading">
            <OSIcon name="spark" size={16} /> Local experiment log
          </h2>
          <button type="button" onClick={() => props.openApp('lab')}>
            Open AI Lab <OSIcon name="arrow" size={13} />
          </button>
        </div>
        <dl className={styles.labMetrics}>
          <div>
            <dt>Recorded runs available</dt>
            <dd>{props.labRuns.length}</dd>
          </div>
          <div>
            <dt>Mean search + extraction</dt>
            <dd>{milliseconds(meanRunMs)}</dd>
          </div>
        </dl>
        <p className={styles.note}>
          Source: local runs, recorded with performance.now() in this browser. Includes no-match
          runs. These are local observations, not model latency, benchmark scores, or server
          metrics.
        </p>
        {recentRuns.length ? (
          <ol className={styles.runList} aria-label="Latest eight local retrieval runs">
            {recentRuns.map(run => (
              <li key={run.id}>
                <div className={styles.runQuery}>
                  <button
                    type="button"
                    onClick={() => props.openApp('lab', { command: run.query })}
                  >
                    {run.query || '(empty query)'}
                  </button>
                  <time dateTime={new Date(run.at).toISOString()}>{formatTime(run.at)}</time>
                </div>
                <dl>
                  <div>
                    <dt>Search + extract</dt>
                    <dd>{milliseconds(run.durationMs)}</dd>
                  </div>
                  <div>
                    <dt>Indexed docs</dt>
                    <dd>{run.documents}</dd>
                  </div>
                  <div>
                    <dt>Matching chunks</dt>
                    <dd>{run.matched}</dd>
                  </div>
                  <div>
                    <dt>Top cosine</dt>
                    <dd>{run.topScore.toFixed(4)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        ) : (
          <div className={styles.empty}>
            No completed runs yet. Run a query in AI Lab to record actual local timings and matches.
          </div>
        )}
      </section>
    </div>
  );
}
