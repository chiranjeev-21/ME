import { useEffect, useRef, useState } from 'react';
import { PROFILE } from '../content.ts';
import { ExternalLink, Eyebrow } from './shared';

export function ContactWorld() {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  const copyEmail = async () => {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopyState('copied');
      timer.current = setTimeout(() => setCopyState('idle'), 5000);
    } catch {
      setCopyState('failed');
    }
  };
  return (
    <section className="uw-world uw-contact" aria-labelledby="uw-contact-title">
      <div className="uw-beacon" aria-hidden="true">
        <div />
        <div />
        <div />
        <span>↗</span>
      </div>
      <header>
        <Eyebrow>07 / An open channel</Eyebrow>
        <h1 id="uw-contact-title">
          A good conversation
          <br />
          starts with <em>hello.</em>
        </h1>
        <p className="uw-lead">
          About a system. An interface.
          <br />
          Or something worth building.
        </p>
        <p>No contact form between us. These are my direct, verified channels.</p>
      </header>
      <div className="uw-contact-email">
        <span className="uw-meta">01 / EMAIL</span>
        <a href={`mailto:${PROFILE.email}`}>
          {PROFILE.email}
          <span aria-hidden="true">↗</span>
        </a>
        <div className="uw-copy-row">
          <button type="button" onClick={() => void copyEmail()}>
            {copyState === 'copied' ? 'Address copied ✓' : 'Copy email address'}
          </button>
          <p role="status" aria-live="polite">
            {copyState === 'copied'
              ? 'Copied to your clipboard.'
              : copyState === 'failed'
                ? 'Copy was not permitted. Select the address above, or use the email link.'
                : 'Opens your mail app. Nothing is sent by this site.'}
          </p>
        </div>
      </div>
      <div className="uw-contact-socials">
        {PROFILE.socials.map((social, index) => (
          <div key={social.label}>
            <span className="uw-meta">
              0{index + 2} / {social.label.toUpperCase()}
            </span>
            <ExternalLink href={social.href}>{social.label}</ExternalLink>
            <p>
              {social.label === 'GitHub'
                ? 'Source, repositories, and experiments.'
                : 'Professional context and a direct connection.'}
            </p>
          </div>
        ))}
      </div>
      <footer className="uw-contact-signature">
        <span>Chiranjeev Singh</span>
        <p>
          Engineer & builder.
          <br />
          You can call me CJ.
        </p>
      </footer>
    </section>
  );
}
