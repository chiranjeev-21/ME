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
      <div className="uw-lab-surface">{lab}</div>
      <aside className="uw-lab-note">
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
