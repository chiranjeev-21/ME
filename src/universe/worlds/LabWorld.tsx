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
        <p className="uw-lead">A query in. Inspectable passages out.</p>
        <p>
          Try a technology or project, run retrieval, then open a returned source. Use the pipeline
          controls to look under the hood.
        </p>
      </header>
      <div className="uw-lab-surface">{lab}</div>
    </section>
  );
}
