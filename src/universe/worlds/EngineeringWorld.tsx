import { CAREER, plainText } from '../content.ts';
import type { WorldViewProps } from '../types';
import { DestinationLink, Eyebrow } from './shared';

const principles = [
  {
    index: '01',
    title: 'Observe before interpreting.',
    body: 'Telemetry and release comparison help distinguish a changed workload from a changed system. A latency number without its conditions is an incomplete signal.',
  },
  {
    index: '02',
    title: 'Bound the failure.',
    body: 'Timeout-aware handling, recovery policy, and resource limits put explicit boundaries around work that cannot complete as expected.',
  },
  {
    index: '03',
    title: 'Keep the evidence attached.',
    body: 'Failure-test results are not production guarantees. A projected cost reduction is not realized savings. The qualifier belongs beside the result.',
  },
];

export function EngineeringWorld(props: WorldViewProps) {
  const current = CAREER[0];
  return (
    <section className="uw-world uw-engineering" aria-labelledby="uw-engineering-title">
      <header className="uw-blueprint-header">
        <Eyebrow>02 / Engineering field notes</Eyebrow>
        <p className="uw-drawing-id">CJ / SYSTEMS / NOT TO SCALE</p>
        <h1 id="uw-engineering-title">
          Design for the
          <br />
          <em>unhappy path.</em>
        </h1>
        <p className="uw-lead">
          Distributed computing. Storage reliability.
          <br />
          Useful systems under real constraints.
        </p>
      </header>
      <figure className="uw-system-diagram">
        <figcaption>
          <span>FIG. 01 — Reasoning about a request</span>
          <strong>Illustrative only · not an employer production topology</strong>
        </figcaption>
        <div className="uw-flow">
          <div>
            <small>INPUT</small>
            <strong>Workload</strong>
            <span>Demand & constraints</span>
          </div>
          <i aria-hidden="true">→</i>
          <div>
            <small>DECISION</small>
            <strong>Policy</strong>
            <span>Capacity & timeouts</span>
          </div>
          <i aria-hidden="true">→</i>
          <div>
            <small>EXECUTION</small>
            <strong>Storage</strong>
            <span>Failure & recovery</span>
          </div>
        </div>
        <div className="uw-feedback">
          <span aria-hidden="true">↳</span> Observe → compare → revise{' '}
          <span aria-hidden="true">↵</span>
        </div>
      </figure>
      <section className="uw-current-work">
        <div>
          <Eyebrow>Current context</Eyebrow>
          <h2>{current.company}</h2>
          <p>
            {current.role}
            <br />
            <span className="uw-muted">Apr 2026 — Present · Azure Direct Drive</span>
          </p>
        </div>
        <div>
          <h3>Reliability is a set of constraints, not a badge.</h3>
          <p>
            My current work spans distributed computing, storage reliability, and performance. These
            are résumé-verified highlights, not a disclosure of internal designs.
          </p>
          <ul>
            {current.highlights.slice(1).map(highlight => (
              <li key={highlight}>{plainText(highlight)}</li>
            ))}
          </ul>
        </div>
      </section>
      <div className="uw-principles">
        {principles.map(principle => (
          <article key={principle.index}>
            <span>{principle.index} /</span>
            <h3>{principle.title}</h3>
            <p>{principle.body}</p>
          </article>
        ))}
      </div>
      <footer className="uw-engineering-footer">
        <div>
          <Eyebrow>Inspectable portfolio architecture</Eyebrow>
          <h2>
            Smaller systems.
            <br />
            Visible decisions.
          </h2>
          <p>
            The CJ OS and CJ Universe case studies describe public portfolio implementations, with
            their boundaries and trade-offs intact.
          </p>
        </div>
        <div className="uw-link-stack">
          <DestinationLink
            {...props}
            target={{
              world: 'projects',
              projectSlug: 'cj-os-desktop',
              articleSlug: null,
              vault: false,
            }}
            className="uw-button"
          >
            CJ OS / desktop architecture →
          </DestinationLink>
          <DestinationLink
            {...props}
            target={{
              world: 'projects',
              projectSlug: 'cj-universe',
              articleSlug: null,
              vault: false,
            }}
            className="uw-button"
          >
            CJ Universe / shared destinations →
          </DestinationLink>
          <button className="uw-text-link" onClick={props.openTerminal}>
            Open the portfolio terminal <span aria-hidden="true">↗</span>
          </button>
        </div>
      </footer>
    </section>
  );
}
