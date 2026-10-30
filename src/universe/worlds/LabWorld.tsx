import type { WorldViewProps } from '../types';
import { Eyebrow } from './shared';

export function LabWorld({ lab }: WorldViewProps) {
  return (
    <section className="uw-world uw-lab" aria-labelledby="uw-lab-title">
      <header>
        <Eyebrow>03 / Research surface</Eyebrow>
        <div className="uw-lab-title">
          <h1 id="uw-lab-title">
            Inspect the
            <br />
            <em>experiment.</em>
          </h1>
          <span className="uw-lab-mark" aria-hidden="true">
            [ λ ]
          </span>
        </div>
        <p className="uw-lead">A working lab, with its mechanism and limits in view.</p>
        <p>
          Use the shared lab below to explore the portfolio’s evidence. Read its source labels and
          limitations before interpreting a result as an answer.
        </p>
      </header>
      <ol className="uw-lab-protocol" aria-label="How to read this experiment" data-reveal="trace">
        <li>
          <span>01 / Source</span>
          <strong>Start with the material.</strong>
          <p>Inspect what the supplied evidence actually says.</p>
        </li>
        <li>
          <span>02 / Mechanism</span>
          <strong>Try the working controls.</strong>
          <p>Use the lab’s own labels to understand how a result is produced.</p>
        </li>
        <li>
          <span>03 / Boundary</span>
          <strong>Keep the limits in view.</strong>
          <p>A match is a place to look, not a new verified claim.</p>
        </li>
      </ol>
      <div className="uw-lab-surface">{lab}</div>
      <aside className="uw-lab-note" data-reveal="section">
        <span aria-hidden="true">↳</span>
        <p>
          <strong>A note on authority.</strong> Finding a passage is not the same as verifying a new
          claim. Public repository metadata does not establish architecture, performance, or
          production readiness.
        </p>
      </aside>
    </section>
  );
}
