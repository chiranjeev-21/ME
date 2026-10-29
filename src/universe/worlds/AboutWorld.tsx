import { CAREER, PROFILE, QUALIFICATIONS, SKILLS, plainText } from '../content.ts';
import type { WorldViewProps } from '../types';
import { DestinationLink, Eyebrow } from './shared';

export function AboutWorld(props: WorldViewProps) {
  return (
    <section className="uw-world uw-about" aria-labelledby="uw-about-title">
      <header className="uw-about-hero">
        <div className="uw-about-intro">
          <Eyebrow>01 / A human, not a job title</Eyebrow>
          <h1 id="uw-about-title">
            Chiranjeev.
            <br />
            <em>Call me CJ.</em>
          </h1>
          <p className="uw-lead">
            Engineer and builder.
            <br />
            Curious about how things hold together.
          </p>
          <p>
            I work on Azure Direct Drive at Microsoft, with a focus on distributed computing,
            storage reliability, and performance. This is a place for the work, the decisions behind
            it, and room to experiment.
          </p>
          <a className="uw-button" href={PROFILE.resume} target="_blank" rel="noopener noreferrer">
            Read the original résumé <span aria-hidden="true">↗</span>
            <span className="uw-sr"> (PDF, opens in a new tab)</span>
          </a>
        </div>
        <figure className="uw-portrait">
          <img src={PROFILE.portrait} alt="Chiranjeev Singh" width="600" height="750" />
          <figcaption>
            Chiranjeev Singh <span>Bengaluru, India</span>
          </figcaption>
        </figure>
      </header>
      <div className="uw-about-statement">
        <span aria-hidden="true">≈</span>
        <p>
          Systems are built from decisions.
          <br />
          <em>This portfolio makes some of mine visible.</em>
        </p>
      </div>
      <section className="uw-career" aria-labelledby="uw-career-title">
        <div className="uw-section-heading">
          <Eyebrow>A working timeline</Eyebrow>
          <h2 id="uw-career-title">Where I’ve been building.</h2>
          <p>
            From production services and AI pipelines to Azure&apos;s distributed storage. A few
            chapters from my engineering work.
          </p>
        </div>
        <div className="uw-career-list">
          {CAREER.map((job, index) => (
            <article key={job.id} className="uw-career-item">
              <div className="uw-career-index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div>
                <p className="uw-meta">
                  {job.period} · {job.location}
                </p>
                <h3>
                  {job.company} <span>{job.role}</span>
                </h3>
                <ul>
                  {job.highlights.map(highlight => (
                    <li key={highlight}>{plainText(highlight)}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="uw-about-foot">
        <div>
          <Eyebrow>Tools & disciplines</Eyebrow>
          <div className="uw-tags">
            {SKILLS.map(skill => (
              <span key={skill.label}>{skill.label}</span>
            ))}
          </div>
          <DestinationLink
            {...props}
            target={{ world: 'engineering', projectSlug: null, articleSlug: null, vault: false }}
            className="uw-text-link"
          >
            Look at the engineering perspective →
          </DestinationLink>
        </div>
        <div>
          <Eyebrow>Education & credentials</Eyebrow>
          {QUALIFICATIONS.map(item => (
            <p key={item.id}>
              <strong>{item.title}</strong>
              <br />
              <span className="uw-muted">{plainText(item.subtitle)}</span>
            </p>
          ))}
        </div>
      </section>
    </section>
  );
}
