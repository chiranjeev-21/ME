import { useState } from 'react';
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

const requestStages = [
  {
    label: 'INPUT',
    title: 'Workload',
    subtitle: 'Demand & constraints',
    detail:
      'Start with the conditions: what is being asked of the system, and what capacity or latency constraints matter? A changed workload can change the result without a code change.',
  },
  {
    label: 'DECISION',
    title: 'Policy',
    subtitle: 'Capacity & timeouts',
    detail:
      'Make the boundary explicit. Capacity limits and timeout-aware handling describe which work can proceed and when waiting must end. A policy is a trade-off, not unlimited capacity.',
  },
  {
    label: 'EXECUTION',
    title: 'Storage',
    subtitle: 'Failure & recovery',
    detail:
      'Follow the failure path as well as the successful request. Recovery behavior and observations feed the next revision; this illustration does not simulate or measure a storage service.',
  },
];

export function EngineeringWorld(props: WorldViewProps) {
  const [stage, setStage] = useState(0);
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
      <figure className="uw-system-diagram" data-reveal="trace">
        <figcaption>
          <span>FIG. 01 — Reasoning about a request</span>
          <strong>Illustrative only · not an employer production topology</strong>
        </figcaption>
        <p className="uw-diagram-instruction">Select a stage to inspect the reasoning.</p>
        <div className="uw-flow" role="group" aria-label="Illustrative request stages">
          {requestStages.map((item, index) => (
            <button
              key={item.title}
              type="button"
              aria-pressed={stage === index}
              aria-controls="uw-request-detail"
              onClick={() => setStage(index)}
            >
              <small>{item.label}</small>
              <strong>{item.title}</strong>
              <span>{item.subtitle}</span>
              <span className="uw-flow-direction" aria-hidden="true">
                {index < requestStages.length - 1 ? '→' : '↵'}
              </span>
            </button>
          ))}
        </div>
        <svg
          key={stage}
          className="uw-request-trace"
          viewBox="0 0 1000 45"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <path className="uw-trace-out" pathLength="1" d="M2 5H998" />
          <path className="uw-trace-return" pathLength="1" d="M998 5V40H2V18" />
        </svg>
        <p id="uw-request-detail" className="uw-flow-detail" role="status">
          <strong>{requestStages[stage].title} / </strong>
          {requestStages[stage].detail}
        </p>
        <div className="uw-feedback">
          <span aria-hidden="true">↳</span> Observe → compare → revise{' '}
          <span aria-hidden="true">↵</span>
        </div>
      </figure>
      <div className="uw-principles">
        {principles.map(principle => (
          <article key={principle.index} data-reveal="section">
            <span>{principle.index} /</span>
            <h3>{principle.title}</h3>
            <p>{principle.body}</p>
          </article>
        ))}
      </div>
      <footer className="uw-engineering-footer" data-reveal="section">
        <div>
          <Eyebrow>Inspectable portfolio architecture</Eyebrow>
          <h2>
            Smaller systems.
            <br />
            Visible decisions.
          </h2>
          <p>
            Follow a shared app registry, a window manager, and a navigation model in the public
            implementation notes.
          </p>
        </div>
        <div className="uw-link-stack">
          <DestinationLink
            {...props}
            target={{
              world: 'projects',
              projectSlug: null,
              articleSlug: null,
              vault: false,
            }}
            className="uw-button"
          >
            Read the architecture case studies →
          </DestinationLink>
        </div>
      </footer>
    </section>
  );
}
